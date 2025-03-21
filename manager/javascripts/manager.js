const path = require("path")
const fs = require("fs");

const DCSInstance = require('./dcsinstance');
const { showErrorPopup, showConfirmPopup } = require('./popup');
const { logger } = require("./filesystem")

const ManagerPage = require("./managerpage");
const WizardPage = require("./wizardpage");
const { fetchWithTimeout } = require("./net");
const { exec } = require("child_process");
const { sleep } = require("./utils");

class Manager {
    options = {
        activeInstance: undefined,
        additionalDCSInstances: [],
        configLoaded: false,
        instances: [],
        IP: undefined,
        logLocation: path.join(__dirname, "..", "manager.log"),
        mode: 'basic',
        state: 'IDLE'
    };

    /* Manager pages */
    activePage = null;
    welcomePage = null;
    settingsPage = null;
    folderPage = null;
    typePage = null;
    connectionsTypePage = null;
    connectionsPage = null;
    passwordsPage = null;
    cameraPage = null;
    resultPage = null;
    instancesPage = null;
    expertSettingsPage = null;

    constructor() {
        /* Simple framework to define callbacks to events directly in the .ejs files. When an event happens, e.g. a button is clicked, the signal function is called with the function
        to call and an optional object to pass. An event will then be created, defined in index.html, and will be listened here. Using an eval call, the appropriate member function 
        will then be called */
        document.addEventListener("signal", (ev) => {
            const callback = ev.detail.callback;
            const params = JSON.stringify(ev.detail.params);
            try {
                eval(`this.${callback}(${params})`)
            } catch (e) {
                console.error(e);
            }
        });

        window.olympus = {
            manager: this
        };
    }

    /** Asynchronously start the manager
     * 
     */
    async start() {

        /* Check if the options file exists */
        if (fs.existsSync("options.json")) {
            /* Load the options from the json file */
            try {
                this.options = { ...this.options, ...JSON.parse(fs.readFileSync("options.json")) };
                this.setConfigLoaded(true);
            } catch (e) {
                logger.error(`An error occurred while reading the options.json file: ${e}`);
                showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`)
            }
        }

        if (!this.getConfigLoaded()) {
            this.hideLoadingPage();

            /* Show page to select basic vs expert mode */
            this.welcomePage = new ManagerPage(this, "./ejs/welcome.ejs");
            this.welcomePage.show();
        }
        else {
            document.getElementById("header").classList.remove("hide");

            /* Initialize mode switching */
            if (this.getMode() === "basic") {
                document.getElementById("switch-mode").innerText = "Expert mode";
                document.getElementById("switch-mode").onclick = () => { this.switchMode("expert"); }
            }
            else {
                document.getElementById("switch-mode").innerText = "Basic mode";
                document.getElementById("switch-mode").onclick = () => { this.switchMode("basic"); }
            }

            /* Get the list of DCS instances */
            this.setLoadingProgress("Retrieving DCS instances...", 0);
            var instances = await DCSInstance.getInstances();
            this.setLoadingProgress(`Analysis completed, starting manager...`, 100);
            await sleep(100);

            this.setInstances(instances);

            /* Get my public IP */
            this.getPublicIP().then(
                (IP) => { this.setIP(IP); },
                (err) => {
                    logger.log(err)
                    this.setIP(undefined);
                }
            )

            /* Check if there are corrupted or outdated instances */
            if (this.getInstances().some((instance) => {
                return instance.installed && instance.error;
            })) {
                /* Ask the user for confirmation */
                showConfirmPopup("<div class='main-message'> One or more of your Olympus instances are not up to date! </div><div class='sub-message'> If you have just updated Olympus this is normal.<br><br> Press <b>Accept</b> and the Manager will update your instances for you. <br> Press <b>Close</b> to update your instances manually using the Installation Wizard</div>", async () => {
                    try {
                        /* Nested popup calls need to wait for animation to complete */
                        await sleep(300);

                        await DCSInstance.fixInstances();
                        location.reload();
                    } catch (err) {
                        logger.error(err);

                        /* Nested popup calls need to wait for animation to complete */
                        await sleep(300);
                        showErrorPopup(`<div class='main-message'>An error occurred while trying to fix your installations. Please reinstall Olympus manually. </div><div class='sub-message'> You can find more info in ${this.options.logLocation} </div>`);
                    }
                })
            }

            /* Hide the loading page */
            this.hideLoadingPage();

            /* Create all the HTML pages */
            this.menuPage = new ManagerPage(this, "./ejs/menu.ejs");
            this.folderPage = new WizardPage(this, "./ejs/folder.ejs");
            this.settingsPage = new ManagerPage(this, "./ejs/settings.ejs");
            this.typePage = new WizardPage(this, "./ejs/type.ejs");
            this.connectionsTypePage = new WizardPage(this, "./ejs/connectionsType.ejs");
            this.connectionsPage = new WizardPage(this, "./ejs/connections.ejs");
            this.passwordsPage = new WizardPage(this, "./ejs/passwords.ejs");
            this.cameraPage = new WizardPage(this, "./ejs/camera.ejs");
            this.resultPage = new ManagerPage(this, "./ejs/result.ejs");
            this.instancesPage = new ManagerPage(this, "./ejs/instances.ejs");
            this.expertSettingsPage = new WizardPage(this, "./ejs/expertsettings.ejs");

            /* Force the setting of the ports whenever the page is shown */
            this.connectionsPage.options.onShow = () => {
                if (this.getActiveInstance()) {
                    this.setPort('frontend', this.getActiveInstance().frontendPort);
                    this.setPort('backend', this.getActiveInstance().backendPort);
                }
            }
            this.expertSettingsPage.options.onShow = () => {
                if (this.getActiveInstance()) {
                    this.setPort('frontend', this.getActiveInstance().frontendPort);
                    this.setPort('backend', this.getActiveInstance().backendPort);
                    this.expertSettingsPage.getElement().querySelector(".autoconnect .checkbox").classList.toggle("checked", this.getActiveInstance().autoconnectWhenLocal)
                }
            }

            /* Always force the IDLE state when reaching the menu page */
            this.menuPage.options.onShow = async () => {
                await this.setState('IDLE');
            }

            /* Update the instances when showing the dashboard */
            this.instancesPage.options.onShow = () => {
                this.updateInstances();
            }

            /* Reset default radio buttons */
            this.typePage.options.onShow = () => {
                if (this.getActiveInstance())
                    this.getActiveInstance().installationType = 'singleplayer';
                else {
                    showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`);
                }
            }

            this.connectionsTypePage.options.onShow = () => {
                if (this.getActiveInstance())
                    this.getActiveInstance().connectionsType = 'auto';
                else {
                    showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`);
                }
            }

            /* Reload the instances when we get to the folder page */
            this.folderPage.options.onShow = async () => {
                if (this.getInstances().length > 0)
                    this.setActiveInstance(this.getInstances()[0]);
                await DCSInstance.reloadInstances();
            }

            if (this.getMode() === "basic") {
                /* In basic mode no dashboard is shown */
                this.menuPage.show();
            } else {
                /* In Expert mode we go directly to the dashboard */
                this.instancesPage.show();
                this.updateInstances();
            }

            /* Send an event on manager started */
            document.dispatchEvent(new CustomEvent("managerStarted"));
        }
    }

    /** Creates the options file. This is done only the very first time you start Olympus.
     * 
     * @param {String} mode The mode, either Basic or Expert 
     */
    async createOptionsFile(mode) {
        try {
            fs.writeFileSync("options.json", JSON.stringify({ mode: mode, additionalDCSInstances: [] }, null, 2));
            location.reload();
        } catch (err) {
            logger.log(err);
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`)
        }
    }

    /** Switch to a different mode of operation
     * 
     * @param {String} newMode The mode to switch to 
     */
    async switchMode(newMode) {
        /* Change the mode in the options.json and reload the page */
        var options = JSON.parse(fs.readFileSync("options.json"));
        options.mode = newMode;
        fs.writeFileSync("options.json", JSON.stringify(options, null, 2));
        location.reload();
    }

    async setSavedGamesFolder(folder) {
        var options = JSON.parse(fs.readFileSync("options.json"));
        options.savedGamesFolder = folder;
        fs.writeFileSync("options.json", JSON.stringify(options, null, 2));
        location.reload();
    }

    async getOptions() {
        return JSON.parse(fs.readFileSync("options.json"));
    }

    /************************************************/
    /* CALLBACKS                                    */
    /************************************************/
    /** Switch to basic mode
     *  
     */
    async onBasicClicked() {
        this.createOptionsFile("basic");
    }

    /** Switch to expert mode
     * 
     */
    async onExpertClicked() {
        this.createOptionsFile("expert");
    }

    /** When the install button is clicked go the installation page
     * 
     */
    async onInstallMenuClicked() {
        await this.setState('INSTALL');

        if (this.getInstances().length == 0) {
            // TODO: show error
        }

        if (this.getInstances().length === 1) {
            this.setActiveInstance(this.getInstances()[0]);

            /* Show the type selection page */
            if (!this.getActiveInstance().installed) {
                this.activePage.hide()
                this.typePage.show();
            } else {
                if (this.getActiveInstance().webserverOnline || this.getActiveInstance().backendOnline) {
                    showErrorPopup("<div class='main-message'>The selected Olympus instance is currently active </div><div class='sub-message'> Please stop DCS and Olympus Server/Frontend before editing it! </div>");
                } else {
                    showConfirmPopup("<div class='main-message'> Olympus is already installed in this instance! </div> <div class='sub-message'>If you click Accept, it will be installed again and all changes, e.g. custom databases or mods support, will be lost. Are you sure you want to continue?</div>",
                        () => {
                            this.activePage.hide();
                            this.typePage.show();
                        },
                        async () => {
                            await this.setState('IDLE');
                        }
                    )
                }
            }
        } else {
            /* Show the folder selection page */
            this.activePage.hide()
            this.folderPage.show();
        }
    }

    /** When the edit button is clicked go to the settings page
     * 
     */
    async onEditMenuClicked() {
        this.activePage.hide();
        await this.setState('IDLE');
        this.settingsPage.show();
    }

    /** When a folder is selected, find what instance was clicked to set as active
     * 
     * @param {String} name The name of the instance
     */

    async onFolderClicked(name) {
        var instance = await this.getClickedInstance(name);

        var instanceDivs = this.folderPage.getElement().querySelectorAll(".button.radio");
        for (let i = 0; i < instanceDivs.length; i++) {
            instanceDivs[i].classList.toggle('selected', instanceDivs[i].dataset.folder === instance.folder);
            if (instanceDivs[i].dataset.folder === instance.folder)
                this.setActiveInstance(instance);
        }
    }

    /* When the installation type is selected */
    async onInstallTypeClicked(type) {
        this.typePage.getElement().querySelector(`.singleplayer`).classList.toggle("selected", type === 'singleplayer');
        this.typePage.getElement().querySelector(`.multiplayer`).classList.toggle("selected", type === 'multiplayer');
        if (this.getActiveInstance()) {
            this.getActiveInstance().installationType = type;
            this.getActiveInstance().autoconnectWhenLocal = type === 'singleplayer';
        }
        else {
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`);
        }
    }

    /* When the connections type is selected */
    async onConnectionsTypeClicked(type) {
        this.connectionsTypePage.getElement().querySelector(`.auto`).classList.toggle("selected", type === 'auto');
        this.connectionsTypePage.getElement().querySelector(`.manual`).classList.toggle("selected", type === 'manual');
        if (this.getActiveInstance())
            this.getActiveInstance().connectionsType = type;
        else {
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`);
        }
    }

    /* When the camera control installation is selected */
    async onInstallCameraControlClicked(type) {
        this.cameraPage.getElement().querySelector(`.install`).classList.toggle("selected", type === 'install');
        this.cameraPage.getElement().querySelector(`.no-install`).classList.toggle("selected", type === 'no-install');
        if (this.getActiveInstance())
            this.getActiveInstance().installCameraPlugin = type;
        else {
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`);
        }
    }

    /* When the next button of a wizard page is clicked */
    async onNextClicked() {
        /* Choose which page to show depending on the active page */
        /* Folder selection page */
        if (this.activePage == this.folderPage) {
            if (this.getActiveInstance().installed) {
                if (this.getActiveInstance().webserverOnline || this.getActiveInstance().backendOnline) {
                    showErrorPopup("<div class='main-message'>The selected Olympus instance is currently active </div><div class='sub-message'> Please stop DCS and Olympus Server/Client before editing it! </div>");
                } else {
                    showConfirmPopup("<div class='main-message'> Olympus is already installed in this instance! </div> <div class='sub-message'>If you click Accept, it will be installed again and all changes, e.g. custom databases or mods support, will be lost. Are you sure you want to continue?</div>",
                        () => {
                            this.activePage.hide();
                            this.typePage.show();
                        },
                        async () => {
                            await this.setState('IDLE');
                        }
                    )
                }
            } else {
                this.activePage.hide();
                this.typePage.show();
            }
            /* Installation type page */
        } else if (this.activePage == this.typePage) {
            this.activePage.hide();
            this.connectionsTypePage.show();
            /* Connection type page */
        } else if (this.activePage == this.connectionsTypePage) {
            if (this.getActiveInstance()) {
                if (this.getActiveInstance().connectionsType === 'auto') {
                    this.activePage.hide();
                    this.passwordsPage.show();
                }
                else {
                    this.activePage.hide();
                    this.connectionsPage.show();
                    (this.getMode() === 'basic' ? this.connectionsPage : this.expertSettingsPage).getElement().querySelector(".backend-address .checkbox").classList.toggle("checked", this.getActiveInstance().backendAddress === '*')
                    (this.getMode() === 'basic' ? this.passwordsPage : this.expertSettingsPage).getElement().querySelector(".autoconnect .checkbox").classList.toggle("checked", this.getActiveInstance().autoconnectWhenLocal)
                }
            } else {
                showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`)
            }
            /* Connection page */
        } else if (this.activePage == this.connectionsPage) {
            if (await this.checkPorts()) {
                this.activePage.hide();
                this.passwordsPage.show();
            }
            /* Passwords page */
        } else if (this.activePage == this.passwordsPage) {
            if (await this.checkPasswords()) {
                this.activePage.hide();
                this.cameraPage.show()
            }
            /* Installation type page */
        } else if (this.activePage == this.cameraPage) {
            if (await this.checkDCSRunning()) {
                showConfirmPopup(`<div class='main-message'>DCS is running!</div><div class='sub-message'> Please stop the DCS instance you are trying to add Olympus to, then select <b>Accept</b>. <br>You can click <b>Accept</b> immediately if the running DCS instance is not the one you are adding Olympus to.</div>`, async () => {
                    /* Nested popup calls need to wait for animation to complete */
                    await sleep(300);
                    
                    this.activePage.hide();
                    this.getState() === 'INSTALL' ? this.getActiveInstance().install() : this.getActiveInstance().edit();
                });
            } else {
                this.activePage.hide();
                this.getState() === 'INSTALL' ? this.getActiveInstance().install() : this.getActiveInstance().edit(); 
            }
            /* Expert settings page */
        } else if (this.activePage == this.expertSettingsPage) {
            if (await this.checkPorts() && await this.checkPasswords()) {
                if (await this.checkDCSRunning()) {
                    showConfirmPopup(`<div class='main-message'>DCS is running!</div><div class='sub-message'> Please stop the DCS instance you are trying to add Olympus to, then select <b>Accept</b>. <br>You can click <b>Accept</b> immediately if the running DCS instance is not the one you are adding Olympus to.</div>`, async () => {
                        /* Nested popup calls need to wait for animation to complete */
                        await sleep(300);
                        
                        this.activePage.hide();
                        this.getState() === 'INSTALL' ? this.getActiveInstance().install() : this.getActiveInstance().edit();
                    });
                } else {
                    this.activePage.hide();
                    this.getState() === 'INSTALL' ? this.getActiveInstance().install() : this.getActiveInstance().edit();
                }
            }
        }
    }

    /* When the back button of a wizard page is clicked */
    async onBackClicked() {
        this.activePage.hide();

        /* If we have backed to the menu, instances or settings page, reset the active instance */
        if ([this.instancesPage, this.settingsPage].includes(this.activePage.previousPage)) {
            await this.setState('IDLE');
        }

        this.activePage.previousPage.show(true); // Don't change the previous page (or we get stuck in a loop)
        this.updateInstances();
    }

    async onCancelClicked() {
        this.activePage.hide();
        await this.setState('IDLE');
        if (this.getMode() === "basic")
            this.menuPage.show(true);
        else
            this.instancesPage.show(true);
        this.updateInstances();
    }

    async onGameMasterPasswordChanged(value) {
        for (let input of this.activePage.getElement().querySelectorAll("input[type='password'].unique")) {
            input.placeholder = "";
        }

        if (this.getActiveInstance())
            this.getActiveInstance().setGameMasterPassword(value);
        else
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`);
    }

    async onBlueCommanderPasswordChanged(value) {
        for (let input of this.activePage.getElement().querySelectorAll("input[type='password'].unique")) {
            input.placeholder = "";
        }

        if (this.getActiveInstance())
            this.getActiveInstance().setBlueCommanderPassword(value);
        else
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`);
    }

    async onRedCommanderPasswordChanged(value) {
        for (let input of this.activePage.getElement().querySelectorAll("input[type='password'].unique")) {
            input.placeholder = "";
        }

        if (this.getActiveInstance())
            this.getActiveInstance().setRedCommanderPassword(value);
        else
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`);
    }

    async onAdminPasswordChanged(value) {
        if (this.getActiveInstance())
            this.getActiveInstance().setAdminPassword(value);
        else
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`);
    }

    /* When the frontend port input value is changed */
    async onFrontendPortChanged(value) {
        this.setPort('frontend', Number(value));
    }

    /* When the backend port input value is changed */
    async onBackendPortChanged(value) {
        this.setPort('backend', Number(value));
    }

    /* When the srs port input value is changed */
    async onSRSPortChanged(value) {
        this.getActiveInstance().SRSPort = Number(value);
    }

    /* When the "Enable API connection" checkbox is clicked */
    async onEnableAPIClicked() {
        if (this.getActiveInstance()) {
            if (this.getActiveInstance().backendAddress === 'localhost') {
                this.getActiveInstance().backendAddress = '*';
            } else {
                this.getActiveInstance().backendAddress = 'localhost';
            }
            if (this.getMode() === 'basic') {
                this.connectionsPage.getElement().querySelector(".note.warning").classList.toggle("hide", this.getActiveInstance().backendAddress !== '*')
                this.connectionsPage.getElement().querySelector(".backend-address .checkbox").classList.toggle("checked", this.getActiveInstance().backendAddress === '*')
            } else {
                this.expertSettingsPage.getElement().querySelector(".backend-address .checkbox").classList.toggle("checked", this.getActiveInstance().backendAddress === '*')
            }
        } else {
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`)
        }
    }

    /* When the "Enable camera control plugin" checkbox is clicked */
    async onEnableCameraPluginClicked() {
        if (this.getActiveInstance()) {
            if (this.getActiveInstance().installCameraPlugin === 'install') {
                this.getActiveInstance().installCameraPlugin = 'no-install';
            } else {
                this.getActiveInstance().installCameraPlugin = 'install';
            }
            this.expertSettingsPage.getElement().querySelector(".camera-plugin .checkbox").classList.toggle("checked", this.getActiveInstance().installCameraPlugin === 'install')
        } else {
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`)
        }
    }

    async onEnableAutoconnectClicked() {
        if (this.getActiveInstance()) {
            if (this.getActiveInstance().autoconnectWhenLocal) {
                this.getActiveInstance().autoconnectWhenLocal = false;
            } else {
                this.getActiveInstance().autoconnectWhenLocal = true;
            }
            this.expertSettingsPage.getElement().querySelector(".autoconnect .checkbox").classList.toggle("checked", this.getActiveInstance().autoconnectWhenLocal)
        } else {
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`)
        }
    }

    /* When the "Return to manager" button is pressed */
    async onReturnClicked() {
        await this.reload();
        this.activePage.hide();
        this.menuPage.show();
    }

    /* When the "Close manager" button is pressed */
    async onCloseManagerClicked() {
        document.querySelector('.close').click();
    }

    async checkPorts() {
        var frontendPortFree = await this.getActiveInstance().checkFrontendPort();
        var backendPortFree = await this.getActiveInstance().checkBackendPort();
        if (frontendPortFree && backendPortFree) {
            return true;
        } else {
            showErrorPopup(`<div class='main-message'> Please make sure both the frontend and backend ports are free!</div><div class='sub-message'>If ports are already in use, Olympus will not be able to communicated correctly.</div>`);
            return false;
        }
    }

    async checkPasswords() {
        if (this.getActiveInstance()) {
            if (this.getState() === 'EDIT' && !this.getActiveInstance().arePasswordsEdited()) {
                return true;
            }
            else {
                if (!this.getActiveInstance().arePasswordsSet()) {
                    showErrorPopup(`<div class='main-message'>Please make sure all passwords are set!</div><div class='sub-message'>The role users will fulfill depends on the password they enter at login. </div>`);
                    return false;
                } else if (!this.getActiveInstance().arePasswordsDifferent()) {
                    showErrorPopup(`<div class='main-message'>Please set different passwords! </div><div class='sub-message'>The role users will fulfill depends on the password they enter at login. </div>`);
                    return false;
                } else {
                    return true;
                }
            }
        } else {
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${this.getLogLocation()} for more info. </div>`)
            return false;
        }
    }

    async onStartServerClicked(name) {
        var div = await this.getClickedInstanceDiv(name);
        div.querySelector(".collapse").classList.add("loading")
        var instance = await this.getClickedInstance(name);
        instance.startServer();
    }

    async onStartClientClicked(name) {
        var div = await this.getClickedInstanceDiv(name);
        div.querySelector(".collapse").classList.add("loading")
        var instance = await this.getClickedInstance(name);
        instance.startClient();
    }

    async onOpenBrowserClicked(name) {
        var instance = await this.getClickedInstance(name);
        exec(`start http://localhost:${instance.frontendPort}`)
    }

    async onStopClicked(name) {
        var instance = await this.getClickedInstance(name);
        instance.stop();
    }

    async onEditClicked(name) {
        var instance = await this.getClickedInstance(name);
        if (instance.webserverOnline || instance.backendOnline) {
            showErrorPopup("<div class='main-message'>The selected Olympus instance is currently active </div><div class='sub-message'> Please stop DCS and Olympus Server/Client before editing it! </div>")
        } else {
            this.setActiveInstance(instance);
            await this.setState('EDIT');
            this.activePage.hide();
            (this.getMode() === 'basic' ? this.typePage : this.expertSettingsPage).show();
        }
    }

    async onInstallClicked(name) {
        var instance = await this.getClickedInstance(name);
        this.setActiveInstance(instance);
        await this.setState('INSTALL');
        this.activePage.hide();
        (this.getMode() === 'basic' ? this.typePage : this.expertSettingsPage).show();
    }

    async onUninstallClicked(name) {
        var instance = await this.getClickedInstance(name);
        this.setActiveInstance(instance);
        await this.setState('UNINSTALL');
        if (instance.webserverOnline || instance.backendOnline) {
            showErrorPopup("<div class='main-message'>The selected Olympus instance is currently active </div><div class='sub-message'> Please stop DCS and Olympus Server/Client before removing it! </div>")
        } else {
            if (await this.checkDCSRunning()) {
                showConfirmPopup(`<div class='main-message'>DCS is running!</div><div class='sub-message'> Please stop the DCS instance you are trying to remove Olympus from, then select <b>Accept</b></div>. <br>You can click <b>Accept</b> immediately if the running DCS instance is not the one you are removing Olympus from.`, async () => {
                    /* Nested popup calls need to wait for animation to complete */
                    await sleep(300);

                    await instance.uninstall();
                });
            } else {
                await instance.uninstall();
            }
        } 
    }

    async onLinkClicked(url) {
        exec(`start ${url}`);
    }

    async onTextFileClicked(path) {
        exec(`notepad "${path}"`);
    }

    async getClickedInstance(name) {
        var instances = await DCSInstance.getInstances()
        return instances.find((instance) => { return instance.name === name; });
    }

    async getClickedInstanceDiv(name) {
        var instance = await this.getClickedInstance(name);
        var instanceDivs = this.instancesPage.getElement().querySelectorAll(`.option`);
        for (let i = 0; i < instanceDivs.length; i++) {
            var instanceDiv = instanceDivs[i];
            if (instanceDiv.dataset.folder === instance.folder) {
                return instanceDiv;
            }
        }
    }

    /* Set the selected port to the dcs instance */
    async setPort(port, value) {
        var success;
        if (port === 'frontend') {
            success = await this.getActiveInstance().checkFrontendPort(value);
            this.getActiveInstance().setFrontendPort(value);
        }
        else {
            success = await this.getActiveInstance().checkBackendPort(value);
            this.getActiveInstance().setBackendPort(value);
        }

        var successEls = (this.getMode() === 'basic' ? this.connectionsPage : this.expertSettingsPage).getElement().querySelector(`.${port}-port`).querySelectorAll(".success");
        for (let i = 0; i < successEls.length; i++) {
            successEls[i].classList.toggle("hide", !success);
        }
        var errorEls = (this.getMode() === 'basic' ? this.connectionsPage : this.expertSettingsPage).getElement().querySelector(`.${port}-port`).querySelectorAll(".error");
        for (let i = 0; i < errorEls.length; i++) {
            errorEls[i].classList.toggle("hide", success);
        }
    }

    async getPublicIP() {
        const res = await fetchWithTimeout("https://ipecho.io/json", { timeout: 2500 });
        const data = await res.json();
        return data.ip;
    }

    async updateInstances() {
        var instanceDivs = this.instancesPage.getElement().querySelectorAll(`.option`);
        for (let i = 0; i < instanceDivs.length; i++) {
            var instanceDiv = instanceDivs[i];
            var instance = this.getInstances().find((instance) => { return instance.folder === instanceDivs[i].dataset.folder; })
            if (instance) {
                instanceDiv.querySelector(".button.install").classList.toggle("hide", instance.installed);
                instanceDiv.querySelector(".button.start").classList.toggle("hide", !instance.installed);
                instanceDiv.querySelector(".button.uninstall").classList.toggle("hide", !instance.installed);
                instanceDiv.querySelector(".button.edit").classList.toggle("hide", !instance.installed);

                if (instance.installed) {
                    if (instanceDiv.querySelector(".webserver.online") !== null) {
                        instanceDiv.querySelector(".webserver.online").classList.toggle("hide", !instance.webserverOnline);
                        instanceDiv.querySelector(".webserver.offline").classList.toggle("hide", instance.webserverOnline);
                        instanceDiv.querySelector(".backend.online").classList.toggle("hide", !instance.backendOnline);
                        instanceDiv.querySelector(".backend.offline").classList.toggle("hide", instance.backendOnline);

                        if (instance.backendOnline) {
                            instanceDiv.querySelector(".fps .data").innerText = instance.fps;
                            instanceDiv.querySelector(".load .data").innerText = instance.load;
                        }

                        instanceDiv.querySelector(".button.start").classList.toggle("hide", instance.webserverOnline);
                        instanceDiv.querySelector(".button.uninstall").classList.toggle("hide", instance.webserverOnline);
                        instanceDiv.querySelector(".button.edit").classList.toggle("hide", instance.webserverOnline);
                        instanceDiv.querySelector(".button.open-browser").classList.toggle("hide", !instance.webserverOnline);
                        instanceDiv.querySelector(".button.stop").classList.toggle("hide", !instance.webserverOnline);

                        if (instance.webserverOnline)
                            instanceDiv.querySelector(".button.start").classList.remove("loading");
                    }
                }
            }
        }
    }

    async reload() {
        await DCSInstance.reloadInstances();

        this.options.installEnabled = true;
        this.options.editEnabled = this.getInstances().find(instance => instance.installed);
    }

    async setLoadingProgress(message, percent) {
        document.querySelector("#loader .loading-message").innerHTML = message;
        if (percent) {
            var style = document.querySelector('#loader .loading-bar').style;
            style.setProperty('--percent', `${percent}%`);
        }
    }

    async hideLoadingPage() {
        /* Hide the loading page */
        document.getElementById("loader").style.opacity = "0%";
        window.setTimeout(() => {
            document.getElementById("loader").classList.add("hide");
        }, 250);
    }

    async setActiveInstance(newActiveInstance) {
        this.options.activeInstance = newActiveInstance;
    }

    async setAdditionalDCSInstances(newAdditionalDCSInstances) {
        this.options.additionalDCSInstances = newAdditionalDCSInstances;
    }

    async setConfigLoaded(newConfigLoaded) {
        this.options.configLoaded = newConfigLoaded;
    }

    async setInstances(newInstances) {
        this.options.instances = newInstances;
    }

    async setIP(newIP) {
        this.options.IP = newIP;
    }

    async setLogLocation(newLogLocation) {
        this.options.logLocation = newLogLocation;
    }

    async setState(newState) {
        this.options.state = newState;
        await DCSInstance.reloadInstances();
        if (newState === 'IDLE')
            this.setActiveInstance(undefined);
    }

    async checkDCSRunning() {
        let ps = new Promise((res, rej) => {
            exec('tasklist', function(err, stdout, stderr) {
                if (stdout.toLowerCase().includes("dcs.exe") || stdout.includes("dcs_server.exe")) {
                    res(true);
                } else {
                    res(false);
                }
            });
        })
        try {
            return await ps;
        } catch {
            return false; // An error occurred, let's hope DCS is not running!
        }
    }

    /** Get the currently active instance, i.e. the instance that is being edited/installed/removed
     * 
     * @returns The active instance
     */
    getActiveInstance() {
        return this.options.activeInstance;
    }

    getAdditionalDCSInstances() {
        return this.options.additionalDCSInstances
    }

    getConfigLoaded() {
        return this.options.configLoaded;
    }

    getInstances() {
        return this.options.instances;
    }

    getIP() {
        return this.options.IP;
    }

    getLogLocation() {
        return this.options.logLocation;
    }

    getState() {
        return this.options.state;
    }

    getMode() {
        return this.options.mode;
    }
}

module.exports = Manager;
const path = require("path")
const fs = require("fs");

const DCSInstance = require('./dcsinstance');
const { showErrorPopup, showWaitPopup, showConfirmPopup } = require('./popup');
const { logger } = require("./filesystem")

const ManagerPage = require("./managerpage");
const WizardPage = require("./wizardpage");
const { fetchWithTimeout } = require("./net");
const { exec } = require("child_process");
const { sleep } = require("./utils");

class Manager {
    options = {
        logLocation: path.join(__dirname, "..", "manager.log"),
        configLoaded: false,
        operation: 'NONE'
    };

    activePage = null;
    welcomePage = null;
    settingsPage = null;
    folderPage = null;
    typePage = null;
    connectionsTypePage = null;
    connectionsPage = null;
    passwordsPage = null;
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
                this.options.configLoaded = true;
            } catch (e) {
                logger.error(`An error occurred while reading the options.json file: ${e}`);
                showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${getManager().options.logLocation} for more info. </div>`)
            }
        }

        if (!this.options.configLoaded) {
            this.hideLoadingPage();

            /* Show page to select basic vs expert mode */
            this.welcomePage = new ManagerPage(this, "./ejs/welcome.ejs");
            this.welcomePage.show();
        }
        else {
            document.getElementById("header").classList.remove("hide");

            /* Initialize mode switching */
            if (this.options.mode === "basic") {
                document.getElementById("switch-mode").innerText = "Expert mode";
                document.getElementById("switch-mode").onclick = () => { this.switchMode("expert"); }
            }
            else {
                document.getElementById("switch-mode").innerText = "Basic mode";
                document.getElementById("switch-mode").onclick = () => { this.switchMode("basic"); }
            }

            /* Get the list of DCS instances */
            this.setLoadingProgress("Retrieving DCS instances...", 0);
            DCSInstance.getInstances().then(async (instances) => {
                this.setLoadingProgress(`Analysis completed, starting manager...`, 100);
                await sleep(100);

                this.options.instances = instances;

                /* Get my public IP */
                this.getPublicIP().then(
                    (ip) => { this.options.ip = ip; },
                    () => { this.options.ip = undefined; }
                )

                /* Check if there are corrupted or outdated instances */
                if (this.options.instances.some((instance) => {
                    return instance.installed && instance.error;
                })) {
                    /* Ask the user for confirmation */
                    showConfirmPopup("<div class='main-message'> One or more of your Olympus instances are not up to date! </div><div class='sub-message'> If you have just updated Olympus this is normal.<br><br> Press <b>Accept</b> and the Manager will update your instances for you. <br> Press <b>Close</b> to update your instances manually using the Installation Wizard</div>", async () => {
                        try {
                            await sleep(300);
                            await DCSInstance.fixInstances();
                            location.reload();
                        } catch (err) {
                            logger.error(err);
                            await sleep(300);
                            showErrorPopup(`<div class='main-message'>An error occurred while trying to fix your installations. Please reinstall Olympus manually. </div><div class='sub-message'> You can find more info in ${this.options.logLocation} </div>`);
                        }
                    })
                }

                this.options.installEnabled = true;
                this.options.editEnabled = this.options.instances.find(instance => instance.installed);

                /* Hide the loading page */
                this.hideLoadingPage();

                this.options.singleInstance = this.options.instances.length === 1;

                /* Create all the HTML pages */
                this.menuPage = new ManagerPage(this, "./ejs/menu.ejs");
                this.folderPage = new WizardPage(this, "./ejs/folder.ejs");
                this.settingsPage = new ManagerPage(this, "./ejs/settings.ejs");
                this.typePage = new WizardPage(this, "./ejs/type.ejs");
                this.connectionsTypePage = new WizardPage(this, "./ejs/connectionsType.ejs");
                this.connectionsPage = new WizardPage(this, "./ejs/connections.ejs");
                this.passwordsPage = new WizardPage(this, "./ejs/passwords.ejs");
                this.resultPage = new ManagerPage(this, "./ejs/result.ejs");
                this.instancesPage = new ManagerPage(this, "./ejs/instances.ejs");
                this.expertSettingsPage = new WizardPage(this, "./ejs/expertsettings.ejs");

                /* Force the setting of the ports whenever the page is shown */
                this.connectionsPage.options.onShow = () => {
                    if (this.options.activeInstance) {
                        this.setPort('client', this.options.activeInstance.clientPort);
                        this.setPort('backend', this.options.activeInstance.backendPort);
                    }
                }
                this.expertSettingsPage.options.onShow = () => {
                    if (this.options.activeInstance) {
                        this.setPort('client', this.options.activeInstance.clientPort);
                        this.setPort('backend', this.options.activeInstance.backendPort);
                    }
                }

                this.instancesPage.options.onShow = () => {
                    this.updateInstances();
                }

                if (this.options.mode === "basic") {
                    /* In basic mode no dashboard is shown */
                    this.menuPage.show();
                } else {
                    /* In Expert mode we go directly to the dashboard */
                    this.instancesPage.show();
                    this.updateInstances();
                }

                /* Send an event on manager started */
                document.dispatchEvent(new CustomEvent("managerStarted"));
            });
        }
    }

    /** Get the currently active instance, i.e. the instance that is being edited/installed/removed
     * 
     * @returns The active instance
     */
    getActiveInstance() {
        return this.options.activeInstance;
    }

    /** Creates the options file. This is done only the very first time you start Olympus.
     * 
     * @param {String} mode The mode, either Basic or Expert 
     */
    createOptionsFile(mode) {
        try {
            fs.writeFileSync("options.json", JSON.stringify({ mode: mode, additionalDCSInstances: [] }, null, 2));
            location.reload();
        } catch (err) {
            logger.log(err);
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${getManager().options.logLocation} for more info. </div>`)
        }
    }

    /** Switch to a different mode of operation
     * 
     * @param {String} newMode The mode to switch to 
     */
    switchMode(newMode) {
        /* Change the mode in the options.json and reload the page */
        var options = JSON.parse(fs.readFileSync("options.json"));
        options.mode = newMode;
        fs.writeFileSync("options.json", JSON.stringify(options, null, 2));
        location.reload();
    }

    /************************************************/
    /* CALLBACKS                                    */
    /************************************************/
    /** Switch to basic mode
     *  
     */
    onBasicClicked() {
        this.createOptionsFile("basic");
    }

    /** Switch to expert mode
     * 
     */
    onExpertClicked() {
        this.createOptionsFile("expert");
    }

    /** When the install button is clicked go the installation page
     * 
     */
    onInstallMenuClicked() {
        this.options.operation = 'INSTALL';

        if (this.options.instances.length == 0) {
            // TODO: show error
        }

        this.options.activeInstance = this.options.instances[0];
        if (this.options.singleInstance) {
            /* Show the type selection page */
            if (!this.options.activeInstance.installed) {
                this.activePage.hide()
                this.typePage.show();
            } else {
                showConfirmPopup("<div class='main-message'> Olympus is already installed in this instance! </div> <div class='sub-message'>If you click Accept, it will be installed again and all changes, e.g. custom databases or mods support, will be lost. Are you sure you want to continue?</div>",
                    () => {
                        this.activePage.hide()
                        this.typePage.show();
                    }
                )
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
    onEditMenuClicked() {
        this.activePage.hide()
        this.options.operation = 'EDIT';
        delete this.options.activeInstance;
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
                this.options.activeInstance = instance;
        }
    }

    /* When the installation type is selected */
    onInstallTypeClicked(type) {
        this.typePage.getElement().querySelector(`.singleplayer`).classList.toggle("selected", type === 'singleplayer');
        this.typePage.getElement().querySelector(`.multiplayer`).classList.toggle("selected", type === 'multiplayer');
        if (this.options.activeInstance)
            this.options.activeInstance.installationType = type;
        else {
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${getManager().options.logLocation} for more info. </div>`);
        }
    }

    /* When the connections type is selected */
    onConnectionsTypeClicked(type) {
        this.connectionsTypePage.getElement().querySelector(`.auto`).classList.toggle("selected", type === 'auto');
        this.connectionsTypePage.getElement().querySelector(`.manual`).classList.toggle("selected", type === 'manual');
        if (this.options.activeInstance)
            this.options.activeInstance.connectionsType = type;
        else {
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${getManager().options.logLocation} for more info. </div>`);
        }
    }

    /* When the next button of a wizard page is clicked */
    async onNextClicked() {
        /* Choose which page to show depending on the active page */
        if (this.activePage == this.folderPage) {
            if (this.options.activeInstance.installed) {
                showConfirmPopup("<div class='main-message'> Olympus is already installed in this instance! </div> <div class='sub-message'>If you click Accept, it will be installed again and all changes, e.g. custom databases or mods support, will be lost. Are you sure you want to continue?</div>",
                    () => {
                        this.activePage.hide()
                        this.typePage.show();
                    }
                )
            } else {
                this.activePage.hide();
                this.typePage.show();
            }
        } else if (this.activePage == this.typePage) {
            this.activePage.hide();
            this.connectionsTypePage.show();
        } else if (this.activePage == this.connectionsTypePage) {
            if (this.options.activeInstance) {
                if (this.options.activeInstance.connectionsType === 'auto') {
                    this.activePage.hide();
                    this.passwordsPage.show();
                }
                else {
                    this.activePage.hide();
                    this.connectionsPage.show();
                    (this.options.mode === 'basic'? this.connectionsPage: this.expertSettingsPage).getElement().querySelector(".backend-address .checkbox").classList.toggle("checked", this.options.activeInstance.backendAddress === '*')
                }
            } else {
                showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${getManager().options.logLocation} for more info. </div>`)
            }
        } else if (this.activePage == this.connectionsPage) {
            if (await this.checkPorts()) {
                this.activePage.hide();
                this.passwordsPage.show();
            } 
        } else if (this.activePage == this.passwordsPage) {
            if (await this.checkPasswords()) {
                this.activePage.hide();
                this.options.operation === 'INSTALL' ? this.options.activeInstance.install() : this.options.activeInstance.edit();
            }
        } else if (this.activePage == this.expertSettingsPage) {
            if (await this.checkPorts() && await this.checkPasswords()) {
                this.activePage.hide();
                this.options.operation === 'INSTALL' ? this.options.activeInstance.install() : this.options.activeInstance.edit();
            }
        }
    }

    /* When the back button of a wizard page is clicked */
    onBackClicked() {
        this.activePage.hide();

        /* If we have backed to the menu, instances or settings page, reset the active instance */
        if ([this.instancesPage, this.settingsPage].includes(this.activePage.previousPage)) {
            delete this.options.activeInstance;
        }

        this.activePage.previousPage.show(true); // Don't change the previous page
        this.updateInstances();
    }

    onCancelClicked() {
        this.activePage.hide();
        delete this.options.activeInstance;
        if (this.options.mode === "basic") 
            this.menuPage.show(true);
        else
            this.instancesPage.show(true);
        this.updateInstances();
    }

    onGameMasterPasswordChanged(value) {
        if (this.options.activeInstance)
            this.options.activeInstance.setGameMasterPassword(value);
        else
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${getManager().options.logLocation} for more info. </div>`);
    }

    onBlueCommanderPasswordChanged(value) {
        if (this.options.activeInstance)
            this.options.activeInstance.setBlueCommanderPassword(value);
        else 
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${getManager().options.logLocation} for more info. </div>`);
    }

    onRedCommanderPasswordChanged(value) {
        if (this.options.activeInstance) 
            this.options.activeInstance.setRedCommanderPassword(value);
        else 
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${getManager().options.logLocation} for more info. </div>`);
    }

    /* When the client port input value is changed */
    onClientPortChanged(value) {
        this.setPort('client', Number(value));
    }

    /* When the backend port input value is changed */
    onBackendPortChanged(value) {
        this.setPort('backend', Number(value));
    }

    /* When the "Enable API connection" checkbox is clicked */
    onEnableAPIClicked() {
        if (this.options.activeInstance) {
            if (this.options.activeInstance.backendAddress === 'localhost') {
                this.options.activeInstance.backendAddress = '*';
            } else {
                this.options.activeInstance.backendAddress = 'localhost';
            }
            if (this.options.mode === 'basic') {
                this.connectionsPage.getElement().querySelector(".note.warning").classList.toggle("hide", this.options.activeInstance.backendAddress !== '*')
                this.connectionsPage.getElement().querySelector(".backend-address .checkbox").classList.toggle("checked", this.options.activeInstance.backendAddress === '*')
            } else {
                this.expertSettingsPage.getElement().querySelector(".backend-address .checkbox").classList.toggle("checked", this.options.activeInstance.backendAddress === '*')
            }
        } else {
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${getManager().options.logLocation} for more info. </div>`)
        }
    }

    /* When the "Return to manager" button is pressed */
    async onReturnClicked() {
        await this.reload();
        this.activePage.hide();
        this.menuPage.show();
    }

    /* When the "Close manager" button is pressed */
    onCloseManagerClicked() {
        document.querySelector('.close').click();
    }

    async checkPorts() {
        var clientPortFree = await this.options.activeInstance.checkClientPort();
        var backendPortFree = await this.options.activeInstance.checkBackendPort();
        if (clientPortFree && backendPortFree) {
            return true;
        } else {
            showErrorPopup(`<div class='main-message'> Please, make sure both the client and backend ports are free!</div><div class='sub-message'>If ports are already in use, Olympus will not be able to communicated correctly.</div>`);
            return false;
        }
    }

    async checkPasswords() {
        if (this.options.activeInstance) {
            if (this.options.activeInstance.installed && !this.options.activeInstance.arePasswordsEdited()) {
                return true;
            }
            else {
                if (!this.options.activeInstance.arePasswordsSet()) {
                    showErrorPopup(`<div class='main-message'>Please, make sure all passwords are set!</div><div class='sub-message'>The role users will fulfill depends on the password they enter at login. </div>`);
                    return false;
                } else if (!this.options.activeInstance.arePasswordsDifferent()) {
                    showErrorPopup(`<div class='main-message'>Please, set different passwords! </div><div class='sub-message'>The role users will fulfill depends on the password they enter at login. </div>`);
                    return false;
                } else {
                    return true;
                }
            }
        } else {
            showErrorPopup(`<div class='main-message'>A critical error occurred! </div><div class='sub-message'> Check ${getManager().options.logLocation} for more info. </div>`)
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
        exec(`start http://localhost:${instance.clientPort}`)
    }

    async onStopClicked(name) {
        var instance = await this.getClickedInstance(name);
        instance.stop();
    }

    async onEditClicked(name) {
        var instance = await this.getClickedInstance(name);
        if (instance.webserverOnline || instance.backendOnline) {
            showErrorPopup("<div class='main-message'>Error, the selected Olympus instance is currently active </div><div class='sub-message'> Please stop Olympus before editing it! </div>")
        } else {
            
            this.options.activeInstance = instance;
            this.options.operation = 'EDIT';
            this.activePage.hide();
            (this.options.mode === 'basic'? this.typePage: this.expertSettingsPage).show();
        }
    }

    async onInstallClicked(name) {
        var instance = await this.getClickedInstance(name);
        this.options.activeInstance = instance;
        this.options.operation = 'INSTALL';
        this.options.singleInstance = false;
        this.activePage.hide();
        (this.options.mode === 'basic'? this.typePage: this.expertSettingsPage).show();
    }

    async onUninstallClicked(name) {
        var instance = await this.getClickedInstance(name);
        this.options.activeInstance = instance;
        this.options.operation = 'UNINSTALL';
        if (instance.webserverOnline || instance.backendOnline)
            showErrorPopup("<div class='main-message'>Error, the selected Olympus instance is currently active </div><div class='sub-message'> Please stop Olympus before removing it! </div>")
        else
            await instance.uninstall();
    }

    onLinkClicked(url) {
        exec(`start ${url}`);
    }

    onTextFileClicked(path) {
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
        if (port === 'client') {
            success = await this.options.activeInstance.checkClientPort(value);
            this.options.activeInstance.setClientPort(value);
        }
        else {
            success = await this.options.activeInstance.checkBackendPort(value);
            this.options.activeInstance.setBackendPort(value);
        }

        var successEls = (this.options.mode === 'basic'? this.connectionsPage: this.expertSettingsPage).getElement().querySelector(`.${port}-port`).querySelectorAll(".success");
        for (let i = 0; i < successEls.length; i++) {
            successEls[i].classList.toggle("hide", !success);
        }
        var errorEls = (this.options.mode === 'basic'? this.connectionsPage: this.expertSettingsPage).getElement().querySelector(`.${port}-port`).querySelectorAll(".error");
        for (let i = 0; i < errorEls.length; i++) {
            errorEls[i].classList.toggle("hide", success);
        }
    }

    async getPublicIP() {
        const res = await fetchWithTimeout("https://ipecho.io/json", { timeout: 2500 });
        const data = await res.json();
        return data.ip;
    }

    updateInstances() {
        var instanceDivs = this.instancesPage.getElement().querySelectorAll(`.option`);
        for (let i = 0; i < instanceDivs.length; i++) {
            var instanceDiv = instanceDivs[i];
            var instance = this.options.instances.find((instance) => { return instance.folder === instanceDivs[i].dataset.folder; })
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
        this.options.editEnabled = this.options.instances.find(instance => instance.installed);
    }

    setLoadingProgress(message, percent) {
        document.querySelector("#loader .loading-message").innerHTML = message;
        if (percent) {
            var style = document.querySelector('#loader .loading-bar').style;
            style.setProperty('--percent', `${percent}%`);
        }
    }

    hideLoadingPage() {
        /* Hide the loading page */
        document.getElementById("loader").style.opacity = "0%";
        window.setTimeout(() => {
            document.getElementById("loader").classList.add("hide");
        }, 250);        
    }
}

module.exports = Manager;
const path = require("path")
const fs = require("fs");

const DCSInstance = require('./dcsinstance');
const { showErrorPopup, showWaitPopup, showConfirmPopup } = require('./popup');
const { fixInstances } = require('./filesystem');
const { logger } = require("./filesystem")

const ManagerPage = require("./managerpage");
const WizardPage = require("./wizardpage");
const { fetchWithTimeout } = require("./net");
const { exec } = require("child_process");

class Manager {
    options = {
        logLocation: path.join(__dirname, "..", "manager.log"),
        configLoaded: false
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

    constructor() {
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

    async start() {
        /* Check if the options file exists */
        if (fs.existsSync("options.json")) {
            /* Load the options from the json file */
            try {
                this.options = { ...this.options, ...JSON.parse(fs.readFileSync("options.json")) };
                this.options.configLoaded = true;
            } catch (e) {
                logger.error(`An error occurred while reading the options.json file: ${e}`);
            }
        }

        if (!this.options.configLoaded) {
            /* Hide the loading page */
            document.getElementById("loader").classList.add("hide");

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
            DCSInstance.getInstances().then((instances) => {
                this.setLoadingProgress(`Analysis completed, starting manager!`, 100);

                this.options.instances = instances;

                /* Get my public IP */
                this.getPublicIP().then(
                    (ip) => {
                        this.options.ip = ip;
                    },
                    () => {
                        this.options.ip = undefined;
                    }
                )

                /* Check if there are corrupted or outdate instances */
                if (this.options.instances.some((instance) => {
                    return instance.installed && instance.error;
                })) {
                    /* Ask the user for confirmation */
                    showConfirmPopup("<div style='font-size: 18px; max-width: 100%;'>One or more of your Olympus instances are not up to date! </div> <br> <br> If you have just updated Olympus this is normal. <br> <br>  Press Accept and the Manager will fix your instances for you. <br> Press Close to update your instances manually using the Installation Wizard", async () => {
                        showWaitPopup("Please wait while your instances are being fixed.")
                        fixInstances(this.options.instances.filter((instance) => {
                            return instance.installed && instance.error;
                        })).then(
                            () => { location.reload() },
                            (err) => {
                                logger.error(err);
                                showErrorPopup(`An error occurred while trying to fix your installations. Please reinstall Olympus manually. <br><br> You can find more info in ${path.join(__dirname, "..", "manager.log")}`);
                            }
                        )
                    })
                }

                this.options.installEnabled = true;
                this.options.editEnabled = this.options.instances.find(instance => instance.installed);
                this.options.uninstallEnabled = this.options.instances.find(instance => instance.installed);

                /* Hide the loading page */
                document.getElementById("loader").classList.add("hide");

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

                /* Force the setting of the ports whenever the page is shown */
                this.connectionsPage.options.onShow = () => {
                    if (this.options.activeInstance) {
                        this.setPort('client', this.options.activeInstance.clientPort);
                        this.setPort('backend', this.options.activeInstance.backendPort);
                    }
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

    getActiveInstance() {
        return this.options.activeInstance;
    }

    createOptionsFile(mode) {
        try {
            fs.writeFileSync("options.json", JSON.stringify({ mode: mode }));
            location.reload();
        } catch (e) {
            showErrorPopup(`A critical error occurred, check ${this.options.logLocation} for more info.`)
        }
    }

    switchMode(newMode) {
        /* Change the mode in the options.json and reload the page */
        var options = JSON.parse(fs.readFileSync("options.json"));
        options.mode = newMode;
        fs.writeFileSync("options.json", JSON.stringify(options));
        location.reload();
    }

    /************************************************/
    /* CALLBACKS                                    */
    /************************************************/
    /* Switch to basic mode */
    onBasicClicked() {
        this.createOptionsFile("basic");
    }

    /* Switch to expert mode */
    onExpertClicked() {
        this.createOptionsFile("expert");
    }

    /* When the install button is clicked go the installation page */
    onInstallMenuClicked() {
        this.options.install = true;

        if (this.options.singleInstance) {
            this.options.activeInstance = this.options.instances[0];

            /* Show the type selection page */
            if (!this.options.activeInstance.installed) {
                this.activePage.hide()
                this.typePage.show();
            } else {
                showConfirmPopup("<div style='font-size: 18px; max-width: 100%; margin-bottom: 8px;'> Olympus is already installed in this instance! </div> If you click Accept, it will be installed again and all changes, e.g. custom databases or mods support, will be lost. Are you sure you want to continue?",
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

    /* When the edit button is clicked go to the instances page */
    onEditMenuClicked() {
        this.activePage.hide()
        this.options.install = false;

        if (this.options.singleInstance) {
            this.options.activeInstance = this.options.instances[0];
            this.typePage.show();
        } else {
            this.settingsPage.show();
        }
    }

    onFolderClicked(name) {
        this.getClickedInstance(name).then((instance) => {
            var instanceDivs = this.folderPage.getElement().querySelectorAll(".button.radio");
            for (let i = 0; i < instanceDivs.length; i++) {
                instanceDivs[i].classList.toggle('selected', instanceDivs[i].dataset.folder === instance.folder);
                if (instanceDivs[i].dataset.folder === instance.folder)
                    this.options.activeInstance = instance;
            }
        });
    }

    /* When the installation type is selected */
    onInstallTypeClicked(type) {
        this.typePage.getElement().querySelector(`.singleplayer`).classList.toggle("selected", type === 'singleplayer');
        this.typePage.getElement().querySelector(`.multiplayer`).classList.toggle("selected", type === 'multiplayer');
        if (this.options.activeInstance)
            this.options.activeInstance.installationType = type;
        else
            showErrorPopup("A critical error has occurred. Please restart the Manager.")
    }

    /* When the connections type is selected */
    onConnectionsTypeClicked(type) {
        this.connectionsTypePage.getElement().querySelector(`.auto`).classList.toggle("selected", type === 'auto');
        this.connectionsTypePage.getElement().querySelector(`.manual`).classList.toggle("selected", type === 'manual');
        if (this.options.activeInstance)
            this.options.activeInstance.connectionsType = type;
        else
            showErrorPopup("A critical error has occurred. Please restart the Manager.")
    }

    /* When the next button of a wizard page is clicked */
    onNextClicked() {
        /* Choose which page to show depending on the active page */
        if (this.activePage == this.folderPage) {
            this.activePage.hide();
            this.typePage.show();
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
                    this.connectionsPage.getElement().querySelector(".backend-address .checkbox").classList.toggle("checked", this.options.activeInstance.backendAddress === '*')
                }
            } else {
                showErrorPopup("A critical error has occurred. Please restart the Manager.")
            }
        } else if (this.activePage == this.connectionsPage) {
            this.options.activeInstance.checkClientPort(this.options.activeInstance.clientPort).then(
                (portFree) => {
                    if (portFree) {
                        return this.options.activeInstance.checkBackendPort(this.options.activeInstance.backendPort);
                    } else {
                        return Promise.reject('Port not free');
                    }
                }).then((portFree) => {
                    if (portFree) {
                        this.activePage.hide();
                        this.passwordsPage.show();
                    } else {
                        return Promise.reject('Port not free');
                    }
                }).catch(() => {
                    showErrorPopup('Please, make sure both the client and backend ports are free!');
                }
            );
        } else if (this.activePage == this.passwordsPage) {
            if (this.options.activeInstance) {
                if (this.options.activeInstance.installed && !this.options.activeInstance.arePasswordsEdited()) {
                    this.activePage.hide();
                    showWaitPopup(`<span>Please wait while Olympus is being installed in <i>${this.options.activeInstance.name}</i></span><div class="loading-bar" style="width: 100%; height: 10px;"></div><div class="loading-message" style="font-weight: normal; text-align: center;"></div>`);
                    this.options.activeInstance.install();
                }
                else {
                    if (!this.options.activeInstance.arePasswordsSet()) {
                        showErrorPopup('Please, make sure all passwords are set!');
                    } else if (!this.options.activeInstance.arePasswordsDifferent()) {
                        showErrorPopup('Please, set different passwords for the Game Master, Blue Commander, and Red Commander roles!');
                    } else {
                        this.activePage.hide();
                        showWaitPopup(`<span>Please wait while Olympus is being installed in <i>${this.options.activeInstance.name}</i></span><div class="loading-bar" style="width: 100%; height: 10px;"></div><div class="loading-message" style="font-weight: normal; text-align: center;"></div>`);
                        this.options.activeInstance.install();
                    }
                }
            } else {
                showErrorPopup("A critical error has occurred. Please restart the Manager.")
            }
        }
    }

    /* When the back button of a wizard page is clicked */
    onBackClicked() {
        this.activePage.hide();
        this.activePage.previousPage.show(true); // Don't change the previous page
        this.updateInstances();
    }

    onCancelClicked() {
        location.reload();
    }

    onGameMasterPasswordChanged(value) {
        if (this.options.activeInstance) {
            this.options.activeInstance.setGameMasterPassword(value);
            if (!this.options.activeInstance.blueCommanderPasswordEdited)
                this.passwordsPage.getElement().querySelector(".blue-commander input").value = "";
            if (!this.options.activeInstance.redCommanderPasswordEdited)
                this.passwordsPage.getElement().querySelector(".red-commander input").value = "";
        }
        else
            showErrorPopup("A critical error has occurred. Please restart the Manager.")
    }

    onBlueCommanderPasswordChanged(value) {
        if (this.options.activeInstance) {
            this.options.activeInstance.setBlueCommanderPassword(value);
            if (!this.options.activeInstance.gameMasterPasswordEdited)
                this.passwordsPage.getElement().querySelector(".game-master input").value = "";
            if (!this.options.activeInstance.redCommanderPasswordEdited)
                this.passwordsPage.getElement().querySelector(".red-commander input").value = "";
        }
        else
            showErrorPopup("A critical error has occurred. Please restart the Manager.")
    }

    onRedCommanderPasswordChanged(value) {
        if (this.options.activeInstance) {
            this.options.activeInstance.setRedCommanderPassword(value);
            if (!this.options.activeInstance.gameMasterPasswordEdited)
                this.passwordsPage.getElement().querySelector(".game-master input").value = "";
            if (!this.options.activeInstance.blueCommanderPasswordEdited)
                this.passwordsPage.getElement().querySelector(".blue-commander input").value = "";
        }
        else
            showErrorPopup("A critical error has occurred. Please restart the Manager.")
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
            this.connectionsPage.getElement().querySelector(".note.warning").classList.toggle("hide", this.options.activeInstance.backendAddress !== '*')
            this.connectionsPage.getElement().querySelector(".backend-address .checkbox").classList.toggle("checked", this.options.activeInstance.backendAddress === '*')
        } else {
            showErrorPopup("A critical error has occurred. Please restart the Manager.")
        }
    }

    /* When the "Return to manager" button is pressed */
    onReturnClicked() {
        location.reload();
    }

    /* When the "Close manager" button is pressed */
    onCloseManagerClicked() {
        document.querySelector('.close').click();
    }

    async onStartServerClicked(name) {
        this.getClickedInstanceDiv(name).then((div) => div.querySelector(".collapse").classList.add("loading"));
        this.getClickedInstance(name).then((instance) => instance.startServer());
    }

    async onStartClientClicked(name) {
        this.getClickedInstanceDiv(name).then((div) => div.querySelector(".collapse").classList.add("loading"));
        this.getClickedInstance(name).then(instance => instance.startClient());
    }

    async onOpenBrowserClicked(name) {
        this.getClickedInstance(name).then((instance) => exec(`start http://localhost:${instance.clientPort}`));
    }

    async onStopClicked(name) {
        this.getClickedInstance(name).then((instance) => instance.stop());
    }

    async onEditClicked(name) {
        this.getClickedInstance(name).then((instance) => {
            if (instance.webserverOnline || instance.backendOnline) {
                showErrorPopup("Error, the selected Olympus instance is currently active, please stop Olympus before editing it!")
            } else {
                this.options.activeInstance = instance;
                this.activePage.hide();
                this.typePage.show();
            }
        });
    }

    async onInstallClicked(name) {
        this.getClickedInstance(name).then((instance) => {
            this.options.activeInstance = instance;
            this.options.install = true;
            this.options.singleInstance = false;
            this.activePage.hide();
            this.typePage.show();
        });
    }

    async onUninstallClicked(name) {
        this.getClickedInstance(name).then((instance) => {
            instance.webserverOnline || instance.backendOnline ? showErrorPopup("Error, the selected Olympus instance is currently active, please stop Olympus before uninstalling it!") : instance.uninstall();
        });
    }

    async getClickedInstance(name) {
        return DCSInstance.getInstances().then((instances) => {
            return instances.find((instance) => {
                return instance.name === name
            })
        });
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
        if (port === 'client'){
            success = await this.options.activeInstance.checkClientPort(value);
            this.options.activeInstance.setClientPort(value);
        }
        else {
            success = await this.options.activeInstance.checkBackendPort(value);
            this.options.activeInstance.setBackendPort(value);
        }

        var successEls = this.connectionsPage.getElement().querySelector(`.${port}-port`).querySelectorAll(".success");
        for (let i = 0; i < successEls.length; i++) {
            successEls[i].classList.toggle("hide", !success);
        }
        var errorEls = this.connectionsPage.getElement().querySelector(`.${port}-port`).querySelectorAll(".error");
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

                        if (this.backendOnline) {
                            instanceDiv.querySelector(".fps .data").innerText = instance.fps;
                            instanceDiv.querySelector(".load .data").innerText = instance.load;
                        }

                        instanceDiv.querySelector(".button.start").classList.toggle("hide", instance.webserverOnline);
                        instanceDiv.querySelector(".button.uninstall").classList.toggle("hide", instance.webserverOnline);
                        instanceDiv.querySelector(".button.edit").classList.toggle("hide", instance.webserverOnline);
                        instanceDiv.querySelector(".button.open-browser").classList.toggle("hide", !instance.webserverOnline);
                        instanceDiv.querySelector(".button.stop").classList.toggle("hide", !instance.webserverOnline);

                        if (this.webserverOnline)
                            instanceDiv.querySelector(".button.start").classList.remove("loading");
                    }
                }
            }
        }
    }

    reload() {
        this.activePage.show();
    }

    setLoadingProgress(message, percent) {
        document.querySelector("#loader .loading-message").innerHTML = message;
        if (percent) {
            var style = document.querySelector('#loader .loading-bar').style;
            style.setProperty('--percent', `${percent}%`);
        }
    }

    setPopupLoadingProgress(message, percent) {
        document.querySelector("#popup .loading-message").innerHTML = message;
        if (percent) {
            var style = document.querySelector('#popup .loading-bar').style;
            style.setProperty('--percent', `${percent}%`);
        }
    }
}

module.exports = Manager;
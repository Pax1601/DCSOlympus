const path = require("path")
const fs = require("fs");

const DCSInstance = require('./dcsinstance');
const { showErrorPopup, showWaitPopup, showConfirmPopup } = require('./popup');
const { fixInstances } = require('./filesystem');
const { logger } = require("./filesystem")

const ManagerPage = require("./managerpage");
const WizardPage = require("./wizardpage");

class Manager {
    options = {
        logLocation: path.join(__dirname, "..", "manager.log"),
        configLoaded: false
    };

    activePage = null;
    welcomePage = null;
    folderPage = null;
    typePage = null;
    connectionsTypePage = null;
    connectionsPage = null;
    passwordsPage = null;
    resultPage = null;
    instancesPage = null;

    constructor() {
        console.log("constructor")
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
            this.options.instances = await DCSInstance.getInstances();

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
            this.folderPage = new WizardPage(this, "./ejs/installation.ejs");
            this.typePage = new WizardPage(this, "./ejs/type.ejs");
            this.connectionsTypePage = new WizardPage(this, "./ejs/connectionsType.ejs");
            this.connectionsPage = new WizardPage(this, "./ejs/connections.ejs");
            this.passwordsPage = new WizardPage(this, "./ejs/passwords.ejs");
            this.resultPage = new ManagerPage(this, "./ejs/result.ejs");
            //this.instancesPage = new InstancesPage(this);

            if (this.options.mode === "basic") {
                /* In basic mode no dashboard is shown */
                this.menuPage.show();
            } else {
                /* In Expert mode we go directly to the dashboard */
                this.instancesPage.show();
            }
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
    onInstallClicked() {
        this.options.install = true;

        if (this.options.singleInstance) {
            this.options.activeInstance = this.options.instances[0];

            /* Show the type selection page */
            if (!this.options.activeInstance.installed) {
                this.menuPage.hide();
                this.typePage.show();
            } else {
                showConfirmPopup("<div style='font-size: 18px; max-width: 100%'> Olympus is already installed in this instance! </div> If you click Accept, it will be installed again and all changes, e.g. custom databases or mods support, will be lost. Are you sure you want to continue?",
                    () => {
                        this.menuPage.hide();
                        this.typePage.show();
                    }
                )
            }
        } else {
            /* Show the folder selection page */
            this.menuPage.hide();
            this.folderPage.show();
        }
    }

    /* When the edit button is clicked go to the instances page */
    onEditClicked() {
        this.hide();
        this.options.install = false;

        if (this.options.singleInstance) {
            this.options.activeInstance = this.options.instances[0];
            this.typePage.show();
        } else {
            this.folderPage.show();
        }
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

    /* When the back button of a wizard page is clicked */
    onBackClicked() {
        this.activePage.hide();
        this.activePage.previousPage.show();
    }

    /* When the next button of a wizard page is clicked */
    onNextClicked() {
        this.activePage.hide();

        /* Choose which page to show depending on the active page */
        if (this.activePage == this.typePage) {
            this.connectionsTypePage.show();
        } else if (this.activePage == this.connectionsTypePage) {
            if (this.options.activeInstance) {
                if (this.options.activeInstance.connectionsType === 'auto') {
                    this.passwordsPage.show();
                }
                else {
                    this.connectionsPage.show();
                    this.setPort('client', this.options.activeInstance.clientPort);
                    this.setPort('backend', this.options.activeInstance.backendPort);
                    this.connectionsPage.getElement().querySelector(".backend-address .checkbox").classList.toggle("checked", this.options.activeInstance.backendAddress === '*')
                }
            } else {
                showErrorPopup("A critical error has occurred. Please restart the Manager.")
            }
        } else if (this.activePage == this.connectionsPage) {
            this.passwordsPage.show();
        } else if (this.activePage == this.passwordsPage) {
            if (this.options.activeInstance) {
                this.options.activeInstance.install();
                this.resultPage.show();
            } else {
                showErrorPopup("A critical error has occurred. Please restart the Manager.")
            }
        }
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
            this.connectionsPage.getElement().querySelector(".backend-address .checkbox").classList.toggle("checked", this.options.activeInstance.backendAddress === '*')
        } else {
            showErrorPopup("A critical error has occurred. Please restart the Manager.")
        }
    }

    /* Set the selected port to the dcs instance */
    async setPort(port, value) {
        var success;
        if (port === 'client')
            success = await this.options.activeInstance.setClientPort(value);
        else
            success = await this.options.activeInstance.setBackendPort(value);

        var successEls = this.connectionsPage.getElement().querySelector(`.${port}-port`).querySelectorAll(".success");
        for (let i = 0; i < successEls.length; i++) {
            successEls[i].classList.toggle("hide", !success);
        }
        var errorEls = this.connectionsPage.getElement().querySelector(`.${port}-port`).querySelectorAll(".error");
        for (let i = 0; i < errorEls.length; i++) {
            errorEls[i].classList.toggle("hide", success);
        }
    }
}

module.exports = Manager;
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

    welcomePage = null;
    folderPage = null;
    typePage = null;
    connectionsPage = null;
    passwordsPage = null;
    resultPage = null;
    instancesPage = null;

    constructor() {
        document.addEventListener("signal", (ev) => {
            const callback = ev.detail.callback;
            const params = ev.detail.params;
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
                this.options = {...this.options, ...JSON.parse(fs.readFileSync("options.json"))};
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
            //this.connectionsPage = new ConnectionsPage(this);
            //this.passwordsPage = new PasswordsPage(this);
            //this.resultPage = new ResultPage(this);
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
            fs.writeFileSync("options.json", JSON.stringify({mode: mode}));
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
                this.typePage.show(this.menuPage);
            } else {
                showConfirmPopup("<div style='font-size: 18px; max-width: 100%'> Olympus is already installed in this instance! </div> If you click Accept, it will be installed again and all changes, e.g. custom databases or mods support, will be lost. Are you sure you want to continue?",
                    () => {
                        this.menuPage.hide();
                        this.typePage.show(this.menuPage);
                    }
                )
            }
        } else {
            /* Show the folder selection page */
            this.menuPage.hide();
            this.folderPage.show(this.menuPage);
        }
    }

    /* When the edit button is clicked go to the instances page */
    onEditClicked() {
        this.hide();
        this.options.install = false;
        
        if (this.options.singleInstance) {
            this.options.activeInstance = this.options.instances[0];
            this.typePage.show(this);
        } else {
            this.folderPage.show(this);
        }
    }

    
}

module.exports = Manager;
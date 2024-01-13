const MenuPage = require("./menu");
const InstallationsPage = require('./installations');
const ConnectionsPage = require('./connections');
const PasswordsPage = require('./passwords');
const ResultPage = require('./result');
const InstancesPage = require('./instances');

const DCSInstance = require('./dcsinstance');
const { showErrorPopup, showWaitPopup, showConfirmPopup } = require('./popup');
const { fixInstances } = require('./filesystem');
const { logger } = require("./filesystem")
const path = require("path")
const fs = require("fs");
const WelcomePage = require("./welcome");
const TypePage = require("./type");

class Manager {
    options = {
        logLocation: path.join(__dirname, "..", "manager.log"),
        configLoaded: false
    };

    welcomePage = null;
    installationsPage = null;
    typePage = null;
    connectionsPage = null;
    passwordsPage = null;
    resultPage = null;
    instancesPage = null;

    constructor() {

    }

    async start() {
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

            /* Show page to select basic vs advanced mode */
            this.welcomePage = new WelcomePage(this);
            document.body.appendChild(this.welcomePage.getElement());
            this.welcomePage.show();
        }
        else {
            document.getElementById("header").classList.remove("hide");

            if (this.options.mode === "basic") {
                document.getElementById("switch-mode").innerText = "Advanced mode";
                document.getElementById("switch-mode").onclick = () => { this.switchMode("advanced"); }
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
            this.menuPage = new MenuPage(this);
            this.installationsPage = new InstallationsPage(this); 
            this.typePage = new TypePage(this); 
            this.connectionsPage = new ConnectionsPage(this);
            this.passwordsPage = new PasswordsPage(this);
            this.resultPage = new ResultPage(this);
            this.instancesPage = new InstancesPage(this);

            document.body.appendChild(this.menuPage.getElement());
            document.body.appendChild(this.installationsPage.getElement());
            document.body.appendChild(this.typePage.getElement());
            document.body.appendChild(this.connectionsPage.getElement());
            document.body.appendChild(this.passwordsPage.getElement());
            document.body.appendChild(this.resultPage.getElement());
            document.body.appendChild(this.instancesPage.getElement());

            if (this.options.mode === "basic") {
                /* In basic mode no dashboard is shown */
                this.menuPage.show();
            } else {
                /* In advanced mode we go directly to the dashboard */
                this.instancesPage.show();
            }
        }
    }

    getActiveInstance() {
        return this.options.activeInstance;
    }

    switchMode(newMode) {
        var options = JSON.parse(fs.readFileSync("options.json"));
        options.mode = newMode;
        fs.writeFileSync("options.json", JSON.stringify(options));
        location.reload();
    }
}

module.exports = Manager;
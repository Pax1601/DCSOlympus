const MenuPage = require("./menu");
const InstallationsPage = require('./installations');
const ConnectionsPage = require('./connections');
const PasswordsPage = require('./passwords');
const ResultPage = require('./result');
const InstancesPage = require('./instances');

const DCSInstance = require('./dcsinstance');
const { showErrorPopup, showWaitPopup } = require('./popup');
const { fixInstances } = require('./filesystem');

class Manager {
    simplified = true;

    constructor() {

    }

    async start() {
        /* Get the list of DCS instances */
        var instances = await DCSInstance.getInstances();

        /* If there is only 1 DCS Instance and Olympus is not installed in it, go straight to the installation page (since there is nothing else to do) */
        this.simplified = instances.length === 1 && !instances[0].installed;

        document.getElementById("loader").classList.add("hide");

        /* Check if there are corrupted or outdate instances */
        if (instances.some((instance) => {
            return instance.installed && instance.error;
        })) {
            /* Ask the user for confirmation */
            showErrorPopup("One or more Olympus instances are corrupted or need updating. Press Close to fix this.", async () => {
                showWaitPopup("Please wait while your instances are being fixed.")
                fixInstances(instances.filter((instance) => {
                    return instance.installed && instance.error;
                })).then(
                    () => { location.reload() },
                    () => { showErrorPopup("An error occurred while trying to fix your installations. Please reinstall Olympus manually."); }
                )
            })
        }

        /* Check which buttons should be enabled */
        const installEnabled = instances.some((instance) => { return !instance.installed; });
        const updateEnabled = instances.some((instance) => { return instance.installed; });
        const manageEnabled = instances.some((instance) => { return instance.installed; });

        /* Menu */
        var menuPage = new MenuPage();
        menuPage.options = {
            ...menuPage.options,
            installEnabled: installEnabled,
            updateEnabled: updateEnabled,
            manageEnabled: manageEnabled
        }
        /* When the install button is clicked go the installation page */
        menuPage.onInstallClicked = (e) => {
            menuPage.hide();
            installationsPage.show();
        }
        /* When the update button is clicked go to the instances page in "update mode" (i.e. manage = false) */
        menuPage.onUpdateClicked = (e) => {
            menuPage.hide();
            instancesPage.options = {
                ...instancesPage.options,
                manage: false
            }
            instancesPage.show();
        }
        /* When the manage button is clicked go to the instances page in "manage mode" (i.e. manage = true) */
        menuPage.onManageClicked = (e) => {
            menuPage.hide();
            instancesPage.options = {
                ...instancesPage.options,
                manage: true
            }
            instancesPage.show();
        }

        /* Installations */
        var installationsPage = new InstallationsPage();
        installationsPage.options = {
            ...installationsPage.options,
            instances: instances
        }
        installationsPage.setSelectedInstance = (activeInstance) => {
            /* Set the active options for the pages */
            const options = {
                instance: activeInstance,
                simplified: this.simplified,
                install: true
            }
            connectionsPage.options = {
                ...connectionsPage.options,
                ...options
            }
            passwordsPage.options = {
                ...passwordsPage.options,
                ...options
            }
            resultPage.options = {
                ...resultPage.options,
                ...options
            }

            /* Show the connections page */
            installationsPage.hide();
            connectionsPage.show();

            connectionsPage.onBackClicked = (e) => {
                /* Show the installation page */
                connectionsPage.hide();
                installationsPage.show();
            }
        }
        installationsPage.onCancelClicked = (e) => {
            /* Go back to the main menu */
            installationsPage.hide();
            menuPage.show();
        }

        /* Instances */
        var instancesPage = new InstancesPage();
        instancesPage.options = {
            ...instancesPage.options,
            instances: instances.filter((instance) => { return instance.installed; })
        }
        instancesPage.setSelectedInstance = (activeInstance) => {
            /* Set the active options for the pages */
            const options = {
                instance: activeInstance,
                simplified: this.simplified,
                install: false
            }
            connectionsPage.options = {
                ...connectionsPage.options,
                ...options
            }
            passwordsPage.options = {
                ...passwordsPage.options,
                ...options
            }
            resultPage.options = {
                ...resultPage.options,
                ...options
            }

            /* Show the connections page */
            instancesPage.hide();
            connectionsPage.show();

            connectionsPage.onBackClicked = (e) => {
                /* Show the instances page */
                connectionsPage.hide();
                instancesPage.show();
            }
        }
        instancesPage.onCancelClicked = (e) => {
            /* Go back to the main menu */
            instancesPage.hide();
            menuPage.show();
        }

        /* Connections */
        var connectionsPage = new ConnectionsPage();
        connectionsPage.onNextClicked = async (e) => {
            let activeInstance = connectionsPage.options.instance;
            if (activeInstance) {
                /* Check that the selected ports are free before proceeding */
                if (await activeInstance.checkClientPort(activeInstance.clientPort) && await activeInstance.checkBackendPort(activeInstance.backendPort)) {
                    connectionsPage.hide();
                    passwordsPage.show();
                } else {
                    showErrorPopup("Please make sure the selected ports are not already in use.")
                }
            } else {
                showErrorPopup("An error has occurred, please restart the Olympus Manager.")
            }
        }
        connectionsPage.onCancelClicked = (e) => {
            /* Go back to the main menu */
            connectionsPage.hide();
            menuPage.show();
        }

        /* Passwords */
        var passwordsPage = new PasswordsPage();
        passwordsPage.onBackClicked = (e) => {
            /* Go back to the connections page */
            let activeInstance = connectionsPage.options.instance;
            if (activeInstance) {
                passwordsPage.hide();
                connectionsPage.show();
            } else {
                showErrorPopup("An error has occurred, please restart the Olympus Manager.")
            }
        }
        passwordsPage.onNextClicked = (e) => {
            let activeInstance = connectionsPage.options.instance;
            if (activeInstance) {
                /* Check that all the passwords have been set */
                if (activeInstance.gameMasterPassword === "" || activeInstance.blueCommanderPassword === "" || activeInstance.redCommanderPassword === "") {
                    showErrorPopup("Please fill all the password inputs.")
                }
                else if (activeInstance.gameMasterPassword === activeInstance.blueCommanderPassword || activeInstance.blueCommanderPassword === activeInstance.redCommanderPassword || activeInstance.gameMasterPassword === activeInstance.redCommanderPassword) {
                    showErrorPopup("All the passwords must be different from each other.")
                } else {
                    passwordsPage.hide();
                    resultPage.show();
                    resultPage.startInstallation();
                }
            } else {
                showErrorPopup("An error has occurred, please restart the Olympus Manager.")
            }

        }
        passwordsPage.onCancelClicked = (e) => {
            /* Go back to the main menu */
            passwordsPage.hide();
            menuPage.show();
        }

        /* Result */
        var resultPage = new ResultPage();
        resultPage.onBackClicked = (e) => {
            /* Reload the page to apply changes */
            resultPage.hide();
            location.reload();
        }
        resultPage.onCancelClicked = (e) => {
            /* Reload the page to apply changes */
            resultPage.hide();
            location.reload();
        }

        /* Create all the HTML pages */
        document.body.appendChild(menuPage.getElement());
        document.body.appendChild(installationsPage.getElement());
        document.body.appendChild(instancesPage.getElement());
        document.body.appendChild(connectionsPage.getElement());
        document.body.appendChild(passwordsPage.getElement());
        document.body.appendChild(resultPage.getElement());

        /* In simplified mode we directly show the connections page */
        if (this.simplified) {
            const options = {
                instance: instances[0],
                simplified: this.simplified,
                install: true
            }
            connectionsPage.options = {
                ...connectionsPage.options,
                ...options
            }
            passwordsPage.options = {
                ...passwordsPage.options,
                ...options
            }
            resultPage.options = {
                ...resultPage.options,
                ...options
            }
            /* Show the connections page directly */
            instancesPage.hide();
            connectionsPage.show();
        } else {
            /* Show the main menu */
            menuPage.show();
        }
    }
}

module.exports = Manager;
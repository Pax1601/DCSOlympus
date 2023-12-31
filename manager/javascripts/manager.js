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
    constructor() {
        
    }

    async start() {
        var instances = await DCSInstance.getInstances();

        document.getElementById("loader").classList.add("hide");

        if (instances.some((instance) => {
            return instance.installed && instance.error;
        })) {
            showErrorPopup("One or more Olympus instances are corrupted or need updating. Press Close to fix this.", async () => {
                showWaitPopup("Please wait while your instances are being fixed.")
                fixInstances(instances.filter((instance) => {
                    return instance.installed && instance.error;
                })).then(
                    () => { location.reload() },
                    () => { showErrorPopup("An error occurred while trying to fix you installations. Please reinstall Olympus manually"); }
                )
            })
        }

        /* Menu */
        var menuPage = new MenuPage();
        menuPage.onInstallClicked = (e) => {
            menuPage.hide();
            installationsPage.show();
        }
        menuPage.onUpdateClicked = (e) => {
            menuPage.hide();
            instancesPage.options = {
                ...instancesPage.options,
                manage: false
            }
            instancesPage.show();
        }
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
            connectionsPage.options = {
                ...connectionsPage.options,
                instance: activeInstance,
                install: true
            }
            passwordsPage.options = {
                ...passwordsPage.options,
                instance: activeInstance,
                install: true
            }
            resultPage.options = {
                ...resultPage.options,
                instance: activeInstance,
                install: true
            }
            installationsPage.hide();
            connectionsPage.show();

            connectionsPage.onBackClicked = (e) => {
                connectionsPage.hide();
                installationsPage.show();
            }
        }
        installationsPage.onCancelClicked = (e) => {
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
            connectionsPage.options = {
                ...connectionsPage.options,
                instance: activeInstance,
                install: false
            }
            passwordsPage.options = {
                ...passwordsPage.options,
                instance: activeInstance,
                install: false
            }
            resultPage.options = {
                ...resultPage.options,
                instance: activeInstance,
                install: false
            }
            instancesPage.hide();
            connectionsPage.show();

            connectionsPage.onBackClicked = (e) => {
                connectionsPage.hide();
                instancesPage.show();
            }
        }
        instancesPage.onCancelClicked = (e) => {
            instancesPage.hide();
            menuPage.show();
        }

        /* Connections */
        var connectionsPage = new ConnectionsPage();
        connectionsPage.onNextClicked = async (e) => {
            let activeInstance = connectionsPage.options.instance;
            if (activeInstance) {
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
            connectionsPage.hide();
            menuPage.show();
        }

        /* Passwords */
        var passwordsPage = new PasswordsPage();
        passwordsPage.onBackClicked = (e) => {
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
            passwordsPage.hide();
            menuPage.show();
        }

        /* Result */
        var resultPage = new ResultPage();
        resultPage.onBackClicked = (e) => {
            resultPage.hide();
            location.reload();
        }
        resultPage.onCancelClicked = (e) => {
            resultPage.hide();
            location.reload();
        }

        document.body.appendChild(menuPage.getElement());
        document.body.appendChild(installationsPage.getElement());
        document.body.appendChild(instancesPage.getElement());
        document.body.appendChild(connectionsPage.getElement());
        document.body.appendChild(passwordsPage.getElement());
        document.body.appendChild(resultPage.getElement());

        menuPage.show();
    }
}

module.exports = Manager;
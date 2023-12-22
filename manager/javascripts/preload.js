const contextBridge = require('electron').contextBridge;
const ipcRenderer = require('electron').ipcRenderer;

const ManagerMenu = require("./managermenu");
const ManagerInstallations = require('./managerinstallations');
const DCSInstance = require('./dcsinstance');
const ManagerConnections = require('./managerconnections');
const ManagerPasswords = require('./managerpasswords');
const { showPopup } = require('./popup');
const ManagerResult = require('./managerresult');
const { fixInstances } = require('./filesystem');
const ManagerInstances = require('./managerinstances');

/* White-listed channels. */
const ipc = {
    'render': {
        /* From render to main. */
        'send': [
            'window:minimize',
            'window:maximize',
            'window:restore',
            'window:close'
        ],
        /* From main to render. */
        'receive': [
            'event:maximized',
            'event:unmaximized'
        ],
        /* From render to main and back again. */
        'sendReceive': []
    }
};

/* Exposed protected methods in the render process.  */
contextBridge.exposeInMainWorld(
    /* Allowed 'ipcRenderer' methods.  */
    'ipcRender', {
    /* From render to main.  */
    send: (channel, args) => {
        let validChannels = ipc.render.send;
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, args);
        }
    },
    /* From main to render.  */
    receive: (channel, listener) => {
        let validChannels = ipc.render.receive;
        if (validChannels.includes(channel)) {
            /* Deliberately strip event as it includes `sender`.  */
            ipcRenderer.on(channel, (event, ...args) => listener(...args));
        }
    },
    /* From render to main and back again.  */
    invoke: (channel, args) => {
        let validChannels = ipc.render.sendReceive;
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, args);
        }
    }
}
);

var activeInstance;

async function setup() {
    var instances = await DCSInstance.getInstances();

    if (instances.some((instance) => {
        return instance.installed && instance.error;
    })) {
        showPopup("One or more Olympus instances are corrupted or need updating. Press Close to fix this.", async () => {
            fixInstances(instances.filter((instance) => {
                return instance.installed && instance.error;
            })).then(
                () => { location.reload() },
                () => { showPopup("An error occurred while trying to fix you installations. Please reinstall Olympus manually") }
            )
        })
    }

    /* Menu */
    var managerMenu = new ManagerMenu();
    managerMenu.onInstallClicked = (e) => {
        managerMenu.hide();
        managerInstallations.show();
    }
    managerMenu.onUpdateClicked = (e) => {
        managerMenu.hide();
        managerInstances.show();
    }

    /* Installations */
    var managerInstallations = new ManagerInstallations({ instances: instances });
    managerInstallations.onBackClicked = (e) => {
        managerInstallations.hide();
        managerMenu.show();
    }
    managerInstallations.onNextClicked = (e) => {
         activeInstance = managerInstallations.getSelectedInstance();
        if (activeInstance) {
            managerInstallations.hide();
            managerConnections.show(activeInstance);
        } else {
            showPopup("Please select the instance you want to install Olympus into.")
        }
    }
    managerInstallations.onCancelClicked = (e) => {
        managerInstallations.hide();
        managerMenu.show();
    }

    /* Instances */
    var managerInstances = new ManagerInstances({ instances: instances });
    managerInstances.onBackClicked = (e) => {
        managerInstances.hide();
        managerMenu.show();
    }
    managerInstances.onNextClicked = (e) => {
        activeInstance = managerInstances.getSelectedInstance();
        if (activeInstance) {
            managerInstances.hide();
            managerConnections.show(activeInstance);
        } else {
            showPopup("Please select the instance you want to manage.")
        }
    }
    managerInstances.onCancelClicked = (e) => {
        managerInstances.hide();
        managerMenu.show();
    }

    /* Connections */
    var managerConnections = new ManagerConnections();
    managerConnections.onBackClicked = (e) => {
        managerConnections.hide();
        managerInstallations.show();
    }
    managerConnections.onNextClicked = async (e) => {
        if (activeInstance) {
            if (await activeInstance.checkClientPort(activeInstance.clientPort) && await activeInstance.checkBackendPort(activeInstance.backendPort)) {
                managerConnections.hide();
                managerPasswords.show(activeInstance);
            } else {
                showPopup("Please make sure the selected ports are not already in use.")
            }
        } else {
            showPopup("An error has occurred, please restart the Olympus Manager.")
        }
    }

    managerConnections.onCancelClicked = (e) => {
        managerConnections.hide();
        managerMenu.show();
    }

    /* Passwords */
    var managerPasswords = new ManagerPasswords();
    managerPasswords.onBackClicked = (e) => {
        if (activeInstance) {
            managerPasswords.hide();
            managerConnections.show(activeInstance);
        } else {
            showPopup("An error has occurred, please restart the Olympus Manager.")
        }
    }
    managerPasswords.onNextClicked = (e) => {
        if (activeInstance) {
            if (activeInstance.gameMasterPassword === "" || activeInstance.blueCommanderPassword === "" || activeInstance.redCommanderPassword === "") {
                showPopup("Please fill all the password inputs.")
            }
            else if (activeInstance.gameMasterPassword === activeInstance.blueCommanderPassword || activeInstance.blueCommanderPassword === activeInstance.redCommanderPassword || activeInstance.gameMasterPassword === activeInstance.redCommanderPassword) {
                showPopup("All the passwords must be different from each other.")
            } else {
                managerPasswords.hide();
                managerResult.show(activeInstance);
                managerResult.startInstallation();
            }
        } else {
            showPopup("An error has occurred, please restart the Olympus Manager.")
        }

    }
    managerPasswords.onCancelClicked = (e) => {
        managerPasswords.hide();
        managerMenu.show();
    }

    /* Result */
    var managerResult = new ManagerResult();
    managerResult.onBackClicked = (e) => {
        managerResult.hide();
        managerMenu.show();
    }
    managerResult.onCancelClicked = (e) => {
        managerResult.hide();
        managerMenu.show();
    }

    document.body.appendChild(managerMenu.getElement());
    document.body.appendChild(managerInstallations.getElement());
    document.body.appendChild(managerInstances.getElement());
    document.body.appendChild(managerConnections.getElement());
    document.body.appendChild(managerPasswords.getElement());
    document.body.appendChild(managerResult.getElement());

    managerMenu.show();
}

/* On content loaded */
window.addEventListener('DOMContentLoaded', () => {
    setup();
})
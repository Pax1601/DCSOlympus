var regedit = require('regedit')
var fs = require('fs')
var path = require('path')
const ejs = require('ejs')

const contextBridge = require('electron').contextBridge;
const ipcRenderer = require('electron').ipcRenderer;

const vi = require('win-version-info');
const ManagerMenu  = require("./managermenu");
const ManagerInstallations = require('./managerinstallations');

const shellFoldersKey = 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders'
const saveGamesKey = '{4C5C32FF-BB9D-43B0-B5B4-2D72E54EAAA4}'

var instanceDivs = [];

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

var managerMenu = new ManagerMenu();
var managerInstallations = new ManagerInstallations({instances: ["asd/asd1", "asd/asd2"]});

window.addEventListener('DOMContentLoaded', () => {
    //document.body.appendChild(managerMenu.getElement());
    document.body.appendChild(managerInstallations.getElement());
})
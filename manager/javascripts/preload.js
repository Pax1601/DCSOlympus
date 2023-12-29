const Manager = require('./manager');

const contextBridge = require('electron').contextBridge;
const ipcRenderer = require('electron').ipcRenderer;
const { exec } = require("child_process");

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
});

const manager = new Manager();

/* On content loaded */
window.addEventListener('DOMContentLoaded', async () => {
    computePagesHeight();
    document.getElementById("loader").classList.remove("hide");
    await manager.start();
    computePagesHeight();

    var links = document.querySelectorAll(".link");
    for (let i = 0; i < links.length; i++) {
        links[i].addEventListener("click", (e) => {
            exec("start " + e.target.dataset.link);
        })
    }
})

window.addEventListener('resize', () => {
    computePagesHeight();
})

function computePagesHeight() {
    var pages = document.querySelectorAll(".manager-page");
    var titleBar = document.querySelector("#title-bar");
    var header = document.querySelector("#header");

    for (let i = 0; i < pages.length; i++) {
        pages[i].style.height = (window.innerHeight - (titleBar.clientHeight + header.clientHeight)) + "px";
    }
}
var regedit = require('regedit')
var fs = require('fs')
var path = require('path')
const ejs = require('ejs')
const portfinder = require('portfinder')
const sha256 = require('sha256')
const contextBridge = require('electron').contextBridge;
const ipcRenderer = require('electron').ipcRenderer;
const createShortcut = require('create-desktop-shortcuts');
const vi = require('win-version-info');

const shellFoldersKey = 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders'
const saveGamesKey = '{4C5C32FF-BB9D-43B0-B5B4-2D72E54EAAA4}'

var instanceDivs = [];

// White-listed channels.
const ipc = {
    'render': {
        // From render to main.
        'send': [
            'window:minimize', // Channel names
            'window:maximize',
            'window:restore',
            'window:close'
        ],
        // From main to render.
        'receive': [
            'event:maximized',
            'event:unmaximized'
        ],
        // From render to main and back again.
        'sendReceive': []
    }
};

// Exposed protected methods in the render process.
contextBridge.exposeInMainWorld(
    // Allowed 'ipcRenderer' methods.
    'ipcRender', {
    // From render to main.
    send: (channel, args) => {
        let validChannels = ipc.render.send;
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, args);
        }
    },
    // From main to render.
    receive: (channel, listener) => {
        let validChannels = ipc.render.receive;
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender`.
            ipcRenderer.on(channel, (event, ...args) => listener(...args));
        }
    },
    // From render to main and back again.
    invoke: (channel, args) => {
        let validChannels = ipc.render.sendReceive;
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, args);
        }
    }
}
);

function showPopup(message, otherButton, otherButtonCallback) {
    var data = {
        message: message,
        otherButton: otherButton
    };

    var popups = document.querySelectorAll(".popup");

    for (let i = 0; i < popups.length; i++) {
        document.body.removeChild(popups[i])
    }

    ejs.renderFile("./ejs/popup.ejs", data, {}, (err, str) => {
        var div = document.createElement("div");
        div.classList.add("popup");
        div.innerHTML = str;
        document.body.appendChild(div);

        div.querySelector(".apply").addEventListener("click", () => {
            document.body.removeChild(div);
        })

        div.querySelector(".other").addEventListener("click", () => {
            otherButtonCallback();
        })
    });
}

function checkPort(port, callback) {
    portfinder.getPort({ port: port, stopPort: port }, (err, res) => {
        if (err !== null) {
            console.error(`Port ${port} already in use`);
            callback(false);
        } else {
            callback(true);
        }
    });
}

function installOlympus(folder) {
    console.log(`Installing Olympus in ${folder}`);
    try {
        fs.cpSync(path.join("..", "mod"), path.join(folder, "Mods", "Services", "Olympus"), { recursive: true });
        fs.cpSync(path.join("..", "scripts", "OlympusHook.lua"), path.join(folder, "Scripts", "Hook", "OlympusHook.lua"));
        fs.cpSync(path.join("..", "olympus.json"), path.join(folder, "Config", "olympus.json"));
        if (createShortcut({
            windows: {
                filePath: path.resolve(__dirname, '..', '..', 'client', 'client.vbs'),
                outputPath: folder,
                name: "DCS Olympus Client",
                arguments: `"${path.join(folder, "Config", "olympus.json")}"`,
                icon: path.resolve(__dirname, '..', '..', 'img', 'olympus.ico'),
                workingDirectory: path.resolve(__dirname, '..', '..', 'client')
            }
        }) &&
            createShortcut({
                windows: {
                    filePath: path.resolve(__dirname, '..', '..', 'client', 'server.vbs'),
                    outputPath: folder,
                    name: "DCS Olympus Server",
                    arguments: `"${path.join(folder, "Config", "olympus.json")}"`,
                    icon: path.resolve(__dirname, '..', '..', 'img', 'olympus_server.ico'),
                    workingDirectory: path.resolve(__dirname, '..', '..', 'client')
                }
            })) {
            console.log("Shorcuts created succesfully")
        } else {
            return false;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
    loadDivs();
    return true;
}

function uninstallOlympus(folder) {
    console.log(`Uninstalling Olympus from ${folder}`);
    try {
        fs.rmSync(path.join(folder, "Mods", "Services", "Olympus"), { recursive: true });
        fs.rmSync(path.join(folder, "Config", "olympus.json"));
        loadDivs();
    } catch (e) {
        console.error(e);
        return false;
    }
    return true;
}

function applyConfiguration(folder, data) {
    console.log(`Applying configuration to Olympus from ${folder}`);

    if (fs.existsSync(path.join(folder, "Config", "olympus.json"))) {
        var config = JSON.parse(fs.readFileSync(path.join(folder, "Config", "olympus.json")));

        config["client"]["port"] = data["clientPort"];
        config["server"]["port"] = data["backendPort"];
        config["server"]["address"] = data["backendAddress"];
        config["authentication"]["gameMasterPassword"] = sha256(data["gameMasterPassword"]);
        config["authentication"]["blueCommanderPassword"] = sha256(data["blueCommanderPassword"]);
        config["authentication"]["redCommanderPassword"] = sha256(data["redCommanderPassword"]);

        try {
            fs.writeFileSync(path.join(folder, "Config", "olympus.json"), JSON.stringify(config, null, 4));
        } catch (e) {
            console.error(e);
            return false;
        }
    } else {
        return false;
    }
    return true;
}

function updateOlympus(folder) {
    console.log(`Updating Olympus in ${folder}`);
    try {
        fs.cpSync(path.join("..", "mod"), path.join(folder, "Mods", "Services", "Olympus"), { recursive: true });
        fs.cpSync(path.join("..", "scripts", "OlympusHook.lua"), path.join(folder, "Scripts", "Hook", "OlympusHook.lua"));
        loadDivs();
    } catch (e) {
        console.error(e);
        return false;
    }
    return true;
}

function createDesktopShortcuts(folder) {
    if (createShortcut({
        windows: {
            filePath: path.resolve(__dirname, '..', '..', 'client', 'client.vbs'),
            name: "DCS Olympus Client",
            arguments: `"${path.join(folder, "Config", "olympus.json")}"`,
            icon: path.resolve(__dirname, '..', '..', 'img', 'olympus.ico'),
            workingDirectory: path.resolve(__dirname, '..', '..', 'client')
        }
    }) && createShortcut({
        windows: {
            filePath: path.resolve(__dirname, '..', '..', 'client', 'server.vbs'),
            name: "DCS Olympus Server",
            arguments: `"${path.join(folder, "Config", "olympus.json")}"`,
            icon: path.resolve(__dirname, '..', '..', 'img', 'olympus_server.ico'),
            workingDirectory: path.resolve(__dirname, '..', '..', 'client')
        }
    })) {
        showPopup("Shortcuts created successfully!")
    } else {
        showPopup("And error occurred while creating the shortcuts.")
    }
}

class InstanceDiv {
    element = null;
    parent = null;
    folder = "";

    constructor(parent, folder) {
        this.element = parent;
        this.folder = folder;
        this.render();
    }

    render() {
        this.element = document.createElement("div");

        var data = {
            folder: this.folder,
            installed: false,
            index: instanceDivs.length * 10
        };

        var newVersionInfo = vi(path.join("..", "mod", "bin", "olympus.dll"));
        data["newVersion"] = newVersionInfo.ProductVersion;
        data["version"] = "n/a";

        if (fs.existsSync(path.join(this.folder, "Config", "olympus.json"))) {
            var config = JSON.parse(fs.readFileSync(path.join(this.folder, "Config", "olympus.json")));
            data = {
                ...data,
                ...config
            }
            data["installed"] = true;

            try {
                data["version"] = vi(path.join(this.folder, "Mods", "Services", "Olympus", "bin", "olympus.dll")).ProductVersion;
            } catch (e) {
                data["version"] = "n/a";
            }
        }

        ejs.renderFile("./ejs/instanceDiv.ejs", data, {}, (err, str) => {
            this.element.innerHTML = str;
            this.element.querySelector(".add").addEventListener("click", (e) => {
                if (!e.srcElement.classList.contains("disabled")) {
                    showPopup("Please wait while Olympus is being installed");
                    window.setTimeout(() => {
                        if (installOlympus(this.folder)) {
                            showPopup("Olympus installed successfully. Use the provided form to set Olympus properties. All fields are mandatory. Click on \"Create desktop shortcuts\" to generate Olympus shortcuts on your desktop.", "Create desktop shortcuts", () => {
                                createDesktopShortcuts(this.folder);
                            });
                        } else {
                            showPopup("An error has occurred during installation");
                        }
                    }, 100);
                }
            });

            this.element.querySelector(".remove").addEventListener("click", (e) => {
                if (!e.srcElement.classList.contains("disabled")) {
                    showPopup("Please wait while Olympus is being uninstalled from DCS instance");
                    window.setTimeout(() => {
                        if (uninstallOlympus(this.folder)) {
                            showPopup("Olympus uninstalled successfully from DCS instance!");
                        } else {
                            showPopup("An error has occurred during uninstallation");
                        }
                    }, 100);
                }
            });

            this.element.querySelector(".apply").addEventListener("click", (e) => {
                e.srcElement.classList.remove("blink");
                if (!e.srcElement.classList.contains("disabled")) {
                    showPopup("Please wait while the configuration is being applied");
                    window.setTimeout(() => {
                        if (applyConfiguration(this.folder, this.getFields())) {
                            showPopup("Olympus configuration applied successfully!");
                        } else {
                            showPopup("An error has occurred while applying the configuration");
                        }
                    }, 100)
                }
            });

            this.element.querySelector(".update").addEventListener("click", (e) => {
                if (!e.srcElement.classList.contains("disabled")) {
                    showPopup("Please wait while Olympus is being updated in the DCS instance");
                    window.setTimeout(() => {
                        if (updateOlympus(this.folder)) {
                            showPopup("Olympus updated successfully from DCS instance!");
                        } else {
                            showPopup("An error has occurred during the update");
                        }
                    }, 100);
                }
            });

            var inputs = this.element.querySelectorAll("input");
            for (let i = 0; i < inputs.length; i++) {
                inputs[i].addEventListener("change", () => {
                    inputs[i].classList.remove("error");
                    instanceDivs.forEach((instanceDiv) => instanceDiv.checkFields())
                })
            }
        });
    }

    getDiv() {
        return this.element;
    }

    getFields() {
        return {
            clientPort: Number(this.element.querySelector("#client-port").value),
            backendPort: Number(this.element.querySelector("#backend-port").value),
            backendAddress: this.element.querySelector("#backend-address").value,
            gameMasterPassword: this.element.querySelector("#game-master-password").value,
            blueCommanderPassword: this.element.querySelector("#blue-commander-password").value,
            redCommanderPassword: this.element.querySelector("#red-commander-password").value,
        }
    }

    checkFields() {
        var data = this.getFields();

        /* Clear existing errors */
        var inputs = this.element.querySelectorAll("input");
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].classList.remove("error");
        }
        var messages = this.element.querySelectorAll(".error");
        for (let i = 0; i < messages.length; i++) {
            messages[i].innerText = "";
        }

        /* Enable the button */
        this.element.querySelector(".apply").classList.remove("disabled");

        if (data["clientPort"] !== 0 && data["backendPort"] !== 0) {
            if (data["clientPort"] === data["backendPort"]) {
                this.element.querySelector("#client-port").classList.add("error");
                this.element.querySelector("#client-port-error").innerText = "Ports must be different";
                this.element.querySelector("#backend-port").classList.add("error");
                this.element.querySelector("#backend-port-error").innerText = "Ports must be different";
                this.element.querySelector(".apply").classList.add("disabled");
            }
            else {
                checkPort(data["clientPort"], (res) => {
                    var otherInstanceUsesPort = instanceDivs.find((instanceDiv) => {
                        if (instanceDiv != this) {
                            var fields = instanceDiv.getFields();
                            if (fields["clientPort"] === data["clientPort"] || fields["backendPort"] === data["clientPort"]) {
                                return true;
                            }
                        }
                    })

                    if (!res || otherInstanceUsesPort) {
                        this.element.querySelector("#client-port").classList.add("error");
                        this.element.querySelector("#client-port-error").innerText = "Port already in use";
                        this.element.querySelector(".apply").classList.add("disabled");
                    }
                });

                checkPort(data["backendPort"], (res) => {
                    var otherInstanceUsesPort = instanceDivs.find((instanceDiv) => {
                        if (instanceDiv != this) {
                            var fields = instanceDiv.getFields();
                            if (fields["clientPort"] === data["backendPort"] || fields["backendPort"] === data["backendPort"]) {
                                return true;
                            }
                        }
                    })

                    if (!res || otherInstanceUsesPort) {
                        this.element.querySelector("#backend-port").classList.add("error");
                        this.element.querySelector("#backend-port-error").innerText = "Port already in use";
                        this.element.querySelector(".apply").classList.add("disabled");
                    }
                });
            }
        }

        if (data["gameMasterPassword"] !== "" && data["blueCommanderPassword"] !== "" && data["gameMasterPassword"] === data["blueCommanderPassword"]) {
            this.element.querySelector("#game-master-password").classList.add("error");
            this.element.querySelector("#game-master-password-error").innerText = "Passwords must be different";
            this.element.querySelector("#blue-commander-password").classList.add("error");
            this.element.querySelector("#blue-commander-password-error").innerText = "Passwords must be different";
            this.element.querySelector(".apply").classList.add("disabled");
        }

        if (data["gameMasterPassword"] !== "" && data["redCommanderPassword"] !== "" && data["gameMasterPassword"] === data["redCommanderPassword"]) {
            this.element.querySelector("#game-master-password").classList.add("error");
            this.element.querySelector("#game-master-password-error").innerText = "Passwords must be different";
            this.element.querySelector("#red-commander-password").classList.add("error");
            this.element.querySelector("#red-commander-password-error").innerText = "Passwords must be different";
            this.element.querySelector(".apply").classList.add("disabled");
        }

        if (data["blueCommanderPassword"] !== "" && data["redCommanderPassword"] !== "" && data["blueCommanderPassword"] === data["redCommanderPassword"]) {
            this.element.querySelector("#blue-commander-password").classList.add("error");
            this.element.querySelector("#blue-commander-password-error").innerText = "Passwords must be different";
            this.element.querySelector("#red-commander-password").classList.add("error");
            this.element.querySelector("#red-commander-password-error").innerText = "Passwords must be different";
            this.element.querySelector(".apply").classList.add("disabled");
        }

        if (data["gameMasterPassword"] === "" || data["blueCommanderPassword"] === "" || data["redCommanderPassword"] === "") {
            this.element.querySelector(".apply").classList.add("disabled");
        }
    }
}

function loadDivs() {
    regedit.list(shellFoldersKey, function (err, result) {
        if (err) {
            console.log(err);
        }
        else {
            if (result[shellFoldersKey] !== undefined && result[shellFoldersKey]["exists"] && result[shellFoldersKey]['values'][saveGamesKey] !== undefined && result[shellFoldersKey]['values'][saveGamesKey]['value'] !== undefined) {
                const searchpath = result[shellFoldersKey]['values'][saveGamesKey]['value'];
                const folders = fs.readdirSync(searchpath);
                instanceDivs = [];
                const mainDiv = document.getElementById("main-div");

                folders.forEach((folder) => {
                    if (fs.existsSync(path.join(searchpath, folder, "Config", "appsettings.lua")) ||
                        fs.existsSync(path.join(searchpath, folder, "Config", "serversettings.lua"))) {
                        instanceDivs.push(new InstanceDiv(mainDiv, path.join(searchpath, folder)));
                    }
                });

                mainDiv.replaceChildren(...instanceDivs.map((instanceDiv) => {
                    return instanceDiv.getDiv();
                }));

                instanceDivs.forEach((instanceDiv) => instanceDiv.checkFields())

            } else {
                console.error("An error occured while trying to fetch the location of the DCS folders.")
            }
        }
    })
}

window.addEventListener('DOMContentLoaded', () => {
    loadDivs();
})
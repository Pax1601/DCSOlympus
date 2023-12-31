var regedit = require('regedit')
const shellFoldersKey = 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders'
const saveGamesKey = '{4C5C32FF-BB9D-43B0-B5B4-2D72E54EAAA4}'
var fs = require('fs')
var path = require('path')
const vi = require('win-version-info');
const { checkPort, fetchWithTimeout } = require('./net')
const dircompare = require('dir-compare');
const { spawn } = require('child_process');
const find = require('find-process');
const { deleteMod, uninstallInstance } = require('./filesystem')
const { showErrorPopup, showConfirmPopup } = require('./popup')

class DCSInstance {
    static instances = null;

    static async getInstances() {
        if (this.instances === null) {
            this.instances = await this.findInstances();
        }
        return this.instances;
    }

    static async findInstances() {
        let promise = new Promise((res, rej) => {
            regedit.list(shellFoldersKey, function (err, result) {
                if (err) {
                    rej(err);
                }
                else {
                    if (result[shellFoldersKey] !== undefined && result[shellFoldersKey]["exists"] && result[shellFoldersKey]['values'][saveGamesKey] !== undefined && result[shellFoldersKey]['values'][saveGamesKey]['value'] !== undefined) {
                        const searchpath = result[shellFoldersKey]['values'][saveGamesKey]['value'];
                        const folders = fs.readdirSync(searchpath);
                        var instances = [];

                        folders.forEach((folder) => {
                            if (fs.existsSync(path.join(searchpath, folder, "Config", "appsettings.lua")) ||
                                fs.existsSync(path.join(searchpath, folder, "Config", "serversettings.lua"))) {
                                instances.push(new DCSInstance(path.join(searchpath, folder)));
                            }
                        })

                        res(instances);
                    } else {
                        console.error("An error occured while trying to fetch the location of the DCS instances.")
                        rej("An error occured while trying to fetch the location of the DCS instances.");
                    }
                }
            })
        });

        return promise;
    }

    folder = "";
    name = "";
    clientPort = 3000;
    backendPort = 3001;
    backendAddress = "localhost";
    gameMasterPassword = "";
    blueCommanderPassword = "";
    redCommanderPassword = "";
    gameMasterPasswordHash = "";
    installed = false;
    error = false;
    webserverOnline = false;
    backendOnline = false;
    missionTime = "";
    load = 0;
    fps = 0;

    constructor(folder) {
        this.folder = folder;
        this.name = path.basename(folder);

        if (fs.existsSync(path.join(folder, "Config", "olympus.json"))) {
            try {
                var config = JSON.parse(fs.readFileSync(path.join(folder, "Config", "olympus.json")));
                this.clientPort = config["client"]["port"];
                this.backendPort = config["server"]["port"];
                this.backendAddress = config["server"]["address"];
                this.gameMasterPasswordHash = config["authentication"]["gameMasterPassword"];
            } catch (err) {
                console.error(err)
            }

            this.installed = true;
            const options = { compareContent: true };
            var err1 = true;
            var err2 = true;
            var res1;
            var res2;
            try {
                res1 = dircompare.compareSync(path.join("..", "mod"), path.join(folder, "Mods", "Services", "Olympus"), options);
                res2 = dircompare.compareSync(path.join("..", "scripts", "OlympusHook.lua"), path.join(folder, "Scripts", "Hooks", "OlympusHook.lua"), options);
                err1 = res1.differences !== 0;
                err2 = res2.differences !== 0;
            } catch (e) {
                console.log(e);
            }

            if (err1 || err2) {
                this.error = true;
            }
        }

        window.setInterval(async () => {
            await this.getData();

            var page = document.getElementById("manager-instances");
            if (page) {
                var instanceDivs = page.querySelectorAll(`.option`);
                for (let i = 0; i < instanceDivs.length; i++) {
                    if (instanceDivs[i].dataset.folder == this.folder) {
                        var instanceDiv = instanceDivs[i];
                        if (instanceDiv.querySelector(".webserver.online") !== null) {
                            instanceDiv.querySelector(".webserver.online").classList.toggle("hide", !this.webserverOnline)
                            instanceDiv.querySelector(".webserver.offline").classList.toggle("hide", this.webserverOnline)
                            instanceDiv.querySelector(".backend.online").classList.toggle("hide", !this.backendOnline)
                            instanceDiv.querySelector(".backend.offline").classList.toggle("hide", this.backendOnline)

                            if (this.backendOnline) {
                                instanceDiv.querySelector(".fps .data").innerText = this.fps;
                                instanceDiv.querySelector(".load .data").innerTexr = this.load;
                            }

                            instanceDiv.querySelector(".start-stop-server").innerText = this.webserverOnline ? "Stop" : "Start server";
                            instanceDiv.querySelector(".start-stop-client").innerText = this.webserverOnline ? "Open in browser" : "Start client";
                        }
                    }
                }
            }
        }, 1000);
    }

    async setClientPort(newPort) {
        if (await this.checkClientPort(newPort)) {
            console.log(`Instance ${this.folder} client port set to ${newPort}`)
            this.clientPort = newPort;
            return true;
        }
        return false;
    }

    async setBackendPort(newPort) {
        if (await this.checkBackendPort(newPort)) {
            console.log(`Instance ${this.folder} client port set to ${newPort}`)
            this.backendPort = newPort;
            return true;
        }
        return false;
    }

    setBackendAddress(newAddress) {
        this.backendAddress = newAddress;
    }

    setGameMasterPassword(newPassword) {
        this.gameMasterPassword = newPassword;
    }

    setBlueCommanderPassword(newPassword) {
        this.blueCommanderPassword = newPassword;
    }

    setRedCommanderPassword(newPassword) {
        this.redCommanderPassword = newPassword;
    }

    async checkClientPort(port) {
        var promise = new Promise((res, rej) => {
            checkPort(port, async (portFree) => {
                if (portFree) {
                    portFree = !(await DCSInstance.getInstances()).some((instance) => {
                        if (instance !== this && instance.installed) {
                            if (instance.clientPort === port || instance.backendPort === port) {
                                console.log(`Port ${port} already selected by other instance`);
                                return true;
                            }
                        } else {
                            if (instance.backendPort === port) {
                                console.log(`Port ${port} equal to backend port`);
                                return true;
                            }
                        }
                        return false;
                    })
                }
                else {
                    console.log(`Port ${port} currently in use`);
                }
                res(portFree);
            })
        })
        return promise;
    }

    async checkBackendPort(port) {
        var promise = new Promise((res, rej) => {
            checkPort(port, async (portFree) => {
                if (portFree) {
                    portFree = !(await DCSInstance.getInstances()).some((instance) => {
                        if (instance !== this && instance.installed) {
                            if (instance.clientPort === port || instance.backendPort === port) {
                                console.log(`Port ${port} already selected by other instance`);
                                return true;
                            }
                        } else {
                            if (instance.clientPort === port) {
                                console.log(`Port ${port} equal to client port`);
                                return true;
                            }
                        }
                        return false;
                    })
                } else {
                    console.log(`Port ${port} currently in use`);
                }
                res(portFree);
            })
        })
        return promise;
    }

    async getData() {
        if (this.installed && !this.error) {
            fetchWithTimeout(`http://localhost:${this.clientPort}`, { timeout: 250 })
                .then(async (response) => {
                    this.webserverOnline = (await response.text()).includes("Olympus");
                }, () => {
                    this.webserverOnline = false;
                });

            let headers = new Headers();
            headers.set('Authorization', 'Basic ' + Buffer.from("manager" + ":" + this.gameMasterPasswordHash).toString('base64'));
            fetchWithTimeout(`http://${this.backendAddress}:${this.backendPort}/olympus/mission`, {
                method: 'GET',
                headers: headers,
                timeout: 250
            }).then(async (response) => {
                if (response.ok) {
                    this.backendOnline = true;
                    return response.text();
                } else {
                    return Promise.reject(`Reponse error, status code: ${response.status}`);
                }
            }, () => {
                this.backendOnline = false;
            }).then((text) => {
                var data = JSON.parse(text);
                this.fps = data.frameRate;
                this.load = data.load;
            }, (err) => {
                console.warn(err);
            }).catch((err) => {
                console.warn(err);
            });
        }
    }

    startServer() {
        console.log(`Starting server for instance at ${this.folder}`)
        const out = fs.openSync(`./${this.name}.log`, 'a');
        const err = fs.openSync(`./${this.name}.log`, 'a');
        const sub = spawn('cscript.exe', ['server.vbs', path.join(this.folder, "Config", "olympus.json")], {
            detached: true,
            cwd: "../client",
            stdio: ['ignore', out, err]
        });

        sub.unref();
    }

    startClient() {
        console.log(`Starting client for instance at ${this.folder}`)
        const out = fs.openSync(`./${this.name}.log`, 'a');
        const err = fs.openSync(`./${this.name}.log`, 'a');
        const sub = spawn('cscript.exe', ['client.vbs', path.join(this.folder, "Config", "olympus.json")], {
            detached: true,
            cwd: "../client",
            stdio: ['ignore', out, err]
        });

        sub.unref();
    }

    stop() {
        find('port', this.clientPort)
            .then((list) => {
                if (list.length !== 1) {
                    list.length === 0 ? console.error("No processes found on the specified port") : console.error("Too many processes found on the specified port");
                } else {
                    if (list[0].name.includes("node.exe")) {
                        console.log(`Killing process ${list[0].name}`)
                        try {
                            process.kill(list[0].pid);
                            process.kill(list[0].ppid);
                        } catch (e) {
                            process.kill(list[0].pid);
                        }
                    }
                    else {
                        console.log(list[0])
                        console.error(`The process listening on the specified port has an incorrect name: ${list[0].name}`)
                    }
                }
            }, () => {
                console.error("Error retrieving list of processes")
            })
    }

    uninstall() {
        showConfirmPopup("Are you sure you want to completely remove this Olympus installation?", () =>
            uninstallInstance(this.folder).then(
                () => {
                    location.reload();
                },
                () => {
                    showErrorPopup("An error has occurred while uninstalling the Olympus instance. Make sure Olympus and DCS are not running.", () => {
                        location.reload();
                    });
                }
            ));
    }
}

module.exports = DCSInstance;
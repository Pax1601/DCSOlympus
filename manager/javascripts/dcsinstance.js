var regedit = require('regedit')
const shellFoldersKey = 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders'
const saveGamesKey = '{4C5C32FF-BB9D-43B0-B5B4-2D72E54EAAA4}'
var fs = require('fs')
var path = require('path')
const vi = require('win-version-info');
const checkPort = require('./net')
const dircompare = require('dir-compare');

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
    installed = false;
    error = false;

    constructor(folder) {
        this.folder = folder;
        this.name = path.basename(folder);

        if (fs.existsSync(path.join(folder, "Config", "olympus.json"))){
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
            } catch(e) {
                console.log(e);
            }

            if (err1 || err2) {
                console.log(res1)
                console.log(res2)
                this.error = true;
            }
        }
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
                        if (instance !== this) {
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
                        if (instance !== this) {
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
}

module.exports = DCSInstance;
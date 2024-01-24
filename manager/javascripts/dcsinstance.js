const { getManager } = require('./managerfactory')
var regedit = require('regedit')
const shellFoldersKey = 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders'
const saveGamesKey = '{4C5C32FF-BB9D-43B0-B5B4-2D72E54EAAA4}'
var fs = require('fs')
var path = require('path')
const { checkPort, fetchWithTimeout } = require('./net')
const dircompare = require('dir-compare');
const { spawn } = require('child_process');
const find = require('find-process');
const { uninstallInstance, installHooks, installMod, installJSON, applyConfiguration, installShortCuts } = require('./filesystem')
const { showErrorPopup, showConfirmPopup, showWaitPopup } = require('./popup')
const { logger } = require("./filesystem")
const { hidePopup } = require('./popup')

class DCSInstance {
    static instances = null;

    /** Static asynchronous method to retrieve all DCS instances. Only runs at startup 
     * 
     */
    static async getInstances() {
        if (this.instances === null) {
            this.instances = await this.findInstances();
        }
        return this.instances;
    }

    /** Static asynchronous method to find all existing DCS instances
     * 
     */
    static async findInstances() {
        let promise = new Promise((res, rej) => {
            /* Get the Saved Games folder from the registry */
            regedit.list(shellFoldersKey, function (err, result) {
                if (err) {
                    rej(err);
                }
                else {
                    /* Check that the registry read was successfull */
                    if (result[shellFoldersKey] !== undefined && result[shellFoldersKey]["exists"] && result[shellFoldersKey]['values'][saveGamesKey] !== undefined && result[shellFoldersKey]['values'][saveGamesKey]['value'] !== undefined) {
                        /* Read all the folders in Saved Games */
                        const searchpath = result[shellFoldersKey]['values'][saveGamesKey]['value'];
                        const folders = fs.readdirSync(searchpath);
                        var instances = [];

                        /* A DCS Instance is created if either the appsettings.lua or serversettings.lua file is detected */
                        folders.forEach((folder) => {
                            if (fs.existsSync(path.join(searchpath, folder, "Config", "appsettings.lua")) ||
                                fs.existsSync(path.join(searchpath, folder, "Config", "serversettings.lua"))) {
                                instances.push(new DCSInstance(path.join(searchpath, folder)));
                            }
                        })

                        res(instances);
                    } else {
                        logger.error("An error occured while trying to fetch the location of the DCS instances.")
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
    installationType = 'singleplayer';
    connectionsType = 'auto';
    gameMasterPasswordEdited = false;
    blueCommanderPasswordEdited = false;
    redCommanderPasswordEdited = false;

    constructor(folder) {
        this.folder = folder;
        this.name = path.basename(folder);

        /* Check if the olympus.json file is detected. If true, Olympus is considered to be installed */
        if (fs.existsSync(path.join(folder, "Config", "olympus.json"))) {
            try {
                /* Read the olympus.json */
                var config = JSON.parse(fs.readFileSync(path.join(folder, "Config", "olympus.json")));
                this.clientPort = config["client"]["port"];
                this.backendPort = config["server"]["port"];
                this.backendAddress = config["server"]["address"];
                this.gameMasterPasswordHash = config["authentication"]["gameMasterPassword"];
            } catch (err) {
                logger.error(err)
            }

            /* Compare the contents of the installed Olympus instance and the one in the root folder. Exclude the databases folder, which users can edit.
               If there is any difference, the instance is flagged as either corrupted or outdated */
            this.installed = true;
            const options = { 
                compareContent: true,
                excludeFilter: "databases, mods.lua"
             };
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
                logger.log(e);
            }

            if (err1 || err2) {
                this.error = true;
            }
        }

        /* Periodically "ping" Olympus to check if either the client or the backend are active */
        window.setInterval(async () => {
            await this.getData();
            getManager().updateInstances();            
        }, 1000);
    }

    /** Asynchronously set the client port
     * 
     */
    async setClientPort(newPort) {
        logger.log(`Instance ${this.folder} client port set to ${newPort}`)
        this.clientPort = newPort;
    }

    /** Asynchronously set the backend port
     * 
     */
    async setBackendPort(newPort) {
        logger.log(`Instance ${this.folder} backend port set to ${newPort}`)
        this.backendPort = newPort;
    }

    /** Set backend address
     * 
     */
    setBackendAddress(newAddress) {
        this.backendAddress = newAddress;
    }

    /** Set Game Master password
     * 
     */
    setGameMasterPassword(newPassword) {
        this.gameMasterPassword = newPassword;
        this.gameMasterPasswordEdited = true;
    }

    /** Set Blue Commander password
     * 
     */
    setBlueCommanderPassword(newPassword) {
        this.blueCommanderPassword = newPassword;
        this.blueCommanderPasswordEdited = true;
    }

    /** Set Red Commander password
     * 
     */
    setRedCommanderPassword(newPassword) {
        this.redCommanderPassword = newPassword;
        this.redCommanderPasswordEdited = true;
    }

    arePasswordsEdited() {
        return (getManager().getActiveInstance().gameMasterPasswordEdited || getManager().getActiveInstance().blueCommanderPasswordEdited  || getManager().getActiveInstance().redCommanderPasswordEdited );
    }

    arePasswordsSet() {
        return !(getManager().getActiveInstance().gameMasterPassword === '' || getManager().getActiveInstance().blueCommanderPassword === '' || getManager().getActiveInstance().redCommanderPassword === '');
    }

    arePasswordsDifferent() {
        return !(getManager().getActiveInstance().gameMasterPassword === getManager().getActiveInstance().blueCommanderPassword || getManager().getActiveInstance().gameMasterPassword === getManager().getActiveInstance().redCommanderPassword || getManager().getActiveInstance().blueCommanderPassword === getManager().getActiveInstance().redCommanderPassword);
    }

    /** Check if the client port is free
     * 
     */
    async checkClientPort(port) {
        var promise = new Promise((res, rej) => {
            checkPort(port, async (portFree) => {
                if (portFree) {
                    portFree = !(await DCSInstance.getInstances()).some((instance) => {
                        if (instance !== this && instance.installed) {
                            if (instance.clientPort === port || instance.backendPort === port) {
                                logger.log(`Port ${port} already selected by other instance`);
                                return true;
                            }
                        } else {
                            if (instance.backendPort === port) {
                                logger.log(`Port ${port} equal to backend port`);
                                return true;
                            }
                        }
                        return false;
                    })
                }
                else {
                    logger.log(`Port ${port} currently in use`);
                }
                logger.log(`Port ${port} is free`);
                res(portFree);
            })
        })
        return promise;
    }

    /** Check if the backend port is free
     * 
     */
    async checkBackendPort(port) {
        var promise = new Promise((res, rej) => {
            checkPort(port, async (portFree) => {
                if (portFree) {
                    portFree = !(await DCSInstance.getInstances()).some((instance) => {
                        if (instance !== this && instance.installed) {
                            if (instance.clientPort === port || instance.backendPort === port) {
                                logger.log(`Port ${port} already selected by other instance`);
                                return true;
                            }
                        } else {
                            if (instance.clientPort === port) {
                                logger.log(`Port ${port} equal to client port`);
                                return true;
                            }
                        }
                        return false;
                    })
                } else {
                    logger.log(`Port ${port} currently in use`);
                }
                logger.log(`Port ${port} is free`);
                res(portFree);
            })
        })
        return promise;
    }

    /** Asynchronously interrogate the webserver and the backend to check if they are active and to retrieve data.
     * 
     */
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
                if (text !== undefined) {
                    var data = JSON.parse(text);
                    this.fps = data.frameRate;
                    this.load = data.load;
                }
            }, (err) => {
                logger.warn(err);
            }).catch((err) => {
                logger.warn(err);
            });
        }
    }

    /** Start the Olympus server associated with this instance
     * 
     */
    startServer() {
        logger.log(`Starting server for instance at ${this.folder}`)
        const out = fs.openSync(`./${this.name}.log`, 'a');
        const err = fs.openSync(`./${this.name}.log`, 'a');
        const sub = spawn('cscript.exe', ['server.vbs', path.join(this.folder, "Config", "olympus.json")], {
            detached: true,
            cwd: "../client",
            stdio: ['ignore', out, err]
        });

        sub.unref();
    }

    /** Start the Olympus client associated with this instance
     * 
     */
    startClient() {
        logger.log(`Starting client for instance at ${this.folder}`)
        const out = fs.openSync(`./${this.name}.log`, 'a');
        const err = fs.openSync(`./${this.name}.log`, 'a');
        const sub = spawn('cscript.exe', ['client.vbs', path.join(this.folder, "Config", "olympus.json")], {
            detached: true,
            cwd: "../client",
            stdio: ['ignore', out, err]
        });

        sub.unref();
    }

    /* Stop any node process running on the server port. This will stop either the server or the client depending on what is running */
    stop() {
        find('port', this.clientPort)
            .then((list) => {
                if (list.length !== 1) {
                    list.length === 0 ? logger.error("No processes found on the specified port") : logger.error("Too many processes found on the specified port");
                } else {
                    if (list[0].name.includes("node.exe")) {
                        logger.log(`Killing process ${list[0].name}`)
                        try {
                            process.kill(list[0].pid);
                            process.kill(list[0].ppid);
                        } catch (e) {
                            process.kill(list[0].pid);
                        }
                    }
                    else {
                        logger.error(`The process listening on the specified port has an incorrect name: ${list[0].name}`)
                    }
                }
            }, () => {
                logger.error("Error retrieving list of processes")
            })
    }

    /* Install this instance */
    install() {        
        installHooks(getManager().getActiveInstance().folder).then(
            () => {},
            (err) => {
                return Promise.reject(err);
            }
        ).then(() => installMod(getManager().getActiveInstance().folder, getManager().getActiveInstance().name)).then(
            () => {},
            (err) => {
                return Promise.reject(err);
            }
        ).then(() => installJSON(getManager().getActiveInstance().folder)).then(
            () => {},
            (err) => {
                return Promise.reject(err);
            }
        ).then(() => applyConfiguration(getManager().getActiveInstance().folder, getManager().getActiveInstance())).then(
            () => {},
            (err) => {
                return Promise.reject(err);
            }
        ).then(() => installShortCuts(getManager().getActiveInstance().folder, getManager().getActiveInstance().name)).then(
            () => {},
            (err) => {
                return Promise.reject(err);
            }
        ).then(
            () => {
                hidePopup();
                getManager().resultPage.show();
                getManager().resultPage.getElement().querySelector(".result-summary.success").classList.remove("hide");
                getManager().resultPage.getElement().querySelector(".result-summary.error").classList.add("hide");
                getManager().resultPage.getElement().querySelector(".instructions-group").classList.remove("hide");
            },
            () => {
                hidePopup();
                getManager().resultPage.show();
                getManager().resultPage.getElement().querySelector(".result-summary.success").classList.add("hide");
                getManager().resultPage.getElement().querySelector(".result-summary.error").classList.remove("hide");
            }
        );
    }

    /* Uninstall this instance */
    uninstall() {
        showConfirmPopup("<div style='font-size: 18px; max-width: 100%; margin-bottom: 15px;'> Are you sure you want to remove Olympus? </div> If you click Accept, the Olympus mod will be removed from your DCS installation.", () =>
            uninstallInstance(this.folder, this.name).then(
                () => {
                    location.reload();
                },
                (err) => {
                    logger.error(err)
                    showErrorPopup(`An error has occurred while uninstalling the Olympus instance. Make sure Olympus and DCS are not running. <br><br> You can find more info in ${path.join(__dirname, "..", "manager.log")}`, () => {
                        location.reload();
                    });
                }
            )
        );
    }
}

module.exports = DCSInstance;
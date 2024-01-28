const { getManager } = require('./managerfactory')
var regedit = require('regedit').promisified;
var fs = require('fs')
var path = require('path')
const { checkPort, fetchWithTimeout, getFreePort } = require('./net')
const dircompare = require('dir-compare');
const { spawn } = require('child_process');
const find = require('find-process');
const { installHooks, installMod, installJSON, applyConfiguration, installShortCuts, deleteMod, deleteHooks, deleteJSON, deleteShortCuts } = require('./filesystem')
const { showErrorPopup, showConfirmPopup, showWaitLoadingPopup, setPopupLoadingProgress } = require('./popup')
const { logger } = require("./filesystem")
const { hidePopup } = require('./popup');
const { sleep } = require('./utils');

const shellFoldersKey = 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders'
const saveGamesKey = '{4C5C32FF-BB9D-43B0-B5B4-2D72E54EAAA4}'

class DCSInstance {
    static instances = null;

    /** Static asynchronous method to retrieve all DCS instances. Only runs at startup, later calls will serve the cached result
     * 
     * @returns The list of DCS instances
     */
    static async getInstances() {
        if (this.instances === null) 
            DCSInstance.instances =  this.findInstances();
        return DCSInstance.instances;
    }

    /** Static asynchronous method to find all existing DCS instances
     * 
     * @returns The list of found DCS instances
     */
    static async findInstances() {
        /* Get the Saved Games folder from the registry */
        getManager().setLoadingProgress("Finding DCS instances...");

        var result = await regedit.list(shellFoldersKey);
        /* Check that the registry read was successfull */
        if (result[shellFoldersKey] !== undefined && result[shellFoldersKey]["exists"] && result[shellFoldersKey]['values'][saveGamesKey] !== undefined && result[shellFoldersKey]['values'][saveGamesKey]['value'] !== undefined) {
            /* Read all the folders in Saved Games */
            const searchpath = result[shellFoldersKey]['values'][saveGamesKey]['value'];
            var folders = fs.readdirSync(searchpath).map((folder) => {return path.join(searchpath, folder);});
            console.log(folders);
            var instances = [];
            folders = folders.concat(getManager().options.additionalDCSInstances);
            console.log(folders);

            /* A DCS Instance is created if either the appsettings.lua or serversettings.lua file is detected */
            for (let i = 0; i < folders.length; i++) {
                const folder = folders[i];
                if (fs.existsSync(path.join(folder, "Config", "appsettings.lua")) || fs.existsSync(path.join(folder, "Config", "serversettings.lua")) || getManager().options.additionalDCSInstances.includes(folder)) {
                    logger.log(`Found instance in ${folder}, checking for Olympus`)
                    var newInstance = new DCSInstance(path.join(folder));

                    /* Check if Olympus is already installed */
                    getManager().setLoadingProgress(`Found instance in ${folder}, checking for Olympus...`, (i + 1) / folders.length * 100);
                    await newInstance.checkInstallation();
                    instances.push(newInstance);
                }
            }
        } else {
            logger.error("An error occured while trying to fetch the location of the DCS instances.")
            throw "An error occured while trying to fetch the location of the DCS instances.";
        }
        getManager().setLoadingProgress(`All DCS instances found!`, 100);

        return instances;
    }

    /** Asynchronously fixes/updates all the instances by deleting the existing installation and the copying over the clean files 
     * 
     */
    static async fixInstances() {
        showWaitLoadingPopup("Please wait while your instances are being fixed.")
        const instancesToFix = (await DCSInstance.getInstances()).filter((instance) => { return instance.installed && instance.error; });
        setPopupLoadingProgress(`Fixing Olympus instances`, 0);

        for (let i = 0; i < instancesToFix.length; i++) {
            const instance = instancesToFix[i];
            logger.log(`Fixing Olympus in ${instance.folder}`)

            setPopupLoadingProgress(`Deleting mod folder in ${instance.folder}...`, (i * 4 + 1) / (instancesToFix.length * 4) * 100);
            await sleep(100);
            await deleteMod(instance.folder, instance.name);

            setPopupLoadingProgress(`Deleting hook scripts in ${instance.folder}...`, (i * 4 + 2) / (instancesToFix.length * 4) * 100);
            await sleep(100);
            await deleteHooks(instance.folder);

            setPopupLoadingProgress(`Installing mod folder in ${instance.folder}...`, (i * 4 + 3) / (instancesToFix.length * 4) * 100);
            await sleep(100);
            await installMod(instance.folder, instance.name);

            setPopupLoadingProgress(`Installing hook scripts in ${instance.folder}...`, (i * 4 + 4) / (instancesToFix.length * 4) * 100);
            await sleep(100);
            await installHooks(instance.folder);  
        }

        setPopupLoadingProgress(`All instances fixed!`, 100);
        await sleep(100);
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

        /* Periodically "ping" Olympus to check if either the client or the backend are active */
        window.setInterval(async () => {
            await this.getData();
            getManager().updateInstances();
        }, 1000);
    }

    /** Asynchronously checks if Olympus is installed in a DCS instance and compares the contents of package with the installation
     * 
     * @returns true if the instance has any error or is outdated
     */
    async checkInstallation() {
        /* Check if the olympus.json file is detected. If true, Olympus is considered to be installed */
        if (fs.existsSync(path.join(this.folder, "Config", "olympus.json"))) {
            getManager().setLoadingProgress(`Olympus installed in ${this.folder}`);
            try {
                /* Read the olympus.json */
                var config = JSON.parse(fs.readFileSync(path.join(this.folder, "Config", "olympus.json")));
                this.clientPort = config["client"]["port"];
                this.backendPort = config["server"]["port"];
                this.backendAddress = config["server"]["address"];
                this.gameMasterPasswordHash = config["authentication"]["gameMasterPassword"];
            } catch (err) {
                showErrorPopup(`A critical error has occurred while reading your Olympus configuration file. Please, manually reinstall olympus in ${this.folder}.`)
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
                logger.log(`Comparing Mods content in ${this.folder}`)
                getManager().setLoadingProgress(`Comparing Mods content in ${this.folder}`);
                res1 = await dircompare.compare(path.join("..", "mod"), path.join(this.folder, "Mods", "Services", "Olympus"), options);
                logger.log(`Comparing Scripts content in ${this.folder}`)
                getManager().setLoadingProgress(`Comparing Scripts content in ${this.folder}`);
                res2 = await dircompare.compareSync(path.join("..", "scripts", "OlympusHook.lua"), path.join(this.folder, "Scripts", "Hooks", "OlympusHook.lua"), options);
                err1 = res1.differences !== 0;
                err2 = res2.differences !== 0;
            } catch (e) {
                logger.log(e);
            }

            if (err1 || err2) {
                this.error = true;
                getManager().setLoadingProgress(`Differences found in ${this.folder}`);
                logger.log("Differences found!")
            } else {
                getManager().setLoadingProgress(`No differences found in ${this.folder}`);
            }
        }
        return this.error;
    }

    /** Set the client port
     * 
     * @param {Number} newPort The new client port to set
     */

    setClientPort(newPort) {
        logger.log(`Instance ${this.folder} client port set to ${newPort}`)
        this.clientPort = newPort;
    }

    /** Set the backend port
     * 
     * @param {Number} newPort The new backend port to set
     */
    setBackendPort(newPort) {
        logger.log(`Instance ${this.folder} backend port set to ${newPort}`)
        this.backendPort = newPort;
    }

    /** Set backend address
     * 
     * @param {String} newAddress The new backend address to set
     */
    setBackendAddress(newAddress) {
        this.backendAddress = newAddress;
    }

    /** Set Game Master password
     * 
     * @param {String} newPassword The new Game Master password to set
     */
    setGameMasterPassword(newPassword) {
        this.gameMasterPassword = newPassword;
        this.gameMasterPasswordEdited = true;
    }

    /** Set Blue Commander password
     * 
     * @param {String} newAddress The new Blue Commander password to set
     */
    setBlueCommanderPassword(newPassword) {
        this.blueCommanderPassword = newPassword;
        this.blueCommanderPasswordEdited = true;
    }

    /** Set Red Commander password
     * 
     *  @param {String} newAddress The new Red Commander password to set
     */
    setRedCommanderPassword(newPassword) {
        this.redCommanderPassword = newPassword;
        this.redCommanderPasswordEdited = true;
    }

    /** Checks if any password has been edited by the user
     * 
     * @returns true if any password was edited
     */
    arePasswordsEdited() {
        return (getManager().getActiveInstance().gameMasterPasswordEdited || getManager().getActiveInstance().blueCommanderPasswordEdited || getManager().getActiveInstance().redCommanderPasswordEdited);
    }

    /** Checks if all the passwords have been set by the user
     * 
     * @returns true if all the password have been set
     */
    arePasswordsSet() {
        return !(getManager().getActiveInstance().gameMasterPassword === '' || getManager().getActiveInstance().blueCommanderPassword === '' || getManager().getActiveInstance().redCommanderPassword === '');
    }

    /** Checks if all the passwords are different
     * 
     * @returns true if all the passwords are different
     */
    arePasswordsDifferent() {
        return !(getManager().getActiveInstance().gameMasterPassword === getManager().getActiveInstance().blueCommanderPassword || getManager().getActiveInstance().gameMasterPassword === getManager().getActiveInstance().redCommanderPassword || getManager().getActiveInstance().blueCommanderPassword === getManager().getActiveInstance().redCommanderPassword);
    }

    /** Asynchronously check if the client port is free
     * 
     * @param {Number | undefined} port The port to check. If not set, the current clientPort will be checked
     * @returns true if the client port is free
     */
    async checkClientPort(port) {
        port = port ?? this.clientPort;

        logger.log(`Checking client port ${port}`);
        var portFree = await checkPort(port);
        if (portFree) {
            portFree = !(await DCSInstance.getInstances()).some((instance) => {
                if (instance !== this && instance.installed) {
                    if (instance.clientPort === port || instance.backendPort === port) {
                        logger.log(`Client port ${port} already selected by other instance`);
                        return true;
                    }
                } else {
                    if (instance.backendPort === port) {
                        logger.log(`Client port ${port} equal to backend port`);
                        return true;
                    }
                }
                return false;
            })
        }
        else {
            logger.log(`Client port ${port} currently in use`);
        }
        return portFree;
    }

    /** Asynchronously check if the backend port is free
     * 
     * @param {Number | undefined} port The port to check. If not set, the current backendPort will be checked
     * @returns true if the backend port is free
     */
    async checkBackendPort(port) {
        port = port ?? this.backendPort;

        logger.log(`Checking backend port ${port}`);
        var portFree = await checkPort(port);
        if (portFree) {
            portFree = !(await DCSInstance.getInstances()).some((instance) => {
                if (instance !== this && instance.installed) {
                    if (instance.clientPort === port || instance.backendPort === port) {
                        logger.log(`Backend port ${port} already selected by other instance`);
                        return true;
                    }
                } else {
                    if (instance.clientPort === port) {
                        logger.log(`Backend port ${port} equal to client port`);
                        return true;
                    }
                }
                return false;
            })
        } else {
            logger.log(`Backend port ${port} currently in use`);
        }
        return portFree;
    }

    /** Asynchronously find free client and backend ports. If the old ports are free, it will keep them.
     * 
     */
    async findFreePorts() {
        logger.log(`Looking for free ports`);
        if (await this.checkClientPort() && await this.checkBackendPort()) {
            logger.log("Old ports are free, keeping them")
        } else {
            logger.log(`Finding new free ports`);

            const instances = await DCSInstance.getInstances();
            const firstPort = instances.map((instance) => { return instance.clientPort; }).concat(instances.map((instance) => { return instance.backendPort; })).sort().at(-1) + 1;

            var clientPort = await getFreePort(firstPort);
            if (clientPort === false)
                rej("Unable to find a free client port");
            logger.log(`Found free client port ${clientPort}`);

            var backendPort = await getFreePort(clientPort + 1);
            if (backendPort === false)
                rej("Unable to find a free backend port");
            logger.log(`Found free backend port ${backendPort}`);

            this.clientPort = clientPort;
            this.backendPort = backendPort;
        }
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

    /** Stop any node process running on the server port. This will stop either the server or the client depending on what is running 
     *  
     */ 
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

    /** Edit this instance
     * 
     */
    async edit() {
        showWaitLoadingPopup(`<span>Please wait while Olympus is being edited in <i>${this.name}</i></span>`);
        try {
            setPopupLoadingProgress("Applying configuration...", 0);
            await sleep(100);
            await applyConfiguration(getManager().getActiveInstance().folder, getManager().getActiveInstance());

            setPopupLoadingProgress("Editing completed!", 100);
            await sleep(500);
            logger.log(`Editing completed successfully`);
            hidePopup();

            getManager().options.mode === "basic"? getManager().menuPage.show(): getManager().instancesPage.show();
        } catch (err) {
            logger.log(`An error occurred during editing: ${err}`);
            hidePopup();
            showErrorPopup(`A critical error occurred, check ${getManager().options.logLocation} for more info.`)
        }
    }

    /** Install this instance
     *  
     */ 
    async install() {
        showWaitLoadingPopup(`<span>Please wait while Olympus is being installed in <i>${this.name}</i></span>`);
        try {
            setPopupLoadingProgress("Installing hook scripts...", 0);
            await sleep(100);
            await installHooks(getManager().getActiveInstance().folder);

            setPopupLoadingProgress("Installing mod folder...", 20);
            await sleep(100);
            await installMod(getManager().getActiveInstance().folder, getManager().getActiveInstance().name);

            setPopupLoadingProgress("Installing JSON file...", 40);
            await sleep(100);
            await installJSON(getManager().getActiveInstance().folder);

            setPopupLoadingProgress("Applying configuration...", 60);
            await sleep(100);
            await applyConfiguration(getManager().getActiveInstance().folder, getManager().getActiveInstance());

            setPopupLoadingProgress("Creating shortcuts...", 80);
            await sleep(100);
            await installShortCuts(getManager().getActiveInstance().folder, getManager().getActiveInstance().name);

            setPopupLoadingProgress("Installation completed!", 100);
            await sleep(500);
            logger.log(`Installation completed successfully`);
            hidePopup();
            getManager().resultPage.show();
            getManager().resultPage.getElement().querySelector(".result-summary.success").classList.remove("hide");
            getManager().resultPage.getElement().querySelector(".result-summary.error").classList.add("hide");
            getManager().resultPage.getElement().querySelector(".instructions-group").classList.remove("hide");
        } catch (err) {
            logger.log(`An error occurred during installation: ${err}`);
            hidePopup();
            getManager().resultPage.show();
            getManager().resultPage.getElement().querySelector(".result-summary.success").classList.add("hide");
            getManager().resultPage.getElement().querySelector(".result-summary.error").classList.remove("hide");
        }

    }

    /** Uninstall this instance
     * 
     */
    async uninstall() {
        showConfirmPopup("<div style='font-size: 18px; max-width: 100%; margin-bottom: 15px;'> Are you sure you want to remove Olympus? </div> If you click Accept, the Olympus mod will be removed from your DCS installation.", async () => {
            try {
                logger.log(`Uninstalling Olympus from ${this.folder}`)
                showWaitLoadingPopup(`<span>Please wait while Olympus is being removed from <i>${this.name}</i></span>`);
                setPopupLoadingProgress("Deleting mod folder...", 0);
                await sleep(100);
                await deleteMod(this.folder, this.name);

                setPopupLoadingProgress("Deleting hook scripts...", 25);
                await sleep(100);
                await deleteHooks(this.folder);

                setPopupLoadingProgress("Deleting JSON...", 50);
                await sleep(100);
                await deleteJSON(this.folder);

                setPopupLoadingProgress("Deleting shortcuts...", 75);
                await sleep(100);
                await deleteShortCuts(this.folder, this.name);

                await sleep(500);
                setPopupLoadingProgress("Instance removed!", 100);
                logger.log(`Olympus removed from ${this.folder}`)
                location.reload();
                return true;
            } catch (err) {
                logger.error(err)
                showErrorPopup(`An error has occurred while uninstalling the Olympus instance. Make sure Olympus and DCS are not running. <br><br> You can find more info in ${path.join(__dirname, "..", "manager.log")}`, () => {
                    location.reload();
                });
            }
        });
    }
}

module.exports = DCSInstance;
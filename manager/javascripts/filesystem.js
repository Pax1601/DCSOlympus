const sha256 = require('sha256')
const createShortcut = require('create-desktop-shortcuts');
const fs = require('fs');
const path = require('path');
const { showWaitPopup } = require('./popup');
const { Console } = require('console');
const homeDir = require('os').homedir();

var output = fs.createWriteStream('./manager.log', {flags: 'a'});
var logger = new Console(output, output);
const date = new Date();
output.write(` ======================= New log starting at ${date.toString()} =======================\n`);

/** Conveniency function to asynchronously delete a single file, with error catching
 * 
 */
async function deleteFile(filePath) {
    logger.log(`Deleting ${filePath}`);
    var promise = new Promise((res, rej) => {
        if (fs.existsSync(filePath)) {
            fs.rm(filePath, (err) => {
                if (err) {
                    logger.error(`Error removing ${filePath}: ${err}`)
                    rej(err);
                }
                else {
                    logger.log(`Removed ${filePath}`)
                    res(true);
                }
            });
        }
        else {
            res(true);
        }
    })
    return promise;
}

/** Given a list of Olympus instances, it fixes/updates them by deleting the existing installation and the copying over the clean files 
 * 
 */
async function fixInstances(instances) {
    var promise = new Promise((res, rej) => {
        var instancePromises = instances.map((instance) => {
            var instancePromise = new Promise((instanceRes, instanceErr) => {
                logger.log(`Fixing Olympus in ${instance.folder}`)
                deleteMod(instance.folder, instance.name)
                    .then(() => deleteHooks(instance.folder), (err) => { return Promise.reject(err); })
                    .then(() => installMod(instance.folder, instance.name), (err) => { return Promise.reject(err); })
                    .then(() => installHooks(instance.folder), (err) => { return Promise.reject(err); })
                    .then(() => installShortCuts(instance.folder, instance.name), (err) => { return Promise.reject(err); })
                    .then(() => instanceRes(true), (err) => { instanceErr(err) })
            })
            return instancePromise;
        });
        Promise.all(instancePromises).then(() => res(true), (err) => { rej(err) });
    })
    return promise;
}

/** Uninstalls a specific instance given its folder
 * 
 */
async function uninstallInstance(folder, name) {
    logger.log(`Uninstalling Olympus from ${folder}`)
    showWaitPopup("Please wait while the Olympus installation is being removed.")
    var promise = new Promise((res, rej) => {
        deleteMod(folder, name)
            .then(() => deleteHooks(folder), (err) => { return Promise.reject(err); })
            .then(() => deleteJSON(folder), (err) => { return Promise.reject(err); })
            .then(() => deleteShortCuts(folder, name), (err) => { return Promise.reject(err); })
            .then(() => res(true), (err) => { rej(err) });
    })
    return promise;
}

/** Installs the Hooks script
 * 
 */
async function installHooks(folder) {
    logger.log(`Installing hooks in ${folder}`)
    var promise = new Promise((res, rej) => {
        fs.cp(path.join("..", "scripts", "OlympusHook.lua"), path.join(folder, "Scripts", "Hooks", "OlympusHook.lua"), (err) => {
            if (err) {
                logger.log(`Error installing hooks in ${folder}: ${err}`)
                rej(err);
            }
            else {
                logger.log(`Hooks succesfully installed in ${folder}`)
                res(true);
            }
        });
    })
    return promise;
}

/** Installs the Mod folder
 * 
 */
async function installMod(folder, name) {
    logger.log(`Installing mod in ${folder}`)
    var promise = new Promise((res, rej) => {
        fs.cp(path.join("..", "mod"), path.join(folder, "Mods", "Services", "Olympus"), { recursive: true }, (err) => {
            if (err) {
                logger.log(`Error installing mod in ${folder}: ${err}`)
                rej(err);
            }
            else {
                logger.log(`Mod succesfully installed in ${folder}`)

                /* Check if backup user-editable files exist. If true copy them over */
                try {
                    logger.log(__dirname)
                    logger.log(path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "databases"));
                    if (fs.existsSync(path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "databases"))) {
                        logger.log("Backup databases found, copying over");
                        fs.cpSync(path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "databases"), path.join(folder, "Mods", "Services", "Olympus", "databases"), {recursive: true});
                    }

                    if (fs.existsSync(path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "scripts", "mods.lua"))) {
                        logger.log("Backup mods.lua found, copying over");
                        fs.cpSync(path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "scripts", "mods.lua"), path.join(folder, "Mods", "Services", "Olympus", "scripts", "mods.lua"));
                    }
                } catch (err) {
                    logger.log(`Error installing mod in ${folder}: ${err}`)
                    rej(err);
                }

                res(true);
            }
        });
    })
    return promise;
}

/** Installs the olympus.json file
 * 
 */
async function installJSON(folder) {
    logger.log(`Installing config in ${folder}`)
    var promise = new Promise((res, rej) => {
        fs.cp(path.join("..", "olympus.json"), path.join(folder, "Config", "olympus.json"), (err) => {
            if (err) {
                logger.log(`Error installing config in ${folder}: ${err}`)
                rej(err);
            }
            else {
                logger.log(`Config succesfully installed in ${folder}`)
                res(true);
            }
        });
    })
    return promise;
}

/** Creates shortcuts both in the DCS Saved Games folder and on the desktop
 * 
 */
async function installShortCuts(folder, name) {
    logger.log(`Installing shortcuts for Olympus in ${folder}`);
    var promise = new Promise((res, rej) => {
        var res1 = createShortcut({
            windows: {
                filePath: path.resolve(__dirname, '..', '..', 'client', 'client.vbs'),
                outputPath: folder,
                name: `DCS Olympus Client (${name})`,
                arguments: `"${path.join(folder, "Config", "olympus.json")}"`,
                icon: path.resolve(__dirname, '..', '..', 'img', 'olympus.ico'),
                workingDirectory: path.resolve(__dirname, '..', '..', 'client')
            }
        });

        var res2 = createShortcut({
            windows: {
                filePath: path.resolve(__dirname, '..', '..', 'client', 'server.vbs'),
                outputPath: folder,
                name: `DCS Olympus Server (${name})`,
                arguments: `"${path.join(folder, "Config", "olympus.json")}"`,
                icon: path.resolve(__dirname, '..', '..', 'img', 'olympus_server.ico'),
                workingDirectory: path.resolve(__dirname, '..', '..', 'client')
            }
        });

        var res3 = createShortcut({
            windows: {
                filePath: path.resolve(__dirname, '..', '..', 'client', 'client.vbs'),
                name: `DCS Olympus Client (${name})`,
                arguments: `"${path.join(folder, "Config", "olympus.json")}"`,
                icon: path.resolve(__dirname, '..', '..', 'img', 'olympus.ico'),
                workingDirectory: path.resolve(__dirname, '..', '..', 'client')
            }
        });

        var res4 = createShortcut({
            windows: {
                filePath: path.resolve(__dirname, '..', '..', 'client', 'server.vbs'),
                name: `DCS Olympus Server (${name})`,
                arguments: `"${path.join(folder, "Config", "olympus.json")}"`,
                icon: path.resolve(__dirname, '..', '..', 'img', 'olympus_server.ico'),
                workingDirectory: path.resolve(__dirname, '..', '..', 'client')
            }
        });

        if (res1 && res2 && res3 && res4) {
            res(true);
        } else {
            rej("An error occurred while creating the shortcuts")
        }
    });
    return promise;
}

/** Writes the configuration of an instance to the olympus.json file
 * 
 */
async function applyConfiguration(folder, instance) {
    logger.log(`Applying configuration to Olympus in ${folder}`);
    var promise = new Promise((res, rej) => {
        if (fs.existsSync(path.join(folder, "Config", "olympus.json"))) {
            var config = JSON.parse(fs.readFileSync(path.join(folder, "Config", "olympus.json")));

            config["client"]["port"] = instance.clientPort;
            config["server"]["port"] = instance.backendPort;
            config["server"]["address"] = instance.backendAddress;
            config["authentication"]["gameMasterPassword"] = sha256(instance.gameMasterPassword);
            config["authentication"]["blueCommanderPassword"] = sha256(instance.blueCommanderPassword);
            config["authentication"]["redCommanderPassword"] = sha256(instance.redCommanderPassword);

            fs.writeFile(path.join(folder, "Config", "olympus.json"), JSON.stringify(config, null, 4), (err) => {
                if (err) {
                    logger.log(`Error applying config in ${folder}: ${err}`)
                    rej(err);
                }
                else {
                    logger.log(`Config succesfully applied in ${folder}`)
                    res(true);
                }
            });

        } else {
            rej("File does not exist")
        }
        res(true);
    });
    return promise;
}

/** Deletes the Hooks script 
 * 
 */
async function deleteHooks(folder) {
    logger.log(`Deleting hooks from ${folder}`);
    return deleteFile(path.join(folder, "Scripts", "Hooks", "OlympusHook.lua"));
}

/** Deletes the Mod folder
 * 
 */
async function deleteMod(folder, name) {
    logger.log(`Deleting mod from ${folder}`);
    var promise = new Promise((res, rej) => {
        if (fs.existsSync(path.join(folder, "Mods", "Services", "Olympus"))) {
            /* Make a copy of the user-editable files */
            if (fs.existsSync(path.join(folder, "Mods", "Services", "Olympus", "databases"))) 
                fs.cpSync(path.join(folder, "Mods", "Services", "Olympus", "databases"), path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "databases"), {recursive: true});
            else
                logger.warn(`No database folder found in ${folder}, skipping backup...`)

            if (fs.existsSync(path.join(folder, "Mods", "Services", "Olympus", "scripts", "mods.lua")))
                fs.cpSync(path.join(folder, "Mods", "Services", "Olympus", "scripts", "mods.lua"), path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "scripts", "mods.lua"));
            else
                logger.warn(`No mods.lua found in ${folder}, skipping backup...`)

            /* Remove the mod folder */
            fs.rmdir(path.join(folder, "Mods", "Services", "Olympus"), { recursive: true, force: true }, (err) => {
                if (err) {
                    logger.log(`Error removing mod from ${folder}: ${err}`)
                    rej(err);
                }
                else {
                    logger.log(`Mod succesfully removed from ${folder}`)
                    res(true);
                }
            })
        } else {
            res(true);
        };
    })
    return promise;
}

/** Deletes the olympus.json configuration file
 * 
 */
async function deleteJSON(folder) {
    logger.log(`Deleting JSON from ${folder}`);
    return deleteFile(path.join(folder, "Config", "olympus.json"));
}

/** Deletes the shortcuts
 * 
 */
async function deleteShortCuts(folder, name) {
    logger.log(`Deleting ShortCuts from ${folder}`);
    var promise = new Promise((res, rej) => {
        deleteFile(path.join(folder, `DCS Olympus Server (${name}).lnk`))
            .then(deleteFile(path.join(folder, `DCS Olympus Client (${name}).lnk`)), (err) => { return Promise.reject(err); })
            .then(deleteFile(path.join(homeDir, "Desktop", `DCS Olympus Server (${name}).lnk`)), (err) => { return Promise.reject(err); })
            .then(deleteFile(path.join(homeDir, "Desktop", `DCS Olympus Client (${name}).lnk`)), (err) => { return Promise.reject(err); })
            .then(() => { res(true) }, (err) => { rej(err) })
    });
    return promise;
}

module.exports = {
    applyConfiguration: applyConfiguration,
    installJSON: installJSON,
    installHooks: installHooks,
    installMod: installMod,
    installShortCuts, installShortCuts,
    fixInstances: fixInstances,
    deleteHooks: deleteHooks,
    deleteJSON: deleteJSON,
    deleteMod: deleteMod,
    deleteShortCuts: deleteShortCuts,
    uninstallInstance: uninstallInstance,
    logger: logger
}

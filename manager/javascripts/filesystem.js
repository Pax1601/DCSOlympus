const sha256 = require('sha256')
const createShortcut = require('create-desktop-shortcuts');
const fs = require('fs');
const path = require('path');
const { showWaitPopup } = require('./popup');
const homeDir = require('os').homedir();

/** Conveniency function to asynchronously delete a single file, with error catching
 * 
 */
async function deleteFile(filePath) {
    console.log(`Deleting ${filePath}`);
    var promise = new Promise((res, rej) => {
        if (fs.existsSync(filePath)) {
            fs.rm(filePath, (err) => {
                if (err) {
                    console.error(`Error removing ${filePath}: ${err}`)
                    rej(err);
                }
                else {
                    console.log(`Removed ${filePath}`)
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
                console.log(`Fixing Olympus in ${instance.folder}`)
                deleteMod(instance.folder)
                    .then(() => deleteHooks(instance.folder), (err) => { return Promise.reject(err); })
                    .then(() => installMod(instance.folder), (err) => { return Promise.reject(err); })
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
    console.log(`Uninstalling Olympus from ${folder}`)
    showWaitPopup("Please wait while the Olympus installation is being uninstalled.")
    var promise = new Promise((res, rej) => {
        deleteMod(folder)
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
    console.log(`Installing hooks in ${folder}`)
    var promise = new Promise((res, rej) => {
        fs.cp(path.join("..", "scripts", "OlympusHook.lua"), path.join(folder, "Scripts", "Hooks", "OlympusHook.lua"), (err) => {
            if (err) {
                console.log(`Error installing hooks in ${folder}: ${err}`)
                rej(err);
            }
            else {
                console.log(`Hooks succesfully installed in ${folder}`)
                res(true);
            }
        });
    })
    return promise;
}

/** Installs the Mod folder
 * 
 */
// TODO: add option to not copy over databases
async function installMod(folder) {
    console.log(`Installing mod in ${folder}`)
    var promise = new Promise((res, rej) => {
        fs.cp(path.join("..", "mod"), path.join(folder, "Mods", "Services", "Olympus"), { recursive: true }, (err) => {
            if (err) {
                console.log(`Error installing mod in ${folder}: ${err}`)
                rej(err);
            }
            else {
                console.log(`Mod succesfully installed in ${folder}`)
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
    console.log(`Installing config in ${folder}`)
    var promise = new Promise((res, rej) => {
        fs.cp(path.join("..", "olympus.json"), path.join(folder, "Config", "olympus.json"), (err) => {
            if (err) {
                console.log(`Error installing config in ${folder}: ${err}`)
                rej(err);
            }
            else {
                console.log(`Config succesfully installed in ${folder}`)
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
    console.log(`Installing shortcuts for Olympus in ${folder}`);
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
    console.log(`Applying configuration to Olympus in ${folder}`);
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
                    console.log(`Error applying config in ${folder}: ${err}`)
                    rej(err);
                }
                else {
                    console.log(`Config succesfully applied in ${folder}`)
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
    console.log(`Deleting hooks from ${folder}`);
    return deleteFile(path.join(folder, "Scripts", "Hooks", "OlympusHook.lua"));
}

/** Deletes the Mod folder
 * 
 */
async function deleteMod(folder) {
    console.log(`Deleting mod from ${folder}`);
    var promise = new Promise((res, rej) => {
        if (fs.existsSync(path.join(folder, "Mods", "Services", "Olympus"))) {
            fs.rmdir(path.join(folder, "Mods", "Services", "Olympus"), { recursive: true, force: true }, (err) => {
                if (err) {
                    console.log(`Error removing mod from ${folder}: ${err}`)
                    rej(err);
                }
                else {
                    console.log(`Mod succesfully removed from ${folder}`)
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
    console.log(`Deleting JSON from ${folder}`);
    return deleteFile(path.join(folder, "Config", "olympus.json"));
}

/** Deletes the shortcuts
 * 
 */
async function deleteShortCuts(folder, name) {
    console.log(`Deleting ShortCuts from ${folder}`);
    var promise = new Promise((res, rej) => {
        deleteFile(path.join(folder, `DCS Olympus Server (${name}).lnk`))
        .then(deleteFile(path.join(folder, `DCS Olympus Client (${name}).lnk`)), (err) => { return Promise.reject(err); })
        .then(deleteFile(path.join(homeDir, "Desktop", `DCS Olympus Server (${name}).lnk`)), (err) => { return Promise.reject(err); })
        .then(deleteFile(path.join(homeDir, "Desktop", `DCS Olympus Client (${name}).lnk`)), (err) => { return Promise.reject(err); })
        .then(() => {res(true)}, (err) => { rej(err) })
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
    uninstallInstance: uninstallInstance
}

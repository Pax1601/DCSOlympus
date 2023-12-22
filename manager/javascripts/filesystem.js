const sha256 = require('sha256')
const createShortcut = require('create-desktop-shortcuts');
const fs = require('fs');
const path = require('path');

async function fixInstances(instances) {
    var promise = new Promise((res, rej) => {
        var instancePromises = instances.map((instance) => {
            var instancePromise = new Promise((instanceRes, instanceErr) => {
                installMod(instance.folder)
                    .then(() => installHooks(instance.folder))
                    .then(() => installShortCuts(instance.folder, instance.name))
                    .then(() => instanceRes(true), (err) => { instanceErr(err) })
            })
            return instancePromise;
        });
        console.log(instancePromises);
        Promise.all(instancePromises).then(() => res(true), (err) => { rej(err) });
    })
    console.log(promise);
    return promise;
}

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

        if (res1 && res2) {
            res(true);
        } else {
            rej("An error occurred while creating the shortcuts")
        }
    });
    return promise;
}

module.exports = {
    applyConfiguration: applyConfiguration,
    installJSON: installJSON,
    installHooks: installHooks,
    installMod: installMod,
    installShortCuts, installShortCuts,
    fixInstances: fixInstances
}

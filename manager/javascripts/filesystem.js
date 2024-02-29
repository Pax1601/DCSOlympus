const sha256 = require('sha256')
const createShortcut = require('create-desktop-shortcuts');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { Console } = require('console');
const homeDir = require('os').homedir();

var output = fs.createWriteStream('./manager.log', { flags: 'a' });
var logger = new Console(output, output);
const date = new Date();
output.write(` ======================= New log starting at ${date.toString()} =======================\n`);

var EXPORT_STRING = "pcall(function() local olympusLFS=require('lfs');dofile(olympusLFS.writedir()..[[Mods\\Services\\Olympus\\Scripts\\OlympusCameraControl.lua]]); end,nil) ";

/** Conveniency function to asynchronously delete a single file, with error catching
 * 
 * @param {String} filePath The path to the file to delete
 */
async function deleteFile(filePath) {
    logger.log(`Deleting ${filePath}`);
    if (await exists(filePath) && await fsp.rm(filePath)) 
        logger.log(`Removed ${filePath}`);
    else 
    logger.log(`${filePath} does not exist, nothing to do`);
}

/** Conveniency function to asynchronously check if a file or folder exists
 * 
 * @param {*} location Path to the folder or file to check for existance
 * @returns true if file exists, false if it doesn't
 */
async function exists(location) {
    try {
        await fsp.stat(location);
        return true;
    } catch (err) {
        if (err.code === 'ENOENT') {
            return false
        } else {
            throw err;
        }
    }
}

/** Asynchronously installs the Hooks script
 * 
 * @param {String} folder The base Saved Games folder where the hooks scripts should be installed
 */
async function installHooks(folder) {
    logger.log(`Installing hooks in ${folder}`)
    await fsp.cp(path.join("..", "scripts", "OlympusHook.lua"), path.join(folder, "Scripts", "Hooks", "OlympusHook.lua"));
    logger.log(`Hooks succesfully installed in ${folder}`)
}

/** Asynchronously installs the Mod folder
 * 
 * @param {String} folder The base Saved Games folder where the mod folder should be installed
 * @param {String} name The name of the current DCS Instance, used to create backups of user created files
 */

async function installMod(folder, name) {
    logger.log(`Installing mod in ${folder}`)

    await fsp.cp(path.join("..", "mod"), path.join(folder, "Mods", "Services", "Olympus"), { recursive: true });
    logger.log(`Mod succesfully installed in ${folder}`)

    /* Check if backup user-editable files exist. If true copy them over */
    logger.log(path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "databases"));
    if (await exists(path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "databases"))) {
        logger.log("Backup databases found, copying over");
        await fsp.cp(path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "databases"), path.join(folder, "Mods", "Services", "Olympus", "databases"), { recursive: true });
    }

    if (exists(path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "scripts", "mods.lua"))) {
        logger.log("Backup mods.lua found, copying over");
        fsp.cp(path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "scripts", "mods.lua"), path.join(folder, "Mods", "Services", "Olympus", "scripts", "mods.lua"));
    }
}

/** Asynchronously installs the olympus.json file
 * 
 * @param {String} folder The base Saved Games folder where the config json should be installed
 */
async function installJSON(folder) {
    logger.log(`Installing config in ${folder}`)
    await fsp.cp(path.join("..", "olympus.json"), path.join(folder, "Config", "olympus.json"));
    logger.log(`Config succesfully installed in ${folder}`)
}

/** Asynchronously creates shortcuts both in the DCS Saved Games folder and on the desktop
 * 
 * @param {String} folder The base Saved Games folder where the shortcuts should be installed
 * @param {String} name The name of the current DCS Instance, used to create the shortcut names
 */
async function installShortCuts(folder, name) {
    logger.log(`Installing shortcuts for Olympus in ${folder}`);

    var res1 = createShortcut({
        windows: {
            filePath: path.resolve(__dirname, '..', '..', 'frontend', 'client.vbs'),
            outputPath: folder,
            name: `DCS Olympus Client (${name})`,
            arguments: `"${path.join(folder, "Config", "olympus.json")}"`,
            icon: path.resolve(__dirname, '..', '..', 'img', 'olympus.ico'),
            workingDirectory: path.resolve(__dirname, '..', '..', 'frontend')
        }
    });

    var res2 = createShortcut({
        windows: {
            filePath: path.resolve(__dirname, '..', '..', 'frontend', 'server.vbs'),
            outputPath: folder,
            name: `DCS Olympus Server (${name})`,
            arguments: `"${path.join(folder, "Config", "olympus.json")}"`,
            icon: path.resolve(__dirname, '..', '..', 'img', 'olympus_server.ico'),
            workingDirectory: path.resolve(__dirname, '..', '..', 'frontend')
        }
    });

    var res3 = createShortcut({
        windows: {
            filePath: path.resolve(__dirname, '..', '..', 'frontend', 'client.vbs'),
            name: `DCS Olympus Client (${name})`,
            arguments: `"${path.join(folder, "Config", "olympus.json")}"`,
            icon: path.resolve(__dirname, '..', '..', 'img', 'olympus.ico'),
            workingDirectory: path.resolve(__dirname, '..', '..', 'frontend')
        }
    });

    var res4 = createShortcut({
        windows: {
            filePath: path.resolve(__dirname, '..', '..', 'frontend', 'server.vbs'),
            name: `DCS Olympus Server (${name})`,
            arguments: `"${path.join(folder, "Config", "olympus.json")}"`,
            icon: path.resolve(__dirname, '..', '..', 'img', 'olympus_server.ico'),
            workingDirectory: path.resolve(__dirname, '..', '..', 'frontend')
        }
    });

    // TODO actually check if the shortcuts where created
    if (!res1 || !res2 || !res3 || !res4) 
        throw "An error occurred while creating the shortcuts";
}

/** Asynchronously writes the configuration of an instance to the olympus.json file
 * 
 * @param {String} folder The base Saved Games folder where Olympus should is installed
 * @param {DCSInstance} instance The DCSInstance of which we want to apply the configuration 
 */
async function applyConfiguration(folder, instance) {
    logger.log(`Applying configuration to Olympus in ${folder}`);

    if (await exists(path.join(folder, "Config", "olympus.json"))) {
        var config = JSON.parse(await fsp.readFile(path.join(folder, "Config", "olympus.json")));

        /* Automatically find free ports */
        if (instance.connectionsType === 'auto') {
            await instance.findFreePorts();
        }

        /* Apply the configuration */
        config["frontend"]["port"] = instance.frontendPort;
        config["backend"]["port"] = instance.backendPort;
        config["backend"]["address"] = instance.backendAddress;
        config["authentication"]["gameMasterPassword"] = sha256(instance.gameMasterPassword);
        config["authentication"]["blueCommanderPassword"] = sha256(instance.blueCommanderPassword);
        config["authentication"]["redCommanderPassword"] = sha256(instance.redCommanderPassword);

        await fsp.writeFile(path.join(folder, "Config", "olympus.json"), JSON.stringify(config, null, 4));
        logger.log(`Config succesfully applied in ${folder}`)
    } else {
        throw "File does not exist";
    }
}

/** Asynchronously install the camera control plugin 
 * 
 * @param {String} folder The base Saved Games folder where Olympus is installed
 */
async function installCameraPlugin(folder) {
    logger.log(`Installing camera support plugin to  DCS in ${folder}`);
    /* If the export file doesn't exist, create it */
    if (!(await exists(path.join(folder, "Scripts", "export.lua")))) {
        await fsp.writeFile(path.join(folder, "Scripts", "export.lua"), EXPORT_STRING);
    } else {
        let content = await fsp.readFile(path.join(folder, "Scripts", "export.lua"), { encoding: 'utf8' });
        if (content.indexOf(EXPORT_STRING) != -1) {
            /* Looks like the export string is already installed, nothing to do */
        }
        else {
            /* Append the export string at the end of the file */
            content += ("\n" + EXPORT_STRING);
        }
        /* Write the content of the file */
        await fsp.writeFile(path.join(folder, "Scripts", "export.lua"), content)
    }
}

/** Asynchronously deletes the Hooks script 
 * 
 * @param {String} folder The base Saved Games folder where Olympus is installed
 */
async function deleteHooks(folder) {
    logger.log(`Deleting hooks from ${folder}`);
    await deleteFile(path.join(folder, "Scripts", "Hooks", "OlympusHook.lua"));
}

/** Asynchronously deletes the Mod folder
 * 
 * @param {String} folder The base Saved Games folder where Olympus is installed
 */
async function deleteMod(folder, name) {
    logger.log(`Deleting mod from ${folder}`);

    if (await exists(path.join(folder, "Mods", "Services", "Olympus"))) {
        /* Make a copy of the user-editable files */
        if (await exists(path.join(folder, "Mods", "Services", "Olympus", "databases")))
            await fsp.cp(path.join(folder, "Mods", "Services", "Olympus", "databases"), path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "databases"), { recursive: true });
        else
            logger.warn(`No database folder found in ${folder}, skipping backup...`)

        if (await exists(path.join(folder, "Mods", "Services", "Olympus", "scripts", "mods.lua")))
            await fsp.cp(path.join(folder, "Mods", "Services", "Olympus", "scripts", "mods.lua"), path.join(__dirname, "..", "..", "..", "DCS Olympus backups", name, "scripts", "mods.lua"));
        else
            logger.warn(`No mods.lua found in ${folder}, skipping backup...`)

        /* Remove the mod folder */
        await fsp.rmdir(path.join(folder, "Mods", "Services", "Olympus"), { recursive: true, force: true })
        logger.log(`Mod succesfully removed from ${folder}`)
    } else {
        logger.warn(`Mod does not exist in ${folder}, nothing to do`)
    }
}

/** Asynchronously deletes the olympus.json configuration file
 * 
 * @param {String} folder The base Saved Games folder where Olympus is installed
 */
async function deleteJSON(folder) {
    logger.log(`Deleting JSON from ${folder}`);
    return deleteFile(path.join(folder, "Config", "olympus.json"));
}

/** Asynchronously deletes the shortcuts
 * 
 * @param {String} folder The base Saved Games folder where Olympus is installed
 * @param {String} name The name of the DCS Instance, used to find the correct shortcuts
 */
async function deleteShortCuts(folder, name) {
    logger.log(`Deleting ShortCuts from ${folder} and desktop`);
    await deleteFile(path.join(folder, `DCS Olympus Server (${name}).lnk`))
    await deleteFile(path.join(folder, `DCS Olympus Client (${name}).lnk`))
    await deleteFile(path.join(homeDir, "Desktop", `DCS Olympus Server (${name}).lnk`))
    await deleteFile(path.join(homeDir, "Desktop", `DCS Olympus Client (${name}).lnk`))
    logger.log(`ShortCuts deleted from ${folder} and desktop`);
}

/** Asynchronously removes the camera plugin string from the export lua file
 * 
 * @param {String} folder The base Saved Games folder where Olympus is installed
 */
async function deleteCameraPlugin(folder) {
    logger.log(`Deleting camera support plugin to  DCS in ${folder}`);
    if (!(await exists(path.join(folder, "Scripts", "export.lua")))) {
        /* If the export file doesn't exist, nothing to do */
    } else {
        let content = await fsp.readFile(path.join(folder, "Scripts", "export.lua"), { encoding: 'utf8' });
        if (content.indexOf(EXPORT_STRING) ==+ -1) {
            /* Looks like the export string is not installed, nothing to do */
        }
        else {
            /* Remove the export string from the file */
            content = content.replace(EXPORT_STRING, "")

            /* Write the content of the file */
            await fsp.writeFile(path.join(folder, "Scripts", "export.lua"), content)
        }
    }
}

module.exports = {
    applyConfiguration: applyConfiguration,
    installJSON: installJSON,
    installHooks: installHooks,
    installMod: installMod,
    installShortCuts: installShortCuts,
    installCameraPlugin: installCameraPlugin,
    deleteHooks: deleteHooks,
    deleteJSON: deleteJSON,
    deleteMod: deleteMod,
    deleteShortCuts: deleteShortCuts,
    deleteCameraPlugin: deleteCameraPlugin,
    logger: logger
}

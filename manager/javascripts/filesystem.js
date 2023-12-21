const sha256 = require('sha256')
const createShortcut = require('create-desktop-shortcuts');

export function installOlympus(folder) {
    console.log(`Installing Olympus in ${folder}`);
    try {
        fs.cpSync(path.join("..", "mod"), path.join(folder, "Mods", "Services", "Olympus"), { recursive: true });
        fs.cpSync(path.join("..", "scripts", "OlympusHook.lua"), path.join(folder, "Scripts", "Hooks", "OlympusHook.lua"));
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

export function uninstallOlympus(folder) {
    console.log(`Uninstalling Olympus from ${folder}`);
    try {
        fs.rmSync(path.join(folder, "Mods", "Services", "Olympus"), { recursive: true, force: true });
        fs.rmSync(path.join(folder, "Config", "olympus.json"), {force: true});
        loadDivs();
    } catch (e) {
        console.error(e);
        return false;
    }
    return true;
}

export function applyConfiguration(folder, data) {
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

export function updateOlympus(folder) {
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

export function createDesktopShortcuts(folder) {
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
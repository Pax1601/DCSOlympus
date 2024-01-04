const Manager = require('./manager');

const contextBridge = require('electron').contextBridge;
const ipcRenderer = require('electron').ipcRenderer;
const { exec, spawn } = require("child_process");
const { showConfirmPopup, showWaitPopup, showErrorPopup } = require('./popup');
const path = require('path');
const os = require('os');
const https = require('follow-redirects').https;
const fs = require('fs');
const AdmZip = require("adm-zip");
const { Octokit } = require('octokit');

const VERSION = "v2.0.0";
function checkVersion() {

    /* Check if we are running the latest version */
    const request = new Request("https://raw.githubusercontent.com/Pax1601/DCSOlympus/main/version.json");
    fetch(request).then((response) => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error("Error connecting to Github to retrieve latest version");
        }
    }).then((res) => {
        /* If we are running a development version of the script (not from a compiled package), skip version checking */
        if (VERSION.includes("OLYMPUS_VERSION_NUMBER")) {
            console.log("Development build detected, skipping version checks...")
        } else {
            /* Check if there is a newer version available */
            var reg1 = res["version"].match(/\d+/g).map((str) => { return Number(str) });
            var reg2 = VERSION.match(/\d+/g).map((str) => { return Number(str) });

            /* If a newer version is available update Olympus in Release mode */
            if (reg1[0] > reg2[0] || (reg1[0] == reg2[0] && reg1[1] > reg2[1]) || (reg1[0] == reg2[0] && reg1[1] == reg2[1] && reg1[2] > reg2[2])) {
                console.log(`New version available: ${res["version"]}`);
                showConfirmPopup(`You are currently running DCS Olympus ${VERSION}, but ${res["version"]} is available. Do you want to update DCS Olympus automatically? <div style="max-width: 100%; color: orange">Note: DCS and Olympus MUST be stopped before proceeding.</div>`,
                    () => {
                        updateOlympusRelease();
                    }, () => {
                        console.log("Update canceled");
                    })
            }
            /* If the current version is newer than the latest release, the user is probably a developer. Ask for a beta update */
            else if (reg2[0] > reg1[0] || (reg2[0] == reg1[0] && reg2[1] > reg1[1]) || (reg2[0] == reg1[0] && reg2[1] == reg1[1] && reg2[2] > reg1[2])) {
                console.log(`Beta version detected: ${res["version"]}`);
                showConfirmPopup(`You are currently running DCS Olympus ${VERSION}, which is newer than the latest release version. Do you want to download the latest beta version? <div style="max-width: 100%; color: orange">Note: DCS and Olympus MUST be stopped before proceeding.</div>`,
                    () => {
                        updateOlympusBeta();
                    }, () => {
                        console.log("Update canceled");
                    })
            }
        }
    })
}

/** Update Olympus in "beta" mode. The user will be provided with the option to update from a build artifact 
 * 
 */
async function updateOlympusBeta() {
    /* Get a list of build artifacts */
    const octokit = new Octokit({});
    const res = await octokit.request('GET /repos/{owner}/{repo}/actions/artifacts', {
        owner: 'Pax1601',
        repo: 'DCSOlympus',
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    const artifacts = res.data.artifacts;
    
    /* Select the newest artifact */
    var artifact = artifacts.find((artifact) => { return artifact.name = "development_build_not_a_release" });

    showConfirmPopup(`Latest beta artifact has a timestamp of ${artifact.updated_at}. Do you want to continue?`, () => {
        /* Run the browser and download the artifact */ //TODO: try and directly download the file from code rather than using the browser 
        exec(`start https://github.com/Pax1601/DCSOlympus/actions/runs/${artifact.workflow_run.id}/artifacts/${artifact.id}`)
        showConfirmPopup('A browser window was opened to download the beta artifact. Please wait for the download to complete, then press "Accept" and select the downloaded beta artifact.',
            () => {
                /* Ask the user to select the downloaded file */
                var input = document.createElement('input');
                input.type = 'file';
                input.click();
                input.onchange = e => {
                    /* Run the update process */
                    updateOlympus(e.target.files[0])
                }
            },
            () => {
                console.log("Update canceled");
            });
    },
        () => {
            console.log("Update canceled");
        })
}

/** Update Olympus to the lastest release
 * 
 */
async function updateOlympusRelease() {
    const octokit = new Octokit({})

    const res = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
        owner: 'Pax1601',
        repo: 'DCSOlympus',
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })

    /* Run the update process */
    updateOlympus(res.data.assets[0].browser_download_url)
}

function updateOlympus(location) {
    showWaitPopup("Please wait while Olympus is being updated. The Manager will be closed and reopened automatically when updating is completed.")

    /* If the location is a string, it is interpreted as a download url. Else, it is interpreted as a File (on disk)*/
    if (typeof location === "string") {
        console.log(`Updating Olympus with package from ${location}`)
    } else {
        console.log(`Updating Olympus with package from ${location.path}`)
    }

    let tmpDir;
    const appPrefix = 'dcs-olympus-';
    try {
        /* Create a temporary folder */
        const folder = path.join(os.tmpdir(), appPrefix);
        tmpDir = fs.mkdtempSync(folder);

        if (typeof location === "string") {
            /* Download the file */
            const file = fs.createWriteStream(path.join(tmpDir, "temp.zip"));
            console.log(`Downloading update package in ${path.join(tmpDir, "temp.zip")}`)
            const request = https.get(location, (response) => {
                if (response.statusCode === 200) {
                    response.pipe(file);

                    /* Either on success or on error close the file stream */
                    file.on("finish", () => {
                        file.close();
                        console.log("Download completed");

                        /* Extract and copy the files */
                        extractAndCopy(tmpDir);
                    });
                    file.on("error", (err) => {
                        file.close();
                        console.error(err);
                        throw Error(err);
                    })
                } else {
                    failUpdate();
                    throw Error("Failed to download resource.")
                }
            });
        } else {
            /* Copy the archive to the temporary folder */
            fs.copyFileSync(location.path, path.join(tmpDir, "temp.zip"));
            
            /* Extract and copy the files */
            extractAndCopy(tmpDir);
        }
    }
    catch (err) {
        /* Show the failed update message */
        failUpdate();
        console.error(err)
    }
}

/** Extract the contents of the zip and update Olympus by deleting all files from the current installation and copying the new files over.
 * 
 */
function extractAndCopy(folder) {
    /* Extract all the files */
    const zip = new AdmZip(path.join(folder, "temp.zip"));
    zip.extractAllTo(path.join(folder, "temp"));

    /* Create a batch file that:
    1) waits for 5 seconds to allow the old process to close;
    2) deletes the existing installation;
    3) copies the new installation;
    4) cds into the new installation;
    5) runs the install.bat script */
    fs.writeFileSync(path.join(folder, 'update.bat'),
        `timeout /t 5 \nrmdir "${path.join(__dirname, "..", "..")}" /s /q \necho D|xcopy /Y /S /E "${path.join(folder, "temp")}" "${path.join(__dirname, "..", "..")}" \ncd "${path.join(__dirname, "..", "..")}" \ninstall.bat`
    )

    /* Launch the update script then close gracefully */
    var proc = spawn('cmd.exe', ["/c", path.join(folder, 'update.bat')], { cwd: folder, shell: true, detached: true });
    proc.unref();
    ipcRenderer.send('window:close');
}

/** Something went wrong. Tell the user to update manually.
 * 
 */
function failUpdate() {
    showErrorPopup("An error has occurred while updating Olympus. Please delete Olympus and update it manually. A browser window will open automatically on the download page.", () => {
        exec(`start https://github.com/Pax1601/DCSOlympus/releases`, () => {
            ipcRenderer.send('window:close');
        })
    })
}

/* White-listed channels. */
const ipc = {
    'render': {
        /* From render to main. */
        'send': [
            'window:minimize',
            'window:maximize',
            'window:restore',
            'window:close'
        ],
        /* From main to render. */
        'receive': [
            'event:maximized',
            'event:unmaximized'
        ],
        /* From render to main and back again. */
        'sendReceive': []
    }
};

/* Exposed protected methods in the render process.  */
contextBridge.exposeInMainWorld(
    /* Allowed 'ipcRenderer' methods.  */
    'ipcRender', {
    /* From render to main.  */
    send: (channel, args) => {
        let validChannels = ipc.render.send;
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, args);
        }
    },
    /* From main to render.  */
    receive: (channel, listener) => {
        let validChannels = ipc.render.receive;
        if (validChannels.includes(channel)) {
            /* Deliberately strip event as it includes `sender`.  */
            ipcRenderer.on(channel, (event, ...args) => listener(...args));
        }
    },
    /* From render to main and back again.  */
    invoke: (channel, args) => {
        let validChannels = ipc.render.sendReceive;
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, args);
        }
    }
});

/* New instance of the manager app */
const manager = new Manager();

/* On content loaded */
window.addEventListener('DOMContentLoaded', async () => {
    /* Check if a new version is available */
    checkVersion();

    /* Compute the height of the content page */
    computePagesHeight();
    document.getElementById("loader").classList.remove("hide");
    await manager.start();
    /* Compute the height of the content page to account for the pages created by the manager*/
    computePagesHeight();

    /* Create event listeners for the hyperlinks */
    var links = document.querySelectorAll(".link");
    for (let i = 0; i < links.length; i++) {
        links[i].addEventListener("click", (e) => {
            exec("start " + e.target.dataset.link);
        })
    }
})

window.addEventListener('resize', () => {
    computePagesHeight();
})

/** Computes the height of the content area
 * 
 */
function computePagesHeight() {
    var pages = document.querySelectorAll(".manager-page");
    var titleBar = document.querySelector("#title-bar");
    var header = document.querySelector("#header");

    for (let i = 0; i < pages.length; i++) {
        pages[i].style.height = (window.innerHeight - (titleBar.clientHeight + header.clientHeight)) + "px";
    }
}
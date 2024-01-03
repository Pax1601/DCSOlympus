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

const VERSION = "{{OLYMPUS_VERSION_NUMBER}}";
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
        if (VERSION.includes("OLYMPUS_VERSION_NUMBER")) {
            console.log("Development build detected, skipping version checks...")
        } else {
            var reg1 = res["version"].match(/\d+/g).map((str) => { return Number(str) });
            var reg2 = VERSION.match(/\d+/g).map((str) => { return Number(str) });

            if (reg1[0] > reg2[0] || (reg1[0] == reg2[0] && reg1[1] > reg2[1]) || (reg1[0] == reg2[0] && reg1[1] == reg2[1] && reg1[2] > reg2[2])) {
                console.log(`New version available: ${res["version"]}`);
                showConfirmPopup(`You are currently running DCS Olympus ${VERSION}, but ${res["version"]} is available. Do you want to update DCS Olympus automatically? <div style="max-width: 100%; color: orange">Note: DCS and Olympus MUST be stopped before proceeding.</div>`,
                    () => {
                        updateOlympusRelease();
                    }, () => {
                        console.log("Update canceled");
                    })
            }
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

async function updateOlympusBeta() {
    const octokit = new Octokit({});

    const res = await octokit.request('GET /repos/{owner}/{repo}/actions/artifacts', {
        owner: 'Pax1601',
        repo: 'DCSOlympus',
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    const artifacts = res.data.artifacts;
    var artifact = artifacts.find((artifact) => { return artifact.name = "development_build_not_a_release" });

    showConfirmPopup(`Latest beta artifact has a timestamp of ${artifact.updated_at}. Do you want to continue?`, () => {
        exec(`start https://github.com/Pax1601/DCSOlympus/actions/runs/${artifact.workflow_run.id}/artifacts/${artifact.id}`)
        showConfirmPopup('A browser window was opened to download the beta artifact. Please wait for the download to complete, then press "Accept" and select the downloaded beta artifact.',
            () => {
                var input = document.createElement('input');
                input.type = 'file';
                input.click();
                input.onchange = e => {
                    console.log(e.target.files[0]);
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

async function updateOlympusRelease() {
    const octokit = new Octokit({})

    const res = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
        owner: 'Pax1601',
        repo: 'DCSOlympus',
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })

    updateOlympus(res.data.assets[0].browser_download_url)
}

function updateOlympus(location) {
    showWaitPopup("Please wait while Olympus is being updated. The Manager will be closed and reopened automatically when updating is completed.")
    if (typeof location === "string") {
        console.log(`Updating Olympus with package from ${location}`)
    } else {
        console.log(`Updating Olympus with package from ${location.path}`)
    }

    let tmpDir;
    const appPrefix = 'dcs-olympus-';
    try {
        const folder = path.join(os.tmpdir(), appPrefix);
        tmpDir = fs.mkdtempSync(folder);

        if (typeof location === "string") {
            const file = fs.createWriteStream(path.join(tmpDir, "temp.zip"));
            console.log(`Downloading update package in ${path.join(tmpDir, "temp.zip")}`)
            const request = https.get(location, (response) => {
                if (response.statusCode === 200) {
                    response.pipe(file);

                    // after download completed close filestream
                    file.on("finish", () => {
                        file.close();
                        console.log("Download completed");
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
            fs.copyFileSync(location.path, path.join(tmpDir, "temp.zip"));
            extractAndCopy(tmpDir);
        }
    }
    catch (err) {
        failUpdate();
        console.error(err)
    }
}

function failUpdate() {
    showErrorPopup("An error has occurred while updating Olympus. Please delete Olympus and update it manually. A browser window will open automatically on the download page.", () => {
        exec(`start https://github.com/Pax1601/DCSOlympus/releases`, () => {
            ipcRenderer.send('window:close');
        })
    })
}

function extractAndCopy(folder) {
    const zip = new AdmZip(path.join(folder, "temp.zip"));
    zip.extractAllTo(path.join(folder, "temp"));

    fs.writeFileSync(path.join(folder, 'update.bat'),
        `timeout /t 5 \nrmdir "${path.join(__dirname, "..", "..")}" /s /q \necho D|xcopy /Y /S /E "${path.join(folder, "temp")}" "${path.join(__dirname, "..", "..")}" \ncd "${path.join(__dirname, "..", "..")}" \ninstall.bat`
    )

    var proc = spawn('cmd.exe', ["/c", path.join(folder, 'update.bat')], { cwd: folder, shell: true, detached: true });
    proc.unref();
    ipcRenderer.send('window:close');
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

const manager = new Manager();

/* On content loaded */
window.addEventListener('DOMContentLoaded', async () => {
    computePagesHeight();
    document.getElementById("loader").classList.remove("hide");
    await manager.start();
    computePagesHeight();

    var links = document.querySelectorAll(".link");
    for (let i = 0; i < links.length; i++) {
        links[i].addEventListener("click", (e) => {
            exec("start " + e.target.dataset.link);
        })
    }
})

checkVersion();
window.addEventListener('resize', () => {
    computePagesHeight();
})

function computePagesHeight() {
    var pages = document.querySelectorAll(".manager-page");
    var titleBar = document.querySelector("#title-bar");
    var header = document.querySelector("#header");

    for (let i = 0; i < pages.length; i++) {
        pages[i].style.height = (window.innerHeight - (titleBar.clientHeight + header.clientHeight)) + "px";
    }
}
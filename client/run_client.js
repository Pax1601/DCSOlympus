const fs = require('fs')
const path = require('path')
const { exec } = require("child_process");
const { tcpPingPort } = require("tcp-ping-port")
const jsonPath = path.join('..', 'olympus.json');
const options = { 
    socketTimeout: 1000
}

var attempt = 0;
const maxAttempt = 3;

function checkServer() {
    console.log("Checking DCS Olympus server availability...");
    tcpPingPort(`localhost`, json["client"]["port"], options).then(res => {
        if (res.online) {
            run();
        }
        else {
            if (attempt < maxAttempt) {
                attempt++;
                console.log(`DCS Olympus server not found, starting it up! Attempt ${attempt} of ${maxAttempt}`);
                startServer();
            } else {
                console.log("Failed to start DCS Olympus server!")
            }
        }
    })
}

async function startServer() {
    exec(`START /min "" "../DCS Olympus Server.lnk"`)
    await new Promise(resolve => setTimeout(resolve, 3000));
    checkServer();
}

function run() {
    exec(`start http://localhost:${json["client"]["port"]}`)
}

/* Check that we can read the json */
if (fs.existsSync(jsonPath)) {
    var json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    checkServer();
}
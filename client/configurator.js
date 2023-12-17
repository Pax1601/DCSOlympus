const fs = require('fs')
const path = require('path')
const yargs = require('yargs');
const prompt = require('prompt-sync')({sigint: true});
const sha256 = require('sha256');
const jsonPath = path.join('..', 'olympus.json');

/* Set the acceptable values */
yargs.alias('a', 'address').describe('a', 'Backend address').string('a');
yargs.alias('b', 'backendPort').describe('b', 'Backend port').number('b');
yargs.alias('c', 'clientPort').describe('c', 'Client port').number('c');
yargs.alias('p', 'gameMasterPassword').describe('p', 'Game Master password').string('p');
yargs.alias('bp', 'blueCommanderPassword').describe('bp', 'Blue Commander password').string('bp');
yargs.alias('rp', 'redCommanderPassword').describe('rp', 'Red Commander password').string('rp');
args = yargs.argv;

async function run() {
    /* Check that we can read the json */
    if (fs.existsSync(jsonPath)) {
        var json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        var address = args.address ?? json["server"]["address"];
        var clientPort = args.clientPort ?? json["client"]["port"];
        var backendPort = args.backendPort ?? json["server"]["port"];
        var gameMasterPassword = args.gameMasterPassword? sha256(args.gameMasterPassword): json["authentication"]["gameMasterPassword"];
        var blueCommanderPassword = args.blueCommanderPassword? sha256(args.blueCommanderPassword): json["authentication"]["blueCommanderPassword"];
        var redCommanderPassword = args.redCommanderPassword? sha256(args.redCommanderPassword): json["authentication"]["redCommanderPassword"];

        /* Run in interactive mode */
        if (args.address === undefined && args.clientPort === undefined && args.backendPort === undefined &&
            args.gameMasterPassword === undefined && args.blueCommanderPassword === undefined && args.redCommanderPassword === undefined) {

            console.log('\x1b[36m%s\x1b[0m', "*********************************************************************");
            console.log('\x1b[36m%s\x1b[0m', "*  _____   _____  _____    ____  _                                  *");
            console.log('\x1b[36m%s\x1b[0m', "* |  __ \\ / ____|/ ____|  / __ \\| |                                 *");
            console.log('\x1b[36m%s\x1b[0m', "* | |  | | |    | (___   | |  | | |_   _ _ __ ___  _ __  _   _ ___  *");
            console.log('\x1b[36m%s\x1b[0m', "* | |  | | |     \\___ \\  | |  | | | | | | '_ ` _ \\| '_ \\| | | / __| *");
            console.log('\x1b[36m%s\x1b[0m', "* | |__| | |____ ____) | | |__| | | |_| | | | | | | |_) | |_| \\__ \\ *");
            console.log('\x1b[36m%s\x1b[0m', "* |_____/ \\_____|_____/   \\____/|_|\\__, |_| |_| |_| .__/ \\__,_|___/ *");
            console.log('\x1b[36m%s\x1b[0m', "*                                   __/ |         | |               *");
            console.log('\x1b[36m%s\x1b[0m', "*                                  |___/          |_|               *");
            console.log('\x1b[36m%s\x1b[0m', "*********************************************************************");
            console.log('\x1b[36m%s\x1b[0m', "");

            console.log("DCS Olympus configurator {{OLYMPUS_VERSION_NUMBER}}.{{OLYMPUS_COMMIT_HASH}}");
            console.log("");

            var newValue;
            var result;

            /* Get the new address */
            newValue = prompt(`Insert an address or press Enter to keep current value ${address}. Use * for any address: `);
            address = newValue !== ""? newValue: address;

            /* Get the new client port */
            while (true) {
                newValue = prompt(`Insert a client port or press Enter to keep current value ${clientPort}. Integers between 1025 and 65535: `);
                if (newValue === "")
                    break;
                result = Number(newValue);
                
                if (!isNaN(result) && Number.isInteger(result) && result > 1024 && result <= 65535)
                    break;
            }
            clientPort = newValue? result: clientPort;

            /* Get the new backend port */
            while (true) {
                newValue = prompt(`Insert a backend port or press Enter to keep current value ${backendPort}. Integers between 1025 and 65535: `);
                if (newValue === "")
                    break;
                result = Number(newValue);
                
                if (!isNaN(result) && Number.isInteger(result) && result > 1024 && result <= 65535 && result != clientPort)
                    break;

                if (result === clientPort)
                    console.log("Client port and backend port must be different.");
            }
            backendPort = newValue? result: backendPort;

            while (true) {
            /* Get the new Game Master password */
            gmRawPass = prompt(`Insert a new Game Master password or press Enter to keep current value: `, {echo: "*"});

            /* Get the new Blue Commander password */
            blueRawPass = prompt(`Insert a new Blue Commander password or press Enter to keep current value: `, {echo: "*"});
            
            /* Get the new Red Commander password */
            redRawPass = prompt(`Insert a new Red Commander password or press Enter to keep current value: `, {echo: "*"});

            if (gmRawPass === blueRawPass || blueRawPass === redRawPass || gmRawPass === redRawPass)
                console.log("All three passwords must be different");

            else
                break;
            }
            gameMasterPassword = gmRawPass !== ""? sha256(gmRawPass): gameMasterPassword;
            blueCommanderPassword = blueRawPass !== ""? sha256(blueRawPass): blueCommanderPassword;
            redCommanderPassword = redRawPass !== ""? sha256(redRawPass): redCommanderPassword;
        
        }

        /* Apply the inputs */
        json["server"]["address"] = address;
        json["client"]["port"] = clientPort;
        json["server"]["port"] = backendPort;
        json["authentication"]["gameMasterPassword"] = gameMasterPassword;
        json["authentication"]["blueCommanderPassword"] = blueCommanderPassword;
        json["authentication"]["redCommanderPassword"] = redCommanderPassword;

        /* Write the result to disk */
        const serialized = JSON.stringify(json, null, 4);
        fs.writeFileSync(jsonPath, serialized, 'utf8');
        console.log("Olympus.json updated correctly, goodbye!");
    }
    else {
        console.error("Error, could not read olympus.json file!")
    }

    /* Wait a bit before closing the window */
    await new Promise(resolve => setTimeout(resolve, 3000));
}

/* Run the configurator */
run();

import { getConfig, setAddress } from "./server/server";
import { OlympusApp } from "./app";

var app: OlympusApp;

function setup() {
    /* Load the config file from the app server*/
    getConfig((config: ConfigurationOptions) => {
        if (config && config.address != undefined && config.port != undefined) {
            const address = config.address;
            const port = config.port;
            if (typeof address === 'string' && typeof port == 'number') { 
                setAddress(address == "*" ? window.location.hostname : address, <number>port);

                /* If the configuration file was successfully loaded, start the app */
                app = new OlympusApp();
                app.start();
            }
        }
        else {
            throw new Error('Could not read configuration file');
        }
    });
}

export function getApp() {
    return app;
}

window.onload = setup;
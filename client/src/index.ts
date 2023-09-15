import { getConfig, getPaused, setAddress, setCredentials, setPaused, startUpdate, toggleDemoEnabled } from "./server/server";
import { SVGInjector } from "@tanem/svg-injector";
import { OlympusApp } from "./app";
import { ShortcutKeyboard } from "./shortcut/shortcut";

var app: OlympusApp;

function setup() {
    /* Load the config file from the app server*/
    getConfig((config: ConfigurationOptions) => readConfig(config));

    app = new OlympusApp();
    app.start();

    /* Setup event handlers */
    setupEvents(app);
}

export function getApp() {
    return app;
}

/** Loads the configuration parameters
 * 
 * @param config ConfigParameters, defines the address and port of the Olympus REST server
 */
function readConfig(config: ConfigurationOptions) {
    if (config && config.address != undefined && config.port != undefined) {
        const address = config.address;
        const port = config.port;
        if (typeof address === 'string' && typeof port == 'number')
            setAddress(address == "*" ? window.location.hostname : address, <number>port);
    }
    else {
        throw new Error('Could not read configuration file');
    }
}

function setupEvents(app: OlympusApp) {
    /* Generic clicks */
    document.addEventListener("click", (ev) => {
        if (ev instanceof MouseEvent && ev.target instanceof HTMLElement) {
            const target = ev.target;

            if (target.classList.contains("olympus-dialog-close")) {
                target.closest("div.olympus-dialog")?.classList.add("hide");
            }

            const triggerElement = target.closest("[data-on-click]");

            if (triggerElement instanceof HTMLElement) {
                const eventName: string = triggerElement.dataset.onClick || "";
                let params = JSON.parse(triggerElement.dataset.onClickParams || "{}");
                params._element = triggerElement;

                if (eventName) {
                    document.dispatchEvent(new CustomEvent(eventName, {
                        detail: params
                    }));
                }
            }
        }
    });

    const shortcutManager = app.getShortcutManager();
    shortcutManager.add("toggleDemo", new ShortcutKeyboard({
        "callback": () => {
            toggleDemoEnabled();
        },
        "code": "KeyT"
    })
    )
        .add("togglePause", new ShortcutKeyboard({
            "altKey": false,
            "callback": () => {
                setPaused(!getPaused());
            },
            "code": "Space",
            "ctrlKey": false
        })
        );

    ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].forEach(code => {
        shortcutManager.add(`pan${code}keydown`, new ShortcutKeyboard({
            "altKey": false,
            "callback": (ev: KeyboardEvent) => {
                getApp().getMap().handleMapPanning(ev);
            },
            "code": code,
            "ctrlKey": false,
            "event": "keydown"
        }));
    });

    ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].forEach(code => {
        shortcutManager.add(`pan${code}keyup`, new ShortcutKeyboard({
            "callback": (ev: KeyboardEvent) => {
                getApp().getMap().handleMapPanning(ev);
            },
            "code": code
        }));
    });

    ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9"].forEach(code => {
        shortcutManager.add(`hotgroup${code}`, new ShortcutKeyboard({
            "callback": (ev: KeyboardEvent) => {
                if (ev.ctrlKey && ev.shiftKey)
                    getApp().getUnitsManager().selectedUnitsAddToHotgroup(parseInt(ev.code.substring(5)));
                else if (ev.ctrlKey && !ev.shiftKey)
                    getApp().getUnitsManager().selectedUnitsSetHotgroup(parseInt(ev.code.substring(5)));
                else
                    getApp().getUnitsManager().selectUnitsByHotgroup(parseInt(ev.code.substring(5)));
            },
            "code": code
        }));
    });

    // TODO: move from here in dedicated class
    document.addEventListener("closeDialog", (ev: CustomEventInit) => {
        ev.detail._element.closest(".ol-dialog").classList.add("hide");
    });

    /* Try and connect with the Olympus REST server */
    document.addEventListener("tryConnection", () => {
        const form = document.querySelector("#splash-content")?.querySelector("#authentication-form");
        const username = (form?.querySelector("#username") as HTMLInputElement).value;
        const password = (form?.querySelector("#password") as HTMLInputElement).value;

        /* Update the user credentials */
        setCredentials(username, password);

        /* Start periodically requesting updates */
        startUpdate();

        getApp().setLoginStatus("connecting");
    })

    /* Reload the page, used to mimic a restart of the app */
    document.addEventListener("reloadPage", () => {
        location.reload();
    })

    /* Inject the svgs with the corresponding svg code. This allows to dynamically manipulate the svg, like changing colors */
    document.querySelectorAll("[inject-svg]").forEach((el: Element) => {
        var img = el as HTMLImageElement;
        var isLoaded = img.complete;
        if (isLoaded)
            SVGInjector(img);
        else
            img.addEventListener("load", () => {
                SVGInjector(img);
            });
    })
}

window.onload = setup;
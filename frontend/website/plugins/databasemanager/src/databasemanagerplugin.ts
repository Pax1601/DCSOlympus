import { OlympusPlugin, UnitBlueprint } from "interfaces";
import { AirUnitEditor } from "./airuniteditor";
import { OlympusApp } from "olympusapp";
import { GroundUnitEditor } from "./grounduniteditor";
import { PrimaryToolbar } from "toolbars/primarytoolbar";
import { NavyUnitEditor } from "./navyuniteditor";

/** Database Manager
 * 
 * This database provides a user interface to allow easier and convenient unit databases manipulation. It allows to edit all the fields of the units databases, save them
 * on the server, and restore the defaults.
 * 
 * TODO:
 * Add ability to manage liveries
 * 
 */
 
export class DatabaseManagerPlugin implements OlympusPlugin {
    #app!: OlympusApp;

    #element: HTMLElement;
    #mainContentContainer: HTMLElement;
    #contentDiv1: HTMLElement;
    #contentDiv2: HTMLElement;
    #contentDiv3: HTMLElement;

    /* Upper tab buttons */
    #button1: HTMLButtonElement;
    #button2: HTMLButtonElement;
    #button3: HTMLButtonElement;
    #button4: HTMLButtonElement;

    /* Lower operation buttons */
    #button5: HTMLButtonElement;
    #button6: HTMLButtonElement;
    #button7: HTMLButtonElement;
    #button8: HTMLButtonElement;
    #button9: HTMLButtonElement;

    /* Database editors */
    #aircraftEditor: AirUnitEditor;
    #helicopterEditor: AirUnitEditor;
    #groundUnitEditor: GroundUnitEditor;
    #navyUnitEditor: NavyUnitEditor;

    constructor() {
        /* Create main HTML element */
        this.#element = document.createElement("div");
        this.#element.id = "database-manager-panel";
        this.#element.oncontextmenu = () => { return false; }
        this.#element.classList.add("ol-dialog");
        document.body.appendChild(this.#element);

        /* Start hidden */
        this.toggle(false);

        /* Create the top tab buttons container and buttons */
        let topButtonContainer = document.createElement("div");

        this.#button1 = document.createElement("button");
        this.#button1.classList.add("tab-button");
        this.#button1.textContent = "Aircraft database";
        this.#button1.onclick = () => { this.#hideAll(); this.#aircraftEditor.show(); this.#button1.classList.add("selected"); };
        topButtonContainer.appendChild(this.#button1);

        this.#button2 = document.createElement("button");
        this.#button2.classList.add("tab-button");
        this.#button2.textContent = "Helicopter database";
        this.#button2.onclick = () => { this.#hideAll(); this.#helicopterEditor.show(); this.#button2.classList.add("selected"); };
        topButtonContainer.appendChild(this.#button2);

        this.#button3 = document.createElement("button");
        this.#button3.classList.add("tab-button");
        this.#button3.textContent = "Ground Unit database";
        this.#button3.onclick = () => { this.#hideAll(); this.#groundUnitEditor.show(); this.#button3.classList.add("selected"); };
        topButtonContainer.appendChild(this.#button3);

        this.#button4 = document.createElement("button");
        this.#button4.classList.add("tab-button");
        this.#button4.textContent = "Navy Unit database";
        this.#button4.onclick = () => { this.#hideAll(); this.#navyUnitEditor.show(); this.#button4.classList.add("selected"); };
        topButtonContainer.appendChild(this.#button4);

        this.#element.appendChild(topButtonContainer);

        /* Create the container for the database editor elements  and the elements themselves */
        this.#mainContentContainer = document.createElement("div");
        this.#mainContentContainer.classList.add("dm-container");
        this.#element.appendChild(this.#mainContentContainer);

        this.#contentDiv1 = document.createElement("div");
        this.#contentDiv1.classList.add("dm-content-container", "ol-scrollable");
        this.#mainContentContainer.appendChild(this.#contentDiv1);

        this.#contentDiv2 = document.createElement("div");
        this.#contentDiv2.classList.add("dm-content-container", "ol-scrollable");
        this.#mainContentContainer.appendChild(this.#contentDiv2);

        this.#contentDiv3 = document.createElement("div");
        this.#contentDiv3.classList.add("dm-content-container", "ol-scrollable");
        this.#mainContentContainer.appendChild(this.#contentDiv3);

        /* Create the database editors, which use the three divs created before */
        this.#aircraftEditor = new AirUnitEditor(this.#contentDiv1, this.#contentDiv2, this.#contentDiv3);
        this.#helicopterEditor = new AirUnitEditor(this.#contentDiv1, this.#contentDiv2, this.#contentDiv3);
        this.#groundUnitEditor = new GroundUnitEditor(this.#contentDiv1, this.#contentDiv2, this.#contentDiv3);
        this.#navyUnitEditor = new NavyUnitEditor(this.#contentDiv1, this.#contentDiv2, this.#contentDiv3);

        /* Create the bottom buttons container. These buttons allow to save, restore, reset, and discard the changes */
        let bottomButtonContainer = document.createElement("div");

        this.#button5 = document.createElement("button");
        this.#button5.textContent = "Save";
        this.#button5.title = "Save the changes on the server"
        this.#button5.onclick = () => { this.#saveDatabases();};
        bottomButtonContainer.appendChild(this.#button5);

        this.#button6 = document.createElement("button");
        this.#button6.textContent = "Discard";
        this.#button6.title = "Discard all changes and reload the database from the server";
        this.#button6.onclick = () => { this.#loadDatabases(); };
        bottomButtonContainer.appendChild(this.#button6);

        this.#button7 = document.createElement("button");
        this.#button7.textContent = "Reset defaults";
        this.#button7.onclick = () => { this.#resetToDefaultDatabases(); };
        this.#button7.title = "Reset the databases to the default values";
        bottomButtonContainer.appendChild(this.#button7);

        this.#button8 = document.createElement("button");
        this.#button8.textContent = "Restore previous";
        this.#button8.onclick = () => { this.#restoreToPreviousDatabases(); };
        this.#button8.title = "Restore the previously saved databases. Use this if you saved a database by mistake.";
        bottomButtonContainer.appendChild(this.#button8);

        this.#button9 = document.createElement("button");
        this.#button9.textContent = "Close";
        this.#button9.title = "Close the Database Manager"
        this.#button9.onclick = () => { this.toggle(false); };
        bottomButtonContainer.appendChild(this.#button9);

        this.#element.appendChild(bottomButtonContainer);
    }

    /**
     * 
     * @returns The name of the plugin
     */
    getName() {
        return "Database Control Plugin"
    }

    /** Initialize the plugin
     * 
     * @param app The OlympusApp singleton
     * @returns True if successfull
     */
    initialize(app: any) {
        this.#app = app;

        const contextManager = this.#app.getContextManager();
        contextManager.add( "databaseManager", {
            "allowUnitCopying": false,
            "allowUnitPasting": false,
            "useSpawnMenu": false,
            "useUnitControlPanel": false,
            "useUnitInfoPanel": false
        });
    
        /* Load the databases and initialize the editors */
        this.#loadDatabases();

        /* Add a button to the main Olympus App to allow the users to open the dialog */
        var mainButtonDiv = document.createElement("div");
        var mainButton = document.createElement("button");
        mainButton.textContent = "Database manager";
        mainButtonDiv.appendChild(mainButton);
        var toolbar: PrimaryToolbar = this.#app?.getToolbarsManager().get("primaryToolbar") as PrimaryToolbar;
        var elements = toolbar.getMainDropdown().getOptionElements();
        var arr = Array.prototype.slice.call(elements);
        arr.splice(arr.length - 3, 0, mainButtonDiv);
        toolbar.getMainDropdown().setOptionsElements(arr);
        mainButton.onclick = () => {
            toolbar.getMainDropdown().close();
            if (this.#app?.getMissionManager().getCommandModeOptions().commandMode === "Game master") 
                this.toggle();
        }
    
        return true;
    }

    /**
     * 
     * @returns The main container element
     */
    getElement() {
        return this.#element;
    }

    /** Toggles the visibility of the dialog
     * 
     * @param bool Force a specific visibility state
     */
    toggle(bool?: boolean) {
        if (bool)
            this.getElement().classList.toggle("hide", !bool);
        else
            this.getElement().classList.toggle("hide");

        if ( this.#app )
            this.#app.getContextManager().setContext( this.getElement().classList.contains("hide") ? "olympus" : "databaseManager" );
    }

    /** Hide all the editors
     * 
     */
    #hideAll() {
        this.#aircraftEditor.hide();
        this.#helicopterEditor.hide();
        this.#groundUnitEditor.hide();
        this.#navyUnitEditor.hide();

        this.#button1.classList.remove("selected");
        this.#button2.classList.remove("selected");
        this.#button3.classList.remove("selected");
        this.#button4.classList.remove("selected");
    }

    /** Load the databases from the app to the editor. Note, this does not reload the databases from the server to the app
     * 
     */
    #loadDatabases() {
        var aircraftDatabase = this.#app?.getAircraftDatabase();
        if (aircraftDatabase != null)
            this.#aircraftEditor.setDatabase(aircraftDatabase);

        var helicopterDatabase = this.#app?.getHelicopterDatabase();
        if (helicopterDatabase != null)
            this.#helicopterEditor.setDatabase(helicopterDatabase);

        var groundUnitDatabase = this.#app?.getGroundUnitDatabase();
        if (groundUnitDatabase != null)
            this.#groundUnitEditor.setDatabase(groundUnitDatabase);

        var navyUnitDatabase = this.#app?.getNavyUnitDatabase();
        if (navyUnitDatabase != null)
            this.#navyUnitEditor.setDatabase(navyUnitDatabase);

        this.#hideAll();
        this.#aircraftEditor.show();
        this.#button1.classList.add("selected");
    }

    /** Save the databases on the server and reloads it to apply the changes
     * 
     */
    #saveDatabases() {
        var aircraftDatabase = this.#aircraftEditor.getDatabase();
        if (aircraftDatabase){
            this.#uploadDatabase(aircraftDatabase, "aircraftdatabase", "Aircraft database", () => {
                var helicopterDatabase = this.#helicopterEditor.getDatabase();
                if (helicopterDatabase) {
                    this.#uploadDatabase(helicopterDatabase, "helicopterDatabase", "Helicopter database", () => {
                        var groundUnitDatabase = this.#groundUnitEditor.getDatabase();
                        if (groundUnitDatabase) {
                            this.#uploadDatabase(groundUnitDatabase, "groundUnitDatabase", "Ground Unit database", () => {
                                var navyUnitDatabase = this.#navyUnitEditor.getDatabase();
                                if (navyUnitDatabase) {
                                    this.#uploadDatabase(navyUnitDatabase, "navyUnitDatabase", "Navy Unit database", () => {
                                        this.#app?.getAircraftDatabase().load(() => {});
                                        this.#app?.getHelicopterDatabase().load(() => {});
                                        this.#app?.getGroundUnitDatabase().load(() => {});
                                        this.#app?.getNavyUnitDatabase().load(() => {});

                                        this.#app?.getServerManager().reloadDatabases(() => {
                                            this.#app?.getPopupsManager().get("infoPopup")?.setText("Olympus core databases reloaded");
                                        })
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    }

    /** Resets the databases to the default values 
     * 
     */
    #resetToDefaultDatabases() {
        this.#resetToDefaultDatabase("aircraftdatabase", "Aircraft database", () => {
            this.#app?.getAircraftDatabase().load(() => {
                this.#resetToDefaultDatabase("helicopterdatabase", "Helicopter database", () => {
                    this.#app?.getHelicopterDatabase().load(() => {
                        this.#resetToDefaultDatabase("groundunitdatabase", "Ground Unit database", () => {
                            this.#app?.getGroundUnitDatabase().load(() => {
                                this.#resetToDefaultDatabase("navyunitdatabase", "Navy Unit database", () => {
                                    this.#app?.getNavyUnitDatabase().load(() => {
                                        this.#loadDatabases();

                                        this.#app?.getServerManager().reloadDatabases(() => {
                                            this.#app?.getPopupsManager().get("infoPopup")?.setText("Olympus core databases reloaded");
                                        })

                                        this.#hideAll();
                                        this.#aircraftEditor.show();
                                        this.#button1.classList.add("selected");
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    /** Restores the databases to the previous saved values. This is useful if you saved the databases by mistake and want to undo the error.
     * 
     */
    #restoreToPreviousDatabases() {
        this.#restoreToPreviousDatabase("aircraftdatabase", "Aircraft database", () => {
            this.#app?.getAircraftDatabase().load(() => {
                this.#restoreToPreviousDatabase("helicopterdatabase", "Helicopter database", () => {
                    this.#app?.getHelicopterDatabase().load(() => {
                        this.#restoreToPreviousDatabase("groundunitdatabase", "Ground Unit database", () => {
                            this.#app?.getGroundUnitDatabase().load(() => {
                                this.#restoreToPreviousDatabase("navyunitdatabase", "Navy Unit database", () => {
                                    this.#app?.getNavyUnitDatabase().load(() => {
                                        this.#loadDatabases();

                                        this.#app?.getServerManager().reloadDatabases(() => {
                                            this.#app?.getPopupsManager().get("infoPopup")?.setText("Olympus core databases reloaded");
                                        })

                                        this.#hideAll();
                                        this.#aircraftEditor.show();
                                        this.#button1.classList.add("selected");
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    /** Upload a single database to the server
     * 
     * @param database The database 
     * @param name The name of the database as it will be saved on the server
     * @param label A label used in the info popup
     */
    #uploadDatabase(database: { blueprints: { [key: string]: UnitBlueprint } }, name: string, label: string, callback: CallableFunction) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("PUT", "/api/databases/save/units/" + name);
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.onload = (res: any) => {
            if (xmlHttp.status == 200) {
                this.#app?.getPopupsManager().get("infoPopup")?.setText(label + " saved successfully");
                callback();
            }
            else {
                this.#app?.getPopupsManager().get("infoPopup")?.setText("An error has occurred while saving the " + label);
            }
        };
        xmlHttp.onerror = (res: any) => {
            this.#app?.getPopupsManager().get("infoPopup")?.setText("An error has occurred while saving the " + label);
        }
        xmlHttp.send(JSON.stringify(database));
    }

    /** Resets a database to its default values on the server. NOTE: this only resets the database on the server, it will not reload it in the app.
     * 
     * @param name The name of the database as it is saved on the server
     * @param label A label used in the info popup
     * @param callback Called when the operation is completed
     */
    #resetToDefaultDatabase(name: string, label: string, callback: CallableFunction) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("PUT", "/api/databases/reset/units/" + name);
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.onload = (res: any) => {
            if (xmlHttp.status == 200) {
                this.#app?.getPopupsManager().get("infoPopup")?.setText(label + " reset successfully");
                callback();
            }
            else {
                this.#app?.getPopupsManager().get("infoPopup")?.setText("An error has occurred while resetting the " + label);
            }
        };
        xmlHttp.onerror = (res: any) => {
            this.#app?.getPopupsManager().get("infoPopup")?.setText("An error has occurred while resetting the " + label)
        }
        xmlHttp.send("");
    }

    /** Restores a database to its previously saved values on the server. NOTE: this only restores the database on the server, it will not reload it in the app.
     * 
     * @param name The name of the database as it is saved on the server
     * @param label A label used in the info popup
     * @param callback Called when the operation is completed
     */
    #restoreToPreviousDatabase(name: string, label: string, callback: CallableFunction) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("PUT", "/api/databases/restore/units/" + name);
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.onload = (res: any) => {
            if (xmlHttp.status == 200) {
                this.#app?.getPopupsManager().get("infoPopup")?.setText(label + " restored successfully");
                callback();
            }
            else {
                this.#app?.getPopupsManager().get("infoPopup")?.setText("An error has occurred while restoring the " + label);
            }
        };
        xmlHttp.onerror = (res: any) => {
            this.#app?.getPopupsManager().get("infoPopup")?.setText("An error has occurred while restoring the " + label)
        }
        xmlHttp.send("");
    }
}
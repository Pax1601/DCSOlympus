import { OlympusPlugin, UnitBlueprint } from "interfaces";
import { AirUnitEditor } from "./airuniteditor";
import { OlympusApp } from "olympusapp";
import { GroundUnitEditor } from "./grounduniteditor";
import { PrimaryToolbar } from "toolbars/primarytoolbar";
import { NavyUnitEditor } from "./navyuniteditor";

export class DatabaseManagerPlugin implements OlympusPlugin {
    #app: OlympusApp | null = null;

    #element: HTMLElement;
    #container: HTMLElement;
    #contentDiv1: HTMLElement;
    #contentDiv2: HTMLElement;
    #contentDiv3: HTMLElement;

    #button1: HTMLButtonElement;
    #button2: HTMLButtonElement;
    #button3: HTMLButtonElement;
    #button4: HTMLButtonElement;

    #button5: HTMLButtonElement;
    #button6: HTMLButtonElement;
    #button7: HTMLButtonElement;
    #button8: HTMLButtonElement;

    #aircraftEditor: AirUnitEditor;
    #helicopterEditor: AirUnitEditor;
    #groundUnitEditor: GroundUnitEditor;
    #navyUnitEditor: NavyUnitEditor;

    constructor() {
        this.#element = document.createElement("div");
        this.#element.id = "database-manager-panel";
        this.#element.oncontextmenu = () => { return false; }
        this.#element.classList.add("ol-dialog");
        document.body.appendChild(this.#element);

        this.toggle(false);

        let topButtonContainer = document.createElement("div");

        this.#button1 = document.createElement("button");
        this.#button1.classList.add("tab-button");
        this.#button1.textContent = "Aircraft database";
        this.#button1.onclick = () => { this.hideAll(); this.#aircraftEditor.show(); this.#button1.classList.add("selected"); };
        topButtonContainer.appendChild(this.#button1);

        this.#button2 = document.createElement("button");
        this.#button2.classList.add("tab-button");
        this.#button2.textContent = "Helicopter database";
        this.#button2.onclick = () => { this.hideAll(); this.#helicopterEditor.show(); this.#button2.classList.add("selected"); };
        topButtonContainer.appendChild(this.#button2);

        this.#button3 = document.createElement("button");
        this.#button3.classList.add("tab-button");
        this.#button3.textContent = "Ground Unit database";
        this.#button3.onclick = () => { this.hideAll(); this.#groundUnitEditor.show(); this.#button3.classList.add("selected"); };
        topButtonContainer.appendChild(this.#button3);

        this.#button4 = document.createElement("button");
        this.#button4.classList.add("tab-button");
        this.#button4.textContent = "Navy Unit database";
        this.#button4.onclick = () => { this.hideAll(); this.#navyUnitEditor.show(); this.#button4.classList.add("selected"); };
        topButtonContainer.appendChild(this.#button4);

        this.#element.appendChild(topButtonContainer);

        this.#container = document.createElement("div");
        this.#container.classList.add("dm-container");
        this.#element.appendChild(this.#container)

        this.#contentDiv1 = document.createElement("div");
        this.#contentDiv1.classList.add("dm-content-container");
        this.#container.appendChild(this.#contentDiv1);

        this.#contentDiv2 = document.createElement("div");
        this.#contentDiv2.classList.add("dm-content-container");
        this.#container.appendChild(this.#contentDiv2);

        this.#contentDiv3 = document.createElement("div");
        this.#contentDiv3.classList.add("dm-content-container");
        this.#container.appendChild(this.#contentDiv3);

        this.#aircraftEditor = new AirUnitEditor(this.#contentDiv1, this.#contentDiv2, this.#contentDiv3);
        this.#helicopterEditor = new AirUnitEditor(this.#contentDiv1, this.#contentDiv2, this.#contentDiv3);
        this.#groundUnitEditor = new GroundUnitEditor(this.#contentDiv1, this.#contentDiv2, this.#contentDiv3);
        this.#navyUnitEditor = new NavyUnitEditor(this.#contentDiv1, this.#contentDiv2, this.#contentDiv3);

        let bottomButtonContainer = document.createElement("div");

        this.#button5 = document.createElement("button");
        this.#button5.textContent = "Save";
        this.#button5.title = "Save the changes on the server"
        this.#button5.onclick = () => { 
            var aircraftDatabase = this.#aircraftEditor.getDatabase();
            if (aircraftDatabase)
                this.uploadDatabase(aircraftDatabase, "aircraftdatabase");

            var helicopterDatabase = this.#helicopterEditor.getDatabase();
            if (helicopterDatabase)
                this.uploadDatabase(helicopterDatabase, "helicopterDatabase");

            var groundUnitDatabase = this.#groundUnitEditor.getDatabase();
            if (groundUnitDatabase)
                this.uploadDatabase(groundUnitDatabase, "groundUnitDatabase");

            var navyUnitDatabase = this.#navyUnitEditor.getDatabase();
            if (navyUnitDatabase)
                this.uploadDatabase(navyUnitDatabase, "navyUnitDatabase");
        };
        bottomButtonContainer.appendChild(this.#button5);

        this.#button6 = document.createElement("button");
        this.#button6.textContent = "Discard";
        this.#button6.title = "Discard all changes and reload the database from the server"
        this.#button6.onclick = () => { this.loadDatabases(); };
        bottomButtonContainer.appendChild(this.#button6);

        this.#button7 = document.createElement("button");
        this.#button7.textContent = "Reload";
        this.#button7.onclick = () => { };
        //bottomButtonContainer.appendChild(this.#button7);

        this.#button8 = document.createElement("button");
        this.#button8.textContent = "Close";
        this.#button8.title = "Close the Database Manager"
        this.#button8.onclick = () => { this.toggle(false); };
        bottomButtonContainer.appendChild(this.#button8);

        this.#element.appendChild(bottomButtonContainer);
    }

    getName() {
        return "Database Control Plugin"
    }

    initialize(app: any) {
        this.#app = app;
        this.loadDatabases();

        var mainButtonDiv = document.createElement("div");
        var mainButton = document.createElement("button");
        mainButton.textContent = "Database Manager";
        mainButtonDiv.appendChild(mainButton);
        var toolbar: PrimaryToolbar = this.#app?.getToolbarsManager().get("primaryToolbar") as PrimaryToolbar;
        var elements = toolbar.getMainDropdown().getOptionElements();
        var arr = Array.prototype.slice.call(elements);
        arr.splice(arr.length - 1, 0, mainButtonDiv);
        toolbar.getMainDropdown().setOptionsElements(arr);
        mainButton.onclick = () => {
            toolbar.getMainDropdown().close(); 
            this.toggle(); 
        }

        return true;
    }

    loadDatabases() {
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

        this.hideAll();
        this.#aircraftEditor.show();
        this.#button1.classList.add("selected");
    }

    getElement() {
        return this.#element;
    }

    toggle(bool?: boolean) {
        if (bool)
            this.getElement().classList.toggle("hide", !bool);
        else
        this.getElement().classList.toggle("hide");
    }

    hideAll() {
        this.#aircraftEditor.hide();
        this.#helicopterEditor.hide();
        this.#groundUnitEditor.hide();

        this.#button1.classList.remove("selected");
        this.#button2.classList.remove("selected");
        this.#button3.classList.remove("selected");
        this.#button4.classList.remove("selected");
    }

    uploadDatabase(database: {blueprints: {[key: string]: UnitBlueprint}}, databaseName: string) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("PUT", "/api/databases/units/" + databaseName);
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.onload = (res: any) => {
            this.#app?.getPopupsManager().get("infoPopup")?.setText(databaseName + " saved successfully");
        };
        xmlHttp.onerror = (res: any) => {
            this.#app?.getPopupsManager().get("infoPopup")?.setText("An error has occurring saving the database: " + databaseName)
            console.log(res);
        }
        xmlHttp.send(JSON.stringify(database));
    }
}
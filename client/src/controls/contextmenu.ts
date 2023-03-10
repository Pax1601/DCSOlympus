import { LatLng } from "leaflet";
import { getActiveCoalition, setActiveCoalition } from "..";
import { ContextMenuOption } from "../@types/dom";
import { ClickEvent } from "../map/map";
import { spawnAircraft } from "../server/server";
import { aircraftDatabase } from "../units/aircraftdatabase";
import { Dropdown } from "./dropdown";

export interface SpawnOptions {
    role: string;
    type: string;
    latlng: LatLng;
    coalition: string;
    loadout: string | null;
    airbaseName: string | null;
}

export class ContextMenu {
    #container: HTMLElement | null;
    #latlng: LatLng = new LatLng(0, 0);
    #aircraftRoleDropdown: Dropdown;
    #aircraftTypeDropdown: Dropdown;
    #aircraftLoadoutDropdown: Dropdown;
    //#unitsNumberDropdown: Dropdown;
    #spawnOptions: SpawnOptions = {role: "", type: "", latlng: this.#latlng, loadout: null, coalition: "blue", airbaseName: null};

    constructor(id: string,) {
        this.#container = document.getElementById(id);
        this.#container?.querySelector("#context-menu-switch")?.addEventListener('change', (e) => this.#onSwitch(e));

        this.#aircraftRoleDropdown = new Dropdown("role-options", (role: string) => this.#setAircraftRole(role));
        this.#aircraftTypeDropdown = new Dropdown("aircraft-options", (type: string) => this.#setAircraftType(type));
        this.#aircraftLoadoutDropdown = new Dropdown("loadout-options", (loadout: string) => this.#setAircraftLoadout(loadout));
        //this.#unitsNumberDropdown = new Dropdown("#units-options", this.#setAircraftType, [""]);

        document.addEventListener("contextMenuShow", (e: any) => {
            this.#container?.querySelector("#aircraft-spawn-menu")?.classList.toggle("hide", e.detail.type !== "aircraft");
            this.#container?.querySelector("#unit-spawn-aircraft")?.classList.toggle("is-open", e.detail.type === "aircraft");

            this.#resetAircraftRole();
            this.#resetAircraftType();
        })

        document.addEventListener("contextMenuDeployAircraft", () => {
            this.hide();
            this.#spawnOptions.coalition = getActiveCoalition();
            if (this.#spawnOptions)
                spawnAircraft(this.#spawnOptions);
        })

        this.hide();
    }

    show(x: number, y: number, latlng: LatLng) {
        this.#spawnOptions.latlng = latlng;
        this.#container?.classList.toggle("hide", false);
        if (this.#container != null) {
            if (x + this.#container.offsetWidth < window.innerWidth)
                this.#container.style.left = x + "px";
            else
                this.#container.style.left = window.innerWidth - this.#container.offsetWidth + "px";

            if (y + this.#container.offsetHeight < window.innerHeight)
                this.#container.style.top = y + "px";
            else
                this.#container.style.top = window.innerHeight - this.#container.offsetHeight + "px";
        }
    }

    hide() {
        this.#container?.classList.toggle("hide", true);
    }

    #onSwitch(e: any) {
        if (this.#container != null) {
            if (e.srcElement.checked) 
                setActiveCoalition("red");
            else 
                setActiveCoalition("blue");
        }
    }

    /********* Aircraft spawn menu *********/
    #setAircraftRole(role: string)
    {
        if (this.#spawnOptions != null)
        {
            this.#spawnOptions.role = role;
            this.#resetAircraftRole();
            this.#aircraftTypeDropdown.setOptions(aircraftDatabase.getLabelsByRole(role));
            this.#aircraftTypeDropdown.selectValue(0);
        }
    }

    #resetAircraftRole() {
        (<HTMLButtonElement>this.#container?.querySelector("#deploy-unit-button")).disabled = true;
        (<HTMLButtonElement>this.#container?.querySelector("#loadout-list")).replaceChildren();
        this.#aircraftTypeDropdown.reset();
        this.#aircraftRoleDropdown.setOptions(aircraftDatabase.getRoles());
    }

    #setAircraftType(label: string)
    {
        if (this.#spawnOptions != null)
        {
            this.#resetAircraftType();
            var type = aircraftDatabase.getNameByLabel(label);
            if (type != null)
            {
                this.#spawnOptions.type = type;
                this.#aircraftLoadoutDropdown.setOptions(aircraftDatabase.getLoadoutNamesByRole(type, this.#spawnOptions.role));
                this.#aircraftLoadoutDropdown.selectValue(0);
                var image = (<HTMLImageElement>this.#container?.querySelector("#unit-image"));
                image.src = `images/units/${aircraftDatabase.getByLabel(label)?.filename}`;
                image.classList.toggle("hide", false); 
            }
        }
    }

    #resetAircraftType() {
        (<HTMLButtonElement>this.#container?.querySelector("#deploy-unit-button")).disabled = true;
        (<HTMLButtonElement>this.#container?.querySelector("#loadout-list")).replaceChildren();
        this.#aircraftLoadoutDropdown.reset();
        (<HTMLImageElement>this.#container?.querySelector("#unit-image")).classList.toggle("hide", true);
    }

    #setAircraftLoadout(loadoutName: string)
    {
        if (this.#spawnOptions != null)
        {
            var loadout = aircraftDatabase.getLoadoutsByName(this.#spawnOptions.type, loadoutName);
            if (loadout)
            {
                this.#spawnOptions.loadout = loadout.code;
                (<HTMLButtonElement>this.#container?.querySelector("#deploy-unit-button")).disabled = false;
                var items = loadout.items.map((item: any) => {return `${item.quantity}x ${item.name}`;});
                items.length == 0? items.push("Empty loadout"): "";
                (<HTMLButtonElement>this.#container?.querySelector("#loadout-list")).replaceChildren(
                    ...items.map((item: any) => {
                        var div = document.createElement('div');
                        div.innerText = item;
                        return div;
                    })
                )
            }
        }
    }
}
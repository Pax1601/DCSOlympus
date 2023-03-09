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

        this.#aircraftRoleDropdown = new Dropdown("role-options", (role: string) => this.#setAircraftRole(role), aircraftDatabase.getRoles());
        this.#aircraftTypeDropdown = new Dropdown("aircraft-options", (type: string) => this.#setAircraftType(type));
        this.#aircraftLoadoutDropdown = new Dropdown("loadout-options", (loadout: string) => this.#setAircraftLoadout(loadout));
        //this.#unitsNumberDropdown = new Dropdown("#units-options", this.#setAircraftType, [""]);

        document.addEventListener("contextMenuShow", (e: any) => {
            this.#container?.querySelector("#aircraft-spawn-menu")?.classList.toggle("hide", e.detail.unitType !== "aircraft");
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

    #setAircraftRole(role: string)
    {
        if (this.#spawnOptions != null)
        {
            this.#spawnOptions.role = role;
            this.#aircraftTypeDropdown.setOptions(aircraftDatabase.getLabelsByRole(role));
        }
    }

    #setAircraftType(type: string)
    {
        if (this.#spawnOptions != null)
        {
            this.#spawnOptions.type = type;
            this.#aircraftLoadoutDropdown.setOptions(aircraftDatabase.getLoadoutNamesByRole(type, this.#spawnOptions.role));
        }
    }

    #setAircraftLoadout(loadoutName: string)
    {
        if (this.#spawnOptions != null)
        {
            var loadout = aircraftDatabase.getLoadoutsByName(this.#spawnOptions.type, loadoutName);
            if (loadout)
                this.#spawnOptions.loadout = loadout.code;
        }
    }

    #setUnitsNumber(unitsNumber: string)
    {

    }
}
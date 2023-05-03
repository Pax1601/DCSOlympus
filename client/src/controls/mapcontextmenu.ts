import { LatLng } from "leaflet";
import { getActiveCoalition, setActiveCoalition } from "..";
import { spawnAircraft, spawnGroundUnit, spawnSmoke } from "../server/server";
import { aircraftDatabase } from "../units/aircraftdatabase";
import { groundUnitsDatabase } from "../units/groundunitsdatabase";
import { ContextMenu } from "./contextmenu";
import { Dropdown } from "./dropdown";

export interface SpawnOptions {
    role: string;
    type: string;
    latlng: LatLng;
    coalition: string;
    loadout: string | null;
    airbaseName: string | null;
}

export class MapContextMenu extends ContextMenu {
    #aircraftRoleDropdown: Dropdown;
    #aircraftTypeDropdown: Dropdown;
    #aircraftLoadoutDropdown: Dropdown;
    #groundUnitRoleDropdown: Dropdown;
    #groundUnitTypeDropdown: Dropdown;
    #spawnOptions: SpawnOptions = { role: "", type: "", latlng: new LatLng(0, 0), loadout: null, coalition: "blue", airbaseName: null };

    constructor(id: string) {
        super(id);
        this.getContainer()?.querySelector("#context-menu-switch")?.addEventListener('change', (e) => this.#onSwitch(e));

        this.#aircraftRoleDropdown = new Dropdown("aircraft-role-options", (role: string) => this.#setAircraftRole(role));
        this.#aircraftTypeDropdown = new Dropdown("aircraft-type-options", (type: string) => this.#setAircraftType(type));
        this.#aircraftLoadoutDropdown = new Dropdown("loadout-options", (loadout: string) => this.#setAircraftLoadout(loadout));
        this.#groundUnitRoleDropdown = new Dropdown("ground-unit-role-options", (role: string) => this.#setGroundUnitRole(role));
        this.#groundUnitTypeDropdown = new Dropdown("ground-unit-type-options", (type: string) => this.#setGroundUnitType(type));

        document.addEventListener("contextMenuShow", (e: any) => {
            this.showSubMenu(e.detail.type);
        });

        document.addEventListener("contextMenuDeployAircraft", () => {
            this.hide();
            this.#spawnOptions.coalition = getActiveCoalition();
            if (this.#spawnOptions)
                spawnAircraft(this.#spawnOptions);
        });

        document.addEventListener("contextMenuDeployGroundUnit", () => {
            this.hide();
            this.#spawnOptions.coalition = getActiveCoalition();
            if (this.#spawnOptions)
                spawnGroundUnit(this.#spawnOptions);
        });

        document.addEventListener("contextMenuDeploySmoke", (e: any) => {
            this.hide();
            spawnSmoke(e.detail.color, this.getLatLng());
        });

        this.hide();
    }

    show(x: number, y: number, latlng: LatLng) {
        this.#spawnOptions.airbaseName = null;
        super.show(x, y, latlng);
        this.#spawnOptions.latlng = latlng;
        this.showUpperBar();
    }

    showSubMenu(type: string) {
        this.getContainer()?.querySelector("#aircraft-spawn-menu")?.classList.toggle("hide", type !== "aircraft");
        this.getContainer()?.querySelector("#aircraft-spawn-button")?.classList.toggle("is-open", type === "aircraft");
        this.getContainer()?.querySelector("#ground-unit-spawn-menu")?.classList.toggle("hide", type !== "ground-unit");
        this.getContainer()?.querySelector("#ground-unit-spawn-button")?.classList.toggle("is-open", type === "ground-unit");
        this.getContainer()?.querySelector("#smoke-spawn-menu")?.classList.toggle("hide", type !== "smoke");
        this.getContainer()?.querySelector("#smoke-spawn-button")?.classList.toggle("is-open", type === "smoke");

        this.#resetAircraftRole();
        this.#resetAircraftType();
        this.#resetGroundUnitRole();
        this.#resetGroundUnitType();
        this.clip();
    }

    showUpperBar() {
        this.getContainer()?.querySelector("#upper-bar")?.classList.toggle("hide", false);
    }

    hideUpperBar() {
        this.getContainer()?.querySelector("#upper-bar")?.classList.toggle("hide", true);
    }

    setAirbaseName(airbaseName: string) {
        this.#spawnOptions.airbaseName = airbaseName;
    }

    setLatLng(latlng: LatLng) {
        this.#spawnOptions.latlng = latlng;
    }

    #onSwitch(e: any) {
        if (this.getContainer() != null) {
            if (e.srcElement.checked)
                setActiveCoalition("red");
            else
                setActiveCoalition("blue");
        }
    }

    /********* Aircraft spawn menu *********/
    #setAircraftRole(role: string) {
        this.#spawnOptions.role = role;
        this.#resetAircraftType();
        this.#aircraftTypeDropdown.setOptions(aircraftDatabase.getByRole(role).map((blueprint) => { return blueprint.label }));
        this.#aircraftTypeDropdown.selectValue(0);
        this.clip();
    }

    #resetAircraftRole() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        (<HTMLButtonElement>this.getContainer()?.querySelector("#loadout-list")).replaceChildren();
        this.#aircraftRoleDropdown.reset();
        this.#aircraftTypeDropdown.reset();
        this.#aircraftRoleDropdown.setOptions(aircraftDatabase.getRoles());
        this.clip();
    }

    #setAircraftType(label: string) {
        this.#resetAircraftType();
        var type = aircraftDatabase.getByLabel(label)?.name || null;
        if (type != null) {
            this.#spawnOptions.type = type;
            this.#aircraftLoadoutDropdown.setOptions(aircraftDatabase.getLoadoutNamesByRole(type, this.#spawnOptions.role));
            this.#aircraftLoadoutDropdown.selectValue(0);
            var image = (<HTMLImageElement>this.getContainer()?.querySelector("#unit-image"));
            image.src = `images/units/${aircraftDatabase.getByLabel(label)?.filename}`;
            image.classList.toggle("hide", false);
        }
        this.clip();
    }

    #resetAircraftType() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        (<HTMLButtonElement>this.getContainer()?.querySelector("#loadout-list")).replaceChildren();
        this.#aircraftLoadoutDropdown.reset();
        (<HTMLImageElement>this.getContainer()?.querySelector("#unit-image")).classList.toggle("hide", true);
        this.clip();
    }

    #setAircraftLoadout(loadoutName: string) {
        var loadout = aircraftDatabase.getLoadoutByName(this.#spawnOptions.type, loadoutName);
        if (loadout) {
            this.#spawnOptions.loadout = loadout.code;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = false;
            var items = loadout.items.map((item: any) => { return `${item.quantity}x ${item.name}`; });
            items.length == 0 ? items.push("Empty loadout") : "";
            (<HTMLButtonElement>this.getContainer()?.querySelector("#loadout-list")).replaceChildren(
                ...items.map((item: any) => {
                    var div = document.createElement('div');
                    div.innerText = item;
                    return div;
                })
            )
        }
        this.clip();
    }

    /********* Ground unit spawn menu *********/
    #setGroundUnitRole(role: string) {
        this.#spawnOptions.role = role;
        this.#resetGroundUnitType();

        const types = groundUnitsDatabase.getByRole(role).map((blueprint) => { return blueprint.label } );
        types.sort();

        this.#groundUnitTypeDropdown.setOptions( types );
        this.#groundUnitTypeDropdown.selectValue(0);
        this.clip();
    }

    #resetGroundUnitRole() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#ground-unit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        (<HTMLButtonElement>this.getContainer()?.querySelector("#loadout-list")).replaceChildren();
        this.#groundUnitRoleDropdown.reset();
        this.#groundUnitTypeDropdown.reset();

        const roles = groundUnitsDatabase.getRoles();
        roles.sort();
        
        this.#groundUnitRoleDropdown.setOptions( roles );
        this.clip();
    }

    #setGroundUnitType(label: string) {
        this.#resetGroundUnitType();
        var type = groundUnitsDatabase.getByLabel(label)?.name || null;
        if (type != null) {
            this.#spawnOptions.type = type;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#ground-unit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = false;
        }
        this.clip();
    }

    #resetGroundUnitType() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#ground-unit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        this.clip();
    }
}
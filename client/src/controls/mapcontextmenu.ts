import { LatLng } from "leaflet";
import { getActiveCoalition, getMap, getUnitsManager, setActiveCoalition } from "..";
import { spawnAircrafts, spawnExplosion, spawnGroundUnits, spawnHelicopters, spawnNavyUnits, spawnSmoke } from "../server/server";
import { aircraftDatabase } from "../units/aircraftdatabase";
import { groundUnitDatabase } from "../units/groundunitdatabase";
import { helicopterDatabase } from "../units/helicopterdatabase";
import { ContextMenu } from "./contextmenu";
import { Dropdown } from "./dropdown";
import { Switch } from "./switch";
import { Slider } from "./slider";
import { ftToM } from "../other/utils";
import { GAME_MASTER } from "../constants/constants";
import { navyUnitDatabase } from "../units/navyunitdatabase";
import { CoalitionArea } from "../map/coalitionarea";

export class MapContextMenu extends ContextMenu {
    #coalitionSwitch: Switch;
    #aircraftRoleDropdown: Dropdown;
    #aircraftNameDropdown: Dropdown;
    #aircraftCountDropdown: Dropdown;
    #aircraftLoadoutDropdown: Dropdown;
    #aircraftSpawnAltitudeSlider: Slider;
    #helicopterRoleDropdown: Dropdown;
    #helicopterNameDropdown: Dropdown;
    #helicopterCountDropdown: Dropdown;
    #helicopterLoadoutDropdown: Dropdown;
    #helicopterSpawnAltitudeSlider: Slider;
    #groundUnitTypeDropdown: Dropdown;
    #groundUnitNameDropdown: Dropdown;
    #groundUnitCountDropdown: Dropdown;
    #navyUnitTypeDropdown: Dropdown;
    #navyUnitNameDropdown: Dropdown;
    #navyUnitCountDropdown: Dropdown;
    #spawnOptions = { role: "", name: "", latlng: new LatLng(0, 0), coalition: "blue", loadout: "", airbaseName: "", altitude: ftToM(20000), count: 1 };
    #coalitionArea: CoalitionArea | null = null;

    constructor(id: string) {
        super(id);

        this.#coalitionSwitch = new Switch("coalition-switch", (value: boolean) => this.#onSwitchClick(value));
        this.#coalitionSwitch.setValue(false);
        this.#coalitionSwitch.getContainer()?.addEventListener("contextmenu", (e) => this.#onSwitchRightClick(e));

        /* Aircraft menu */
        this.#aircraftRoleDropdown = new Dropdown("aircraft-role-options", (role: string) => this.#setAircraftRole(role));
        this.#aircraftNameDropdown = new Dropdown("aircraft-type-options", (type: string) => this.#setAircraftName(type));
        this.#aircraftCountDropdown = new Dropdown("aircraft-count-options", (type: string) => this.#setAircraftCount(type));
        this.#aircraftCountDropdown.setOptions(["1", "2", "3", "4"]);
        this.#aircraftCountDropdown.setValue("1");
        this.#aircraftLoadoutDropdown = new Dropdown("aircraft-loadout-options", (loadout: string) => this.#setAircraftLoadout(loadout));
        this.#aircraftSpawnAltitudeSlider = new Slider("aircraft-spawn-altitude-slider", 0, 50000, "ft", (value: number) => {this.#spawnOptions.altitude = ftToM(value);});
        this.#aircraftSpawnAltitudeSlider.setIncrement(500);
        this.#aircraftSpawnAltitudeSlider.setValue(20000);
        this.#aircraftSpawnAltitudeSlider.setActive(true);

        /* Helicopter menu */
        this.#helicopterRoleDropdown = new Dropdown("helicopter-role-options", (role: string) => this.#setHelicopterRole(role));
        this.#helicopterNameDropdown = new Dropdown("helicopter-type-options", (type: string) => this.#setHelicopterName(type));
        this.#helicopterCountDropdown = new Dropdown("helicopter-count-options", (type: string) => this.#setHelicopterCount(type));
        this.#helicopterCountDropdown.setOptions(["1", "2", "3", "4"]);
        this.#helicopterCountDropdown.setValue("1");
        this.#helicopterLoadoutDropdown = new Dropdown("helicopter-loadout-options", (loadout: string) => this.#setHelicopterLoadout(loadout));
        this.#helicopterSpawnAltitudeSlider = new Slider("helicopter-spawn-altitude-slider", 0, 10000, "ft", (value: number) => {this.#spawnOptions.altitude = ftToM(value);});
        this.#helicopterSpawnAltitudeSlider.setIncrement(50);
        this.#helicopterSpawnAltitudeSlider.setValue(5000);
        this.#helicopterSpawnAltitudeSlider.setActive(true);

        var count = [];
        for (let i = 1; i < 10; i++) count.push(String(i));

        /* Ground unit menu */
        this.#groundUnitTypeDropdown = new Dropdown("groundunit-type-options", (type: string) => this.#setGroundUnitType(type));
        this.#groundUnitNameDropdown = new Dropdown("groundunit-name-options", (name: string) => this.#setGroundUnitName(name));
        this.#groundUnitCountDropdown = new Dropdown("groundunit-count-options", (count: string) => this.#setGroundUnitCount(count));
        this.#groundUnitCountDropdown.setOptions(count);
        this.#groundUnitCountDropdown.setValue("1");

        /* Navy unit menu */
        this.#navyUnitTypeDropdown = new Dropdown("navyunit-type-options", (type: string) => this.#setNavyUnitType(type));
        this.#navyUnitNameDropdown = new Dropdown("navyunit-name-options", (name: string) => this.#setNavyUnitName(name));
        this.#navyUnitCountDropdown = new Dropdown("navyunit-count-options", (count: string) => this.#setNavyUnitCount(count));
        this.#navyUnitCountDropdown.setOptions(count);
        this.#navyUnitCountDropdown.setValue("1");

        document.addEventListener("mapContextMenuShow", (e: any) => {
            if (this.getVisibleSubMenu() !== e.detail.type)
                this.showSubMenu(e.detail.type);
            else 
                this.hideSubMenus(e.detail.type);
        });

        document.addEventListener("contextMenuDeployAircraft", () => {
            this.hide();
            this.#spawnOptions.coalition = getActiveCoalition();
            if (this.#spawnOptions) {
                getMap().addTemporaryMarker(this.#spawnOptions.latlng, this.#spawnOptions.name, getActiveCoalition());
                var unitTable = {unitType: this.#spawnOptions.name, location: this.#spawnOptions.latlng, altitude: this.#spawnOptions.altitude, loadout: this.#spawnOptions.loadout};
                var units = [];
                for (let i = 1; i < parseInt(this.#aircraftCountDropdown.getValue()) + 1; i++) {
                    units.push(unitTable);
                }
                spawnAircrafts(units, getActiveCoalition(), this.#spawnOptions.airbaseName, false);
            }
        });

        document.addEventListener("contextMenuDeployHelicopter", () => {
            this.hide();
            this.#spawnOptions.coalition = getActiveCoalition();
            if (this.#spawnOptions) {
                getMap().addTemporaryMarker(this.#spawnOptions.latlng, this.#spawnOptions.name, getActiveCoalition());
                var unitTable = {unitType: this.#spawnOptions.name, location: this.#spawnOptions.latlng, altitude: this.#spawnOptions.altitude, loadout: this.#spawnOptions.loadout};
                var units = [];
                for (let i = 1; i < parseInt(this.#helicopterCountDropdown.getValue()) + 1; i++) {
                    units.push(unitTable);
                }
                spawnHelicopters(units, getActiveCoalition(), this.#spawnOptions.airbaseName, false);
            }
        });

        document.addEventListener("contextMenuDeployGroundUnit", () => {
            this.hide();
            this.#spawnOptions.coalition = getActiveCoalition();
            if (this.#spawnOptions) {
                getMap().addTemporaryMarker(this.#spawnOptions.latlng, this.#spawnOptions.name, getActiveCoalition());
                var unitTable = {unitType: this.#spawnOptions.name, location: this.#spawnOptions.latlng};
                var units = [];
                for (let i = 1; i < parseInt(this.#groundUnitCountDropdown.getValue()) + 1; i++) {
                    units.push(JSON.parse(JSON.stringify(unitTable)));
                    unitTable.location.lat += 0.0001;
                }
                spawnGroundUnits(units, getActiveCoalition(), false);
            }
        });

        document.addEventListener("contextMenuDeployNavyUnits", () => {
            this.hide();
            this.#spawnOptions.coalition = getActiveCoalition();
            if (this.#spawnOptions) {
                getMap().addTemporaryMarker(this.#spawnOptions.latlng, this.#spawnOptions.name, getActiveCoalition());
                var unitTable = {unitType: this.#spawnOptions.name, location: this.#spawnOptions.latlng};
                var units = [];
                for (let i = 1; i < parseInt(this.#navyUnitCountDropdown.getValue()) + 1; i++) {
                    units.push(JSON.parse(JSON.stringify(unitTable)));
                    unitTable.location.lat += 0.0001;
                }
                spawnNavyUnits(units, getActiveCoalition(), false);
            }
        });

        document.addEventListener("contextMenuDeploySmoke", (e: any) => {
            this.hide();
            spawnSmoke(e.detail.color, this.getLatLng());
        });

        document.addEventListener("contextMenuExplosion", (e: any) => {
            this.hide();
            spawnExplosion(e.detail.strength, this.getLatLng());
        });
        
        document.addEventListener("editCoalitionArea", (e: any) => {
            this.hide();
            if (this.#coalitionArea) {
                getMap().deselectAllCoalitionAreas();
                this.#coalitionArea.setSelected(true);
            }
        });

        this.hide();
    }

    show(x: number, y: number, latlng: LatLng) {
        this.#spawnOptions.airbaseName = "";
        super.show(x, y, latlng);
        this.#spawnOptions.latlng = latlng;
        this.showUpperBar();

        this.showAltitudeSlider();

        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => { element.setAttribute("data-coalition", getActiveCoalition()) });
        if (getActiveCoalition() == "blue")
            this.#coalitionSwitch.setValue(false);
        else if (getActiveCoalition() == "red")
            this.#coalitionSwitch.setValue(true);
        else
            this.#coalitionSwitch.setValue(undefined);

        if (getUnitsManager().getCommandMode() !== GAME_MASTER)
            this.#coalitionSwitch.hide()

        this.getContainer()?.querySelector("#coalition-area-button")?.classList.toggle("hide", true);
    }

    showSubMenu(type: string) {
        if (type === "more")
            this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide");
        else if (["aircraft", "groundunit"].includes(type))
            this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide", true);

        this.getContainer()?.querySelector("#aircraft-spawn-menu")?.classList.toggle("hide", type !== "aircraft");
        this.getContainer()?.querySelector("#aircraft-spawn-button")?.classList.toggle("is-open", type === "aircraft");
        this.getContainer()?.querySelector("#helicopter-spawn-menu")?.classList.toggle("hide", type !== "helicopter");
        this.getContainer()?.querySelector("#helicopter-spawn-button")?.classList.toggle("is-open", type === "helicopter");
        this.getContainer()?.querySelector("#groundunit-spawn-menu")?.classList.toggle("hide", type !== "groundunit");
        this.getContainer()?.querySelector("#groundunit-spawn-button")?.classList.toggle("is-open", type === "groundunit");
        this.getContainer()?.querySelector("#navyunit-spawn-menu")?.classList.toggle("hide", type !== "navyunit");
        this.getContainer()?.querySelector("#navyunit-spawn-button")?.classList.toggle("is-open", type === "navyunit");
        this.getContainer()?.querySelector("#smoke-spawn-menu")?.classList.toggle("hide", type !== "smoke");
        this.getContainer()?.querySelector("#smoke-spawn-button")?.classList.toggle("is-open", type === "smoke");
        this.getContainer()?.querySelector("#explosion-menu")?.classList.toggle("hide", type !== "explosion");
        this.getContainer()?.querySelector("#explosion-spawn-button")?.classList.toggle("is-open", type === "explosion");

        this.#resetAircraftRole();
        this.#resetAircraftName();
        this.#resetHelicopterRole();
        this.#resetHelicopterName();
        this.#resetGroundUnitType();
        this.#resetGroundUnitName();
        this.#resetNavyUnitType();
        this.#resetNavyUnitName();
        this.#aircraftCountDropdown.setValue("1");
        this.#helicopterCountDropdown.setValue("1");
        this.#groundUnitCountDropdown.setValue("1");
        this.clip();

        this.setVisibleSubMenu(type);
    }

    hideSubMenus(type: string) {
        this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide", ["aircraft", "groundunit"].includes(type));
        this.getContainer()?.querySelector("#aircraft-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#aircraft-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#helicopter-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#helicopter-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#groundunit-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#groundunit-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#navyunit-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#navyunit-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#smoke-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#smoke-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#explosion-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#explosion-spawn-button")?.classList.toggle("is-open", false);

        this.#resetAircraftRole();
        this.#resetAircraftName();
        this.#resetHelicopterRole();
        this.#resetHelicopterName();
        this.#resetHelicopterRole();
        this.#resetHelicopterName();
        this.#resetGroundUnitType();
        this.#resetGroundUnitName();
        this.#resetNavyUnitType();
        this.#resetNavyUnitName();
        this.clip();

        this.setVisibleSubMenu(null);
    }

    showUpperBar() {
        this.getContainer()?.querySelector(".upper-bar")?.classList.toggle("hide", false);
    }

    hideUpperBar() {
        this.getContainer()?.querySelector(".upper-bar")?.classList.toggle("hide", true);
    }

    showLowerBar() {
        this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide", false);
    }

    hideLowerBar() {
        this.getContainer()?.querySelector("#more-optionsbutton-bar")?.classList.toggle("hide", true);
    }

    showAltitudeSlider() {
        this.getContainer()?.querySelector("#aircraft-spawn-altitude-slider")?.classList.toggle("hide", false);
    }

    hideAltitudeSlider() {
        this.getContainer()?.querySelector("#aircraft-spawn-altitude-slider")?.classList.toggle("hide", true);
    }

    setAirbaseName(airbaseName: string) {
        this.#spawnOptions.airbaseName = airbaseName;
    }

    setLatLng(latlng: LatLng) {
        this.#spawnOptions.latlng = latlng;
    }

    setCoalitionArea(coalitionArea: CoalitionArea) {
        this.#coalitionArea = coalitionArea;
        this.getContainer()?.querySelector("#coalition-area-button")?.classList.toggle("hide", false);
    }

    #onSwitchClick(value: boolean) {
        value? setActiveCoalition("red"): setActiveCoalition("blue");
        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => { element.setAttribute("data-coalition", getActiveCoalition()) });
    }

    #onSwitchRightClick(e: any) {
        this.#coalitionSwitch.setValue(undefined);
        setActiveCoalition("neutral");
        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => { element.setAttribute("data-coalition", getActiveCoalition()) });
    }

    /********* Aircraft spawn menu *********/
    #setAircraftRole(role: string) {
        this.#spawnOptions.role = role;
        this.#resetAircraftName();
        this.#aircraftNameDropdown.setOptions(aircraftDatabase.getByRole(role).map((blueprint) => { return blueprint.label }));
        this.#aircraftNameDropdown.selectValue(0);
        this.clip();
    }

    #resetAircraftRole() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-loadout-list")).replaceChildren();
        this.#aircraftRoleDropdown.reset();
        this.#aircraftNameDropdown.reset();
        this.#aircraftRoleDropdown.setOptions(aircraftDatabase.getRoles());
        this.clip();
    }

    #setAircraftName(label: string) {
        this.#resetAircraftName();
        var name = aircraftDatabase.getByLabel(label)?.name || null;
        if (name != null) {
            this.#spawnOptions.name = name;
            this.#aircraftLoadoutDropdown.setOptions(aircraftDatabase.getLoadoutNamesByRole(name, this.#spawnOptions.role));
            this.#aircraftLoadoutDropdown.selectValue(0);
            var image = (<HTMLImageElement>this.getContainer()?.querySelector("#aircraft-unit-image"));
            image.src = `images/units/${aircraftDatabase.getByLabel(label)?.filename}`;
            image.classList.toggle("hide", false);
        }
        this.clip();
    }

    #resetAircraftName() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-loadout-list")).replaceChildren();
        this.#aircraftLoadoutDropdown.reset();
        (<HTMLImageElement>this.getContainer()?.querySelector("#aircraft-unit-image")).classList.toggle("hide", true);
        this.clip();
    }

    #setAircraftCount(count: string) {
        this.#spawnOptions.count = parseInt(count);
        this.clip();
    }

    #setAircraftLoadout(loadoutName: string) {
        var loadout = aircraftDatabase.getLoadoutByName(this.#spawnOptions.name, loadoutName);
        if (loadout) {
            this.#spawnOptions.loadout = loadout.code;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = false;
            var items = loadout.items.map((item: any) => { return `${item.quantity}x ${item.name}`; });
            items.length == 0 ? items.push("Empty loadout") : "";
            (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-loadout-list")).replaceChildren(
                ...items.map((item: any) => {
                    var div = document.createElement('div');
                    div.innerText = item;
                    return div;
                })
            )
        }
        this.clip();
    }

    /********* Helicopter spawn menu *********/
    #setHelicopterRole(role: string) {
        this.#spawnOptions.role = role;
        this.#resetHelicopterName();
        this.#helicopterNameDropdown.setOptions(helicopterDatabase.getByRole(role).map((blueprint) => { return blueprint.label }));
        this.#helicopterNameDropdown.selectValue(0);
        this.clip();
    }

    #resetHelicopterRole() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-loadout-list")).replaceChildren();
        this.#helicopterRoleDropdown.reset();
        this.#helicopterNameDropdown.reset();
        this.#helicopterRoleDropdown.setOptions(helicopterDatabase.getRoles());
        this.clip();
    }

    #setHelicopterName(label: string) {
        this.#resetHelicopterName();
        var name = helicopterDatabase.getByLabel(label)?.name || null;
        if (name != null) {
            this.#spawnOptions.name = name;
            this.#helicopterLoadoutDropdown.setOptions(helicopterDatabase.getLoadoutNamesByRole(name, this.#spawnOptions.role));
            this.#helicopterLoadoutDropdown.selectValue(0);
            var image = (<HTMLImageElement>this.getContainer()?.querySelector("#helicopter-unit-image"));
            image.src = `images/units/${helicopterDatabase.getByLabel(label)?.filename}`;
            image.classList.toggle("hide", false);
        }
        this.clip();
    }

    #resetHelicopterName() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-loadout-list")).replaceChildren();
        this.#helicopterLoadoutDropdown.reset();
        (<HTMLImageElement>this.getContainer()?.querySelector("#helicopter-unit-image")).classList.toggle("hide", true);
        this.clip();
    }

    #setHelicopterCount(count: string) {
        this.#spawnOptions.count = parseInt(count);
        this.clip();
    }

    #setHelicopterLoadout(loadoutName: string) {
        var loadout = helicopterDatabase.getLoadoutByName(this.#spawnOptions.name, loadoutName);
        if (loadout) {
            this.#spawnOptions.loadout = loadout.code;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = false;
            var items = loadout.items.map((item: any) => { return `${item.quantity}x ${item.name}`; });
            items.length == 0 ? items.push("Empty loadout") : "";
            (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-loadout-list")).replaceChildren(
                ...items.map((item: any) => {
                    var div = document.createElement('div');
                    div.innerText = item;
                    return div;
                })
            )
        }
        this.clip();
    }

    /********* Groundunit spawn menu *********/
    #setGroundUnitType(role: string) {
        this.#resetGroundUnitName();

        const types = groundUnitDatabase.getByType(role).map((blueprint) => { return blueprint.label });
        this.#groundUnitNameDropdown.setOptions(types);
        this.#groundUnitNameDropdown.selectValue(0);
        this.clip();
    }

    #resetGroundUnitType() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#groundunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        this.#groundUnitTypeDropdown.reset();
        this.#groundUnitNameDropdown.reset();

        const types = groundUnitDatabase.getTypes();
        this.#groundUnitTypeDropdown.setOptions(types);
        this.clip();
    }

    #setGroundUnitName(label: string) {
        this.#resetGroundUnitName();
        var type = groundUnitDatabase.getByLabel(label)?.name || null;
        if (type != null) {
            this.#spawnOptions.name = type;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#groundunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = false;
        }
        this.clip();
    }

    #resetGroundUnitName() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#groundunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        this.clip();
    }

    #setGroundUnitCount(count: string) {
        this.#spawnOptions.count = parseInt(count);
        this.clip();
    }

    /********* Navyunit spawn menu *********/
    #setNavyUnitType(role: string) {
        this.#resetNavyUnitName();

        const types = navyUnitDatabase.getByType(role).map((blueprint) => { return blueprint.label });
        this.#navyUnitNameDropdown.setOptions(types);
        this.#navyUnitNameDropdown.selectValue(0);
        this.clip();
    }

    #resetNavyUnitType() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#navyunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        this.#navyUnitTypeDropdown.reset();
        this.#navyUnitNameDropdown.reset();

        const types = navyUnitDatabase.getTypes();
        this.#navyUnitTypeDropdown.setOptions(types);
        this.clip();
    }

    #setNavyUnitName(label: string) {
        this.#resetNavyUnitName();
        var type = navyUnitDatabase.getByLabel(label)?.name || null;
        if (type != null) {
            this.#spawnOptions.name = type;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#navyunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = false;
        }
        this.clip();
    }

    #resetNavyUnitName() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#navyunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        this.clip();
    }

    #setNavyUnitCount(count: string) {
        this.#spawnOptions.count = parseInt(count);
        this.clip();
    }
}
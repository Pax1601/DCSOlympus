import { LatLng } from "leaflet";
import { getApp } from "../..";
import { GAME_MASTER } from "../../constants/constants";
import { UnitBlueprint } from "../../interfaces";

export class UnitDatabase {
    blueprints: { [key: string]: UnitBlueprint } = {};
    #url: string;

    constructor(url: string = "") {
        this.#url = url;
        this.load(() => {});
    }

    load(callback: CallableFunction) {
        if (this.#url !== "") {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', this.#url, true);
            xhr.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
            xhr.responseType = 'json';
            xhr.onload = () => {
            var status = xhr.status;
                if (status === 200) {
                    this.blueprints = xhr.response;
                    callback();
                } else {
                    console.error(`Error retrieving database from ${this.#url}`)
                }
            };
            xhr.send();
        }
    }

    getCategory() {
        return "";
    }

    /* Gets a specific blueprint by name */
    getByName(name: string) {
        if (name in this.blueprints)
            return this.blueprints[name];
        return null;
    }

    /* Gets a specific blueprint by label */
    getByLabel(label: string) {
        for (let unit in this.blueprints) {
            if (this.blueprints[unit].label === label)
                return this.blueprints[unit];
        }
        return null;
    }

    getBlueprints() {
        if (getApp().getMissionManager().getCommandModeOptions().commandMode == GAME_MASTER || !getApp().getMissionManager().getCommandModeOptions().restrictSpawns)
            return this.blueprints;
        else {
            var filteredBlueprints: { [key: string]: UnitBlueprint } = {};
            for (let unit in this.blueprints) {
                const blueprint = this.blueprints[unit];
                if (this.getSpawnPointsByName(blueprint.name) <= getApp().getMissionManager().getAvailableSpawnPoints() && 
                    getApp().getMissionManager().getCommandModeOptions().eras.includes(blueprint.era) &&
                    (!getApp().getMissionManager().getCommandModeOptions().restrictToCoalition || blueprint.coalition === getApp().getMissionManager().getCommandedCoalition() || blueprint.coalition === undefined)) {
                    filteredBlueprints[unit] = blueprint;
                }
            }
            return filteredBlueprints;
        }
    }

    /* Returns a list of all possible roles in a database */
    getRoles() {
        var roles: string[] = [];
        var filteredBlueprints = this.getBlueprints();
        for (let unit in filteredBlueprints) {
            var loadouts = filteredBlueprints[unit].loadouts;
            if (loadouts) {
                for (let loadout of loadouts) {
                    for (let role of loadout.roles) {
                        if (role !== "" && !roles.includes(role))
                            roles.push(role);
                    }
                }
            }
        }
        return roles;
    }

    /* Returns a list of all possible types in a database */
    getTypes() {
        var filteredBlueprints = this.getBlueprints();
        var types: string[] = [];
        for (let unit in filteredBlueprints) {
            var type = filteredBlueprints[unit].type;
            if (type && type !== "" && !types.includes(type))
                types.push(type);
        }
        return types;
    }

    /* Returns a list of all possible periods in a database */
    getEras() {
        var filteredBlueprints = this.getBlueprints();
        var eras: string[] = [];
        for (let unit in filteredBlueprints) {
            var era = filteredBlueprints[unit].era;
            if (era && era !== "" && !eras.includes(era))
                eras.push(era);
        }
        return eras;
    }

    /* Returns a list of all possible ranges in a database */
    getRanges() {
        var filteredBlueprints = this.getBlueprints();
        var ranges: string[] = [];
        for (let unit in filteredBlueprints) {
            var range = filteredBlueprints[unit].range;
            if (range && range !== "" && !ranges.includes(range))
                ranges.push(range);
        }
        return ranges;
    }

    /* Get all blueprints by range */
    getByRange(range: string) {
        var filteredBlueprints = this.getBlueprints();
        var unitswithrange = [];
        for (let unit in filteredBlueprints) {
            if (filteredBlueprints[unit].range === range) {
                unitswithrange.push(filteredBlueprints[unit]);
            }
        }
        return unitswithrange;
    }

    /* Get all blueprints by type */
    getByType(type: string) {
        var filteredBlueprints = this.getBlueprints();
        var units = [];
        for (let unit in filteredBlueprints) {
            if (filteredBlueprints[unit].type === type) {
                units.push(filteredBlueprints[unit]);
            }
        }
        return units;
    }

    /* Get all blueprints by role */
    getByRole(role: string) {
        var filteredBlueprints = this.getBlueprints();
        var units = [];
        for (let unit in filteredBlueprints) {
            var loadouts = filteredBlueprints[unit].loadouts;
            if (loadouts) {
                for (let loadout of loadouts) {
                    if (loadout.roles.includes(role) || loadout.roles.includes(role.toLowerCase())) {
                        units.push(filteredBlueprints[unit])
                        break;
                    }
                }
            }
        }
        return units;
    }

    /* Get the names of all the loadouts for a specific unit and for a specific role */
    getLoadoutNamesByRole(name: string, role: string) {
        var filteredBlueprints = this.getBlueprints();
        var loadoutsByRole = [];
        var loadouts = filteredBlueprints[name].loadouts;
        if (loadouts) {
            for (let loadout of loadouts) {
                if (loadout.roles.includes(role) || loadout.roles.includes("")) {
                    loadoutsByRole.push(loadout.name)
                }
            }
        }
        return loadoutsByRole;
    }

    /* Get the livery names for a specific unit */
    getLiveryNamesByName(name: string) {
        var liveries = this.blueprints[name].liveries;
        if (liveries !== undefined)
            return Object.values(liveries);
        else
            return [];
    }

    /* Get the loadout content from the unit name and loadout name */
    getLoadoutByName(name: string, loadoutName: string) {
        var loadouts = this.blueprints[name].loadouts;
        if (loadouts) {
            for (let loadout of loadouts) {
                if (loadout.name === loadoutName)
                    return loadout;
            }
        }
        return null;
    }

    generateTestGrid(initialPosition: LatLng) {
        var filteredBlueprints = this.getBlueprints();
        const step = 0.01;
        var nUnits = Object.values(filteredBlueprints).length;
        var gridSize = Math.ceil(Math.sqrt(nUnits));
        Object.values(filteredBlueprints).forEach((unitBlueprint: UnitBlueprint, idx: number) => {
            var row = Math.floor(idx / gridSize);
            var col = idx - row * gridSize;
            var location = new LatLng(initialPosition.lat + col * step, initialPosition.lng + row * step)
            getApp().getUnitsManager().spawnUnits(this.getCategory(), [{unitType: unitBlueprint.name, location: location, altitude: 1000, loadout: "", liveryID: ""}]);
        })
    }

    getSpawnPointsByLabel(label: string) {
        var blueprint = this.getByLabel(label);
        if (blueprint)
            return this.getSpawnPointsByName(blueprint.name);
        else
            return Infinity;
    }

    getSpawnPointsByName(name: string) {
        return Infinity;
    }
}
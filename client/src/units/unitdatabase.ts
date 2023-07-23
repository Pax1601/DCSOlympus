import { LatLng } from "leaflet";
import { getMissionHandler, getUnitsManager } from "..";
import { GAME_MASTER } from "../constants/constants";

export class UnitDatabase {
    blueprints: { [key: string]: UnitBlueprint } = {};

    constructor() {

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
        if (getMissionHandler().getCommandModeOptions().commandMode == GAME_MASTER || !getMissionHandler().getCommandModeOptions().restrictSpawns)
            return this.blueprints;
        else {
            var filteredBlueprints: { [key: string]: UnitBlueprint } = {};
            for (let unit in this.blueprints) {
                const blueprint = this.blueprints[unit];
                if (this.getSpawnPointsByName(blueprint.name) <= getMissionHandler().getAvailableSpawnPoints() && 
                    getMissionHandler().getCommandModeOptions().eras.includes(blueprint.era) &&
                    (!getMissionHandler().getCommandModeOptions().restrictToCoalition || blueprint.coalition === getMissionHandler().getCommandedCoalition())) {
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
            getUnitsManager().spawnUnits(this.getCategory(), [{unitType: unitBlueprint.name, location: location, altitude: 1000, loadout: ""}]);
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
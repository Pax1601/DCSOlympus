import { LatLng } from "leaflet";
import { getUnitsManager } from "..";

export class UnitDatabase {
    blueprints: { [key: string]: UnitBlueprint } = {};

    constructor() {

    }

    getCategory() {
        return "";
    }

    getBlueprints() {
        return this.blueprints;
    }

    /* Returns a list of all possible roles in a database */
    getRoles() {
        var roles: string[] = [];
        for (let unit in this.blueprints) {
            var loadouts = this.blueprints[unit].loadouts;
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
        var types: string[] = [];
        for (let unit in this.blueprints) {
            var type = this.blueprints[unit].type;
            if (type && type !== "" && !types.includes(type))
                types.push(type);
        }
        return types;
    }

    /* Returns a list of all possible periods in a database */
    getEras() {
        var eras: string[] = [];
        for (let unit in this.blueprints) {
            var unitEras = this.blueprints[unit].era;
            if (unitEras) {
                for (let era of unitEras) {
                    if (era !== "" && !eras.includes(era))
                        eras.push(era);
                }
            }
        }
        return eras;
    }

    /* Returns a list of all possible ranges in a database */
    getRanges() {
        var ranges: string[] = [];
        for (let unit in this.blueprints) {
            var range = this.blueprints[unit].range;
            if (range && range !== "" && !ranges.includes(range))
                ranges.push(range);
        }
        return ranges;
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

    /* Get all blueprints by range */
    getByRange(range: string) {
        var unitswithrange = [];
        for (let unit in this.blueprints) {
            if (this.blueprints[unit].range === range) {
                unitswithrange.push(this.blueprints[unit]);
            }
        }
        return unitswithrange;
    }

    /* Get all blueprints by type */
    getByType(type: string) {
        var units = [];
        for (let unit in this.blueprints) {
            if (this.blueprints[unit].type === type) {
                units.push(this.blueprints[unit]);
            }
        }
        return units;
    }

    /* Get all blueprints by role */
    getByRole(role: string) {
        var units = [];
        for (let unit in this.blueprints) {
            var loadouts = this.blueprints[unit].loadouts;
            if (loadouts) {
                for (let loadout of loadouts) {
                    if (loadout.roles.includes(role) || loadout.roles.includes(role.toLowerCase())) {
                        units.push(this.blueprints[unit])
                        break;
                    }
                }
            }
        }
        return units;
    }

    /* Get the names of all the loadouts for a specific unit and for a specific role */
    getLoadoutNamesByRole(name: string, role: string) {
        var loadoutsByRole = [];
        var loadouts = this.blueprints[name].loadouts;
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
        const step = 0.01;
        var nUnits = Object.values(this.blueprints).length;
        var gridSize = Math.ceil(Math.sqrt(nUnits));
        Object.values(this.blueprints).forEach((unitBlueprint: UnitBlueprint, idx: number) => {
            var row = Math.floor(idx / gridSize);
            var col = idx - row * gridSize;
            var location = new LatLng(initialPosition.lat + col * step, initialPosition.lng + row * step)
            getUnitsManager().spawnUnit(this.getCategory(), [{unitType: unitBlueprint.name, location: location, altitude: 1000, loadout: ""}]);
        })
    }
}
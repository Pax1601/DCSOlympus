import { getApp } from "../../olympusapp";
import { GAME_MASTER } from "../../constants/constants";
import { UnitBlueprint } from "../../interfaces";
import { UnitDatabaseLoadedEvent } from "../../events";

export class UnitDatabase {
  blueprints: { [key: string]: UnitBlueprint } = {};

  constructor() {}

  load(url: string) {
    if (url !== "") {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
      xhr.responseType = "json";
      xhr.onload = () => {
        var status = xhr.status;
        if (status === 200) {
          const newBlueprints = xhr.response as { [key: string]: UnitBlueprint };
          this.blueprints = { ...this.blueprints, ...newBlueprints };
          UnitDatabaseLoadedEvent.dispatch();
        } else {
          console.error(`Error retrieving database from ${url}`);
        }
      };
      xhr.send();
    }
  }

  /* Gets a specific blueprint by name */
  getByName(name: string) {
    if (name in this.blueprints) return this.blueprints[name];
    return null;
  }

  /* Gets a specific blueprint by label */
  getByLabel(label: string) {
    for (let unit in this.blueprints) {
      if (this.blueprints[unit].label === label) return this.blueprints[unit];
    }
    return null;
  }

  getBlueprints(includeDisabled: boolean = false) {
    if (!getApp()) return [];

    if (
      getApp().getMissionManager().getCommandModeOptions().commandMode == GAME_MASTER ||
      !getApp().getMissionManager().getCommandModeOptions().restrictSpawns
    ) {
      var filteredBlueprints: { [key: string]: UnitBlueprint } = {};
      for (let unit in this.blueprints) {
        const blueprint = this.blueprints[unit];
        if (blueprint.enabled || includeDisabled) filteredBlueprints[unit] = blueprint;
      }
      return Object.values(filteredBlueprints);
    } else {
      var filteredBlueprints: { [key: string]: UnitBlueprint } = {};
      for (let unit in this.blueprints) {
        const blueprint = this.blueprints[unit];
        if (
          (blueprint.enabled || includeDisabled) &&
          this.getSpawnPointsByName(blueprint.name) <= getApp().getMissionManager().getAvailableSpawnPoints() &&
          getApp().getMissionManager().getCommandModeOptions().eras.includes(blueprint.era) &&
          (!getApp().getMissionManager().getCommandModeOptions().restrictToCoalition ||
            blueprint.coalition === getApp().getMissionManager().getCommandedCoalition() ||
            blueprint.coalition === undefined)
        ) {
          filteredBlueprints[unit] = blueprint;
        }
      }
      return Object.values(filteredBlueprints);
    }
  }

  /* Returns a list of all possible roles in a database */
  getRoles(unitFilter?: (unit: UnitBlueprint) => boolean) {
    var roles: string[] = [];
    var filteredBlueprints = this.getBlueprints();
    for (let unit of filteredBlueprints) {
      if (typeof unitFilter === "function" && !unitFilter(unit)) continue;
      var loadouts = unit.loadouts;
      if (loadouts) {
        for (let loadout of loadouts) {
          for (let role of loadout.roles) {
            if (role !== "" && !roles.includes(role)) roles.push(role);
          }
        }
      }
    }
    return roles;
  }

  /* Returns a list of all possible types in a database */
  getTypes(unitFilter?: (unit: UnitBlueprint) => boolean) {
    var filteredBlueprints = this.getBlueprints();
    var types: string[] = [];
    for (let unit of filteredBlueprints) {
      if (typeof unitFilter === "function" && !unitFilter(unit)) continue;
      var type = unit.type;
      if (type && type !== "" && !types.includes(type)) types.push(type);
    }
    return types;
  }

  /* Returns a list of all possible eras in a database */
  getEras(unitFilter?: (unit: UnitBlueprint) => boolean) {
    var filteredBlueprints = this.getBlueprints();
    var eras: string[] = [];
    for (let unit of filteredBlueprints) {
      if (typeof unitFilter === "function" && !unitFilter(unit)) continue;
      var era = unit.era;
      if (era && era !== "" && !eras.includes(era)) eras.push(era);
    }
    return eras;
  }

  /* Get all blueprints by range */
  getByRange(range: string, unitFilter?: (unit: UnitBlueprint) => boolean) {
    var filteredBlueprints = this.getBlueprints();
    var unitswithrange: UnitBlueprint[] = [];
    var minRange = 0;
    var maxRange = 0;

    if (range === "Short range") {
      minRange = 0;
      maxRange = 10000;
    } else if (range === "Medium range") {
      minRange = 10000;
      maxRange = 100000;
    } else {
      minRange = 100000;
      maxRange = 999999;
    }

    for (let unit of filteredBlueprints) {
      if (typeof unitFilter === "function" && !unitFilter(unit)) continue;
      var engagementRange = unit.engagementRange;
      if (engagementRange !== undefined) {
        if (engagementRange >= minRange && engagementRange < maxRange) {
          unitswithrange.push(unit);
        }
      }
    }
    return unitswithrange;
  }

  /* Get all blueprints by type */
  getByType(type: string, unitFilter?: (unit: UnitBlueprint) => boolean) {
    var filteredBlueprints = this.getBlueprints();
    var units: UnitBlueprint[] = [];
    for (let unit of filteredBlueprints) {
      if (typeof unitFilter === "function" && !unitFilter(unit)) continue;
      if (unit.type === type) {
        units.push(unit);
      }
    }
    return units;
  }

  /* Get all blueprints by role */
  getByRole(role: string, unitFilter?: (unit: UnitBlueprint) => boolean) {
    var filteredBlueprints = this.getBlueprints();
    var units: UnitBlueprint[] = [];
    for (let unit of filteredBlueprints) {
      if (typeof unitFilter === "function" && !unitFilter(unit)) continue;
      var loadouts = unit.loadouts;
      if (loadouts) {
        for (let loadout of loadouts) {
          if (loadout.roles.includes(role) || loadout.roles.includes(role.toLowerCase())) {
            units.push(unit);
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
    var loadoutsByRole: string[] = [];
    var loadouts = filteredBlueprints[name].loadouts;
    if (loadouts) {
      for (let loadout of loadouts) {
        if (loadout.roles.includes(role) || loadout.roles.includes("")) {
          loadoutsByRole.push(loadout.name);
        }
      }
    }
    return loadoutsByRole;
  }

  /* Get the livery names for a specific unit */
  getLiveryNamesByName(name: string) {
    var liveries = this.blueprints[name].liveries;
    if (liveries !== undefined) return Object.values(liveries);
    else return [];
  }

  /* Get the loadout content from the unit name and loadout name */
  getLoadoutByName(name: string, loadoutName: string) {
    var loadouts = this.blueprints[name].loadouts;
    if (loadouts) {
      for (let loadout of loadouts) {
        if (loadout.name === loadoutName) return loadout;
      }
    }
    return null;
  }

  getSpawnPointsByName(name: string) {
    return this.getByLabel(name)?.cost ?? 10;
  }

  getUnkownUnit(name: string): UnitBlueprint {
    return {
      name: name,
      category: "aircraft",
      enabled: true,
      coalition: "neutral",
      era: "N/A",
      label: name,
      shortLabel: "",
    };
  }

  
getRandomUnit(
  options: {
    type?: string;
    role?: string;
    ranges?: string[];
    eras?: string[];
    coalition?: string;
  }
) {
  /* Start from all the unit blueprints in the database */
  var unitBlueprints = this.getBlueprints();

  /* If a specific type or role is provided, use only the blueprints of that type or role */
  if (options.type && options.role) {
    console.error("Can't create random unit if both type and role are provided. Either create by type or by role.");
    return null;
  }

  if (options.type) {
    unitBlueprints = this.getByType(options.type);
  } else if (options.role) {
    unitBlueprints = this.getByType(options.role);
  }

  /* Keep only the units that have a range included in the requested values */
  if (options.ranges) {
    unitBlueprints = unitBlueprints.filter((unitBlueprint: UnitBlueprint) => {
      var rangeType = "";
      var range = unitBlueprint.acquisitionRange;
      if (range !== undefined) {
        if (range >= 0 && range < 10000) rangeType = "Short range";
        else if (range >= 10000 && range < 100000) rangeType = "Medium range";
        else if (range >= 100000 && range < 999999) rangeType = "Long range";
      }
      return options.ranges?.includes(rangeType);
    });
  }

  /* Keep only the units that have an era included in the requested values */
  if (options.eras) {
    unitBlueprints = unitBlueprints.filter((unitBlueprint: UnitBlueprint) => {
      return unitBlueprint.era ? options.eras?.includes(unitBlueprint.era) : true;
    });
  }

  /* Keep only the units that have the correct coalition, if selected */
  if (options.coalition) {
    unitBlueprints = unitBlueprints.filter((unitBlueprint: UnitBlueprint) => {
      return unitBlueprint.coalition && unitBlueprint.coalition !== "" ? options.coalition === unitBlueprint.coalition : true;
    });
  }

  var index = Math.floor(Math.random() * unitBlueprints.length);
  return unitBlueprints[index];
}
}

export interface LoadoutItemBlueprint {
    name: string;
    quantity: number;
}

export interface LoadoutBlueprint {
    fuel: number;
    items: LoadoutItemBlueprint[];
    roles: string[];
    code: string;
    name: string;
}

export interface UnitBlueprint {
    name: string;
    label: string;
    shortLabel: string;
    loadouts: LoadoutBlueprint[];
}

export class UnitDatabase {
    units: {[key: string]: UnitBlueprint} = {};

    constructor()
    {

    }

    getLabelsByRole(role: string)
    {
        var units = [];
        for (let unit in this.units)
        {
            for (let loadout of this.units[unit].loadouts)
            {
                if (loadout.roles.includes(role))
                {
                    units.push(this.units[unit].label)
                    break;
                }
            }
        }
        return units;
    }

    getLoadoutNamesByRole(unit: string, role: string)
    {
        var loadouts = [];
        for (let loadout of this.units[unit].loadouts)
        {
            if (loadout.roles.includes(role) || loadout.roles.includes(""))
            {
                loadouts.push(loadout.name)
            }
        }
        return loadouts;
    }

    getLoadoutsByName(unit: string, loadoutName: string)
    {
        for (let loadout of this.units[unit].loadouts)
        {
            if (loadout.name === loadoutName)
            {
                return loadout;
            }
        }
        return null;
    }

    getNameByLabel(label: string)
    {
        for (let name in this.units)
        {
            if (this.units[name].label === label)
            {
                return name;
            }
        }
        return null;
    }
    
    getLabelByName(name: string)
    {
        return this.units[name] === undefined? name: this.units[name].label;
    }

    getShortLabelByName(name: string)
    {
        return this.units[name] === undefined? name: this.units[name].shortLabel;
    }
}
export class UnitDatabase {
    units: {[key: string]: UnitBlueprint} = {};

    constructor()
    {

    }

    getByLabel(label: string)
    {
        for (let unit in this.units)
        {
            if (this.units[unit].label === label)
                return this.units[unit];
        }
        return null;
    }

    getRoles()
    {
        var roles: string[] = [];
        for (let unit in this.units)
        {
            for (let loadout of this.units[unit].loadouts)
            {
                for (let role of loadout.roles)
                {
                    if (role !== "" && !roles.includes(role))
                        roles.push(role);
                }
            }
        }
        return roles;
    }

    getLabelsByRole(role: string)
    {
        var units = [];
        for (let unit in this.units)
        {
            for (let loadout of this.units[unit].loadouts)
            {
                if (loadout.roles.includes(role) || loadout.roles.includes(role.toLowerCase()))
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
export class UnitDatabase {
    blueprints: {[key: string]: UnitBlueprint} = {};

    constructor()
    {

    }

    /* Returns a list of all possible roles in a database */
    getRoles()
    {
        var roles: string[] = [];
        for (let unit in this.blueprints)
        {
            for (let loadout of this.blueprints[unit].loadouts)
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

    /* Gets a specific blueprint by name */
    getByName(name: string)
    {
        if (name in this.blueprints)
            return this.blueprints[name];
        return null;
    }

    /* Gets a specific blueprint by label */
    getByLabel(label: string)
    {
        for (let unit in this.blueprints)
        {
            if (this.blueprints[unit].label === label)
                return this.blueprints[unit];
        }
        return null;
    }

    /* Get all blueprints by role */
    getByRole(role: string)
    {
        var units = [];
        for (let unit in this.blueprints)
        {
            for (let loadout of this.blueprints[unit].loadouts)
            {
                if (loadout.roles.includes(role) || loadout.roles.includes(role.toLowerCase()))
                {
                    units.push(this.blueprints[unit])
                    break;
                }
            }
        }
        return units;
    }

    /* Get the names of all the loadouts for a specific unit and for a specific role */
    getLoadoutNamesByRole(name: string, role: string)
    {
        var loadouts = [];
        for (let loadout of this.blueprints[name].loadouts)
        {
            if (loadout.roles.includes(role) || loadout.roles.includes(""))
            {
                loadouts.push(loadout.name)
            }
        }
        return loadouts;
    }

    /* Get the loadout content from the unit name and loadout name */
    getLoadoutByName(name: string, loadoutName: string)
    {
        for (let loadout of this.blueprints[name].loadouts)
        {
            if (loadout.name === loadoutName)
                return loadout;
        }
        return null;
    }
}
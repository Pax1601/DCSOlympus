interface LoadoutItemBlueprint {
    name: string;
    quantity: number;
    effectiveAgainst?: string;
}

interface LoadoutBlueprint {
    fuel: number;
    items: LoadoutItemBlueprint[];
    roles: string[];
    code: string;
    name: string;
}

interface UnitBlueprint {
    name: string;
    coalition: string;
    era: string;
    label: string;
    shortLabel: string;
    type?: string;
    range?: string;
    loadouts?: LoadoutBlueprint[];
    filename?: string;
    liveries?: {[key: string]: {name: string, countries: string[]}};
    cost?: number;
}

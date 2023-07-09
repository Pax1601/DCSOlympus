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
    era?: string[];
    type?: string;
    label: string;
    shortLabel: string;
    range?: string;
    loadouts: LoadoutBlueprint[];
    filename: string;
}

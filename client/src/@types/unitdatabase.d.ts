interface LoadoutItemBlueprint {
    name: string;
    quantity: number;
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
    label: string;
    shortLabel: string;
    loadouts: LoadoutBlueprint[];
}

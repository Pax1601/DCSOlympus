export interface OlympusPlugin {
    getName: () => string;
    initialize: (any) => boolean;
}


export class Marker {}
export class CustomMarker extends Marker {}
export class Unit extends CustomMarker {}

export class OlympusApp {
    getShortcutManager():ShortcutManager;
    getUnitsManager():UnitsManager;
}

export class ShortcutManager {
    add( name:string, shortcut:Shortcut ): ShortcutManager;
    getKeysBeingHeld(): string[];
    keyComboMatches( combo: string[] ): boolean;
    onKeyDown( callback:CallableFunction );
    onKeyUp( callback:CallableFunction );
}

export class UnitsManager {
    getUnits(): { [ID: number]: Unit }
}

export declare global {
    function getOlympusPlugin(): OlympusPlugin;
}
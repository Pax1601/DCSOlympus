declare module "map/boxselect" {
    export var BoxSelect: (new (...args: any[]) => any) & typeof import("leaflet").Class;
}
declare module "contextmenus/contextmenu" {
    import { LatLng } from "leaflet";
    /** Base class for map contextmenus. By default it is empty and requires to be extended. */
    export class ContextMenu {
        #private;
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        /** Show the contextmenu on top of the map, usually at the location where the user has clicked on it.
         *
         * @param x X screen coordinate of the top left corner of the context menu
         * @param y Y screen coordinate of the top left corner of the context menu
         * @param latlng Leaflet latlng object of the mouse click
         */
        show(x: number, y: number, latlng: LatLng): void;
        /** Hide the contextmenu
         *
         */
        hide(): void;
        /**
         *
         * @returns The HTMLElement that contains the contextmenu
         */
        getContainer(): HTMLElement | null;
        /**
         *
         * @returns The Leaflet latlng object associated to the click that caused the contextmenu to be shown
         */
        getLatLng(): LatLng;
        /**
         *
         * @returns The x coordinate of the top left corner of the menu
         */
        getX(): number;
        /**
         *
         * @returns The y coordinate of the top left corner of the menu
         */
        getY(): number;
        /** Clips the contextmenu, meaning it moves it on the screen to make sure it does not overflow the window.
         *
         */
        clip(): void;
        /** Sets the currently visible submenu
         *
         * @param menu The name of the currently visibile submenu, or null if no submenu is visible
         */
        setVisibleSubMenu(menu: string | null): void;
        /**
         *
         * @returns The name of the currently visible submenu
         */
        getVisibleSubMenu(): string | null;
    }
}
declare module "controls/control" {
    export class Control {
        #private;
        expectedValue: any;
        constructor(container: string | null, options?: any);
        show(): void;
        hide(): void;
        getContainer(): HTMLElement | null;
        setExpectedValue(expectedValue: any): void;
        resetExpectedValue(): void;
        checkExpectedValue(value: any): boolean;
        createElement(options?: any): HTMLElement | null;
    }
}
declare module "controls/switch" {
    import { Control } from "controls/control";
    export class Switch extends Control {
        #private;
        constructor(ID: string, callback: CallableFunction, initialValue?: boolean);
        setValue(newValue: boolean | undefined, ignoreExpectedValue?: boolean): void;
        getValue(): boolean | undefined;
    }
}
declare module "constants/constants" {
    import { LatLng, LatLngBounds } from "leaflet";
    export const UNITS_URI = "units";
    export const WEAPONS_URI = "weapons";
    export const LOGS_URI = "logs";
    export const AIRBASES_URI = "airbases";
    export const BULLSEYE_URI = "bullseyes";
    export const MISSION_URI = "mission";
    export const COMMANDS_URI = "commands";
    export const NONE = "None";
    export const GAME_MASTER = "Game master";
    export const BLUE_COMMANDER = "Blue commander";
    export const RED_COMMANDER = "Red commander";
    export const VISUAL = 1;
    export const OPTIC = 2;
    export const RADAR = 4;
    export const IRST = 8;
    export const RWR = 16;
    export const DLINK = 32;
    export const states: string[];
    export const ROEs: string[];
    export const reactionsToThreat: string[];
    export const emissionsCountermeasures: string[];
    export const ROEDescriptions: string[];
    export const reactionsToThreatDescriptions: string[];
    export const emissionsCountermeasuresDescriptions: string[];
    export const minSpeedValues: {
        [key: string]: number;
    };
    export const maxSpeedValues: {
        [key: string]: number;
    };
    export const speedIncrements: {
        [key: string]: number;
    };
    export const minAltitudeValues: {
        [key: string]: number;
    };
    export const maxAltitudeValues: {
        [key: string]: number;
    };
    export const altitudeIncrements: {
        [key: string]: number;
    };
    export const minimapBoundaries: LatLng[][];
    export const mapBounds: {
        Syria: {
            bounds: LatLngBounds;
            zoom: number;
        };
        MarianaIslands: {
            bounds: LatLngBounds;
            zoom: number;
        };
        Nevada: {
            bounds: LatLngBounds;
            zoom: number;
        };
        PersianGulf: {
            bounds: LatLngBounds;
            zoom: number;
        };
        Caucasus: {
            bounds: LatLngBounds;
            zoom: number;
        };
    };
    export const mapLayers: {
        "ArcGIS Satellite": {
            urlTemplate: string;
            maxZoom: number;
            minZoom: number;
            attribution: string;
        };
        "USGS Topo": {
            urlTemplate: string;
            minZoom: number;
            maxZoom: number;
            attribution: string;
        };
        "OpenStreetMap Mapnik": {
            urlTemplate: string;
            minZoom: number;
            maxZoom: number;
            attribution: string;
        };
        OPENVKarte: {
            urlTemplate: string;
            minZoom: number;
            maxZoom: number;
            attribution: string;
        };
        "Esri.DeLorme": {
            urlTemplate: string;
            minZoom: number;
            maxZoom: number;
            attribution: string;
        };
        CyclOSM: {
            urlTemplate: string;
            minZoom: number;
            maxZoom: number;
            attribution: string;
        };
    };
    export const IDLE = "Idle";
    export const MOVE_UNIT = "Move unit";
    export const COALITIONAREA_DRAW_POLYGON = "Draw Coalition Area";
    export const visibilityControls: string[];
    export const visibilityControlsTypes: string[][];
    export const visibilityControlsTooltips: string[];
    export const IADSTypes: string[];
    export const IADSDensities: {
        [key: string]: number;
    };
    export const SHOW_CONTACT_LINES = "Show unit contact lines";
    export const HIDE_GROUP_MEMBERS = "Hide group members when zoomed out";
    export const SHOW_UNIT_LABELS = "Show unit labels";
    export const SHOW_UNIT_PATHS = "Show unit paths";
    export const SHOW_UNIT_TARGETS = "Show unit targets";
    export enum DataIndexes {
        startOfData = 0,
        category = 1,
        alive = 2,
        human = 3,
        controlled = 4,
        coalition = 5,
        country = 6,
        name = 7,
        unitName = 8,
        groupName = 9,
        state = 10,
        task = 11,
        hasTask = 12,
        position = 13,
        speed = 14,
        heading = 15,
        isTanker = 16,
        isAWACS = 17,
        onOff = 18,
        followRoads = 19,
        fuel = 20,
        desiredSpeed = 21,
        desiredSpeedType = 22,
        desiredAltitude = 23,
        desiredAltitudeType = 24,
        leaderID = 25,
        formationOffset = 26,
        targetID = 27,
        targetPosition = 28,
        ROE = 29,
        reactionToThreat = 30,
        emissionsCountermeasures = 31,
        TACAN = 32,
        radio = 33,
        generalSettings = 34,
        ammo = 35,
        contacts = 36,
        activePath = 37,
        isLeader = 38,
        endOfData = 255
    }
}
declare module "map/markers/custommarker" {
    import { Map, Marker } from "leaflet";
    import { MarkerOptions } from "leaflet";
    import { LatLngExpression } from "leaflet";
    export class CustomMarker extends Marker {
        constructor(latlng: LatLngExpression, options?: MarkerOptions);
        onAdd(map: Map): this;
        onRemove(map: Map): this;
        createIcon(): void;
    }
}
declare module "map/coalitionarea/coalitionareahandle" {
    import { LatLng } from "leaflet";
    import { CustomMarker } from "map/markers/custommarker";
    export class CoalitionAreaHandle extends CustomMarker {
        constructor(latlng: LatLng);
        createIcon(): void;
    }
}
declare module "map/coalitionarea/coalitionareamiddlehandle" {
    import { LatLng } from "leaflet";
    import { CustomMarker } from "map/markers/custommarker";
    export class CoalitionAreaMiddleHandle extends CustomMarker {
        constructor(latlng: LatLng);
        createIcon(): void;
    }
}
declare module "map/coalitionarea/coalitionarea" {
    import { LatLng, LatLngExpression, Map, Polygon, PolylineOptions } from "leaflet";
    export class CoalitionArea extends Polygon {
        #private;
        constructor(latlngs: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][], options?: PolylineOptions);
        setCoalition(coalition: string): void;
        getCoalition(): string;
        setSelected(selected: boolean): void;
        getSelected(): boolean;
        setEditing(editing: boolean): void;
        getEditing(): boolean;
        addTemporaryLatLng(latlng: LatLng): void;
        moveActiveVertex(latlng: LatLng): void;
        setOpacity(opacity: number): void;
        onRemove(map: Map): this;
    }
}
declare module "controls/dropdown" {
    export class Dropdown {
        #private;
        constructor(ID: string | null, callback: CallableFunction, options?: string[] | null, defaultText?: string);
        getContainer(): HTMLElement;
        setOptions(optionsList: string[], sortAlphabetically?: boolean): void;
        setOptionsElements(optionsElements: HTMLElement[]): void;
        getOptionElements(): HTMLCollection;
        addOptionElement(optionElement: HTMLElement): void;
        selectText(text: string): void;
        selectValue(idx: number): boolean;
        reset(): void;
        getValue(): string;
        setValue(value: string): void;
        forceValue(value: string): void;
        getIndex(): number;
        clip(): void;
        close(): void;
        open(): void;
        show(): void;
        hide(): void;
        isHidden(): boolean;
    }
}
declare module "mission/airbase" {
    import { CustomMarker } from "map/markers/custommarker";
    import { AirbaseChartData, AirbaseOptions } from "interfaces";
    export class Airbase extends CustomMarker {
        #private;
        constructor(options: AirbaseOptions);
        chartDataHasBeenSet(): boolean;
        createIcon(): void;
        setCoalition(coalition: string): void;
        getChartData(): AirbaseChartData;
        getCoalition(): string;
        setName(name: string): void;
        getName(): string;
        setChartData(chartData: AirbaseChartData): void;
        setProperties(properties: string[]): void;
        getProperties(): string[];
        setParkings(parkings: string[]): void;
        getParkings(): string[];
    }
}
declare module "interfaces" {
    import { LatLng } from "leaflet";
    import { OlympusApp } from "olympusapp";
    import { Airbase } from "mission/airbase";
    export interface OlympusPlugin {
        getName: () => string;
        initialize: (app: OlympusApp) => boolean;
    }
    global {
        function getOlympusPlugin(): OlympusPlugin;
    }
    export interface ConfigurationOptions {
        port: number;
        address: string;
    }
    export interface ContextMenuOption {
        tooltip: string;
        src: string;
        callback: CallableFunction;
    }
    export interface AirbasesData {
        airbases: {
            [key: string]: any;
        };
        sessionHash: string;
        time: number;
    }
    export interface BullseyesData {
        bullseyes: {
            [key: string]: {
                latitude: number;
                longitude: number;
                coalition: string;
            };
        };
        sessionHash: string;
        time: number;
    }
    export interface MissionData {
        mission: {
            theatre: string;
            dateAndTime: DateAndTime;
            commandModeOptions: CommandModeOptions;
            coalitions: {
                red: string[];
                blue: string[];
            };
        };
        time: number;
        sessionHash: string;
    }
    export interface CommandModeOptions {
        commandMode: string;
        restrictSpawns: boolean;
        restrictToCoalition: boolean;
        setupTime: number;
        spawnPoints: {
            red: number;
            blue: number;
        };
        eras: string[];
    }
    export interface DateAndTime {
        date: {
            Year: number;
            Month: number;
            Day: number;
        };
        time: {
            h: number;
            m: number;
            s: number;
        };
        elapsedTime: number;
        startTime: number;
    }
    export interface LogData {
        logs: {
            [key: string]: string;
        };
        sessionHash: string;
        time: number;
    }
    export interface ServerRequestOptions {
        time?: number;
        commandHash?: string;
    }
    export interface UnitSpawnTable {
        unitType: string;
        location: LatLng;
        altitude?: number;
        loadout?: string;
        liveryID: string;
    }
    export interface ObjectIconOptions {
        showState: boolean;
        showVvi: boolean;
        showHotgroup: boolean;
        showUnitIcon: boolean;
        showShortLabel: boolean;
        showFuel: boolean;
        showAmmo: boolean;
        showSummary: boolean;
        showCallsign: boolean;
        rotateToHeading: boolean;
    }
    export interface GeneralSettings {
        prohibitJettison: boolean;
        prohibitAA: boolean;
        prohibitAG: boolean;
        prohibitAfterburner: boolean;
        prohibitAirWpn: boolean;
    }
    export interface TACAN {
        isOn: boolean;
        channel: number;
        XY: string;
        callsign: string;
    }
    export interface Radio {
        frequency: number;
        callsign: number;
        callsignNumber: number;
    }
    export interface Ammo {
        quantity: number;
        name: string;
        guidance: number;
        category: number;
        missileCategory: number;
    }
    export interface Contact {
        ID: number;
        detectionMethod: number;
    }
    export interface Offset {
        x: number;
        y: number;
        z: number;
    }
    export interface UnitData {
        category: string;
        ID: number;
        alive: boolean;
        human: boolean;
        controlled: boolean;
        coalition: string;
        country: number;
        name: string;
        unitName: string;
        groupName: string;
        state: string;
        task: string;
        hasTask: boolean;
        position: LatLng;
        speed: number;
        heading: number;
        isTanker: boolean;
        isAWACS: boolean;
        onOff: boolean;
        followRoads: boolean;
        fuel: number;
        desiredSpeed: number;
        desiredSpeedType: string;
        desiredAltitude: number;
        desiredAltitudeType: string;
        leaderID: number;
        formationOffset: Offset;
        targetID: number;
        targetPosition: LatLng;
        ROE: string;
        reactionToThreat: string;
        emissionsCountermeasures: string;
        TACAN: TACAN;
        radio: Radio;
        generalSettings: GeneralSettings;
        ammo: Ammo[];
        contacts: Contact[];
        activePath: LatLng[];
        isLeader: boolean;
    }
    export interface LoadoutItemBlueprint {
        name: string;
        quantity: number;
        effectiveAgainst?: string;
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
        coalition: string;
        era: string;
        label: string;
        shortLabel: string;
        type?: string;
        range?: string;
        loadouts?: LoadoutBlueprint[];
        filename?: string;
        liveries?: {
            [key: string]: {
                name: string;
                countries: string[];
            };
        };
        cost?: number;
        barrelHeight?: number;
        muzzleVelocity?: number;
    }
    export interface UnitSpawnOptions {
        roleType: string;
        name: string;
        latlng: LatLng;
        coalition: string;
        count: number;
        country: string;
        loadout: LoadoutBlueprint | undefined;
        airbase: Airbase | undefined;
        liveryID: string | undefined;
        altitude: number | undefined;
    }
    export interface AirbaseOptions {
        name: string;
        position: L.LatLng;
    }
    export interface AirbaseChartData {
        elevation: string;
        ICAO: string;
        TACAN: string;
        runways: AirbaseChartRunwayData[];
    }
    export interface AirbaseChartRunwayHeadingData {
        [index: string]: {
            magHeading: string;
            ILS: string;
        };
    }
    export interface AirbaseChartRunwayData {
        headings: AirbaseChartRunwayHeadingData[];
        length: string;
    }
    export interface Listener {
        callback: CallableFunction;
        name?: string;
    }
    export interface ShortcutOptions {
        altKey?: boolean;
        callback: CallableFunction;
        ctrlKey?: boolean;
        name?: string;
        shiftKey?: boolean;
    }
    export interface KeyboardShortcutOptions extends ShortcutOptions {
        code: string;
        event?: "keydown" | "keyup";
    }
    export interface MouseShortcutOptions extends ShortcutOptions {
        button: number;
        event: "mousedown" | "mouseup";
    }
    export interface Manager {
        add: CallableFunction;
    }
}
declare module "unit/databases/unitdatabase" {
    import { LatLng } from "leaflet";
    import { UnitBlueprint } from "interfaces";
    export class UnitDatabase {
        #private;
        blueprints: {
            [key: string]: UnitBlueprint;
        };
        constructor(url?: string);
        load(callback: CallableFunction): void;
        getCategory(): string;
        getByName(name: string): UnitBlueprint | null;
        getByLabel(label: string): UnitBlueprint | null;
        getBlueprints(): {
            [key: string]: UnitBlueprint;
        };
        getRoles(): string[];
        getTypes(): string[];
        getEras(): string[];
        getRanges(): string[];
        getByRange(range: string): UnitBlueprint[];
        getByType(type: string): UnitBlueprint[];
        getByRole(role: string): UnitBlueprint[];
        getLoadoutNamesByRole(name: string, role: string): string[];
        getLiveryNamesByName(name: string): {
            name: string;
            countries: string[];
        }[];
        getLoadoutByName(name: string, loadoutName: string): import("interfaces").LoadoutBlueprint | null;
        generateTestGrid(initialPosition: LatLng): void;
        getSpawnPointsByLabel(label: string): number;
        getSpawnPointsByName(name: string): number;
    }
}
declare module "unit/databases/aircraftdatabase" {
    import { UnitDatabase } from "unit/databases/unitdatabase";
    export class AircraftDatabase extends UnitDatabase {
        constructor();
        getCategory(): string;
        getSpawnPointsByName(name: string): number;
    }
    export var aircraftDatabase: AircraftDatabase;
}
declare module "unit/databases/helicopterdatabase" {
    import { UnitDatabase } from "unit/databases/unitdatabase";
    export class HelicopterDatabase extends UnitDatabase {
        constructor();
        getSpawnPointsByName(name: string): number;
        getCategory(): string;
    }
    export var helicopterDatabase: HelicopterDatabase;
}
declare module "unit/databases/groundunitdatabase" {
    import { UnitDatabase } from "unit/databases/unitdatabase";
    export class GroundUnitDatabase extends UnitDatabase {
        constructor();
        getSpawnPointsByName(name: string): number;
        getCategory(): string;
    }
    export var groundUnitDatabase: GroundUnitDatabase;
}
declare module "unit/databases/navyunitdatabase" {
    import { UnitDatabase } from "unit/databases/unitdatabase";
    export class NavyUnitDatabase extends UnitDatabase {
        constructor();
        getSpawnPointsByName(name: string): number;
        getCategory(): string;
    }
    export var navyUnitDatabase: NavyUnitDatabase;
}
declare module "other/utils" {
    import { LatLng, Polygon } from "leaflet";
    import { UnitDatabase } from "unit/databases/unitdatabase";
    import { Dropdown } from "controls/dropdown";
    import { DateAndTime, UnitBlueprint } from "interfaces";
    export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number;
    export function distance(lat1: number, lon1: number, lat2: number, lon2: number): number;
    export function bearingAndDistanceToLatLng(lat: number, lon: number, brng: number, dist: number): LatLng;
    export function ConvertDDToDMS(D: number, lng: boolean): string;
    export function dataPointMap(container: HTMLElement, data: any): void;
    export function deg2rad(deg: number): number;
    export function rad2deg(rad: number): number;
    export function generateUUIDv4(): string;
    export function keyEventWasInInput(event: KeyboardEvent): boolean;
    export function reciprocalHeading(heading: number): number;
    export const zeroAppend: (num: number, places: number, decimal?: boolean) => string;
    export const zeroPad: (num: number, places: number) => string;
    export function similarity(s1: string, s2: string): number;
    export function editDistance(s1: string, s2: string): any;
    export function latLngToMercator(lat: number, lng: number): {
        x: number;
        y: number;
    };
    export function mercatorToLatLng(x: number, y: number): {
        lng: number;
        lat: number;
    };
    export function createDivWithClass(className: string): HTMLDivElement;
    export function knotsToMs(knots: number): number;
    export function msToKnots(ms: number): number;
    export function ftToM(ft: number): number;
    export function mToFt(m: number): number;
    export function mToNm(m: number): number;
    export function nmToFt(nm: number): number;
    export function polyContains(latlng: LatLng, polygon: Polygon): boolean;
    export function randomPointInPoly(polygon: Polygon): LatLng;
    export function polygonArea(polygon: Polygon): number;
    export function randomUnitBlueprint(unitDatabase: UnitDatabase, options: {
        type?: string;
        role?: string;
        ranges?: string[];
        eras?: string[];
    }): UnitBlueprint | null;
    export function getMarkerCategoryByName(name: string): "aircraft" | "groundunit-sam" | "groundunit-other" | "groundunit-sam-radar" | "groundunit-sam-launcher" | "groundunit-ewr" | "helicopter";
    export function getUnitDatabaseByCategory(category: string): import("unit/databases/aircraftdatabase").AircraftDatabase | import("unit/databases/helicopterdatabase").HelicopterDatabase | import("unit/databases/groundunitdatabase").GroundUnitDatabase | import("unit/databases/navyunitdatabase").NavyUnitDatabase | null;
    export function base64ToBytes(base64: string): ArrayBufferLike;
    export function enumToState(state: number): string;
    export function enumToROE(ROE: number): string;
    export function enumToReactionToThreat(reactionToThreat: number): string;
    export function enumToEmissioNCountermeasure(emissionCountermeasure: number): string;
    export function enumToCoalition(coalitionID: number): "" | "blue" | "red" | "neutral";
    export function convertDateAndTimeToDate(dateAndTime: DateAndTime): Date;
    export function createCheckboxOption(value: string, text: string, checked?: boolean, callback?: CallableFunction): HTMLElement;
    export function getCheckboxOptions(dropdown: Dropdown): {
        [key: string]: boolean;
    };
    export function getGroundElevation(latlng: LatLng, callback: CallableFunction): void;
}
declare module "controls/slider" {
    import { Control } from "controls/control";
    export class Slider extends Control {
        #private;
        constructor(ID: string | null, minValue: number, maxValue: number, unitOfMeasure: string, callback: CallableFunction, options?: any);
        setActive(newActive: boolean): void;
        setMinMax(newMinValue: number, newMaxValue: number): void;
        setIncrement(newIncrement: number): void;
        setValue(newValue: number, ignoreExpectedValue?: boolean): void;
        getValue(): number;
        setDragged(newDragged: boolean): void;
        getDragged(): boolean;
        createElement(options?: any): HTMLElement | null;
    }
}
declare module "controls/unitspawnmenu" {
    import { LatLng } from "leaflet";
    import { Dropdown } from "controls/dropdown";
    import { Slider } from "controls/slider";
    import { UnitDatabase } from "unit/databases/unitdatabase";
    import { Airbase } from "mission/airbase";
    import { UnitSpawnOptions } from "interfaces";
    export class UnitSpawnMenu {
        #private;
        constructor(ID: string, unitDatabase: UnitDatabase, orderByRole: boolean);
        getContainer(): HTMLElement;
        reset(): void;
        setCountries(): void;
        refreshOptions(): void;
        setAirbase(airbase: Airbase | undefined): void;
        setLatLng(latlng: LatLng): void;
        setMaxUnitCount(maxUnitCount: number): void;
        getRoleTypeDrodown(): Dropdown;
        getLabelDropdown(): Dropdown;
        getCountDropdown(): Dropdown;
        getLoadoutDropdown(): Dropdown;
        getCountryDropdown(): Dropdown;
        getLiveryDropdown(): Dropdown;
        getLoadoutPreview(): HTMLDivElement;
        getAltitudeSlider(): Slider;
        deployUnits(spawnOptions: UnitSpawnOptions, unitsCount: number): void;
    }
    export class AircraftSpawnMenu extends UnitSpawnMenu {
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        deployUnits(spawnOptions: UnitSpawnOptions, unitsCount: number): void;
    }
    export class HelicopterSpawnMenu extends UnitSpawnMenu {
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        deployUnits(spawnOptions: UnitSpawnOptions, unitsCount: number): void;
    }
    export class GroundUnitSpawnMenu extends UnitSpawnMenu {
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        deployUnits(spawnOptions: UnitSpawnOptions, unitsCount: number): void;
    }
    export class NavyUnitSpawnMenu extends UnitSpawnMenu {
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        deployUnits(spawnOptions: UnitSpawnOptions, unitsCount: number): void;
    }
}
declare module "map/markers/smokemarker" {
    import { LatLngExpression, MarkerOptions } from "leaflet";
    import { CustomMarker } from "map/markers/custommarker";
    export class SmokeMarker extends CustomMarker {
        #private;
        constructor(latlng: LatLngExpression, color: string, options?: MarkerOptions);
        createIcon(): void;
    }
}
declare module "contextmenus/mapcontextmenu" {
    import { LatLng } from "leaflet";
    import { ContextMenu } from "contextmenus/contextmenu";
    import { CoalitionArea } from "map/coalitionarea/coalitionarea";
    /** The MapContextMenu is the main contextmenu shown to the user whenever it rightclicks on the map. It is the primary interaction method for the user.
     * It allows to spawn units, create explosions and smoke, and edit CoalitionAreas.
     */
    export class MapContextMenu extends ContextMenu {
        #private;
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        /** Show the contextmenu on top of the map, usually at the location where the user has clicked on it.
         *
         * @param x X screen coordinate of the top left corner of the context menu
         * @param y Y screen coordinate of the top left corner of the context menu
         * @param latlng Leaflet latlng object of the mouse click
         */
        show(x: number, y: number, latlng: LatLng): void;
        /** If the user rightclicked on a CoalitionArea, it will be given the ability to edit it.
         *
         * @param coalitionArea The CoalitionArea the user can edit
         */
        setCoalitionArea(coalitionArea: CoalitionArea): void;
    }
}
declare module "contextmenus/unitcontextmenu" {
    import { ContextMenu } from "contextmenus/contextmenu";
    /** The UnitContextMenu is shown when the user rightclicks on a unit. It dynamically presents the user with possible actions to perform on the unit. */
    export class UnitContextMenu extends ContextMenu {
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        /** Set the options that will be presented to the user in the contextmenu
         *
         * @param options Dictionary element containing the text and tooltip of the options shown in the menu
         * @param callback Callback that will be called when the user clicks on one of the options
         */
        setOptions(options: {
            [key: string]: {
                text: string;
                tooltip: string;
            };
        }, callback: CallableFunction): void;
    }
}
declare module "map/markers/targetmarker" {
    import { LatLngExpression, MarkerOptions } from "leaflet";
    import { CustomMarker } from "map/markers/custommarker";
    export class TargetMarker extends CustomMarker {
        constructor(latlng: LatLngExpression, options?: MarkerOptions);
        createIcon(): void;
    }
}
declare module "server/dataextractor" {
    import { LatLng } from "leaflet";
    import { Ammo, Contact, GeneralSettings, Offset, Radio, TACAN } from "interfaces";
    export class DataExtractor {
        #private;
        constructor(buffer: ArrayBuffer);
        setSeekPosition(seekPosition: number): void;
        getSeekPosition(): number;
        extractBool(): boolean;
        extractUInt8(): number;
        extractUInt16(): number;
        extractUInt32(): number;
        extractUInt64(): bigint;
        extractFloat64(): number;
        extractLatLng(): LatLng;
        extractFromBitmask(bitmask: number, position: number): boolean;
        extractString(length?: number): string;
        extractChar(): string;
        extractTACAN(): TACAN;
        extractRadio(): Radio;
        extractGeneralSettings(): GeneralSettings;
        extractAmmo(): Ammo[];
        extractContacts(): Contact[];
        extractActivePath(): LatLng[];
        extractOffset(): Offset;
    }
}
declare module "weapon/weapon" {
    import { LatLng, Map } from 'leaflet';
    import { CustomMarker } from "map/markers/custommarker";
    import { DataExtractor } from "server/dataextractor";
    import { ObjectIconOptions } from "interfaces";
    export class Weapon extends CustomMarker {
        #private;
        ID: number;
        getAlive(): boolean;
        getCoalition(): string;
        getName(): string;
        getPosition(): LatLng;
        getSpeed(): number;
        getHeading(): number;
        static getConstructor(type: string): typeof Missile | typeof Bomb | undefined;
        constructor(ID: number);
        getCategory(): string;
        /********************** Unit data *************************/
        setData(dataExtractor: DataExtractor): void;
        getData(): {
            category: string;
            ID: number;
            alive: boolean;
            coalition: string;
            name: string;
            position: LatLng;
            speed: number;
            heading: number;
        };
        getMarkerCategory(): string;
        getIconOptions(): ObjectIconOptions;
        setAlive(newAlive: boolean): void;
        belongsToCommandedCoalition(): boolean;
        getType(): string;
        /********************** Icon *************************/
        createIcon(): void;
        /********************** Visibility *************************/
        updateVisibility(): void;
        setHidden(hidden: boolean): void;
        getHidden(): boolean;
        setDetectionMethods(newDetectionMethods: number[]): void;
        getDetectionMethods(): number[];
        /***********************************************/
        onAdd(map: Map): this;
    }
    export class Missile extends Weapon {
        constructor(ID: number);
        getCategory(): string;
        getMarkerCategory(): "aircraft" | "missile";
        getIconOptions(): {
            showState: boolean;
            showVvi: boolean;
            showHotgroup: boolean;
            showUnitIcon: boolean;
            showShortLabel: boolean;
            showFuel: boolean;
            showAmmo: boolean;
            showSummary: boolean;
            showCallsign: boolean;
            rotateToHeading: boolean;
        };
    }
    export class Bomb extends Weapon {
        constructor(ID: number);
        getCategory(): string;
        getMarkerCategory(): "aircraft" | "bomb";
        getIconOptions(): {
            showState: boolean;
            showVvi: boolean;
            showHotgroup: boolean;
            showUnitIcon: boolean;
            showShortLabel: boolean;
            showFuel: boolean;
            showAmmo: boolean;
            showSummary: boolean;
            showCallsign: boolean;
            rotateToHeading: boolean;
        };
    }
}
declare module "unit/unit" {
    import { LatLng, Map } from 'leaflet';
    import { CustomMarker } from "map/markers/custommarker";
    import { UnitDatabase } from "unit/databases/unitdatabase";
    import { DataExtractor } from "server/dataextractor";
    import { Ammo, Contact, GeneralSettings, ObjectIconOptions, Offset, Radio, TACAN, UnitData } from "interfaces";
    export class Unit extends CustomMarker {
        #private;
        ID: number;
        getAlive(): boolean;
        getHuman(): boolean;
        getControlled(): boolean;
        getCoalition(): string;
        getCountry(): number;
        getName(): string;
        getUnitName(): string;
        getGroupName(): string;
        getState(): string;
        getTask(): string;
        getHasTask(): boolean;
        getPosition(): LatLng;
        getSpeed(): number;
        getHeading(): number;
        getIsTanker(): boolean;
        getIsAWACS(): boolean;
        getOnOff(): boolean;
        getFollowRoads(): boolean;
        getFuel(): number;
        getDesiredSpeed(): number;
        getDesiredSpeedType(): string;
        getDesiredAltitude(): number;
        getDesiredAltitudeType(): string;
        getLeaderID(): number;
        getFormationOffset(): Offset;
        getTargetID(): number;
        getTargetPosition(): LatLng;
        getROE(): string;
        getReactionToThreat(): string;
        getEmissionsCountermeasures(): string;
        getTACAN(): TACAN;
        getRadio(): Radio;
        getGeneralSettings(): GeneralSettings;
        getAmmo(): Ammo[];
        getContacts(): Contact[];
        getActivePath(): LatLng[];
        getIsLeader(): boolean;
        static getConstructor(type: string): typeof GroundUnit | undefined;
        constructor(ID: number);
        getCategory(): string;
        /********************** Unit data *************************/
        setData(dataExtractor: DataExtractor): void;
        drawLines(): void;
        getData(): UnitData;
        getMarkerCategory(): string;
        getDatabase(): UnitDatabase | null;
        getIconOptions(): ObjectIconOptions;
        setAlive(newAlive: boolean): void;
        setSelected(selected: boolean): void;
        getSelected(): boolean;
        setSelectable(selectable: boolean): void;
        getSelectable(): boolean;
        setHotgroup(hotgroup: number | null): void;
        getHotgroup(): number | null;
        setHighlighted(highlighted: boolean): void;
        getHighlighted(): boolean;
        getGroupMembers(): Unit[];
        belongsToCommandedCoalition(): boolean;
        getType(): string;
        getSpawnPoints(): number | undefined;
        /********************** Icon *************************/
        createIcon(): void;
        /********************** Visibility *************************/
        updateVisibility(): void;
        setHidden(hidden: boolean): void;
        getHidden(): boolean;
        setDetectionMethods(newDetectionMethods: number[]): void;
        getDetectionMethods(): number[];
        getLeader(): Unit | null;
        canFulfillRole(roles: string | string[]): boolean;
        isInViewport(): boolean;
        /********************** Unit commands *************************/
        addDestination(latlng: L.LatLng): void;
        clearDestinations(): void;
        attackUnit(targetID: number): void;
        followUnit(targetID: number, offset: {
            "x": number;
            "y": number;
            "z": number;
        }): void;
        landAt(latlng: LatLng): void;
        changeSpeed(speedChange: string): void;
        changeAltitude(altitudeChange: string): void;
        setSpeed(speed: number): void;
        setSpeedType(speedType: string): void;
        setAltitude(altitude: number): void;
        setAltitudeType(altitudeType: string): void;
        setROE(ROE: string): void;
        setReactionToThreat(reactionToThreat: string): void;
        setEmissionsCountermeasures(emissionCountermeasure: string): void;
        setOnOff(onOff: boolean): void;
        setFollowRoads(followRoads: boolean): void;
        delete(explosion: boolean, immediate: boolean): void;
        refuel(): void;
        setAdvancedOptions(isTanker: boolean, isAWACS: boolean, TACAN: TACAN, radio: Radio, generalSettings: GeneralSettings): void;
        bombPoint(latlng: LatLng): void;
        carpetBomb(latlng: LatLng): void;
        bombBuilding(latlng: LatLng): void;
        fireAtArea(latlng: LatLng): void;
        simulateFireFight(latlng: LatLng, groundElevation: number | null): void;
        /***********************************************/
        onAdd(map: Map): this;
    }
    export class AirUnit extends Unit {
        getIconOptions(): {
            showState: boolean;
            showVvi: boolean;
            showHotgroup: boolean;
            showUnitIcon: boolean;
            showShortLabel: boolean;
            showFuel: boolean;
            showAmmo: boolean;
            showSummary: boolean;
            showCallsign: boolean;
            rotateToHeading: boolean;
        };
    }
    export class Aircraft extends AirUnit {
        constructor(ID: number);
        getCategory(): string;
    }
    export class Helicopter extends AirUnit {
        constructor(ID: number);
        getCategory(): string;
    }
    export class GroundUnit extends Unit {
        constructor(ID: number);
        getIconOptions(): {
            showState: boolean;
            showVvi: boolean;
            showHotgroup: boolean;
            showUnitIcon: boolean;
            showShortLabel: boolean;
            showFuel: boolean;
            showAmmo: boolean;
            showSummary: boolean;
            showCallsign: boolean;
            rotateToHeading: boolean;
        };
        getCategory(): string;
        getType(): string;
    }
    export class NavyUnit extends Unit {
        constructor(ID: number);
        getIconOptions(): {
            showState: boolean;
            showVvi: boolean;
            showHotgroup: boolean;
            showUnitIcon: boolean;
            showShortLabel: boolean;
            showFuel: boolean;
            showAmmo: boolean;
            showSummary: boolean;
            showCallsign: boolean;
            rotateToHeading: boolean;
        };
        getMarkerCategory(): string;
        getCategory(): string;
        getType(): string;
    }
}
declare module "contextmenus/airbasecontextmenu" {
    import { Airbase } from "mission/airbase";
    import { ContextMenu } from "contextmenus/contextmenu";
    /** This context menu is shown to the user when the airbase marker is right clicked on the map.
     * It allows the user to inspect information about the airbase, as well as allowing to spawn units from the airbase itself and land units on it. */
    export class AirbaseContextMenu extends ContextMenu {
        #private;
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        /** Sets the airbase for which data will be shown in the context menu
         *
         * @param airbase The airbase for which data will be shown in the context menu. Note: the airbase must be present in the public/databases/airbases/<theatre>.json database.
         */
        setAirbase(airbase: Airbase): void;
    }
}
declare module "map/markers/destinationpreviewmarker" {
    import { LatLngExpression, MarkerOptions } from "leaflet";
    import { CustomMarker } from "map/markers/custommarker";
    export class DestinationPreviewMarker extends CustomMarker {
        constructor(latlng: LatLngExpression, options?: MarkerOptions);
        createIcon(): void;
    }
}
declare module "map/markers/temporaryunitmarker" {
    import { CustomMarker } from "map/markers/custommarker";
    import { LatLng } from "leaflet";
    export class TemporaryUnitMarker extends CustomMarker {
        #private;
        constructor(latlng: LatLng, name: string, coalition: string, commandHash?: string);
        setCommandHash(commandHash: string): void;
        createIcon(): void;
    }
}
declare module "map/clickableminimap" {
    import { MiniMap, MiniMapOptions } from "leaflet-control-mini-map";
    export class ClickableMiniMap extends MiniMap {
        constructor(layer: L.TileLayer | L.LayerGroup, options?: MiniMapOptions);
        getMap(): any;
    }
}
declare module "contextmenus/coalitionareacontextmenu" {
    import { LatLng } from "leaflet";
    import { CoalitionArea } from "map/coalitionarea/coalitionarea";
    import { ContextMenu } from "contextmenus/contextmenu";
    /** This context menu allows the user to edit or delete a CoalitionArea. Moreover, it allows the user to create a IADS automatically using the CoalitionArea as bounds. */
    export class CoalitionAreaContextMenu extends ContextMenu {
        #private;
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        /**
         *
         * @param x X screen coordinate of the top left corner of the context menu
         * @param y Y screen coordinate of the top left corner of the context menu
         * @param latlng Leaflet latlng object of the mouse click
         */
        show(x: number, y: number, latlng: LatLng): void;
        /** Set the CoalitionArea object the user will be able to edit using this menu
         *
         * @param coalitionArea The CoalitionArea object to edit
         */
        setCoalitionArea(coalitionArea: CoalitionArea): void;
        /** Get the CoalitionArea object the contextmenu is editing
         *
         * @returns The CoalitionArea the contextmenu is editing
         */
        getCoalitionArea(): CoalitionArea | null;
    }
}
declare module "map/coalitionarea/drawingcursor" {
    import { CustomMarker } from "map/markers/custommarker";
    export class DrawingCursor extends CustomMarker {
        constructor();
        createIcon(): void;
    }
}
declare module "contextmenus/airbasespawnmenu" {
    import { ContextMenu } from "contextmenus/contextmenu";
    import { Airbase } from "mission/airbase";
    /** This context menu is shown when the user wants to spawn a new aircraft or helicopter from the ground at an airbase.
     * It is shown by clicking on the "spawn" button of a AirbaseContextMenu. */
    export class AirbaseSpawnContextMenu extends ContextMenu {
        #private;
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        /** Show the context menu
         *
         * @param x X screen coordinate of the top left corner of the context menu
         * @param y Y screen coordinate of the top left corner of the context menu
         */
        show(x: number, y: number): void;
        /** Sets the airbase at which the new unit will be spawned
         *
         * @param airbase The airbase at which the new unit will be spawned. Note: if the airbase has no suitable parking spots, the airplane may be spawned on the runway, or spawning may fail.
         */
        setAirbase(airbase: Airbase): void;
    }
}
declare module "other/manager" {
    export class Manager {
        #private;
        constructor();
        add(name: string, item: any): this;
        get(name: string): any;
        getAll(): {
            [key: string]: any;
        };
    }
}
declare module "other/eventsmanager" {
    import { Manager } from "other/manager";
    export abstract class EventsManager extends Manager {
        constructor();
    }
}
declare module "panels/paneleventsmanager" {
    import { Listener } from "interfaces";
    import { EventsManager } from "other/eventsmanager";
    export class PanelEventsManager extends EventsManager {
        constructor();
        on(eventName: string, listener: Listener): void;
        trigger(eventName: string, contextData: object): void;
    }
}
declare module "panels/panel" {
    import { PanelEventsManager } from "panels/paneleventsmanager";
    export abstract class Panel {
        #private;
        constructor(ID: string);
        show(): void;
        hide(): void;
        toggle(): void;
        getElement(): HTMLElement;
        getVisible(): boolean;
        getEventsManager(): PanelEventsManager;
    }
}
declare module "popups/popup" {
    import { Panel } from "panels/panel";
    export class PopupMessage {
        #private;
        constructor(text: string, fateTime: number);
        getElement(): HTMLDivElement;
    }
    export class Popup extends Panel {
        #private;
        constructor(ID: string, stackAfter?: number);
        setFadeTime(fadeTime: number): void;
        setText(text: string): void;
    }
}
declare module "map/touchboxselect" {
    export var TouchBoxSelect: (new (...args: any[]) => any) & typeof import("leaflet").Class;
}
declare module "map/map" {
    import * as L from "leaflet";
    import { MapContextMenu } from "contextmenus/mapcontextmenu";
    import { UnitContextMenu } from "contextmenus/unitcontextmenu";
    import { AirbaseContextMenu } from "contextmenus/airbasecontextmenu";
    import { Airbase } from "mission/airbase";
    import { Unit } from "unit/unit";
    import { TemporaryUnitMarker } from "map/markers/temporaryunitmarker";
    import { CoalitionArea } from "map/coalitionarea/coalitionarea";
    import { CoalitionAreaContextMenu } from "contextmenus/coalitionareacontextmenu";
    import { AirbaseSpawnContextMenu } from "contextmenus/airbasespawnmenu";
    export class Map extends L.Map {
        #private;
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        addVisibilityOption(option: string, defaultValue: boolean): void;
        setLayer(layerName: string): void;
        getLayers(): string[];
        setState(state: string): void;
        getState(): string;
        deselectAllCoalitionAreas(): void;
        deleteCoalitionArea(coalitionArea: CoalitionArea): void;
        setHiddenType(key: string, value: boolean): void;
        getHiddenTypes(): string[];
        hideAllContextMenus(): void;
        showMapContextMenu(x: number, y: number, latlng: L.LatLng): void;
        hideMapContextMenu(): void;
        getMapContextMenu(): MapContextMenu;
        showUnitContextMenu(x: number, y: number, latlng: L.LatLng): void;
        getUnitContextMenu(): UnitContextMenu;
        hideUnitContextMenu(): void;
        showAirbaseContextMenu(x: number, y: number, latlng: L.LatLng, airbase: Airbase): void;
        getAirbaseContextMenu(): AirbaseContextMenu;
        hideAirbaseContextMenu(): void;
        showAirbaseSpawnMenu(x: number, y: number, latlng: L.LatLng, airbase: Airbase): void;
        getAirbaseSpawnMenu(): AirbaseSpawnContextMenu;
        hideAirbaseSpawnMenu(): void;
        showCoalitionAreaContextMenu(x: number, y: number, latlng: L.LatLng, coalitionArea: CoalitionArea): void;
        getCoalitionAreaContextMenu(): CoalitionAreaContextMenu;
        hideCoalitionAreaContextMenu(): void;
        isZooming(): boolean;
        getMousePosition(): L.Point;
        getMouseCoordinates(): L.LatLng;
        spawnFromAirbase(e: any): void;
        centerOnUnit(ID: number | null): void;
        getCenterUnit(): Unit | null;
        setTheatre(theatre: string): void;
        getMiniMapLayerGroup(): L.LayerGroup<any>;
        handleMapPanning(e: any): void;
        addTemporaryMarker(latlng: L.LatLng, name: string, coalition: string, commandHash?: string): TemporaryUnitMarker;
        getSelectedCoalitionArea(): CoalitionArea | undefined;
        bringCoalitionAreaToBack(coalitionArea: CoalitionArea): void;
        getVisibilityOptions(): {
            [key: string]: boolean;
        };
    }
}
declare module "mission/bullseye" {
    import { CustomMarker } from "map/markers/custommarker";
    export class Bullseye extends CustomMarker {
        #private;
        createIcon(): void;
        setCoalition(coalition: string): void;
        getCoalition(): string;
    }
}
declare module "mission/missionmanager" {
    import { Airbase } from "mission/airbase";
    import { Bullseye } from "mission/bullseye";
    import { AirbasesData, BullseyesData, CommandModeOptions, DateAndTime, MissionData } from "interfaces";
    /** The MissionManager  */
    export class MissionManager {
        #private;
        constructor();
        updateBullseyes(data: BullseyesData): void;
        updateAirbases(data: AirbasesData): void;
        updateMission(data: MissionData): void;
        getBullseyes(): {
            [name: string]: Bullseye;
        };
        getAirbases(): {
            [name: string]: Airbase;
        };
        getCommandModeOptions(): CommandModeOptions;
        getDateAndTime(): DateAndTime;
        getRemainingSetupTime(): number;
        getCoalitions(): {
            red: string[];
            blue: string[];
        };
        getAvailableSpawnPoints(): number;
        getCommandedCoalition(): "blue" | "red" | "all";
        refreshSpawnPoints(): void;
        setSpentSpawnPoints(spawnPoints: number): void;
        showCommandModeDialog(): void;
    }
}
declare module "panels/connectionstatuspanel" {
    import { Panel } from "panels/panel";
    export class ConnectionStatusPanel extends Panel {
        constructor(ID: string);
        update(connected: boolean): void;
    }
}
declare module "panels/hotgrouppanel" {
    import { Panel } from "panels/panel";
    export class HotgroupPanel extends Panel {
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        refreshHotgroups(): void;
        addHotgroup(hotgroup: number): void;
        removeHotgroup(hotgroup: number): void;
    }
}
declare module "panels/mouseinfopanel" {
    import { Panel } from "panels/panel";
    export class MouseInfoPanel extends Panel {
        #private;
        constructor(ID: string);
    }
}
declare module "panels/logpanel" {
    import { Panel } from "panels/panel";
    export class LogPanel extends Panel {
        #private;
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        show(): void;
        appendLogs(logs: {
            [key: string]: string;
        }): void;
        appendLog(log: string): void;
    }
}
declare module "panels/serverstatuspanel" {
    import { Panel } from "panels/panel";
    export class ServerStatusPanel extends Panel {
        constructor(ID: string);
        update(frameRate: number, load: number): void;
    }
}
declare module "panels/unitcontrolpanel" {
    import { Panel } from "panels/panel";
    export class UnitControlPanel extends Panel {
        #private;
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        show(): void;
        addButtons(): void;
        update(): void;
    }
}
declare module "panels/unitinfopanel" {
    import { Panel } from "panels/panel";
    export class UnitInfoPanel extends Panel {
        #private;
        constructor(ID: string);
    }
}
declare module "plugin/pluginmanager" {
    import { Manager } from "other/manager";
    /** The plugins manager is responsible for loading and initializing all the plugins. Plugins are located in the public/plugins folder.
     * Each plugin must be comprised of a single folder containing a index.js file. Each plugin must set the globalThis.getOlympusPlugin variable to
     * return a valid class implementing the OlympusPlugin interface.
      */
    export class PluginsManager extends Manager {
        #private;
        constructor();
    }
}
declare module "shortcut/shortcut" {
    import { KeyboardShortcutOptions, MouseShortcutOptions, ShortcutOptions } from "interfaces";
    export abstract class Shortcut {
        #private;
        constructor(config: ShortcutOptions);
        getConfig(): ShortcutOptions;
    }
    export class ShortcutKeyboard extends Shortcut {
        constructor(config: KeyboardShortcutOptions);
    }
    export class ShortcutMouse extends Shortcut {
        constructor(config: MouseShortcutOptions);
    }
}
declare module "shortcut/shortcutmanager" {
    import { Manager } from "other/manager";
    import { Shortcut } from "shortcut/shortcut";
    export class ShortcutManager extends Manager {
        #private;
        constructor();
        add(name: string, shortcut: Shortcut): this;
        getKeysBeingHeld(): string[];
        keyComboMatches(combo: string[]): boolean;
        onKeyDown(callback: CallableFunction): void;
        onKeyUp(callback: CallableFunction): void;
    }
}
declare module "toolbars/toolbar" {
    export class Toolbar {
        #private;
        /**
         *
         * @param ID - the ID of the HTML element which will contain the context menu
         */
        constructor(ID: string);
        show(): void;
        hide(): void;
        toggle(): void;
        getElement(): HTMLElement;
        getVisible(): boolean;
    }
}
declare module "toolbars/commandmodetoolbar" {
    import { Toolbar } from "toolbars/toolbar";
    export class CommandModeToolbar extends Toolbar {
    }
}
declare module "toolbars/primarytoolbar" {
    import { Dropdown } from "controls/dropdown";
    import { Toolbar } from "toolbars/toolbar";
    export class PrimaryToolbar extends Toolbar {
        #private;
        constructor(ID: string);
        getMainDropdown(): Dropdown;
    }
}
declare module "unit/citiesDatabase" {
    export var citiesDatabase: {
        lat: number;
        lng: number;
        pop: number;
    }[];
}
declare module "unit/unitsmanager" {
    import { LatLng, LatLngBounds } from "leaflet";
    import { Unit } from "unit/unit";
    import { CoalitionArea } from "map/coalitionarea/coalitionarea";
    import { UnitSpawnTable } from "interfaces";
    /** The UnitsManager handles the creation, update, and control of units. Data is strictly updated by the server ONLY. This means that any interaction from the user will always and only
     * result in a command to the server, executed by means of a REST PUT request. Any subsequent change in data will be reflected only when the new data is sent back by the server. This strategy allows
     * to avoid client/server and client/client inconsistencies.
     */
    export class UnitsManager {
        #private;
        constructor();
        /**
         *
         * @returns All the existing units, both alive and dead
         */
        getUnits(): {
            [ID: number]: Unit;
        };
        /** Get a specific unit by ID
         *
         * @param ID ID of the unit. The ID shall be the same as the unit ID in DCS.
         * @returns Unit object, or null if no unit with said ID exists.
         */
        getUnitByID(ID: number): Unit | null;
        /** Returns all the units that belong to a hotgroup
         *
         * @param hotgroup Hotgroup number
         * @returns Array of units that belong to hotgroup
         */
        getUnitsByHotgroup(hotgroup: number): Unit[];
        /** Add a new unit to the manager
         *
         * @param ID ID of the new unit
         * @param category Either "Aircraft", "Helicopter", "GroundUnit", or "NavyUnit". Determines what class will be used to create the new unit accordingly.
         */
        addUnit(ID: number, category: string): void;
        /** Update the data of all the units. The data is directly decoded from the binary buffer received from the REST Server. This is necessary for performance and bandwidth reasons.
         *
         * @param buffer The arraybuffer, encoded according to the ICD defined in: TODO Add reference to ICD
         * @returns The decoded updateTime of the data update.
         */
        update(buffer: ArrayBuffer): number;
        /** Set a unit as "selected", which will allow to perform operations on it, like giving it a destination, setting it to attack a target, and so on
         *
         * @param ID The ID of the unit to select
         * @param deselectAllUnits If true, the unit will be the only selected unit
         */
        selectUnit(ID: number, deselectAllUnits?: boolean): void;
        /** Select all visible units inside a bounding rectangle
         *
         * @param bounds Leaflet bounds object defining the selection area
         */
        selectFromBounds(bounds: LatLngBounds): void;
        /** Select units by hotgroup. A hotgroup can be created to quickly select multiple units using keyboard bindings
         *
         * @param hotgroup The hotgroup number
         */
        selectUnitsByHotgroup(hotgroup: number): void;
        /** Get all the currently selected units
         *
         * @param options Selection options
         * @returns Array of selected units
         */
        getSelectedUnits(options?: {
            excludeHumans?: boolean;
            onlyOnePerGroup?: boolean;
        }): Unit[];
        /** Deselects all currently selected units
         *
         */
        deselectAllUnits(): void;
        /** Deselect a specific unit
         *
         * @param ID ID of the unit to deselect
         */
        deselectUnit(ID: number): void;
        /** This function allows to quickly determine the categories (Aircraft, Helicopter, GroundUnit, NavyUnit) of an array units. This allows to enable/disable specific controls which can only be applied
         * to specific categories.
         *
         * @param units Array of units of which to retrieve the categories
         * @returns Array of categories. Each category is present only once.
         */
        getUnitsCategories(units: Unit[]): string[];
        /**  This function returns the value of a variable for each of the units in the input array. If all the units have the same value, returns the value, else returns undefined. This function is useful to
         * present units data in the control panel, which will print a specific value only if it is the same for all the units. If the values are different, the control panel will show a "mixed values" value, or similar.
         *
         * @param variableGetter CallableFunction that returns the requested variable. Example: getUnitsVariable((unit: Unit) => unit.getName(), foo) will return a string value if all the units have the same name, otherwise it will return undefined.
         * @param units Array of units of which to retrieve the variable
         * @returns The value of the variable if all units have the same value, else undefined
         */
        getUnitsVariable(variableGetter: CallableFunction, units: Unit[]): any;
        /** For a given unit, it returns if and how it is being detected by other units. NOTE: this function will return how a unit is being detected, i.e. how other units are detecting it. It will not return
         * what the unit is detecting.
         *
         * @param unit The unit of which to retrieve the "detected" methods.
         * @returns Array of detection methods
         */
        getUnitDetectedMethods(unit: Unit): number[];
        /*********************** Unit actions on selected units ************************/
        /** Give a new destination to the selected units
         *
         * @param latlng Position of the new destination
         * @param mantainRelativePosition If true, the selected units will mantain their relative positions when reaching the target. This is useful to maintain a formation for groun/navy units
         * @param rotation Rotation in radians by which the formation will be rigidly rotated. E.g. a ( V ) formation will look like this ( < ) if rotated pi/4 radians (90 degrees)
         */
        selectedUnitsAddDestination(latlng: L.LatLng, mantainRelativePosition: boolean, rotation: number): void;
        /** Clear the destinations of all the selected units
         *
         */
        selectedUnitsClearDestinations(): void;
        /** Instruct all the selected units to land at a specific location
         *
         * @param latlng Location where to land at
         */
        selectedUnitsLandAt(latlng: LatLng): void;
        /** Instruct all the selected units to change their speed
         *
         * @param speedChange Speed change, either "stop", "slow", or "fast". The specific value depends on the unit category
         */
        selectedUnitsChangeSpeed(speedChange: string): void;
        /** Instruct all the selected units to change their altitude
         *
         * @param altitudeChange Altitude change, either "climb" or "descend". The specific value depends on the unit category
         */
        selectedUnitsChangeAltitude(altitudeChange: string): void;
        /** Set a specific speed to all the selected units
         *
         * @param speed Value to set, in m/s
         */
        selectedUnitsSetSpeed(speed: number): void;
        /** Set a specific speed type to all the selected units
         *
         * @param speedType Value to set, either "CAS" or "GS". If "CAS" is selected, the unit will try to maintain the selected Calibrated Air Speed, but DCS will still only maintain a Ground Speed value so errors may arise depending on wind.
         */
        selectedUnitsSetSpeedType(speedType: string): void;
        /** Set a specific altitude to all the selected units
         *
         * @param altitude Value to set, in m
         */
        selectedUnitsSetAltitude(altitude: number): void;
        /** Set a specific altitude type to all the selected units
         *
         * @param altitudeType Value to set, either "ASL" or "AGL". If "AGL" is selected, the unit will try to maintain the selected Above Ground Level altitude. Due to a DCS bug, this will only be true at the final position.
         */
        selectedUnitsSetAltitudeType(altitudeType: string): void;
        /** Set a specific ROE to all the selected units
         *
         * @param ROE Value to set, see constants for acceptable values
         */
        selectedUnitsSetROE(ROE: string): void;
        /** Set a specific reaction to threat to all the selected units
         *
         * @param reactionToThreat Value to set, see constants for acceptable values
         */
        selectedUnitsSetReactionToThreat(reactionToThreat: string): void;
        /** Set a specific emissions & countermeasures to all the selected units
         *
         * @param emissionCountermeasure Value to set, see constants for acceptable values
         */
        selectedUnitsSetEmissionsCountermeasures(emissionCountermeasure: string): void;
        /** Turn selected units on or off, only works on ground and navy units
         *
         * @param onOff If true, the unit will be turned on
         */
        selectedUnitsSetOnOff(onOff: boolean): void;
        /** Instruct the selected units to follow roads, only works on ground units
         *
         * @param followRoads If true, units will follow roads
         */
        selectedUnitsSetFollowRoads(followRoads: boolean): void;
        /** Instruct units to attack a specific unit
         *
         * @param ID ID of the unit to attack
         */
        selectedUnitsAttackUnit(ID: number): void;
        /** Instruct units to refuel at the nearest tanker, if possible. Else units will RTB
         *
         */
        selectedUnitsRefuel(): void;
        /** Instruct the selected units to follow another unit in a formation. Only works for aircrafts and helicopters.
         *
         * @param ID ID of the unit to follow
         * @param offset Optional parameter, defines a static offset. X: front-rear, positive front, Y: top-bottom, positive top, Z: left-right, positive right
         * @param formation Optional parameter, defines a predefined formation type. Values are: "trail", "echelon-lh", "echelon-rh", "line-abreast-lh", "line-abreast-rh", "front", "diamond"
         */
        selectedUnitsFollowUnit(ID: number, offset?: {
            "x": number;
            "y": number;
            "z": number;
        }, formation?: string): void;
        /** Instruct the selected units to perform precision bombing of specific coordinates
         *
         * @param latlng Location to bomb
         */
        selectedUnitsBombPoint(latlng: LatLng): void;
        /** Instruct the selected units to perform carpet bombing of specific coordinates
         *
         * @param latlng Location to bomb
         */
        selectedUnitsCarpetBomb(latlng: LatLng): void;
        /** Instruct the selected units to fire at specific coordinates
         *
         * @param latlng Location to fire at
         */
        selectedUnitsFireAtArea(latlng: LatLng): void;
        /** Instruct the selected units to simulate a fire fight at specific coordinates
         *
         * @param latlng Location to fire at
         */
        selectedUnitsSimulateFireFight(latlng: LatLng): void;
        /*********************** Control operations on selected units ************************/
        /**  See getUnitsCategories for more info
         *
         * @returns Category array of the selected units.
         */
        getSelectedUnitsCategories(): string[];
        /**  See getUnitsVariable for more info
         *
         * @param variableGetter CallableFunction that returns the requested variable. Example: getUnitsVariable((unit: Unit) => unit.getName(), foo) will return a string value if all the units have the same name, otherwise it will return undefined.
         * @returns The value of the variable if all units have the same value, else undefined
         */
        getSelectedUnitsVariable(variableGetter: CallableFunction): any;
        /** Groups the selected units in a single (DCS) group, if all the units have the same category
         *
         */
        selectedUnitsCreateGroup(): void;
        /** Set the hotgroup for the selected units. It will be the only hotgroup of the unit
         *
         * @param hotgroup Hotgroup number
         */
        selectedUnitsSetHotgroup(hotgroup: number): void;
        /** Add the selected units to a hotgroup. Units can be in multiple hotgroups at the same type
         *
         * @param hotgroup Hotgroup number
         */
        selectedUnitsAddToHotgroup(hotgroup: number): void;
        /** Delete the selected units
         *
         * @param explosion If true, the unit will be deleted using an explosion
         * @returns
         */
        selectedUnitsDelete(explosion?: boolean): void;
        /** Compute the destinations of every unit in the selected units. This function preserves the relative positions of the units, and rotates the whole formation by rotation.
         *
         * @param latlng Center of the group after the translation
         * @param rotation Rotation of the group, in radians
         * @returns Array of positions for each unit, in order
         */
        selectedUnitsComputeGroupDestination(latlng: LatLng, rotation: number): {
            [key: number]: LatLng;
        };
        /** Copy the selected units and store their properties in memory
         *
         */
        selectedUnitsCopy(): void;
        /*********************** Unit manipulation functions  ************************/
        /** Paste the copied units
         *
         * @returns True if units were pasted successfully
         */
        pasteUnits(): false | undefined;
        /** Automatically create an Integrated Air Defence System from a CoalitionArea object. The units will be mostly focused around big cities. The bigger the city, the larger the amount of units created next to it.
         * If the CoalitionArea does not contain any city, no units will be created
         *
         * @param coalitionArea Boundaries of the IADS
         * @param types Array of unit types to add to the IADS, e.g. AAA, SAM, flak, MANPADS
         * @param eras Array of eras to which the units added to the IADS can belong
         * @param ranges Array of weapon ranges the units can have
         * @param density Value between 0 and 100, controls the amout of units created
         * @param distribution Value between 0 and 100, controls how "scattered" the units will be
         */
        createIADS(coalitionArea: CoalitionArea, types: {
            [key: string]: boolean;
        }, eras: {
            [key: string]: boolean;
        }, ranges: {
            [key: string]: boolean;
        }, density: number, distribution: number): void;
        /** Export all the ground and navy units to file. Does not work on Aircraft and Helicopter units.
         *  TODO: Extend to aircraft and helicopters
         */
        exportToFile(): void;
        /** Import ground and navy units from file
         * TODO: extend to support aircraft and helicopters
         */
        importFromFile(): void;
        /** Spawn a new group of units
         *
         * @param category Category of the new units
         * @param units Array of unit tables
         * @param coalition Coalition to which the new units will belong
         * @param immediate If true the command will be performed immediately, but this may cause lag on the server
         * @param airbase If true, the location of the units will be ignored and the units will spawn at the given airbase. Only works for aircrafts and helicopters
         * @param country Set the country of the units. If empty string, the country will be assigned automatically
         * @param callback CallableFunction called when the command is received by the server
         * @returns True if the spawn command was successfully sent
         */
        spawnUnits(category: string, units: UnitSpawnTable[], coalition?: string, immediate?: boolean, airbase?: string, country?: string, callback?: CallableFunction): boolean;
    }
}
declare module "weapon/weaponsmanager" {
    import { Weapon } from "weapon/weapon";
    /** The WeaponsManager handles the creation and update of weapons. Data is strictly updated by the server ONLY. */
    export class WeaponsManager {
        #private;
        constructor();
        /**
         *
         * @returns All the existing weapons, both active and destroyed
         */
        getWeapons(): {
            [ID: number]: Weapon;
        };
        /** Get a weapon by ID
         *
         * @param ID ID of the weapon
         * @returns Weapon object, or null if input ID does not exist
         */
        getWeaponByID(ID: number): Weapon | null;
        /** Add a new weapon to the manager
         *
         * @param ID ID of the new weapon
         * @param category Either "Missile" or "Bomb". Determines what class will be used to create the new unit accordingly.
         */
        addWeapon(ID: number, category: string): void;
        /** Update the data of all the weapons. The data is directly decoded from the binary buffer received from the REST Server. This is necessary for performance and bandwidth reasons.
         *
         * @param buffer The arraybuffer, encoded according to the ICD defined in: TODO Add reference to ICD
         * @returns The decoded updateTime of the data update.
         */
        update(buffer: ArrayBuffer): number;
        /** For a given weapon, it returns if and how it is being detected by other units. NOTE: this function will return how a weapon is being detected, i.e. how other units are detecting it. It will not return
         * what the weapon is detecting (mostly because weapons can't detect units).
         *
         * @param weapon The unit of which to retrieve the "detected" methods.
         * @returns Array of detection methods
         */
        getWeaponDetectedMethods(weapon: Weapon): number[];
    }
}
declare module "server/servermanager" {
    import { LatLng } from 'leaflet';
    import { GeneralSettings, Radio, ServerRequestOptions, TACAN } from "interfaces";
    export class ServerManager {
        #private;
        constructor();
        toggleDemoEnabled(): void;
        setCredentials(newUsername: string, newPassword: string): void;
        GET(callback: CallableFunction, uri: string, options?: ServerRequestOptions, responseType?: string): void;
        PUT(request: object, callback: CallableFunction): void;
        getConfig(callback: CallableFunction): void;
        setAddress(address: string, port: number): void;
        getAirbases(callback: CallableFunction): void;
        getBullseye(callback: CallableFunction): void;
        getLogs(callback: CallableFunction, refresh?: boolean): void;
        getMission(callback: CallableFunction): void;
        getUnits(callback: CallableFunction, refresh?: boolean): void;
        getWeapons(callback: CallableFunction, refresh?: boolean): void;
        isCommandExecuted(callback: CallableFunction, commandHash: string): void;
        addDestination(ID: number, path: any, callback?: CallableFunction): void;
        spawnSmoke(color: string, latlng: LatLng, callback?: CallableFunction): void;
        spawnExplosion(intensity: number, latlng: LatLng, callback?: CallableFunction): void;
        spawnAircrafts(units: any, coalition: string, airbaseName: string, country: string, immediate: boolean, spawnPoints: number, callback?: CallableFunction): void;
        spawnHelicopters(units: any, coalition: string, airbaseName: string, country: string, immediate: boolean, spawnPoints: number, callback?: CallableFunction): void;
        spawnGroundUnits(units: any, coalition: string, country: string, immediate: boolean, spawnPoints: number, callback?: CallableFunction): void;
        spawnNavyUnits(units: any, coalition: string, country: string, immediate: boolean, spawnPoints: number, callback?: CallableFunction): void;
        attackUnit(ID: number, targetID: number, callback?: CallableFunction): void;
        followUnit(ID: number, targetID: number, offset: {
            "x": number;
            "y": number;
            "z": number;
        }, callback?: CallableFunction): void;
        cloneUnits(units: {
            ID: number;
            location: LatLng;
        }[], deleteOriginal: boolean, spawnPoints: number, callback?: CallableFunction): void;
        deleteUnit(ID: number, explosion: boolean, immediate: boolean, callback?: CallableFunction): void;
        landAt(ID: number, latlng: LatLng, callback?: CallableFunction): void;
        changeSpeed(ID: number, speedChange: string, callback?: CallableFunction): void;
        setSpeed(ID: number, speed: number, callback?: CallableFunction): void;
        setSpeedType(ID: number, speedType: string, callback?: CallableFunction): void;
        changeAltitude(ID: number, altitudeChange: string, callback?: CallableFunction): void;
        setAltitudeType(ID: number, altitudeType: string, callback?: CallableFunction): void;
        setAltitude(ID: number, altitude: number, callback?: CallableFunction): void;
        createFormation(ID: number, isLeader: boolean, wingmenIDs: number[], callback?: CallableFunction): void;
        setROE(ID: number, ROE: string, callback?: CallableFunction): void;
        setReactionToThreat(ID: number, reactionToThreat: string, callback?: CallableFunction): void;
        setEmissionsCountermeasures(ID: number, emissionCountermeasure: string, callback?: CallableFunction): void;
        setOnOff(ID: number, onOff: boolean, callback?: CallableFunction): void;
        setFollowRoads(ID: number, followRoads: boolean, callback?: CallableFunction): void;
        refuel(ID: number, callback?: CallableFunction): void;
        bombPoint(ID: number, latlng: LatLng, callback?: CallableFunction): void;
        carpetBomb(ID: number, latlng: LatLng, callback?: CallableFunction): void;
        bombBuilding(ID: number, latlng: LatLng, callback?: CallableFunction): void;
        fireAtArea(ID: number, latlng: LatLng, callback?: CallableFunction): void;
        simulateFireFight(ID: number, latlng: LatLng, altitude: number, callback?: CallableFunction): void;
        setAdvacedOptions(ID: number, isTanker: boolean, isAWACS: boolean, TACAN: TACAN, radio: Radio, generalSettings: GeneralSettings, callback?: CallableFunction): void;
        setCommandModeOptions(restrictSpawns: boolean, restrictToCoalition: boolean, spawnPoints: {
            blue: number;
            red: number;
        }, eras: string[], setupTime: number, callback?: CallableFunction): void;
        startUpdate(): void;
        refreshAll(): void;
        checkSessionHash(newSessionHash: string): void;
        setConnected(newConnected: boolean): void;
        getConnected(): boolean;
        setPaused(newPaused: boolean): void;
        getPaused(): boolean;
    }
}
declare module "olympusapp" {
    import { Map } from "map/map";
    import { MissionManager } from "mission/missionmanager";
    import { PluginsManager } from "plugin/pluginmanager";
    import { ShortcutManager } from "shortcut/shortcutmanager";
    import { UnitsManager } from "unit/unitsmanager";
    import { WeaponsManager } from "weapon/weaponsmanager";
    import { Manager } from "other/manager";
    import { ServerManager } from "server/servermanager";
    export class OlympusApp {
        #private;
        constructor();
        getMap(): Map;
        getServerManager(): ServerManager;
        getPanelsManager(): Manager;
        getPopupsManager(): Manager;
        getToolbarsManager(): Manager;
        getShortcutManager(): ShortcutManager;
        getUnitsManager(): UnitsManager;
        getWeaponsManager(): WeaponsManager;
        getMissionManager(): MissionManager;
        getPluginsManager(): PluginsManager;
        /** Set the active coalition, i.e. the currently controlled coalition. A game master can change the active coalition, while a commander is bound to his/her coalition
         *
         * @param newActiveCoalition
         */
        setActiveCoalition(newActiveCoalition: string): void;
        /**
         *
         * @returns The active coalition
         */
        getActiveCoalition(): string;
        /**
         *
         * @returns The aircraft database
         */
        getAircraftDatabase(): import("unit/databases/aircraftdatabase").AircraftDatabase;
        /**
         *
         * @returns The helicopter database
         */
        getHelicopterDatabase(): import("unit/databases/helicopterdatabase").HelicopterDatabase;
        /**
         *
         * @returns The ground unit database
         */
        getGroundUnitDatabase(): import("unit/databases/groundunitdatabase").GroundUnitDatabase;
        /**
         *
         * @returns The navy unit database
         */
        getNavyUnitDatabase(): import("unit/databases/navyunitdatabase").NavyUnitDatabase;
        /** Set a message in the login splash screen
         *
         * @param status The message to show in the login splash screen
         */
        setLoginStatus(status: string): void;
        start(): void;
    }
}
declare module "index" {
    import { OlympusApp } from "olympusapp";
    export function getApp(): OlympusApp;
}

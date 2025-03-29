import { LatLng } from "leaflet";
import { AudioOptions, Coalition, MapOptions } from "./types/types";

export interface OlympusConfig {
  /* Set by user */
  frontend: {
    port: number;
    elevationProvider: {
      provider: string;
      username: string | null;
      password: string | null;
    };
    mapLayers: {
      [key: string]: {
        urlTemplate: string;
        minZoom: number;
        maxZoom: number;
        attribution?: string;
      };
    };
    mapMirrors: {
      [key: string]: string;
    };
    /* New with v2.0.0 */
    customAuthHeaders?: {
      enabled: boolean;
      username: string;
      group: string;
    };
    autoconnectWhenLocal?: boolean;
  };
  /* New with v2.0.0 */
  audio?: {
    SRSPort: number;
    WSPort?: number;
    WSEndpoint?: string;
  };
  controllers?: [{ type: string; coalition: Coalition; frequency: number; modulation: number; callsign: string }];
  profiles?: { [key: string]: ProfileOptions };

  /* Set by server */
  local?: boolean;
  authentication?: {
    // Only sent when in localhost mode for autologin
    gameMasterPassword: string;
    blueCommanderPassword: string;
    redCommanderPassword: string;
  };
}

export interface SessionData {
  radios?: { frequency: number; modulation: number; pan: number }[];
  fileSources?: { filename: string; volume: number }[];
  unitSinks?: { ID: number }[];
  connections?: any[];
  coalitionAreas?: (
    | { type: "circle"; label: string; latlng: { lat: number; lng: number }; radius: number; coalition: Coalition }
    | { type: "polygon"; label: string; latlngs: { lat: number; lng: number }[]; coalition: Coalition }
  )[];
  hotgroups?: { [key: string]: number[] };
  starredSpawns?: { [key: number]: SpawnRequestTable };
  drawings?: { [key: string]: { visibility: boolean; opacity: number; name: string; guid: string; containers: any; drawings: any } };
  navpoints?: { [key: string]: { visibility: boolean; opacity: number; name: string; guid: string; containers: any; drawings: any } };
  mapSource?: { id: string };
}

export interface ProfileOptions {
  mapOptions?: MapOptions;
  shortcuts?: { [key: string]: ShortcutOptions };
  audioOptions?: AudioOptions;
}

export interface ContextMenuOption {
  tooltip: string;
  src: string;
  callback: CallableFunction;
}

export interface AirbasesData {
  airbases: { [key: string]: any };
  sessionHash: string;
  time: number;
}

export interface BullseyesData {
  bullseyes: {
    [key: string]: { latitude: number; longitude: number; coalition: string };
  };
  sessionHash: string;
  time: number;
}

export interface SpotsData {
  spots: {
    [key: string]: { active: boolean; type: string; targetPosition: { lat: number; lng: number }; sourceUnitID: number; code?: number };
  };
  sessionHash: string;
  time: number;
}

export interface MissionData {
  mission: {
    theatre: string;
    dateAndTime: DateAndTime;
    commandModeOptions: CommandModeOptions;
    coalitions: { red: string[]; blue: string[] };
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
  date: { Year: number; Month: number; Day: number };
  time: { h: number; m: number; s: number };
  elapsedTime: number;
  startTime: number;
}

export interface LogData {
  logs: { [key: string]: string };
  sessionHash: string;
  time: number;
}

export interface ServerRequestOptions {
  time?: number;
  commandHash?: string;
}

export interface SpawnRequestTable {
  category: string;
  coalition: string;
  unit: UnitSpawnTable;
  amount: number;
  quickAccessName?: string;
}

export interface EffectRequestTable {
  type: string;
  explosionType?: string;
  smokeColor?: string;
}

export interface UnitSpawnTable {
  unitType: string;
  location: LatLng;
  skill: string;
  liveryID: string;
  altitude?: number;
  loadout?: string;
  heading?: number;
}

export interface ObjectIconOptions {
  showState: boolean;
  showVvi: boolean;
  showHealth: boolean;
  showHotgroup: boolean;
  showUnitIcon: boolean;
  showShortLabel: boolean;
  showFuel: boolean;
  showAmmo: boolean;
  showSummary: boolean;
  showCallsign: boolean;
  rotateToHeading: boolean;
  showCluster: boolean;
  showAlarmState: boolean;
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
  markerCategory: string;
  ID: number;
  alive: boolean;
  alarmState: AlarmState;
  human: boolean;
  controlled: boolean;
  coalition: string;
  country: number;
  name: string;
  unitName: string;
  callsign: string;
  groupName: string;
  state: string;
  task: string;
  hasTask: boolean;
  position: LatLng;
  speed: number;
  horizontalVelocity: number;
  verticalVelocity: number;
  heading: number;
  track: number;
  isActiveTanker: boolean;
  isActiveAWACS: boolean;
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
  operateAs: string;
  shotsScatter: number;
  shotsIntensity: number;
  health: number;
  racetrackLength: number;
  racetrackAnchor: LatLng;
  racetrackBearing: number;
  timeToNextTasking: number;
  barrelHeight: number;
  muzzleVelocity: number;
  aimTime: number;
  shotsToFire: number;
  shotsBaseInterval: number;
  shotsBaseScatter: number;
  engagementRange: number;
  targetingRange: number;
  aimMethodRange: number;
  acquisitionRange: number;
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
  enabled: boolean;
}

export interface UnitBlueprint {
  name: string;
  category: string;
  enabled: boolean;
  coalition: string;
  era: string;
  label: string;
  shortLabel: string;
  roles?: string[];
  type?: string;
  loadouts?: LoadoutBlueprint[];
  filename?: string;
  liveries?: { [key: string]: { name: string; countries: string[] } };
  cost?: number;
  barrelHeight?: number;
  muzzleVelocity?: number;
  aimTime?: number;
  shotsToFire?: number;
  shotsBaseInterval?: number;
  shotsBaseScatter?: number;
  description?: string;
  abilities?: string;
  tags?: string;
  acquisitionRange?: number;
  engagementRange?: number;
  targetingRange?: number;
  aimMethodRange?: number;
  alertnessTimeConstant?: number;
  canTargetPoint?: boolean;
  canRearm?: boolean;
  canAAA?: boolean;
  indirectFire?: boolean;
  markerFile?: string;
  unitWhenGrouped?: string;
  mainRole?: string;
  length?: number;
  carrierFilename?: string;
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

export interface ShortcutOptions {
  label: string;
  keyUpCallback: (e: KeyboardEvent) => void;
  keyDownCallback?: (e: KeyboardEvent) => void;
  code: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
}

export interface ServerStatus {
  frameRate: number;
  load: number;
  elapsedTime: number;
  missionTime: DateAndTime["time"];
  connected: boolean;
  paused: boolean;
}

export type DrawingPoint = {
  x: number;
  y: number;
};

export type PolygonPoints = DrawingPoint[] | DrawingPoint;

export type DrawingPrimitiveType = "TextBox" | "Polygon" | "Line" | "Icon";

export interface Drawing {
  name: string;
  visible: boolean;
  mapX: number;
  mapY: number;
  layerName: string;
  layer: string;
  primitiveType: DrawingPrimitiveType;
  colorString: string;
  fillColorString?: string;
  borderThickness?: number;
  fontSize?: number;
  font?: string;
  text?: string;
  angle?: number;
  radius?: number;
  points?: PolygonPoints;
  style?: string;
  polygonMode?: string;
  thickness?: number;
  width?: number;
  height?: number;
  closed?: boolean;
  lineMode?: string;
  hiddenOnPlanner?: boolean;
  file?: string;
  scale?: number;
}

export enum AlarmState {
  RED = 'red',
  GREEN = 'green',
  AUTO = 'auto'
}

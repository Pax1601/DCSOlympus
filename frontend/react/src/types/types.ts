/* Types definition */
export type MapMarkerVisibilityControl = {
  category?: string;
  image: string;
  isProtected?: boolean;
  name: string;
  protectable?: boolean;
  toggles: string[];
  tooltip: string;
};

export type MapOptions = {
  hideGroupMembers: boolean;
  hideUnitsShortRangeRings: boolean;
  showUnitContacts: boolean;
  showUnitPaths: boolean;
  showUnitTargets: boolean;
  showUnitLabels: boolean;
  showUnitsEngagementRings: boolean;
  showUnitsAcquisitionRings: boolean;
  showRacetracks: boolean;
  fillSelectedRing: boolean;
  showMinimap: boolean;
  protectDCSUnits: boolean;
  cameraPluginPort: number;
  cameraPluginRatio: number;
  cameraPluginEnabled: boolean;
  cameraPluginMode: string;
  AWACSMode: boolean;
  AWACSCoalition: Coalition;
  hideChromeWarning: boolean;
  hideSecureWarning: boolean;
  showMissionDrawings: boolean;
  clusterGroundUnits: boolean;
  showUnitCallsigns: boolean;
};

export type AudioOptions = {
  input: string;
  output: string;
}

export type MapHiddenTypes = {
  human: boolean;
  olympus: boolean;
  dcs: boolean;
  aircraft: boolean;
  helicopter: boolean;
  "groundunit-sam": boolean;
  groundunit: boolean;
  navyunit: boolean;
  airbase: boolean;
  dead: boolean;
  blue: boolean;
  red: boolean;
  neutral: boolean;
};

export type MGRS = {
  bandLetter: string;
  columnLetter: string;
  easting: string;
  groups: string[];
  northing: string;
  precision: number;
  rowLetter: string;
  string: string;
  zoneNumber: string;
};

export type Coalition = "blue" | "neutral" | "red" | "all";

export type SRSClientData = {
  name: string;
  unitID: number;
  iff: {
    control: number;
    mode1: number;
    mode2: number;
    mode3: number;
    mode4: boolean;
    mic: number;
    status: number;
  },
  coalition: number;
  radios: {
    frequency: number;
    modulation: number;
  }[];
};


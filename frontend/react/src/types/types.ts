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
  fillSelectedRing: boolean;
  showMinimap: boolean;
  protectDCSUnits: boolean;
};

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

export type Context = string;

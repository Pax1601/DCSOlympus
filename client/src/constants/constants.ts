import { LatLng, LatLngBounds, TileLayer, tileLayer } from "leaflet";

export const ROEs: string[] = ["Hold", "Return", "Designated", "Free"];
export const reactionsToThreat: string[] = ["None", "Manoeuvre", "Passive", "Evade"];
export const emissionsCountermeasures: string[] = ["Silent", "Attack", "Defend", "Free"];

export const ROEDescriptions: string[] = ["Hold (Never fire)", "Return (Only fire if fired upon)", "Designated (Attack the designated target only)", "Free (Attack anyone)"];
export const reactionsToThreatDescriptions: string[] = ["None (No reaction)", "Manoeuvre (no countermeasures)", "Passive (Countermeasures only, no manoeuvre)", "Evade (Countermeasures and manoeuvers)"];
export const emissionsCountermeasuresDescriptions: string[] = ["Silent (Radar OFF, no ECM)", "Attack (Radar only for targeting, ECM only if locked)", "Defend (Radar for searching, ECM if locked)", "Always on (Radar and ECM always on)"];

export const minSpeedValues: { [key: string]: number } = { Aircraft: 100, Helicopter: 0, NavyUnit: 0, GroundUnit: 0 };
export const maxSpeedValues: { [key: string]: number } = { Aircraft: 800, Helicopter: 300, NavyUnit: 60, GroundUnit: 60 };
export const speedIncrements: { [key: string]: number } = { Aircraft: 25, Helicopter: 10, NavyUnit: 5, GroundUnit: 5 };
export const minAltitudeValues: { [key: string]: number } = { Aircraft: 0, Helicopter: 0 };
export const maxAltitudeValues: { [key: string]: number } = { Aircraft: 50000, Helicopter: 10000 };
export const altitudeIncrements: { [key: string]: number } = { Aircraft: 500, Helicopter: 100 };

export const minimapBoundaries = [
    [    // NTTR
        new LatLng(39.7982463, -119.985425),
        new LatLng(34.4037128, -119.7806729),
        new LatLng(34.3483316, -112.4529351),
        new LatLng(39.7372411, -112.1130805),
        new LatLng(39.7982463, -119.985425)
    ],
    [   // Syria
        new LatLng(37.3630556, 29.2686111),
        new LatLng(31.8472222, 29.8975),
        new LatLng(32.1358333, 42.1502778),
        new LatLng(37.7177778, 42.3716667),
        new LatLng(37.3630556, 29.2686111)
    ],
    [   // Caucasus
        new LatLng(39.6170191, 27.634935),
        new LatLng(38.8735863, 47.1423108),
        new LatLng(47.3907982, 49.3101946),
        new LatLng(48.3955879, 26.7753625),
        new LatLng(39.6170191, 27.634935)
    ],
    [   // Persian Gulf
        new LatLng(32.9355285, 46.5623682),
        new LatLng(21.729393, 47.572675),
        new LatLng(21.8501348, 63.9734737),
        new LatLng(33.131584, 64.7313594),
        new LatLng(32.9355285, 46.5623682)
    ],
    [   // Marianas
        new LatLng(22.09, 135.0572222),
        new LatLng(10.5777778, 135.7477778),
        new LatLng(10.7725, 149.3918333),
        new LatLng(22.5127778, 149.5427778),
        new LatLng(22.09, 135.0572222)
    ]
];

export const mapBounds = {
    "Syria": { bounds: new LatLngBounds([31.8472222, 29.8975], [37.7177778, 42.3716667]), zoom: 5 },
    "MarianaIslands": { bounds: new LatLngBounds([10.5777778, 135.7477778], [22.5127778, 149.5427778]), zoom: 5 },
    "Nevada": { bounds: new LatLngBounds([34.4037128, -119.7806729], [39.7372411, -112.1130805]), zoom: 5 },
    "PersianGulf": { bounds: new LatLngBounds([21.729393, 47.572675], [33.131584, 64.7313594]), zoom: 5 },
    "Caucasus": { bounds: new LatLngBounds([39.6170191, 27.634935], [47.3907982, 49.3101946]), zoom: 4 },
    // TODO "Falklands"
}

export const layers = {
    "ArcGIS Satellite": {
        urlTemplate: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maxZoom: 20,
        minZoom: 1,
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    },
    "USGS Topo": {
        urlTemplate: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
        minZoom: 1,
        maxZoom: 20,
        attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
    },
    "OpenStreetMap Mapnik": {
        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        minZoom: 1,
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    "OPENVKarte": {
        urlTemplate: 'https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png',
        minZoom: 1,
        maxZoom: 18,
        attribution: 'Map <a href="https://memomaps.de/">memomaps.de</a> <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    "Esri.DeLorme": {
        urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/Specialty/DeLorme_World_Base_Map/MapServer/tile/{z}/{y}/{x}',
        minZoom: 1,
        maxZoom: 11,
        attribution: 'Tiles &copy; Esri &mdash; Copyright: &copy;2012 DeLorme',
    },
    "CyclOSM": {
        urlTemplate: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
        minZoom: 1,
        maxZoom: 20,
        attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
}

/* Map constants */
export const IDLE = "Idle";
export const MOVE_UNIT = "Move unit";
export const BOMBING = "Bombing";
export const CARPET_BOMBING = "Carpet bombing";
export const FIRE_AT_AREA = "Fire at area";
export const COALITIONAREA_DRAW_POLYGON = "Draw Coalition Area";
export const COALITIONAREA_INTERACT = "Interact with Coalition Areas"
export const visibilityControls: string[] = ["human", "dcs", "aircraft", "groundunit-sam", "groundunit-other", "navyunit", "airbase"];
export const visibilityControlsTootlips: string[] = ["Toggle human players visibility", "Toggle DCS controlled units visibility", "Toggle aircrafts visibility", "Toggle SAM units visibility", "Toggle ground units (not SAM) visibility", "Toggle navy units visibility", "Toggle airbases visibility"];

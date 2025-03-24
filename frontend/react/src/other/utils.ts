import { Circle, LatLng, Polygon } from "leaflet";
import * as turf from "@turf/turf";
import { ROEs, emissionsCountermeasures, reactionsToThreat, states } from "../constants/constants";
import { AlarmState, DateAndTime } from "../interfaces";
import { Converter } from "usng";
import { MGRS } from "../types/types";
import { featureCollection } from "turf";
import MagVar from "magvar";
import axios from "axios";

export function bearing(lat1: number, lon1: number, lat2: number, lon2: number, magnetic = true) {
  const φ1 = deg2rad(lat1); // φ, λ in radians
  const φ2 = deg2rad(lat2);
  const λ1 = deg2rad(lon1); // φ, λ in radians
  const λ2 = deg2rad(lon2);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  const magvar = MagVar.get(lat1, lon1);
  const brng = (rad2deg(θ) - (magnetic ? magvar : 0) + 360) % 360; // in degrees

  return brng;
}

export function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = deg2rad(lat1); // φ, λ in radians
  const φ2 = deg2rad(lat2);
  const Δφ = deg2rad(lat2 - lat1);
  const Δλ = deg2rad(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres

  return d;
}

export function bearingAndDistanceToLatLng(lat: number, lon: number, brng: number, dist: number) {
  const R = 6371e3; // metres
  const φ1 = deg2rad(lat); // φ, λ in radians
  const λ1 = deg2rad(lon);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(dist / R) + Math.cos(φ1) * Math.sin(dist / R) * Math.cos(brng));
  const λ2 = λ1 + Math.atan2(Math.sin(brng) * Math.sin(dist / R) * Math.cos(φ1), Math.cos(dist / R) - Math.sin(φ1) * Math.sin(φ2));

  return new LatLng(rad2deg(φ2), rad2deg(λ2));
}

export function midpoint(lat1: number, lon1: number, lat2: number, lon2: number, zoom: number = 10) {
  const φ1 = deg2rad(lat1); // Convert latitude of point 1 from degrees to radians
  const λ1 = deg2rad(lon1); // Convert longitude of point 1 from degrees to radians
  const φ2 = deg2rad(lat2); // Convert latitude of point 2 from degrees to radians
  const λ2 = deg2rad(lon2); // Convert longitude of point 2 from degrees to radians

  // Convert point 1 to Mercator projection coordinates
  const x1 = (1 / (2 * Math.PI)) * Math.pow(2, zoom) * (Math.PI + λ1);
  const y1 = (1 / (2 * Math.PI)) * Math.pow(2, zoom) * (Math.PI - Math.log(Math.tan(Math.PI / 4 + φ1 / 2)));

  // Convert point 2 to Mercator projection coordinates
  const x2 = (1 / (2 * Math.PI)) * Math.pow(2, zoom) * (Math.PI + λ2);
  const y2 = (1 / (2 * Math.PI)) * Math.pow(2, zoom) * (Math.PI - Math.log(Math.tan(Math.PI / 4 + φ2 / 2)));

  // Calculate the midpoint in Mercator projection coordinates
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  // Convert the midpoint back to latitude and longitude
  const λ = (2 * Math.PI * mx) / Math.pow(2, zoom) - Math.PI;
  const φ = 2 * Math.atan(Math.exp(Math.PI - (2 * Math.PI * my) / Math.pow(2, zoom))) - Math.PI / 2;

  // Return the midpoint as a LatLng object
  return new LatLng(rad2deg(φ), rad2deg(λ));
}

export function ConvertDDToDMS(D: number, lng: boolean) {
  var deg = 0 | (D < 0 ? (D = -D) : D);
  var min = 0 | (((D += 1e-9) % 1) * 60);
  var sec = (0 | (((D * 60) % 1) * 6000)) / 100;
  var dec = Math.round((sec - Math.floor(sec)) * 100);
  var sec = Math.floor(sec);
  if (lng) return zeroPad(deg, 3) + "°" + zeroPad(min, 2) + "'" + zeroPad(sec, 2) + "." + zeroPad(dec, 2) + '"';
  else return zeroPad(deg, 2) + "°" + zeroPad(min, 2) + "'" + zeroPad(sec, 2) + "." + zeroPad(dec, 2) + '"';
}

export function deg2rad(deg: number) {
  var pi = Math.PI;
  return deg * (pi / 180);
}

export function rad2deg(rad: number) {
  var pi = Math.PI;
  return rad / (pi / 180);
}

export function keyEventWasInInput(event: KeyboardEvent) {
  const target = event.target;
  return target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(target.nodeName);
}

export const zeroAppend = function (num: number, places: number, decimal: boolean = false, decimalPlaces: number = 2) {
  var string = decimal ? num.toFixed(decimalPlaces) : num.toFixed(0);
  while (string.length < places) {
    string = "0" + string;
  }
  return string;
};

export const zeroPad = function (num: number, places: number) {
  var string = String(num);
  while (string.length < places) {
    string = "0" + string;
  }
  return string;
};

export function latLngToMGRS(lat: number, lng: number, precision: number = 4): MGRS | undefined {
  if (precision < 0 || precision > 6) {
    console.error("latLngToMGRS: precision must be a number >= 0 and <= 6.  Given precision: " + precision);
    return undefined;
  }

  if (lng > 360 || lng < -180 || lat > 84 || lat < -80) {
    console.error("latLngToMGRS: value outside of bounds");
    return undefined;
  }

  const mgrs = new Converter({}).LLtoMGRS(lat, lng, precision);
  const match = mgrs.match(new RegExp(`^(\\d{2})([A-Z])([A-Z])([A-Z])(\\d+)$`));
  if (match) {
    const easting = match[5].substr(0, match[5].length / 2);
    const northing = match[5].substr(match[5].length / 2);

    let output: MGRS = {
      bandLetter: match[2],
      columnLetter: match[3],
      groups: [match[1] + match[2], match[3] + match[4], easting, northing],
      easting: easting,
      northing: northing,
      precision: precision,
      rowLetter: match[4],
      string: match[0],
      zoneNumber: match[1],
    };

    return output;
  } else {
    return undefined;
  }
}

export function latLngToUTM(lat: number, lng: number) {
  return new Converter({}).LLtoUTM(lat, lng);
}

export function latLngToMercator(lat: number, lng: number): { x: number; y: number } {
  var rMajor = 6378137; //Equatorial Radius, WGS84
  var shift = Math.PI * rMajor;
  var x = (lng * shift) / 180;
  var y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * shift) / 180;

  return { x: x, y: y };
}

export function mercatorToLatLng(x: number, y: number) {
  var rMajor = 6378137; //Equatorial Radius, WGS84
  var shift = Math.PI * rMajor;
  var lng = (x / shift) * 180.0;
  var lat = (y / shift) * 180.0;
  lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180.0)) - Math.PI / 2.0);

  return { lng: lng, lat: lat };
}

export function knotsToMs(knots: number) {
  return knots / 1.94384;
}

export function msToKnots(ms: number) {
  return ms * 1.94384;
}

export function ftToM(ft: number) {
  return ft * 0.3048;
}

export function mToFt(m: number) {
  return m / 0.3048;
}

export function mToNm(m: number) {
  return m * 0.000539957;
}

export function nmToM(nm: number) {
  return nm / 0.000539957;
}

export function nmToFt(nm: number) {
  return nm * 6076.12;
}

export function areaContains(latlng: LatLng, area: Polygon | Circle) {
  if (area instanceof Polygon) return polyContains(latlng, area);
  else return circleContains(latlng, area);
}

export function polyContains(latlng: LatLng, polygon: Polygon) {
  let coordinates = [
    (polygon.getLatLngs()[0] as LatLng[]).map((latlng) => {
      return [latlng.lng, latlng.lat];
    }),
  ];
  coordinates[0].push([polygon.getLatLngs()[0][0].lng, polygon.getLatLngs()[0][0].lat]);
  const poly = turf.polygon(coordinates);
  return turf.inside(turf.point([latlng.lng, latlng.lat]), poly);
}

export function circleContains(latlng: LatLng, circle: Circle) {
  const poly = turf.circle(turf.point([circle.getLatLng().lng, circle.getLatLng().lat]), circle.getRadius() / 1000, 100, "kilometers");
  return turf.inside(turf.point([latlng.lng, latlng.lat]), poly);
}

export function polyCenter(polygon: Polygon) {
  let coordinates = [
    (polygon.getLatLngs()[0] as LatLng[]).map((latlng) => {
      return [latlng.lng, latlng.lat];
    }),
  ];
  coordinates[0].push([polygon.getLatLngs()[0][0].lng, polygon.getLatLngs()[0][0].lat]);
  const poly = turf.polygon(coordinates);
  const center = turf.center(featureCollection([poly]));
  return new LatLng(center.geometry.coordinates[1], center.geometry.coordinates[0]);
}

export function randomPointInPoly(polygon: Polygon): LatLng {
  var bounds = polygon.getBounds();
  var x_min = bounds.getEast();
  var x_max = bounds.getWest();
  var y_min = bounds.getSouth();
  var y_max = bounds.getNorth();

  var lat = y_min + Math.random() * (y_max - y_min);
  var lng = x_min + Math.random() * (x_max - x_min);

  let coordinates = [
    (polygon.getLatLngs()[0] as LatLng[]).map((latlng) => {
      return [latlng.lng, latlng.lat];
    }),
  ];
  coordinates[0].push([polygon.getLatLngs()[0][0].lng, polygon.getLatLngs()[0][0].lat]);
  const poly = turf.polygon(coordinates);
  var inside = turf.inside(turf.point([lng, lat]), poly);

  if (inside) {
    return new LatLng(lat, lng);
  } else {
    return randomPointInPoly(polygon);
  }
}

export function polygonArea(polygon: Polygon) {
  var poly = polygon.toGeoJSON();
  return turf.area(poly);
}

export function enumToState(state: number) {
  if (state < states.length) return states[state];
  else return states[0];
}

export function enumToROE(ROE: number) {
  if (ROE < ROEs.length) return ROEs[ROE];
  else return ROEs[0];
}

export function enumToAlarmState(alarmState: number) {
  switch (alarmState) {
    case 2:
      return AlarmState.RED;
    case 1:
      return AlarmState.GREEN;
    case 0:
      return AlarmState.AUTO;
    default:
      return AlarmState.AUTO;
  }
}

export function convertROE(idx: number) {
  let roe = 0;
  if (idx === 0) roe = 4;
  else if (idx === 1) roe = 3;
  else if (idx === 2) roe = 1;
  else roe = 0;
  return roe;
}

export function enumToReactionToThreat(reactionToThreat: number) {
  if (reactionToThreat < reactionsToThreat.length) return reactionsToThreat[reactionToThreat];
  else return reactionsToThreat[0];
}

export function enumToEmissionCountermeasure(emissionCountermeasure: number) {
  if (emissionCountermeasure < emissionsCountermeasures.length) return emissionsCountermeasures[emissionCountermeasure];
  else return emissionsCountermeasures[0];
}

export function enumToCoalition(coalitionID: number) {
  switch (coalitionID) {
    case 0:
      return "neutral";
    case 1:
      return "red";
    case 2:
      return "blue";
  }
  return "";
}

export function coalitionToEnum(coalition: string) {
  switch (coalition) {
    case "neutral":
      return 0;
    case "red":
      return 1;
    case "blue":
      return 2;
  }
  return 0;
}

export function convertDateAndTimeToDate(dateAndTime: DateAndTime) {
  const date = dateAndTime.date;
  const time = dateAndTime.time;

  if (!date) return new Date();

  let year = date.Year;
  let month = date.Month - 1;

  if (month < 0) {
    month = 11;
    year--;
  }

  return new Date(year, month, date.Day, time.h, time.m, time.s);
}

export function getGroundElevation(latlng: LatLng, callback: CallableFunction) {
  /* Get the ground elevation from the server endpoint */
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `./api/elevation/${latlng.lat}/${latlng.lng}`, true);
  xhr.timeout = 500; // ms
  xhr.responseType = "json";
  xhr.onload = () => {
    var status = xhr?.status;
    if (status === 200) {
      callback(xhr.response);
    }
  };
  xhr.send();
}

export function makeID(length) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export function hash(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return `${4294967296 * (2097151 & h2) + (h1 >>> 0)}`;
}

export function byteArrayToInteger(array) {
  let res = 0;
  for (let i = 0; i < array.length; i++) {
    res = res << 8;
    res += array[array.length - i - 1];
  }
  return res;
}

export function integerToByteArray(value, length) {
  let res: number[] = [];
  for (let i = 0; i < length; i++) {
    res.push(value & 255);
    value = value >> 8;
  }
  return res;
}

export function doubleToByteArray(number) {
  var buffer = new ArrayBuffer(8); // JS numbers are 8 bytes long, or 64 bits
  var longNum = new Float64Array(buffer); // so equivalent to Float64

  longNum[0] = number;

  return Array.from(new Uint8Array(buffer));
}

export function byteArrayToDouble(array) {
  return new DataView(array.reverse().buffer).getFloat64(0);
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function getRandomColor(seed) {
  var h = ((seed * Math.PI * 100) % 360) + 1;
  var s = 50;
  var l = 50;
  return "hsl(" + h + "," + s + "%," + l + "%)";
}

export function wait(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export function computeBearingRangeString(latlng1, latlng2) {
  return `${zeroAppend(bearing(latlng1.lat, latlng1.lng, latlng2.lat, latlng2.lng), 3)}/${zeroAppend(latlng1.distanceTo(latlng2) / 1852, 3)}`;
}

export function spellNumbers(string: string) {
  string = string.replaceAll("1", "one ");
  string = string.replaceAll("2", "two ");
  string = string.replaceAll("3", "three ");
  string = string.replaceAll("4", "four ");
  string = string.replaceAll("5", "five ");
  string = string.replaceAll("6", "six ");
  string = string.replaceAll("7", "seven ");
  string = string.replaceAll("8", "eight ");
  string = string.replaceAll("9", "nine ");
  string = string.replaceAll("0", "zero ");
  return string;
}

export function blobToBase64(blob) {
  return new Promise((resolve: (value: string) => void, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export function mode(array) {
  if (array.length == 0) return null;
  var modeMap = {};
  var maxEl = array[0],
    maxCount = 1;
  for (var i = 0; i < array.length; i++) {
    var el = array[i];
    if (modeMap[el] == null) modeMap[el] = 1;
    else modeMap[el]++;
    if (modeMap[el] > maxCount) {
      maxEl = el;
      maxCount = modeMap[el];
    }
  }
  return maxEl;
}

export function deepCopyTable(table) {
  try {
    return JSON.parse(JSON.stringify(table));
  } catch (error) {
    console.error(error);
    return {};
  }
}

export function computeStandardFormationOffset(formation, idx) {
  let offset = { x: 0, y: 0, z: 0 };
  if (formation === "trail") {
    offset.y = 75 * idx;
    offset.x = 0;
    offset.z = -Math.sqrt(offset.x * offset.x + offset.y * offset.y) * 0.1;
  } else if (formation === "echelon-lh" || formation == "custom" /* default fallback if needed */) {
    offset.y = 50 * idx;
    offset.x = -50 * idx;
    offset.z = -Math.sqrt(offset.x * offset.x + offset.y * offset.y) * 0.1;
  } else if (formation === "echelon-rh") {
    offset.y = 50 * idx;
    offset.x = 50 * idx;
    offset.z = -Math.sqrt(offset.x * offset.x + offset.y * offset.y) * 0.1;
  } else if (formation === "line-abreast-lh") {
    offset.y = 0;
    offset.x = -75 * idx;
  } else if (formation === "line-abreast-rh") {
    offset.y = 0;
    offset.x = 75 * idx;
  } else if (formation === "front") {
    offset.y = -100 * idx;
    offset.x = 0;
  } else if (formation === "diamond") {
    var xr = 0;
    var yr = 1;
    var zr = -1;
    var layer = 1;

    for (let i = 0; i < idx; i++) {
      var xl = xr * Math.cos(Math.PI / 4) - yr * Math.sin(Math.PI / 4);
      var yl = xr * Math.sin(Math.PI / 4) + yr * Math.cos(Math.PI / 4);
      offset = { x: xl * 50, y: yl * 50, z: 0 };
      offset.z = -Math.sqrt(offset.x * offset.x + offset.y * offset.y) * 0.1;
      if (yr == 0) {
        layer++;
        xr = 0;
        yr = layer;
        zr = -layer;
      } else {
        if (xr < layer) {
          xr++;
          zr--;
        } else {
          yr--;
          zr++;
        }
      }
    }
  }
  return offset;
}

export function nearestNiceNumber(number) {
  let niceNumbers = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  let niceNumber = niceNumbers[0];
  for (let i = 0; i < niceNumbers.length; i++) {
    if (niceNumbers[i] >= number) {
      niceNumber = niceNumbers[i];
      break;
    }
  }
  return niceNumber;
}

export function roundToNearestFive(number) {
  return Math.round(number / 5) * 5;
}

export function toDCSFormationOffset(offset: { x: number; y: number; z: number }) {
  // X: front-rear, positive front
  // Y: top-bottom, positive top
  // Z: left-right, positive right

  return { x: -offset.y, y: offset.z, z: offset.x };
}

export function fromDCSFormationOffset(offset: { x: number; y: number; z: number }) {
  return { x: offset.z, y: -offset.x, z: offset.y };
}

/**
 * Adjusts the brightness of a color.
 * @param {string} color - The color in hashtag format (e.g., "#RRGGBB").
 * @param {number} percent - The percentage to adjust the brightness (positive to lighten, negative to darken).
 * @returns {string} - The adjusted color in hashtag format.
 */
export function adjustBrightness(color, percent) {
  // Ensure the color is in the correct format
  if (!/^#[0-9A-F]{6}$/i.test(color)) {
    throw new Error("Invalid color format. Use #RRGGBB.");
  }

  // Parse the color components
  let r = parseInt(color.slice(1, 3), 16);
  let g = parseInt(color.slice(3, 5), 16);
  let b = parseInt(color.slice(5, 7), 16);

  // Adjust the brightness
  r = Math.min(255, Math.max(0, r + Math.round((percent / 100) * 255)));
  g = Math.min(255, Math.max(0, g + Math.round((percent / 100) * 255)));
  b = Math.min(255, Math.max(0, b + Math.round((percent / 100) * 255)));

  // Convert back to hexadecimal and return the adjusted color
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

/**
 * Sets the opacity of a color.
 * @param {string} color - The color in hashtag format (e.g., "#RRGGBB").
 * @param {number} opacity - The opacity value (between 0 and 1).
 * @returns {string} - The color in rgba format.
 */
export function setOpacity(color, opacity) {
  // Ensure the color is in the correct format
  if (!/^#[0-9A-F]{6}$/i.test(color)) {
    throw new Error("Invalid color format. Use #RRGGBB.");
  }

  // Ensure the opacity is within the valid range
  if (opacity < 0 || opacity > 1) {
    throw new Error("Opacity must be between 0 and 1.");
  }

  // Parse the color components
  let r = parseInt(color.slice(1, 3), 16);
  let g = parseInt(color.slice(3, 5), 16);
  let b = parseInt(color.slice(5, 7), 16);

  // Return the color in rgba format
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Computes the brightness of a color.
 * @param {string} color - The color in hashtag format (e.g., "#RRGGBB").
 * @returns {number} - The brightness value (0 to 255).
 */
export function computeBrightness(color) {
  // Ensure the color is in the correct format
  if (!/^#[0-9A-F]{6}$/i.test(color)) {
    throw new Error("Invalid color format. Use #RRGGBB.");
  }

  // Parse the color components
  let r = parseInt(color.slice(1, 3), 16);
  let g = parseInt(color.slice(3, 5), 16);
  let b = parseInt(color.slice(5, 7), 16);

  // Compute the brightness using the luminance formula
  // The formula is: 0.299*R + 0.587*G + 0.114*B
  let brightness = 0.299 * r + 0.587 * g + 0.114 * b;

  return brightness;
}

/**
 * Normalizes an angle to be within the range of 0 to 360 degrees.
 * @param {number} angle - The angle to normalize.
 * @returns {number} - The normalized angle.
 */
export function normalizeAngle(angle: number): number {
  // Ensure the angle is within the range of 0 to 360 degrees
  angle = angle % 360;
  if (angle < 0) {
    angle += 360;
  }
  return angle;
}

export function decimalToRGBA(decimal: number): string {
  const r = (decimal >>> 24) & 0xff;
  const g = (decimal >>> 16) & 0xff;
  const b = (decimal >>> 8) & 0xff;
  const a = (decimal & 0xff) / 255;

  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

export async function getWikipediaImage(unitName: string): Promise<string | null> {
  try {
    // Search for the unit name on Wikipedia
    const searchResponse = await axios.get("https://en.wikipedia.org/w/api.php", {
      params: {
        action: "query",
        list: "search",
        srsearch: unitName,
        format: "json",
        origin: "*",
      },
    });

    if (searchResponse.data.query.search.length === 0) {
      console.error("No search results found for the unit name.");
      return null;
    }

    // Get the title of the first search result
    const pageTitle = searchResponse.data.query.search[0].title;

    // Get the page content to find the image
    const pageResponse = await axios.get("https://en.wikipedia.org/w/api.php", {
      params: {
        action: "query",
        titles: pageTitle,
        prop: "pageimages",
        pithumbsize: 500,
        format: "json",
        origin: "*",
      },
    });

    const pages = pageResponse.data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (page.thumbnail && page.thumbnail.source) {
      return page.thumbnail.source;
    } else {
      console.error("No image found for the unit name.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching data from Wikipedia:", error);
    return null;
  }
}

export async function getWikipediaSummary(unitName: string): Promise<string | null> {
  try {
    // Search for the unit name on Wikipedia
    const searchResponse = await axios.get("https://en.wikipedia.org/w/api.php", {
      params: {
        action: "query",
        list: "search",
        srsearch: unitName,
        format: "json",
        origin: "*",
      },
    });

    if (searchResponse.data.query.search.length === 0) {
      console.error("No search results found for the unit name.");
      return null;
    }

    // Get the title of the first search result
    const pageTitle = searchResponse.data.query.search[0].title;

    // Get the page content to find the summary
    const pageResponse = await axios.get("https://en.wikipedia.org/w/api.php", {
      params: {
        action: "query",
        prop: "extracts",
        exintro: true,
        explaintext: true,
        titles: pageTitle,
        format: "json",
        origin: "*",
      },
    });

    const pages = pageResponse.data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (page.extract) {
      return page.extract;
    } else {
      console.error("No summary found for the unit name.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching data from Wikipedia:", error);
    return null;
  }
}

export function secondsToTimeString(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${zeroPad(hours, 2)}:${zeroPad(minutes, 2)}:${zeroPad(secs, 2)}`;
}

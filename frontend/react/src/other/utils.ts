import { Circle, LatLng, Polygon } from "leaflet";
import * as turf from "@turf/turf";
import { UnitDatabase } from "../unit/databases/unitdatabase";
import { ROEs, emissionsCountermeasures, reactionsToThreat, states } from "../constants/constants";
import { DateAndTime, UnitBlueprint } from "../interfaces";
import { Converter } from "usng";
import { MGRS } from "../types/types";
import { featureCollection } from "turf";

export function bearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const φ1 = deg2rad(lat1); // φ, λ in radians
  const φ2 = deg2rad(lat2);
  const λ1 = deg2rad(lon1); // φ, λ in radians
  const λ2 = deg2rad(lon2);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  const brng = (rad2deg(θ) + 360) % 360; // in degrees

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
  var string = decimal ? num.toFixed(decimalPlaces) : String(num);
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

export function latLngToMGRS(lat: number, lng: number, precision: number = 4): MGRS | false {
  if (precision < 0 || precision > 6) {
    console.error("latLngToMGRS: precision must be a number >= 0 and <= 6.  Given precision: " + precision);
    return false;
  }
  const mgrs = new Converter({}).LLtoMGRS(lat, lng, precision);
  const match = mgrs.match(new RegExp(`^(\\d{2})([A-Z])([A-Z])([A-Z])(\\d+)$`));
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
  xhr.open("GET", getApp().getExpressAddress() + `api/elevation/${latlng.lat}/${latlng.lng}`, true);
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
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for(let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return `${4294967296 * (2097151 & h2) + (h1 >>> 0)}`;
};

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

//  This is for plugins to get access to util functions
//  We should migrate the functions at some point...

import * as turf from "@turf/turf";
import { LatLng, Polygon } from "leaflet";
import { UnitDatabase } from "../unit/databases/unitdatabase";
import { DateAndTime, UnitBlueprint } from "../interfaces";
import { aircraftDatabase } from "../unit/databases/aircraftdatabase";
import { helicopterDatabase } from "../unit/databases/helicopterdatabase";
import { groundUnitDatabase } from "../unit/databases/groundunitdatabase";
import { navyUnitDatabase } from "../unit/databases/navyunitdatabase";
import { GROUND_UNIT_AIR_DEFENCE_REGEX, ROEs, emissionsCountermeasures, reactionsToThreat, states } from "../constants/constants";
import { Dropdown } from "../controls/dropdown";

export type MGRS = {
    bandLetter: string,
    columnLetter: string,
    easting: string,
    groups: string[],
    northing: string,
    precision: number,
    rowLetter: string,
    string: string,
    zoneNumber: string
}

export class Utilities {

    #usng:any;

    constructor() {
        this.#usng = require( "usng.js" );
    }

    base64ToBytes(base64: string) {
        return Buffer.from(base64, 'base64').buffer;
    }
    
    /** Get the bearing from
    * 
    * @param fromLatLng <LatLng> 
    * @param toLatLng <LatLng>
    * @returns <number> degrees in bearing
    */
    bearing(fromLatLng:LatLng, toLatLng:LatLng) {
        const φ1 = this.degToRad(fromLatLng.lat); // φ, λ in radians
        const φ2 = this.degToRad(toLatLng.lat);
        const λ1 = this.degToRad(fromLatLng.lng); // φ, λ in radians
        const λ2 = this.degToRad(toLatLng.lng);
        const y  = Math.sin(λ2 - λ1) * Math.cos(φ2);
        const x  = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
        const θ  = Math.atan2(y, x);
        return (this.radToDeg(θ) + 360) % 360; // in degrees
    }

    /**
     * 
     * @param fromLatLng
     * @param brng 
     * @param dist 
     * @returns <LatLng>
     */
    bearingAndDistanceToLatLng(fromLatLng:LatLng, brng: number, dist: number): LatLng {
        const R = 6371e3; // metres
        const φ1 = this.degToRad(fromLatLng.lat); // φ, λ in radians
        const λ1 = this.degToRad(fromLatLng.lng);
        const φ2 = Math.asin( Math.sin(φ1)*Math.cos(dist/R) + Math.cos(φ1)*Math.sin(dist/R)*Math.cos(brng) );
        const λ2 = λ1 + Math.atan2(Math.sin(brng)*Math.sin(dist/R)*Math.cos(φ1), Math.cos(dist/R)-Math.sin(φ1)*Math.sin(φ2));

        return new LatLng(this.radToDeg(φ2), this.radToDeg(λ2));
    }

    coalitionToEnum(coalition: string) {
    switch (coalition){
        case "neutral": return 0;
        case "red": return 1;
        case "blue": return 2;
    }
    return 0;
    }

    convertDateAndTimeToDate(dateAndTime: DateAndTime) {
        const date = dateAndTime.date;
        const time = dateAndTime.time;
    
        if (!date) {
            return new Date();
        }
    
        let year = date.Year;
        let month = date.Month - 1;
    
        if (month < 0) {
            month = 11;
            year--;
        }
    
        return new Date(year, month, date.Day, time.h, time.m, time.s);
    }

    createCheckboxOption(value: string, text: string, checked: boolean = true, callback: CallableFunction = (ev: any) => {}, options?:any) {
        options = {
            "disabled": false,
            "name": "",
            "readOnly": false,
            ...options
        };
        var div = document.createElement("div");
        div.classList.add("ol-checkbox");
        var label = document.createElement("label");
        label.title = text;
        var input = document.createElement("input");
        input.type = "checkbox";
        input.checked  = checked;
        input.name     = options.name;
        input.disabled = options.disabled;
        input.readOnly = options.readOnly;
        input.value    = value;
        var span = document.createElement("span");
        span.innerText = value;
        label.appendChild(input);
        label.appendChild(span);
        div.appendChild(label);
        input.onclick = (ev: any) => callback(ev);
        return div as HTMLElement;
    }

    createDivWithClass(className: string) {
        var el = document.createElement("div");
        el.classList.add(className);
        return el;
    }

    DDToDMS(D: number, lng: boolean) {
        const zeroPrepend = new Utilities().zeroPrepend;
        var dir = D < 0 ? (lng ? "W" : "S") : lng ? "E" : "N";
        var deg = 0 | (D < 0 ? (D = -D) : D);
        var min = 0 | (((D += 1e-9) % 1) * 60);
        var sec = (0 | (((D * 60) % 1) * 6000)) / 100;
        var dec = Math.round((sec - Math.floor(sec)) * 100);
        var sec = Math.floor(sec);
        if (lng)
            return dir + zeroPrepend(deg, 3) + "°" + zeroPrepend(min, 2) + "'" + zeroPrepend(sec, 2) + "." + zeroPrepend(dec, 2) + "\"";
        else
            return dir + zeroPrepend(deg, 2) + "°" + zeroPrepend(min, 2) + "'" + zeroPrepend(sec, 2) + "." + zeroPrepend(dec, 2) + "\"";
    }

    degToRad(deg: number) {
        return deg * (Math.PI / 180);
    }

    /**
    * 
    * @param fromLatLng <LatLng>
    * @param toLatLng <LatLng>
    * @returns <number> distance in meters
    */
    distance(fromLatLng:LatLng, toLatLng:LatLng) : number {
        const R  = 6371e3; // metres
        const φ1 = this.degToRad(fromLatLng.lat); // φ, λ in radians
        const φ2 = this.degToRad(toLatLng.lat);
        const Δφ = this.degToRad(toLatLng.lat - fromLatLng.lat);
        const Δλ = this.degToRad(toLatLng.lng - fromLatLng.lng);

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    }

    editDistance(s1: string, s2: string) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
    
        var costs = new Array();
        for (var i = 0; i <= s1.length; i++) {
            var lastValue = i;
            for (var j = 0; j <= s2.length; j++) {
                if (i == 0)
                    costs[j] = j;
                else {
                    if (j > 0) {
                        var newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue),
                                costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0)
                costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    enumToCoalition(coalitionID: number) {
        switch (coalitionID){
            case 0: return "neutral";
            case 1: return "red";
            case 2: return "blue";
        }
        return "";
    }

    enumToEmissionCountermeasure(emissionCountermeasure: number) {
        if (emissionCountermeasure < emissionsCountermeasures.length) 
            return emissionsCountermeasures[emissionCountermeasure];
        else 
            return emissionsCountermeasures[0];
    }

    enumToReactionToThreat(reactionToThreat: number) {
        if (reactionToThreat < reactionsToThreat.length) 
            return reactionsToThreat[reactionToThreat];
        else 
            return reactionsToThreat[0];
    }

    enumToROE(ROE: number) {
        if (ROE < ROEs.length) 
            return ROEs[ROE];
        else 
            return ROEs[0];
    }

    enumToState(state: number) {
        if (state < states.length) 
            return states[state];
        else 
            return states[0];
    }

    ftToM(ft: number) {
        return ft * 0.3048;
    }

    generateUUIDv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getCategoryBlueprintIconSVG(category:string, unitName:string) {

        const path = "/resources/theme/images/buttons/visibility/";
    
        //  We can just send these back okay
        if (["Aircraft", "Helicopter", "NavyUnit"].includes(category)) return `${path}${category.toLowerCase()}.svg`;
    
        //  Return if not a ground units as it's therefore something we don't recognise
        if (category !== "GroundUnit") return false;
    
        /** We need to get the unit detail for ground units so we can work out if it's an air defence unit or not **/
        return GROUND_UNIT_AIR_DEFENCE_REGEX.test(unitName) ? `${path}groundunit-sam.svg` : `${path}groundunit.svg`;
    }

    getCheckboxOptions(dropdown: Dropdown) {
        var values: { [key: string]: boolean } = {};
        const element = dropdown.getOptionElements();
        for (let idx = 0; idx < element.length; idx++) {
            const option = element.item(idx) as HTMLElement;
            const key = option.querySelector("span")?.innerText;
            const value = option.querySelector("input")?.checked;
            if (key !== undefined && value !== undefined)
                values[key] = value;
        }
        return values;
    }

    getGroundElevation(latlng: LatLng, callback: CallableFunction) {
        /* Get the ground elevation from the server endpoint */
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `api/elevation/${latlng.lat}/${latlng.lng}`, true);
        xhr.timeout = 500; // ms
        xhr.responseType = 'json';
        xhr.onload = () => {
            var status = xhr?.status;
            if (status === 200) {
                callback(xhr.response)
            }
        };
        xhr.send();
    }

    getMarkerCategoryByName(name: string) {
        if (aircraftDatabase.getByName(name) != null)
            return "aircraft";
        else if (helicopterDatabase.getByName(name) != null)
            return "helicopter";
        else if (groundUnitDatabase.getByName(name) != null){
            var type = groundUnitDatabase.getByName(name)?.type ?? "";
            if (GROUND_UNIT_AIR_DEFENCE_REGEX.test(type))
                return "groundunit-sam";
            else
                return "groundunit-other";
        }
        else if (navyUnitDatabase.getByName(name) != null)
            return "navyunit";
        else 
            return "aircraft"; // TODO add other unit types  
    }

    getUnitDatabaseByCategory(category: string) {
        if (category.toLowerCase() == "aircraft")
            return aircraftDatabase;
        else if (category.toLowerCase() == "helicopter")
            return helicopterDatabase;
        else if (category.toLowerCase().includes("groundunit"))
            return groundUnitDatabase;
        else if (category.toLowerCase().includes("navyunit"))
            return navyUnitDatabase;
        else
            return null;
    }

    keyEventWasInInput( event:KeyboardEvent ) {
        const target = event.target;
        return ( target instanceof HTMLElement && ( [ "INPUT", "TEXTAREA" ].includes( target.nodeName ) ) );
    }

    knotsToMs(knots: number) {
        return knots / 1.94384;
    }

    latLngToMercator(latLng:LatLng): {x: number, y: number} {
        var rMajor = 6378137; //Equatorial Radius, WGS84
        var shift  = Math.PI * rMajor;
        var x      = latLng.lng * shift / 180;
        var y      = Math.log(Math.tan((90 + latLng.lat) * Math.PI / 360)) / (Math.PI / 180);
        y = y * shift / 180;
        
        return {x: x, y: y};
    }

    latLngToMGRS( latLng:LatLng, precision:number = 4 ): MGRS | false {

        if ( precision < 0 || precision > 6 ) {
            console.error( "latLngToMGRS: precision must be a number >= 0 and <= 6.  Given precision: " + precision );
            return false;
        }
        
        const mgrs     = new this.#usng.Converter().LLtoMGRS( latLng.lat, latLng.lng, precision );
        const match    = mgrs.match( new RegExp( `^(\\d{2})([A-Z])([A-Z])([A-Z])(\\d+)$` ) );
        const easting  = match[5].substr(0,match[5].length/2);
        const northing = match[5].substr(match[5].length/2);
    
        let output:MGRS = {
            bandLetter: match[2],
            columnLetter: match[3],
            groups: [ match[1] + match[2], match[3] + match[4], easting, northing ],
            easting: easting,
            northing: northing,
            precision: precision,
            rowLetter: match[4],
            string: match[0],
            zoneNumber: match[1]
        }
        
        return output;
    }

    latLngToUTM( latLng:LatLng ) {
        return new this.#usng.Converter().LLtoUTM( latLng.lat, latLng.lng );
    }

    mercatorToLatLng(x: number, y: number) : LatLng {
        var rMajor = 6378137; //Equatorial Radius, WGS84
        var shift  = Math.PI * rMajor;
        var lng    = x / shift * 180.0;
        var lat    = y / shift * 180.0;
        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2.0);
    
        return new LatLng( lat, lng );
    }

    mToFt(m:number) {
        return m / 0.3048;
    }

    mToNm(m:number) {
        return m * 0.000539957;
    }

    msToKts(ms:number) {
        return ms * 1.94384;
    }

    nmToM(nm: number) {
        return nm / 0.000539957;
    }

    nmToFt(nm: number) {
        return nm * 6076.12;
    }

    latLngIsInPolygon(latlng: LatLng, polygon: Polygon) {
        var poly   = polygon.toGeoJSON();
        return turf.inside(turf.point([latlng.lng, latlng.lat]), poly);
    }

    polygonArea(polygon: Polygon) {
        var poly = polygon.toGeoJSON();
        return turf.area(poly);
    }
    
    radToDeg(rad: number) {
        return rad / (Math.PI / 180);
    }

    randomPointInPolygon(polygon: Polygon): LatLng {
        var bounds = polygon.getBounds(); 
        var x_min  = bounds.getEast();
        var x_max  = bounds.getWest();
        var y_min  = bounds.getSouth();
        var y_max  = bounds.getNorth();
    
        var lat = y_min + (Math.random() * (y_max - y_min));
        var lng = x_min + (Math.random() * (x_max - x_min));
    
        var poly   = polygon.toGeoJSON();
        var inside = turf.inside(turf.point([lng, lat]), poly);
    
        if (inside) {
            return new LatLng(lat, lng);
        } else {
            return this.randomPointInPolygon(polygon);
        }
    }

    randomUnitBlueprint(unitDatabase: UnitDatabase, options: {type?: string, role?: string, ranges?: string[], eras?: string[], coalition?: string} ) {
        /* Start from all the unit blueprints in the database */
        var unitBlueprints = Object.values(unitDatabase.getBlueprints());
    
        /* If a specific type or role is provided, use only the blueprints of that type or role */
        if (options.type && options.role) {
            console.error("Can't create random unit if both type and role are provided. Either create by type or by role.")
            return null;
        }
    
        if (options.type) {
            unitBlueprints = unitDatabase.getByType(options.type);
        }
        else if (options.role) {
            unitBlueprints = unitDatabase.getByType(options.role);
        }
    
        /* Keep only the units that have a range included in the requested values */
        if (options.ranges) {
            unitBlueprints = unitBlueprints.filter((unitBlueprint: UnitBlueprint) => { 
                var rangeType = "";
                var range = unitBlueprint.acquisitionRange ;
                if (range !== undefined) {
                    if (range >= 0 && range < 10000) 
                        rangeType = "Short range";
                    else if (range >= 10000 && range < 100000) 
                        rangeType = "Medium range";
                    else if (range >= 100000 && range < 999999)
                        rangeType = "Long range";
                }
                return options.ranges?.includes(rangeType);
            });
        }
    
        /* Keep only the units that have an era included in the requested values */
        if (options.eras) {
            unitBlueprints = unitBlueprints.filter((unitBlueprint: UnitBlueprint) => { 
                return unitBlueprint.era? options.eras?.includes(unitBlueprint.era): true;
            });
        }
    
        /* Keep only the units that have the correct coalition, if selected */
        if (options.coalition) {
            unitBlueprints = unitBlueprints.filter((unitBlueprint: UnitBlueprint) => { 
                return (unitBlueprint.coalition && unitBlueprint.coalition !== "")? options.coalition === unitBlueprint.coalition: true;
            });
        }
    
        var index = Math.floor(Math.random() * unitBlueprints.length);
        return unitBlueprints[index];
    }
    
    /** Return the reciprocal in degrees (e.g. 90 => 270)
     * 
     * @param degrees <number>
     * @returns <number>
     */
    reciprocal(degrees: number): number {
        return degrees > 180? degrees - 180: degrees + 180;
    }

    similarity(s1: string, s2: string) {
        var longer = s1;
        var shorter = s2;
        if (s1.length < s2.length) {
            longer = s2;
            shorter = s1;
        }
        var longerLength = longer.length;
        if (longerLength == 0) {
            return 1.0;
        }
        return (longerLength - this.editDistance(longer, shorter)) / longerLength;
    }

    /** Pad a number with trailing zeroes to a given size
     * 
     * @param num <number> being formatted
     * @param places <number> how many places being padded to
     * @param decimal? <boolean> if number is a boolean
     * @returns <string>
     */
    zeroAppend(num:number, places:number) {
        var string = String(num);
        while (string.length < places) {
            string += "0";
        }
        return string;
    }

    /** Pad a number with leading zeroes to a given size
     * 
     * @param num <number> being formatted
     * @param places <number> how many places being padded to
     * @returns <string>
     */
    zeroPrepend(num:number, places:number, decimal?:boolean) {
        var string = decimal ? num.toFixed(2) : num.toString();
        while (string.length < places) {
            string = "0" + string;
        }
        return string;
    }


}
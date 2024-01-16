//  This is for plugins to get access to util functions
//  We should migrate the functions at some point...

import { LatLng } from "leaflet";
import {
    bearing,
    distance,
    zeroAppend,
    zeroPad
} from "./utils";


export class Utilities {
    
    bearing(latLng1:LatLng, latLng2:LatLng) {
        return bearing(latLng1.lat, latLng1.lng, latLng2.lat, latLng2.lng);
    }

    distance(latLng1:LatLng, latLng2:LatLng) {
        return distance(latLng1.lat, latLng1.lng, latLng2.lat, latLng2.lng);
    }

    zeroAppend(num:number, places:number) {
        return zeroAppend(num, places);
    }

    zeroPrepend(num:number, places:number) {
        return zeroPad(num, places);
    }

}
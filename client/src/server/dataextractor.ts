import { LatLng } from "leaflet";
import { Ammo, Contact, GeneralSettings, Offset, Radio, TACAN } from "../@types/unit";

export class DataExtractor {
    #seekPosition = 0;
    #dataview: DataView;
    #decoder: TextDecoder;
    #buffer: ArrayBuffer;

    constructor(buffer: ArrayBuffer) {
        this.#buffer = buffer;
        this.#dataview = new DataView(this.#buffer);
        this.#decoder = new TextDecoder("utf-8");
    }

    setSeekPosition(seekPosition: number) {
        this.#seekPosition = seekPosition;
    }

    getSeekPosition() {
        return this.#seekPosition;
    }

    extractBool() {
        const value = this.#dataview.getUint8(this.#seekPosition); 
        this.#seekPosition += 1;
        return value > 0;
    }

    extractUInt8() {
        const value = this.#dataview.getUint8(this.#seekPosition); 
        this.#seekPosition += 1;
        return value;
    }

    extractUInt16() {
        const value = this.#dataview.getUint16(this.#seekPosition, true); 
        this.#seekPosition += 2;
        return value;
    }

    extractUInt32() {
        const value = this.#dataview.getUint32(this.#seekPosition, true); 
        this.#seekPosition += 4;
        return value;
    }

    extractUInt64() {
        const value = this.#dataview.getBigUint64(this.#seekPosition, true); 
        this.#seekPosition += 8;
        return value;
    }

    extractFloat64() {
        const value = this.#dataview.getFloat64(this.#seekPosition, true); 
        this.#seekPosition += 8;
        return value;
    }

    extractLatLng() {
        return new LatLng(this.extractFloat64(), this.extractFloat64(), this.extractFloat64())
    }

    extractFromBitmask(bitmask: number, position: number) {
        return ((bitmask >> position) & 1) > 0;
    }

    extractString(length?: number) {
        if (length === undefined)
            length = this.extractUInt16()
        var stringBuffer = this.#buffer.slice(this.#seekPosition, this.#seekPosition + length);
        var view = new Int8Array(stringBuffer);
        var stringLength = length;
        view.every((value: number, idx: number) => { 
            if (value === 0) {
                stringLength = idx;
                return false;
            } else 
                return true;
            });
        const value = this.#decoder.decode(stringBuffer);
        this.#seekPosition += length;
        return value.substring(0, stringLength).trim();
    }

    extractChar() {
        return this.extractString(1);
    }

    extractTACAN() {
        const value: TACAN = {
                isOn: this.extractBool(),
                channel: this.extractUInt8(),
                XY: this.extractChar(),
                callsign: this.extractString(4)
            }
        return value;
    }

    extractRadio() {
        const value: Radio = {
            frequency: this.extractUInt32(),
            callsign: this.extractUInt8(),
            callsignNumber: this.extractUInt8()
        }
        return value;
    }

    extractGeneralSettings() {
        const value: GeneralSettings = {
            prohibitJettison: this.extractBool(),
            prohibitAA: this.extractBool(),
            prohibitAG: this.extractBool(),
            prohibitAfterburner: this.extractBool(),
            prohibitAirWpn: this.extractBool(),
        }
        return value;
    }

    extractAmmo() {
        const value: Ammo[] = [];
        const size = this.extractUInt16();
        for (let idx = 0; idx < size; idx++) {
            value.push({
                quantity: this.extractUInt16(), 
                name: this.extractString(33),
                guidance: this.extractUInt8(),
                category: this.extractUInt8(),
                missileCategory: this.extractUInt8()
            });
        }
        return value;
    }

    extractContacts(){
        const value: Contact[] = [];
        const size = this.extractUInt16();
        for (let idx = 0; idx < size; idx++) {
            value.push({
                ID: this.extractUInt32(), 
                detectionMethod: this.extractUInt8()
            });
        }
        return value;
    }

    extractActivePath() {
        const value: LatLng[] = [];
        const size = this.extractUInt16();
        for (let idx = 0; idx < size; idx++) {
            value.push(this.extractLatLng());
        }
        return value;
    }

    extractOffset() {
        const value: Offset = {
            x: this.extractFloat64(),
            y: this.extractFloat64(),
            z: this.extractFloat64(),
        }
        return value;
    }
}
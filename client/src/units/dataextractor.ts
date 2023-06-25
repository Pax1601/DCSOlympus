import { LatLng } from "leaflet";
import { UnitData } from "../@types/unit";
import { ROEs, emissionsCountermeasures, reactionsToThreat, states } from "../constants/constants";

export class DataExtractor {
    #offset = 0;
    #dataview: DataView;
    #decoder: TextDecoder;
    #buffer: ArrayBuffer;

    constructor(buffer: ArrayBuffer) {
        this.#buffer = buffer;
        this.#dataview = new DataView(this.#buffer);
        this.#decoder = new TextDecoder("utf-8");
    }

    extractData(offset: number) {
        this.#offset = offset;

        const ID = this.extractUInt32();
        const bitmask = this.extractUInt32();

        const unitData: UnitData = {
            ID: ID,
            alive: this.extractFromBitmask(bitmask, 0),
            human: this.extractFromBitmask(bitmask, 1),
            controlled: this.extractFromBitmask(bitmask, 2),
            hasTask: this.extractFromBitmask(bitmask, 3),
            desiredAltitudeType: this.extractFromBitmask(bitmask, 16)? "AGL": "ASL",
            desiredSpeedType: this.extractFromBitmask(bitmask, 17)? "GS": "CAS",
            isTanker: this.extractFromBitmask(bitmask, 18),
            isAWACS: this.extractFromBitmask(bitmask, 19),
            onOff: this.extractFromBitmask(bitmask, 20),
            followRoads: this.extractFromBitmask(bitmask, 21),
            EPLRS: this.extractFromBitmask(bitmask, 22),
            generalSettings: {
                prohibitAA: this.extractFromBitmask(bitmask, 23),
                prohibitAfterburner: this.extractFromBitmask(bitmask, 24),
                prohibitAG: this.extractFromBitmask(bitmask, 25),
                prohibitAirWpn: this.extractFromBitmask(bitmask, 26),
                prohibitJettison: this.extractFromBitmask(bitmask, 27),
            },
            position: new LatLng(
                this.extractFloat64(),
                this.extractFloat64(),
                this.extractFloat64()
            ),
            speed: this.extractFloat64(),
            heading: this.extractFloat64(),
            fuel: this.extractUInt16(), 
            desiredSpeed: this.extractFloat64(),
            desiredAltitude: this.extractFloat64(),
            leaderID: this.extractUInt32(), 
            targetID: this.extractUInt32(), 
            targetPosition: new LatLng(
                this.extractFloat64(),
                this.extractFloat64(),
                this.extractFloat64()
            ),
            state: this.#getState(this.extractUInt8()),
            ROE: this.#getROE(this.extractUInt8()),
            reactionToThreat: this.#getReactionToThreat(this.extractUInt8()),
            emissionsCountermeasures: this.#getEmissionCountermeasure(this.extractUInt8()),
            coalition: this.#getCoalition(this.extractUInt8()),
            TACAN: {
                isOn: this.extractBool(),
                channel: this.extractUInt8(),
                XY: this.extractChar(),
                callsign: this.extractString(4)
            },
            radio: {
                frequency: this.extractUInt32(),
                callsign: this.extractUInt8(),
                callsignNumber: this.extractUInt8()
            },
            activePath: [],
            ammo: [],
            contacts: [],
            task: "",
            name: "",
            unitName: "",
            groupName: "",
            category: "",
        }
    
        const pathLength = this.extractUInt16();
        const ammoLength = this.extractUInt16();
        const contactsLength = this.extractUInt16();
        const taskLength = this.extractUInt8();

        if (pathLength > 0) {
            unitData.activePath = [];
            for (let idx = 0; idx < pathLength; idx++) {
                unitData.activePath.push(new LatLng(this.extractFloat64(), this.extractFloat64(), this.extractFloat64()));
            }
        }

        if (ammoLength > 0) {
            unitData.ammo = [];
            for (let idx = 0; idx < pathLength; idx++) {
                unitData.ammo.push({
                    quantity: this.extractUInt16(), 
                    name: this.extractString(32),
                    guidance: this.extractUInt8(),
                    category: this.extractUInt8(),
                    missileCategory: this.extractUInt8()
                 });
            }
        }

        if (contactsLength > 0) {
            unitData.contacts = [];
            for (let idx = 0; idx < pathLength; idx++) {
                unitData.contacts.push({
                    ID: this.extractUInt32(), 
                    detectionMethod: this.extractUInt8()
                 });
            }
        }

        if (taskLength > 0) {
            unitData.task = this.extractString(taskLength);
        }
        
        const nameLength = this.extractUInt16();
        const unitNameLength = this.extractUInt16();
        const groupNameLength = this.extractUInt16();
        const categoryLength = this.extractUInt16();

        if (nameLength > 0) {
            unitData.name = this.extractString(nameLength);
        }

        if (unitNameLength > 0) {
            unitData.unitName = this.extractString(unitNameLength);
        }

        if (groupNameLength > 0) {
            unitData.groupName = this.extractString(groupNameLength);
        }
        
        if (categoryLength > 0) {
            unitData.category = this.extractString(categoryLength);
        }

        return {data: unitData, offset: this.#offset};
    }

    extractBool() {
        const value = this.#dataview.getUint8(this.#offset); 
        this.#offset += 1;
        return value > 0;
    }

    extractUInt8() {
        const value = this.#dataview.getUint8(this.#offset); 
        this.#offset += 1;
        return value;
    }

    extractUInt16() {
        const value = this.#dataview.getUint16(this.#offset, true); 
        this.#offset += 2;
        return value;
    }

    extractUInt32() {
        const value = this.#dataview.getUint32(this.#offset, true); 
        this.#offset += 4;
        return value;
    }

    extractUInt64() {
        const value = this.#dataview.getBigUint64(this.#offset, true); 
        this.#offset += 8;
        return value;
    }

    extractFloat64() {
        const value = this.#dataview.getFloat64(this.#offset, true); 
        this.#offset += 8;
        return value;
    }

    extractFromBitmask(bitmask: number, position: number) {
        return ((bitmask >> position) & 1) > 0;
    }

    extractString(length: number) {
        const value = this.#decoder.decode(this.#buffer.slice(this.#offset, this.#offset +length));
        this.#offset += length;
        return value;
    }

    extractChar() {
        return this.extractString(1);
    }

    getOffset() {
        return this.#offset;
    }

    #getState(state: number) {
        if (state < states.length) 
            return states[state];
        else 
            return states[0];
    }

    #getROE(ROE: number) {
        if (ROE < ROEs.length) 
            return ROEs[ROE];
        else 
            return ROEs[0];
    }

    #getReactionToThreat(reactionToThreat: number) {
        if (reactionToThreat < reactionsToThreat.length) 
            return reactionsToThreat[reactionToThreat];
        else 
            return reactionsToThreat[0];
    }

    #getEmissionCountermeasure(emissionCountermeasure: number) {
        if (emissionCountermeasure < emissionsCountermeasures.length) 
            return emissionsCountermeasures[emissionCountermeasure];
        else 
            return emissionsCountermeasures[0];
    }

    #getCoalition(coalitionID: number) {
        switch (coalitionID){
            case 0: return "neutral";
            case 1: return "red";
            case 2: return "blue";
        }
        return "";
    }
}
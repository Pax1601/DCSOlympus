import { LatLng } from 'leaflet';
import { getConnectionStatusPanel, getInfoPopup, getMissionData, getUnitDataTable, getUnitsManager, setConnectionStatus } from '..';
import { SpawnOptions } from '../controls/mapcontextmenu';

var connected: boolean = false;
var paused: boolean = false;

var REST_ADDRESS = "http://localhost:30000/olympus";
var DEMO_ADDRESS = window.location.href + "demo";
const UNITS_URI = "units";
const LOGS_URI = "logs";
const AIRBASES_URI = "airbases";
const BULLSEYE_URI = "bullseyes";
const MISSION_URI = "mission";

var username = "";
var credentials = "";

var sessionHash: string | null = null;
var lastUpdateTime = 0;
var demoEnabled = false;

export function toggleDemoEnabled() {
    demoEnabled = !demoEnabled;
}

export function setCredentials(newUsername: string, newCredentials: string) {
    username = newUsername;
    credentials = newCredentials;
}

export function GET(callback: CallableFunction, uri: string, options?: { time?: number }) {
    var xmlHttp = new XMLHttpRequest();

    /* Assemble the request options string */
    var optionsString = '';
    if (options?.time != undefined)
        optionsString = `time=${options.time}`;


    xmlHttp.open("GET", `${demoEnabled ? DEMO_ADDRESS : REST_ADDRESS}/${uri}${optionsString ? `?${optionsString}` : ''}`, true);
    if (credentials)
        xmlHttp.setRequestHeader("Authorization", "Basic " + credentials);
    xmlHttp.onload = function (e) {
        if (xmlHttp.status == 200) {
            var data = JSON.parse(xmlHttp.responseText);
            if (uri !== UNITS_URI || (options?.time == 0) || parseInt(data.time) > lastUpdateTime) {
                callback(data);
                lastUpdateTime = parseInt(data.time);
                if (isNaN(lastUpdateTime))
                    lastUpdateTime = 0;
                setConnected(true);
            }
        } else if (xmlHttp.status == 401) {
            console.error("Incorrect username/password");
            setConnectionStatus("failed");
        } else {
            setConnected(false);
        }
    };
    xmlHttp.onerror = function (res) {
        console.error("An error occurred during the XMLHttpRequest");
        setConnected(false);
    };
    xmlHttp.send(null);
}

export function POST(request: object, callback: CallableFunction) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("PUT", demoEnabled ? DEMO_ADDRESS : REST_ADDRESS);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    if (credentials)
        xmlHttp.setRequestHeader("Authorization", "Basic " + credentials);
    xmlHttp.onreadystatechange = () => {
        callback();
    };
    xmlHttp.send(JSON.stringify(request));
}

export function getConfig(callback: CallableFunction) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", window.location.href + "config", true);
    xmlHttp.onload = function (e) {
        var data = JSON.parse(xmlHttp.responseText);
        callback(data);
    };
    xmlHttp.onerror = function () {
        console.error("An error occurred during the XMLHttpRequest, could not retrieve configuration file");
    };
    xmlHttp.send(null);
}

export function setAddress(address: string, port: number) {
    REST_ADDRESS = `http://${address}:${port}/olympus`
    console.log(`Setting REST address to ${REST_ADDRESS}`)
}

export function getAirbases(callback: CallableFunction) {
    GET(callback, AIRBASES_URI);
}

export function getBullseye(callback: CallableFunction) {
    GET(callback, BULLSEYE_URI);
}

export function getLogs(callback: CallableFunction) {
    GET(callback, LOGS_URI);
}

export function getMission(callback: CallableFunction) {
    GET(callback, MISSION_URI);
}

export function getUnits(callback: CallableFunction, refresh: boolean = false) {
    GET(callback, `${UNITS_URI}`, { time: refresh ? 0 : lastUpdateTime });
}

export function addDestination(ID: number, path: any) {
    var command = { "ID": ID, "path": path }
    var data = { "setPath": command }
    POST(data, () => { });
}

export function spawnSmoke(color: string, latlng: LatLng) {
    var command = { "color": color, "location": latlng };
    var data = { "smoke": command }
    POST(data, () => { });
}

export function spawnExplosion(strength: number, latlng: LatLng) {
    var command = { "strength": strength, "location": latlng };
    var data = { "explosion": command }
    POST(data, () => { });
}

export function spawnGroundUnit(spawnOptions: SpawnOptions) {
    var command = { "type": spawnOptions.type, "location": spawnOptions.latlng, "coalition": spawnOptions.coalition };
    var data = { "spawnGround": command }
    POST(data, () => { });
}

export function spawnAircraft(spawnOptions: SpawnOptions) {
    var command = { "type": spawnOptions.type, "location": spawnOptions.latlng, "coalition": spawnOptions.coalition, "altitude": spawnOptions.altitude, "payloadName": spawnOptions.loadout != null ? spawnOptions.loadout : "", "airbaseName": spawnOptions.airbaseName != null ? spawnOptions.airbaseName : "" };
    var data = { "spawnAir": command }
    POST(data, () => { });
}

export function attackUnit(ID: number, targetID: number) {
    var command = { "ID": ID, "targetID": targetID };
    var data = { "attackUnit": command }
    POST(data, () => { });
}

export function followUnit(ID: number, targetID: number, offset: { "x": number, "y": number, "z": number }) {
    // X: front-rear, positive front
    // Y: top-bottom, positive bottom
    // Z: left-right, positive right

    var command = { "ID": ID, "targetID": targetID, "offsetX": offset["x"], "offsetY": offset["y"], "offsetZ": offset["z"] };
    var data = { "followUnit": command }
    POST(data, () => { });
}

export function cloneUnit(ID: number, latlng: LatLng) {
    var command = { "ID": ID, "location": latlng };
    var data = { "cloneUnit": command }
    POST(data, () => { });
}

export function deleteUnit(ID: number, explosion: boolean) {
    var command = { "ID": ID, "explosion": explosion };
    var data = { "deleteUnit": command }
    POST(data, () => { });
}

export function landAt(ID: number, latlng: LatLng) {
    var command = { "ID": ID, "location": latlng };
    var data = { "landAt": command }
    POST(data, () => { });
}

export function changeSpeed(ID: number, speedChange: string) {
    var command = { "ID": ID, "change": speedChange }
    var data = { "changeSpeed": command }
    POST(data, () => { });
}

export function setSpeed(ID: number, speed: number) {
    var command = { "ID": ID, "speed": speed }
    var data = { "setSpeed": command }
    POST(data, () => { });
}

export function setSpeedType(ID: number, speedType: string) {
    var command = { "ID": ID, "speedType": speedType }
    var data = { "setSpeedType": command }
    POST(data, () => { });
}

export function changeAltitude(ID: number, altitudeChange: string) {
    var command = { "ID": ID, "change": altitudeChange }
    var data = { "changeAltitude": command }
    POST(data, () => { });
}

export function setAltitudeType(ID: number, altitudeType: string) {
    var command = { "ID": ID, "altitudeType": altitudeType }
    var data = { "setAltitudeType": command }
    POST(data, () => { });
}

export function setAltitude(ID: number, altitude: number) {
    var command = { "ID": ID, "altitude": altitude }
    var data = { "setAltitude": command }
    POST(data, () => { });
}

export function createFormation(ID: number, isLeader: boolean, wingmenIDs: number[]) {
    var command = { "ID": ID, "wingmenIDs": wingmenIDs, "isLeader": isLeader }
    var data = { "setLeader": command }
    POST(data, () => { });
}

export function setROE(ID: number, ROE: string) {
    var command = { "ID": ID, "ROE": ROE }
    var data = { "setROE": command }
    POST(data, () => { });
}

export function setReactionToThreat(ID: number, reactionToThreat: string) {
    var command = { "ID": ID, "reactionToThreat": reactionToThreat }
    var data = { "setReactionToThreat": command }
    POST(data, () => { });
}

export function setEmissionsCountermeasures(ID: number, emissionCountermeasure: string) {
    var command = { "ID": ID, "emissionsCountermeasures": emissionCountermeasure }
    var data = { "setEmissionsCountermeasures": command }
    POST(data, () => { });
}

export function setOnOff(ID: number, onOff: boolean) {
    var command = { "ID": ID, "onOff": onOff }
    var data = { "setOnOff": command }
    POST(data, () => { });
}

export function setFollowRoads(ID: number, followRoads: boolean) {
    var command = { "ID": ID, "followRoads": followRoads }
    var data = { "setFollowRoads": command }
    POST(data, () => { });
}

export function refuel(ID: number) {
    var command = { "ID": ID };
    var data = { "refuel": command }
    POST(data, () => { });
}

export function bombPoint(ID: number, latlng: LatLng) {
    var command = { "ID": ID, "location": latlng }
    var data = { "bombPoint": command }
    POST(data, () => { });
}

export function carpetBomb(ID: number, latlng: LatLng) {
    var command = { "ID": ID, "location": latlng }
    var data = { "carpetBomb": command }
    POST(data, () => { });
}

export function bombBuilding(ID: number, latlng: LatLng) {
    var command = { "ID": ID, "location": latlng }
    var data = { "bombBuilding": command }
    POST(data, () => { });
}

export function fireAtArea(ID: number, latlng: LatLng) {
    var command = { "ID": ID, "location": latlng }
    var data = { "fireAtArea": command }
    POST(data, () => { });
}

export function setAdvacedOptions(ID: number, isTanker: boolean, isAWACS: boolean, TACAN: TACAN, radio: Radio, generalSettings: GeneralSettings) {
    var command = {
        "ID": ID,
        "isTanker": isTanker,
        "isAWACS": isAWACS,
        "TACAN": TACAN,
        "radio": radio,
        "generalSettings": generalSettings
    };

    var data = { "setAdvancedOptions": command };
    POST(data, () => { });
}

export function startUpdate() {
    /* On the first connection, force request of full data */
    getAirbases((data: AirbasesData) => getMissionData()?.update(data));
    getBullseye((data: BullseyesData) => getMissionData()?.update(data));
    getMission((data: any) => { getMissionData()?.update(data) });
    getUnits((data: UnitsData) => getUnitsManager()?.update(data), true /* Does a full refresh */);

    requestUpdate();
    requestRefresh();
}

export function requestUpdate() {
    /* Main update rate = 250ms is minimum time, equal to server update time. */
    getUnits((data: UnitsData) => {
        if (!getPaused()) {
            getUnitsManager()?.update(data);
            checkSessionHash(data.sessionHash);
        }
    }, false);
    window.setTimeout(() => requestUpdate(), getConnected() ? 250 : 1000);

    getConnectionStatusPanel()?.update(getConnected());
}

export function requestRefresh() {
    /* Main refresh rate = 5000ms. */
    getUnits((data: UnitsData) => {
        if (!getPaused()) {
            getUnitsManager()?.update(data);
            getAirbases((data: AirbasesData) => getMissionData()?.update(data));
            getBullseye((data: BullseyesData) => getMissionData()?.update(data));
            getMission((data: any) => {
                getMissionData()?.update(data)
            });

            // Update the list of existing units
            getUnitDataTable()?.update();

            checkSessionHash(data.sessionHash);
        }
    }, true);
    window.setTimeout(() => requestRefresh(), 5000);
}

export function checkSessionHash(newSessionHash: string) {
    if (sessionHash != null) {
        if (newSessionHash != sessionHash)
            location.reload();
    }
    else
        sessionHash = newSessionHash;
}

export function setConnected(newConnected: boolean) {
    if (connected != newConnected)
        newConnected ? getInfoPopup().setText("Connected to DCS Olympus server") : getInfoPopup().setText("Disconnected from DCS Olympus server");
    connected = newConnected;

    if (connected) {
        document.querySelector("#splash-screen")?.classList.add("hide");
        document.querySelector("#gray-out")?.classList.add("hide");
    }
}

export function getConnected() {
    return connected;
}

export function setPaused(newPaused: boolean) {
    paused = newPaused;
    paused ? getInfoPopup().setText("View paused") : getInfoPopup().setText("View unpaused");
}

export function getPaused() {
    return paused;
}
import { LatLng } from 'leaflet';
import { getConnectionStatusPanel, getInfoPopup, getMissionData, getServerStatusPanel, getUnitDataTable, getUnitsManager, setLoginStatus } from '..';
import { GeneralSettings, Radio, TACAN } from '../@types/unit';
import { ROEs, emissionsCountermeasures, reactionsToThreat } from '../constants/constants';

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
var password = "";

var sessionHash: string | null = null;
var lastUpdateTimes: {[key: string]: number} = {}
var demoEnabled = false;

export function toggleDemoEnabled() {
    demoEnabled = !demoEnabled;
}

export function setCredentials(newUsername: string, newPassword: string) {
    username = newUsername;
    password = newPassword;
}

export function GET(callback: CallableFunction, uri: string, options?: { time?: number }, responseType?: string) {
    var xmlHttp = new XMLHttpRequest();

    /* Assemble the request options string */
    var optionsString = '';
    if (options?.time != undefined)
        optionsString = `time=${options.time}`;

    /* On the connection */
    xmlHttp.open("GET", `${demoEnabled ? DEMO_ADDRESS : REST_ADDRESS}/${uri}${optionsString ? `?${optionsString}` : ''}`, true);

    /* If provided, set the credentials */
    if (username && password)
        xmlHttp.setRequestHeader("Authorization", "Basic " + btoa(`${username}:${password}`));

    /* If specified, set the response type */
    if (responseType)
        xmlHttp.responseType = responseType as XMLHttpRequestResponseType;

    xmlHttp.onload = function (e) {
        if (xmlHttp.status == 200) {
            /* Success */
            setConnected(true);
            if (xmlHttp.responseType == 'arraybuffer')
                lastUpdateTimes[uri] = callback(xmlHttp.response);
            else {
                const result = JSON.parse(xmlHttp.responseText);
                lastUpdateTimes[uri] = callback(result);

                if (result.frameRate && result.load)
                    getServerStatusPanel().update(result.frameRate, result.load);
            }
        } else if (xmlHttp.status == 401) {
            /* Bad credentials */
            console.error("Incorrect username/password");
            setLoginStatus("failed");
        } else {
            /* Failure, probably disconnected */
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
    if (username && password)
        xmlHttp.setRequestHeader("Authorization", "Basic " + btoa(`${username}:${password}`));
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

export function getLogs(callback: CallableFunction, refresh: boolean = false) {
    GET(callback, LOGS_URI, { time: refresh ? 0 : lastUpdateTimes[LOGS_URI]});
}

export function getMission(callback: CallableFunction) {
    GET(callback, MISSION_URI);
}

export function getUnits(callback: CallableFunction, refresh: boolean = false) {
    GET(callback, UNITS_URI, { time: refresh ? 0 : lastUpdateTimes[UNITS_URI] }, 'arraybuffer');
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

export function spawnExplosion(intensity: number, latlng: LatLng) {
    var command = { "intensity": intensity, "location": latlng };
    var data = { "explosion": command }
    POST(data, () => { });
}

export function spawnAircrafts(units: any, coalition: string, airbaseName: string, immediate: boolean) {
    var command = { "units": units, "coalition": coalition, "airbaseName": airbaseName, "immediate": immediate };
    var data = { "spawnAircrafts": command }
    POST(data, () => { });
}

export function spawnHelicopters(units: any, coalition: string, airbaseName: string, immediate: boolean) {
    var command = { "units": units, "coalition": coalition, "airbaseName": airbaseName, "immediate": immediate };
    var data = { "spawnHelicopters": command }
    POST(data, () => { });
}

export function spawnGroundUnits(units: any, coalition: string, immediate: boolean) {
    var command = { "units": units, "coalition": coalition, "immediate": immediate };
    var data = { "spawnGroundUnits": command }
    POST(data, () => { });
}

export function spawnNavyUnits(units: any, coalition: string, immediate: boolean) {
    var command = { "units": units, "coalition": coalition, "immediate": immediate };
    var data = { "spawnNavyUnits": command }
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

export function deleteUnit(ID: number, explosion: boolean, immediate: boolean) {
    var command = { "ID": ID, "explosion": explosion, "immediate": immediate };
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
    var command = { "ID": ID, "ROE": ROEs.indexOf(ROE) }
    var data = { "setROE": command }
    POST(data, () => { });
}

export function setReactionToThreat(ID: number, reactionToThreat: string) {
    var command = { "ID": ID, "reactionToThreat": reactionsToThreat.indexOf(reactionToThreat) }
    var data = { "setReactionToThreat": command }
    POST(data, () => { });
}

export function setEmissionsCountermeasures(ID: number, emissionCountermeasure: string) {
    var command = { "ID": ID, "emissionsCountermeasures": emissionsCountermeasures.indexOf(emissionCountermeasure) }
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
    getMission((data: any) => { 
        getMissionData()?.update(data);
        checkSessionHash(data.sessionHash);
    });
    getUnits((buffer: ArrayBuffer) => {return getUnitsManager()?.update(buffer), true /* Does a full refresh */});

    requestUpdate();
    requestRefresh();
}

export function requestUpdate() {
    /* Main update rate = 250ms is minimum time, equal to server update time. */
    if (!getPaused()) {
        getUnits((buffer: ArrayBuffer) => { return getUnitsManager()?.update(buffer); }, false);
    }
    window.setTimeout(() => requestUpdate(), getConnected() ? 250 : 1000);

    getConnectionStatusPanel()?.update(getConnected());
}

export function requestRefresh() {
    /* Main refresh rate = 5000ms. */
    if (!getPaused()) {
        getAirbases((data: AirbasesData) => getMissionData()?.update(data));
        getBullseye((data: BullseyesData) => getMissionData()?.update(data));
        getLogs((data: any) => {
            for (let key in data.logs) {
                if (key != "requestTime")
                    console.log(data.logs[key]);
            }
            return data.time;
        });
        getMission((data: any) => {
            checkSessionHash(data.sessionHash);
            getMissionData()?.update(data)
        });

        // Update the list of existing units
        getUnitDataTable()?.update();
    }
    window.setTimeout(() => requestRefresh(), 1000);
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
import { LatLng } from 'leaflet';
import { getConnectionStatusPanel, getInfoPopup, getLogPanel, getMissionHandler, getServerStatusPanel, getUnitsManager, getWeaponsManager, setLoginStatus } from '..';
import { GeneralSettings, Radio, TACAN } from '../@types/unit';
import { AIRBASES_URI, BULLSEYE_URI, COMMANDS_URI, LOGS_URI, MISSION_URI, NONE, ROEs, UNITS_URI, WEAPONS_URI, emissionsCountermeasures, reactionsToThreat } from '../constants/constants';

var connected: boolean = false;
var paused: boolean = false;

var REST_ADDRESS = "http://localhost:30000/olympus";
var DEMO_ADDRESS = window.location.href + "demo";

var username = "";
var password = "";

var sessionHash: string | null = null;
var lastUpdateTimes: {[key: string]: number} = {}
lastUpdateTimes[UNITS_URI] = Date.now();
lastUpdateTimes[WEAPONS_URI] = Date.now();
lastUpdateTimes[LOGS_URI] = Date.now();
lastUpdateTimes[AIRBASES_URI] = Date.now();
lastUpdateTimes[BULLSEYE_URI] = Date.now();
lastUpdateTimes[MISSION_URI] = Date.now();

var demoEnabled = false;

export function toggleDemoEnabled() {
    demoEnabled = !demoEnabled;
}

export function setCredentials(newUsername: string, newPassword: string) {
    username = newUsername;
    password = newPassword;
}

export function GET(callback: CallableFunction, uri: string, options?: ServerRequestOptions, responseType?: string) {
    var xmlHttp = new XMLHttpRequest();

    /* Assemble the request options string */
    var optionsString = '';
    if (options?.time != undefined)
        optionsString = `time=${options.time}`;
    if (options?.commandHash != undefined)
        optionsString = `commandHash=${options.commandHash}`;

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

                if (result.frameRate !== undefined && result.load !== undefined)
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
    xmlHttp.onload = (res: any) => {
        var res = JSON.parse(xmlHttp.responseText);
        callback(res);
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

export function getWeapons(callback: CallableFunction, refresh: boolean = false) {
    GET(callback, WEAPONS_URI, { time: refresh ? 0 : lastUpdateTimes[WEAPONS_URI] }, 'arraybuffer');
}

export function isCommandExecuted(callback: CallableFunction, commandHash: string) {
    GET(callback, COMMANDS_URI, { commandHash: commandHash});
}

export function addDestination(ID: number, path: any, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "path": path }
    var data = { "setPath": command }
    POST(data, callback);
}

export function spawnSmoke(color: string, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { "color": color, "location": latlng };
    var data = { "smoke": command }
    POST(data, callback);
}

export function spawnExplosion(intensity: number, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { "intensity": intensity, "location": latlng };
    var data = { "explosion": command }
    POST(data, callback);
}

export function spawnAircrafts(units: any, coalition: string, airbaseName: string, country: string, immediate: boolean, spawnPoints: number, callback: CallableFunction = () => {}) {
    var command = { "units": units, "coalition": coalition, "airbaseName": airbaseName, "country": country, "immediate": immediate, "spawnPoints": spawnPoints };
    var data = { "spawnAircrafts": command }
    POST(data, callback);
}

export function spawnHelicopters(units: any, coalition: string, airbaseName: string, country: string, immediate: boolean, spawnPoints: number, callback: CallableFunction = () => {}) {
    var command = { "units": units, "coalition": coalition, "airbaseName": airbaseName, "country": country, "immediate": immediate, "spawnPoints": spawnPoints };
    var data = { "spawnHelicopters": command }
    POST(data, callback);
}

export function spawnGroundUnits(units: any, coalition: string, country: string, immediate: boolean, spawnPoints: number, callback: CallableFunction = () => {}) {
    var command = { "units": units, "coalition": coalition, "country": country, "immediate": immediate, "spawnPoints": spawnPoints };;
    var data = { "spawnGroundUnits": command }
    POST(data, callback);
}

export function spawnNavyUnits(units: any, coalition: string, country: string, immediate: boolean, spawnPoints: number, callback: CallableFunction = () => {}) {
    var command = { "units": units, "coalition": coalition, "country": country, "immediate": immediate, "spawnPoints": spawnPoints };
    var data = { "spawnNavyUnits": command }
    POST(data, callback);
}

export function attackUnit(ID: number, targetID: number, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "targetID": targetID };
    var data = { "attackUnit": command }
    POST(data, callback);
}

export function followUnit(ID: number, targetID: number, offset: { "x": number, "y": number, "z": number }, callback: CallableFunction = () => {}) {
    // X: front-rear, positive front
    // Y: top-bottom, positive bottom
    // Z: left-right, positive right

    var command = { "ID": ID, "targetID": targetID, "offsetX": offset["x"], "offsetY": offset["y"], "offsetZ": offset["z"] };
    var data = { "followUnit": command }
    POST(data, callback);
}

export function cloneUnits(units: {ID: number, location: LatLng}[], deleteOriginal: boolean, spawnPoints: number, callback: CallableFunction = () => {}) {
    var command = { "units": units, "deleteOriginal": deleteOriginal, "spawnPoints": spawnPoints };
    var data = { "cloneUnits": command }
    POST(data, callback);
}

export function deleteUnit(ID: number, explosion: boolean, immediate: boolean, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "explosion": explosion, "immediate": immediate };
    var data = { "deleteUnit": command }
    POST(data, callback);
}

export function landAt(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "location": latlng };
    var data = { "landAt": command }
    POST(data, callback);
}

export function changeSpeed(ID: number, speedChange: string, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "change": speedChange }
    var data = { "changeSpeed": command }
    POST(data, callback);
}

export function setSpeed(ID: number, speed: number, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "speed": speed }
    var data = { "setSpeed": command }
    POST(data, callback);
}

export function setSpeedType(ID: number, speedType: string, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "speedType": speedType }
    var data = { "setSpeedType": command }
    POST(data, callback);
}

export function changeAltitude(ID: number, altitudeChange: string, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "change": altitudeChange }
    var data = { "changeAltitude": command }
    POST(data, callback);
}

export function setAltitudeType(ID: number, altitudeType: string, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "altitudeType": altitudeType }
    var data = { "setAltitudeType": command }
    POST(data, callback);
}

export function setAltitude(ID: number, altitude: number, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "altitude": altitude }
    var data = { "setAltitude": command }
    POST(data, callback);
}

export function createFormation(ID: number, isLeader: boolean, wingmenIDs: number[], callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "wingmenIDs": wingmenIDs, "isLeader": isLeader }
    var data = { "setLeader": command }
    POST(data, callback);
}

export function setROE(ID: number, ROE: string, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "ROE": ROEs.indexOf(ROE) }
    var data = { "setROE": command }
    POST(data, callback);
}

export function setReactionToThreat(ID: number, reactionToThreat: string, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "reactionToThreat": reactionsToThreat.indexOf(reactionToThreat) }
    var data = { "setReactionToThreat": command }
    POST(data, callback);
}

export function setEmissionsCountermeasures(ID: number, emissionCountermeasure: string, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "emissionsCountermeasures": emissionsCountermeasures.indexOf(emissionCountermeasure) }
    var data = { "setEmissionsCountermeasures": command }
    POST(data, callback);
}

export function setOnOff(ID: number, onOff: boolean, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "onOff": onOff }
    var data = { "setOnOff": command }
    POST(data, callback);
}

export function setFollowRoads(ID: number, followRoads: boolean, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "followRoads": followRoads }
    var data = { "setFollowRoads": command }
    POST(data, callback);
}

export function refuel(ID: number, callback: CallableFunction = () => {}) {
    var command = { "ID": ID };
    var data = { "refuel": command }
    POST(data, callback);
}

export function bombPoint(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "location": latlng }
    var data = { "bombPoint": command }
    POST(data, callback);
}

export function carpetBomb(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "location": latlng }
    var data = { "carpetBomb": command }
    POST(data, callback);
}

export function bombBuilding(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "location": latlng }
    var data = { "bombBuilding": command }
    POST(data, callback);
}

export function fireAtArea(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "location": latlng }
    var data = { "fireAtArea": command }
    POST(data, callback);
}

export function simulateFireFight(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { "ID": ID, "location": latlng }
    var data = { "simulateFireFight": command }
    POST(data, callback);
}

export function setAdvacedOptions(ID: number, isTanker: boolean, isAWACS: boolean, TACAN: TACAN, radio: Radio, generalSettings: GeneralSettings, callback: CallableFunction = () => {}) {
    var command = {
        "ID": ID,
        "isTanker": isTanker,
        "isAWACS": isAWACS,
        "TACAN": TACAN,
        "radio": radio,
        "generalSettings": generalSettings
    };

    var data = { "setAdvancedOptions": command };
    POST(data, callback);
}

export function setCommandModeOptions(restrictSpawns: boolean, restrictToCoalition: boolean, spawnPoints: {blue: number, red: number}, eras: string[], setupTime: number, callback: CallableFunction = () => {}) {
    var command = {
        "restrictSpawns": restrictSpawns,
        "restrictToCoalition": restrictToCoalition,
        "spawnPoints": spawnPoints,
        "eras": eras,
        "setupTime": setupTime
    };

    var data = { "setCommandModeOptions": command };
    POST(data, callback);
}

export function startUpdate() {
    window.setInterval(() => {
        if (!getPaused()) {
            getMission((data: MissionData) => {
                checkSessionHash(data.sessionHash);
                getMissionHandler()?.updateMission(data);
                return data.time;
            });
        }
    }, 1000);

    window.setInterval(() => {
        if (!getPaused() && getMissionHandler().getCommandModeOptions().commandMode != NONE) {
            getAirbases((data: AirbasesData) => {
                checkSessionHash(data.sessionHash);
                getMissionHandler()?.updateAirbases(data);
                return data.time;
            });
        }
    }, 10000);

    window.setInterval(() => {
        if (!getPaused() && getMissionHandler().getCommandModeOptions().commandMode != NONE){
            getBullseye((data: BullseyesData) => {
                checkSessionHash(data.sessionHash);
                getMissionHandler()?.updateBullseyes(data);
                return data.time;
            });
        }
    }, 10000);

    window.setInterval(() => {
        if (!getPaused() && getMissionHandler().getCommandModeOptions().commandMode != NONE) {
            getLogs((data: any) => {
                checkSessionHash(data.sessionHash);
                getLogPanel().appendLogs(data.logs)
                return data.time;
            });
        }
    }, 1000);

    window.setInterval(() => {
        if (!getPaused() && getMissionHandler().getCommandModeOptions().commandMode != NONE) {
            getUnits((buffer: ArrayBuffer) => {
                var time = getUnitsManager()?.update(buffer); 
                return time;
            }, false);
        }
    }, 250);

    window.setInterval(() => {
        if (!getPaused() && getMissionHandler().getCommandModeOptions().commandMode != NONE) {
            getWeapons((buffer: ArrayBuffer) => {
                var time = getWeaponsManager()?.update(buffer); 
                return time;
            }, false);
        }
    }, 250);

    window.setInterval(() => {
        if (!getPaused() && getMissionHandler().getCommandModeOptions().commandMode != NONE) {
            getUnits((buffer: ArrayBuffer) => {
                var time = getUnitsManager()?.update(buffer); 
                return time;
            }, true);
            getConnectionStatusPanel()?.update(getConnected());
        }
    }, 5000);

    window.setInterval(() => {
        if (!getPaused() && getMissionHandler().getCommandModeOptions().commandMode != NONE) {
            getWeapons((buffer: ArrayBuffer) => {
                var time = getWeaponsManager()?.update(buffer); 
                return time;
            }, true);
        }
    }, 5000);
}

export function refreshAll() {
    getAirbases((data: AirbasesData) => {
        checkSessionHash(data.sessionHash);
        getMissionHandler()?.updateAirbases(data);
        return data.time;
    });

    getBullseye((data: BullseyesData) => {
        checkSessionHash(data.sessionHash);
        getMissionHandler()?.updateBullseyes(data);
        return data.time;
    });

    getLogs((data: any) => {
        checkSessionHash(data.sessionHash);
        getLogPanel().appendLogs(data.logs)
        return data.time;
    });

    getWeapons((buffer: ArrayBuffer) => {
        var time = getWeaponsManager()?.update(buffer); 
        return time;
    }, true);

    getUnits((buffer: ArrayBuffer) => {
        var time = getUnitsManager()?.update(buffer); 
        return time;
    }, true);
}

export function checkSessionHash(newSessionHash: string) {
    if (sessionHash != null) {
        if (newSessionHash !== sessionHash)
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
import { LatLng } from 'leaflet';
import { getApp } from '..';
import { AIRBASES_URI, BULLSEYE_URI, COMMANDS_URI, LOGS_URI, MISSION_URI, NONE, ROEs, UNITS_URI, WEAPONS_URI, emissionsCountermeasures, reactionsToThreat } from '../constants/constants';
import { ServerStatusPanel } from '../panels/serverstatuspanel';
import { LogPanel } from '../panels/logpanel';
import { Popup } from '../popups/popup';
import { ConnectionStatusPanel } from '../panels/connectionstatuspanel';
import { AirbasesData, BullseyesData, GeneralSettings, MissionData, Radio, ServerRequestOptions, TACAN } from '../interfaces';
import { zeroAppend } from '../other/utils';

export class ServerManager {
    #connected: boolean = false;
    #paused: boolean = false;
    #REST_ADDRESS = "http://localhost:30000/olympus";
    #DEMO_ADDRESS = window.location.href + "demo";
    #username = "";
    #password = "";
    #sessionHash: string | null = null;
    #lastUpdateTimes: {[key: string]: number} = {}
    #demoEnabled = false;
    #previousMissionElapsedTime:number = 0;  //  Track if mission elapsed time is increasing (i.e. is the server paused)
    #serverIsPaused: boolean = false;

    constructor() {
        this.#lastUpdateTimes[UNITS_URI] = Date.now();
        this.#lastUpdateTimes[WEAPONS_URI] = Date.now();
        this.#lastUpdateTimes[LOGS_URI] = Date.now();
        this.#lastUpdateTimes[AIRBASES_URI] = Date.now();
        this.#lastUpdateTimes[BULLSEYE_URI] = Date.now();
        this.#lastUpdateTimes[MISSION_URI] = Date.now();
    }

    toggleDemoEnabled() {
        this.#demoEnabled = !this.#demoEnabled;
    }

    setCredentials(newUsername: string, newPassword: string) {
        this.#username = newUsername;
        this.#password = newPassword;
    }

    GET(callback: CallableFunction, uri: string, options?: ServerRequestOptions, responseType?: string) {
        var xmlHttp = new XMLHttpRequest();

        /* Assemble the request options string */
        var optionsString = '';
        if (options?.time != undefined)
            optionsString = `time=${options.time}`;
        if (options?.commandHash != undefined)
            optionsString = `commandHash=${options.commandHash}`;

        /* On the connection */
        xmlHttp.open("GET", `${this.#demoEnabled ? this.#DEMO_ADDRESS : this.#REST_ADDRESS}/${uri}${optionsString ? `?${optionsString}` : ''}`, true);

        /* If provided, set the credentials */
        if (this.#username && this.#password)
            xmlHttp.setRequestHeader("Authorization", "Basic " + btoa(`${this.#username}:${this.#password}`));

        /* If specified, set the response type */
        if (responseType)
            xmlHttp.responseType = responseType as XMLHttpRequestResponseType;

        xmlHttp.onload = (e) => {
            if (xmlHttp.status == 200) {
                /* Success */
                this.setConnected(true);
                if (xmlHttp.responseType == 'arraybuffer')
                    this.#lastUpdateTimes[uri] = callback(xmlHttp.response);
                else {
                    const result = JSON.parse(xmlHttp.responseText);
                    this.#lastUpdateTimes[uri] = callback(result);

                    if (result.frameRate !== undefined && result.load !== undefined)
                        (getApp().getPanelsManager().get("serverStatus") as ServerStatusPanel).update(result.frameRate, result.load);
                }
            } else if (xmlHttp.status == 401) {
                /* Bad credentials */
                console.error("Incorrect username/password");
                getApp().setLoginStatus("failed");
            } else {
                /* Failure, probably disconnected */
                this.setConnected(false);
            }
        };
        xmlHttp.onerror = (res) => {
            console.error("An error occurred during the XMLHttpRequest");
            this.setConnected(false);
        };
        xmlHttp.send(null);
    }

    PUT(request: object, callback: CallableFunction) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("PUT", this.#demoEnabled ? this.#DEMO_ADDRESS : this.#REST_ADDRESS);
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        if (this.#username && this.#password)
            xmlHttp.setRequestHeader("Authorization", "Basic " + btoa(`${this.#username}:${this.#password}`));
        xmlHttp.onload = (res: any) => {
            var res = JSON.parse(xmlHttp.responseText);
            callback(res);
        };
        xmlHttp.send(JSON.stringify(request));
    }

    getConfig(callback: CallableFunction) {
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

    setAddress(address: string, port: number) {
        this.#REST_ADDRESS = `http://${address}:${port}/olympus`
        console.log(`Setting REST address to ${this.#REST_ADDRESS}`)
    }

    getAirbases(callback: CallableFunction) {
        this.GET(callback, AIRBASES_URI);
    }

    getBullseye(callback: CallableFunction) {
        this.GET(callback, BULLSEYE_URI);
    }

    getLogs(callback: CallableFunction, refresh: boolean = false) {
        this.GET(callback, LOGS_URI, { time: refresh ? 0 : this.#lastUpdateTimes[LOGS_URI]});
    }

    getMission(callback: CallableFunction) {
        this.GET(callback, MISSION_URI);
    }

    getUnits(callback: CallableFunction, refresh: boolean = false) {
        this.GET(callback, UNITS_URI, { time: refresh ? 0 : this.#lastUpdateTimes[UNITS_URI] }, 'arraybuffer');
    }

    getWeapons(callback: CallableFunction, refresh: boolean = false) {
        this.GET(callback, WEAPONS_URI, { time: refresh ? 0 : this.#lastUpdateTimes[WEAPONS_URI] }, 'arraybuffer');
    }

    isCommandExecuted(callback: CallableFunction, commandHash: string) {
        this.GET(callback, COMMANDS_URI, { commandHash: commandHash});
    }

    addDestination(ID: number, path: any, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "path": path }
        var data = { "setPath": command }
        this.PUT(data, callback);
    }

    spawnSmoke(color: string, latlng: LatLng, callback: CallableFunction = () => {}) {
        var command = { "color": color, "location": latlng };
        var data = { "smoke": command }
        this.PUT(data, callback);
    }

    spawnExplosion(intensity: number, latlng: LatLng, callback: CallableFunction = () => {}) {
        var command = { "intensity": intensity, "location": latlng };
        var data = { "explosion": command }
        this.PUT(data, callback);
    }

    spawnAircrafts(units: any, coalition: string, airbaseName: string, country: string, immediate: boolean, spawnPoints: number, callback: CallableFunction = () => {}) {
        var command = { "units": units, "coalition": coalition, "airbaseName": airbaseName, "country": country, "immediate": immediate, "spawnPoints": spawnPoints };
        var data = { "spawnAircrafts": command }
        this.PUT(data, callback);
    }

    spawnHelicopters(units: any, coalition: string, airbaseName: string, country: string, immediate: boolean, spawnPoints: number, callback: CallableFunction = () => {}) {
        var command = { "units": units, "coalition": coalition, "airbaseName": airbaseName, "country": country, "immediate": immediate, "spawnPoints": spawnPoints };
        var data = { "spawnHelicopters": command }
        this.PUT(data, callback);
    }

    spawnGroundUnits(units: any, coalition: string, country: string, immediate: boolean, spawnPoints: number, callback: CallableFunction = () => {}) {
        var command = { "units": units, "coalition": coalition, "country": country, "immediate": immediate, "spawnPoints": spawnPoints };;
        var data = { "spawnGroundUnits": command }
        this.PUT(data, callback);
    }

    spawnNavyUnits(units: any, coalition: string, country: string, immediate: boolean, spawnPoints: number, callback: CallableFunction = () => {}) {
        var command = { "units": units, "coalition": coalition, "country": country, "immediate": immediate, "spawnPoints": spawnPoints };
        var data = { "spawnNavyUnits": command }
        this.PUT(data, callback);
    }

    attackUnit(ID: number, targetID: number, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "targetID": targetID };
        var data = { "attackUnit": command }
        this.PUT(data, callback);
    }

    followUnit(ID: number, targetID: number, offset: { "x": number, "y": number, "z": number }, callback: CallableFunction = () => {}) {
        // X: front-rear, positive front
        // Y: top-bottom, positive bottom
        // Z: left-right, positive right

        var command = { "ID": ID, "targetID": targetID, "offsetX": offset["x"], "offsetY": offset["y"], "offsetZ": offset["z"] };
        var data = { "followUnit": command }
        this.PUT(data, callback);
    }

    cloneUnits(units: {ID: number, location: LatLng}[], deleteOriginal: boolean, spawnPoints: number, callback: CallableFunction = () => {}) {
        var command = { "units": units, "deleteOriginal": deleteOriginal, "spawnPoints": spawnPoints };
        var data = { "cloneUnits": command }
        this.PUT(data, callback);
    }

    deleteUnit(ID: number, explosion: boolean, immediate: boolean, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "explosion": explosion, "immediate": immediate };
        var data = { "deleteUnit": command }
        this.PUT(data, callback);
    }

    landAt(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "location": latlng };
        var data = { "landAt": command }
        this.PUT(data, callback);
    }

    changeSpeed(ID: number, speedChange: string, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "change": speedChange }
        var data = { "changeSpeed": command }
        this.PUT(data, callback);
    }

    setSpeed(ID: number, speed: number, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "speed": speed }
        var data = { "setSpeed": command }
        this.PUT(data, callback);
    }

    setSpeedType(ID: number, speedType: string, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "speedType": speedType }
        var data = { "setSpeedType": command }
        this.PUT(data, callback);
    }

    changeAltitude(ID: number, altitudeChange: string, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "change": altitudeChange }
        var data = { "changeAltitude": command }
        this.PUT(data, callback);
    }

    setAltitudeType(ID: number, altitudeType: string, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "altitudeType": altitudeType }
        var data = { "setAltitudeType": command }
        this.PUT(data, callback);
    }

    setAltitude(ID: number, altitude: number, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "altitude": altitude }
        var data = { "setAltitude": command }
        this.PUT(data, callback);
    }

    createFormation(ID: number, isLeader: boolean, wingmenIDs: number[], callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "wingmenIDs": wingmenIDs, "isLeader": isLeader }
        var data = { "setLeader": command }
        this.PUT(data, callback);
    }

    setROE(ID: number, ROE: string, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "ROE": ROEs.indexOf(ROE) }
        var data = { "setROE": command }
        this.PUT(data, callback);
    }

    setReactionToThreat(ID: number, reactionToThreat: string, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "reactionToThreat": reactionsToThreat.indexOf(reactionToThreat) }
        var data = { "setReactionToThreat": command }
        this.PUT(data, callback);
    }

    setEmissionsCountermeasures(ID: number, emissionCountermeasure: string, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "emissionsCountermeasures": emissionsCountermeasures.indexOf(emissionCountermeasure) }
        var data = { "setEmissionsCountermeasures": command }
        this.PUT(data, callback);
    }

    setOnOff(ID: number, onOff: boolean, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "onOff": onOff }
        var data = { "setOnOff": command }
        this.PUT(data, callback);
    }

    setFollowRoads(ID: number, followRoads: boolean, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "followRoads": followRoads }
        var data = { "setFollowRoads": command }
        this.PUT(data, callback);
    }

    setOperateAs(ID: number, operateAs: number, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "operateAs": operateAs }
        var data = { "setOperateAs": command }
        this.PUT(data, callback);
    }


    refuel(ID: number, callback: CallableFunction = () => {}) {
        var command = { "ID": ID };
        var data = { "refuel": command }
        this.PUT(data, callback);
    }

    bombPoint(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "location": latlng }
        var data = { "bombPoint": command }
        this.PUT(data, callback);
    }

    carpetBomb(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "location": latlng }
        var data = { "carpetBomb": command }
        this.PUT(data, callback);
    }

    bombBuilding(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "location": latlng }
        var data = { "bombBuilding": command }
        this.PUT(data, callback);
    }

    fireAtArea(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "location": latlng }
        var data = { "fireAtArea": command }
        this.PUT(data, callback);
    }

    simulateFireFight(ID: number, latlng: LatLng, altitude: number, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "location": latlng, "altitude": altitude }
        var data = { "simulateFireFight": command }
        this.PUT(data, callback);
    }

    scenicAAA(ID: number, coalition: string, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "coalition": coalition }
        var data = { "scenicAAA": command }
        this.PUT(data, callback);
    }

    missOnPurpose(ID: number, coalition: string, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "coalition": coalition }
        var data = { "missOnPurpose": command }
        this.PUT(data, callback);
    }

    landAtPoint(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "location": latlng }
        var data = { "landAtPoint": command }
        this.PUT(data, callback);
    }

    setShotsScatter(ID: number, shotsScatter: number, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "shotsScatter": shotsScatter }
        var data = { "setShotsScatter": command }
        this.PUT(data, callback);
    }

    setShotsIntensity(ID: number, shotsIntensity: number, callback: CallableFunction = () => {}) {
        var command = { "ID": ID, "shotsIntensity": shotsIntensity }
        var data = { "setShotsIntensity": command }
        this.PUT(data, callback);
    }

    setAdvacedOptions(ID: number, isActiveTanker: boolean, isActiveAWACS: boolean, TACAN: TACAN, radio: Radio, generalSettings: GeneralSettings, callback: CallableFunction = () => {}) {
        var command = {
            "ID": ID,
            "isActiveTanker": isActiveTanker,
            "isActiveAWACS": isActiveAWACS,
            "TACAN": TACAN,
            "radio": radio,
            "generalSettings": generalSettings
        };

        var data = { "setAdvancedOptions": command };
        this.PUT(data, callback);
    }

    setCommandModeOptions(restrictSpawns: boolean, restrictToCoalition: boolean, spawnPoints: {blue: number, red: number}, eras: string[], setupTime: number, callback: CallableFunction = () => {}) {
        var command = {
            "restrictSpawns": restrictSpawns,
            "restrictToCoalition": restrictToCoalition,
            "spawnPoints": spawnPoints,
            "eras": eras,
            "setupTime": setupTime
        };

        var data = { "setCommandModeOptions": command };
        this.PUT(data, callback);
    }

    reloadDatabases(callback: CallableFunction = () => {}) {
        var data = { "reloadDatabases": {} };
        this.PUT(data, callback);
    }

    startUpdate() {
        window.setInterval(() => {
            if (!this.getPaused()) {
                this.getMission((data: MissionData) => {
                    this.checkSessionHash(data.sessionHash);
                    getApp().getMissionManager()?.updateMission(data);
                    return data.time;
                });
            }
        }, 1000);

        window.setInterval(() => {
            if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE) {
                this.getAirbases((data: AirbasesData) => {
                    this.checkSessionHash(data.sessionHash);
                    getApp().getMissionManager()?.updateAirbases(data);
                    return data.time;
                });
            }
        }, 10000);

        window.setInterval(() => {
            if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE){
                this.getBullseye((data: BullseyesData) => {
                    this.checkSessionHash(data.sessionHash);
                    getApp().getMissionManager()?.updateBullseyes(data);
                    return data.time;
                });
            }
        }, 10000);

        window.setInterval(() => {
            if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE) {
                this.getLogs((data: any) => {
                    this.checkSessionHash(data.sessionHash);
                    (getApp().getPanelsManager().get("log") as LogPanel).appendLogs(data.logs)
                    return data.time;
                });
            }
        }, 1000);

        window.setInterval(() => {
            if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE) {
                this.getUnits((buffer: ArrayBuffer) => {
                    var time = getApp().getUnitsManager()?.update(buffer); 
                    return time;
                }, false);
            }
        }, 250);

        window.setInterval(() => {
            if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE) {
                this.getWeapons((buffer: ArrayBuffer) => {
                    var time = getApp().getWeaponsManager()?.update(buffer); 
                    return time;
                }, false);
            }
        }, 250);

        window.setInterval(() => {
            if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE) {
                this.getUnits((buffer: ArrayBuffer) => {
                    var time = getApp().getUnitsManager()?.update(buffer); 
                    return time;
                }, true);

                const elapsedMissionTime         = getApp().getMissionManager().getDateAndTime().elapsedTime;
                this.#serverIsPaused             = ( elapsedMissionTime === this.#previousMissionElapsedTime );
                this.#previousMissionElapsedTime = elapsedMissionTime;

                const csp = (getApp().getPanelsManager().get("connectionStatus") as ConnectionStatusPanel);

                if ( this.getConnected() ) {
                    if ( this.getServerIsPaused() ) {
                        csp.showServerPaused();
                    } else {
                        csp.showConnected();
                    }
                } else {
                    csp.showDisconnected();
                }

            }
        }, ( this.getServerIsPaused() ? 500 : 5000 ));

        //  Mission clock and elapsed time
        window.setInterval( () => {
            
            if ( !this.getConnected() || this.#serverIsPaused ) {
                return;
            }

            const elapsedMissionTime = getApp().getMissionManager().getDateAndTime().elapsedTime;

            const csp = (getApp().getPanelsManager().get("connectionStatus") as ConnectionStatusPanel);
            const mt  = getApp().getMissionManager().getDateAndTime().time;

            csp.setMissionTime( [ mt.h, mt.m, mt.s ].map( n => zeroAppend( n, 2 )).join( ":" ) );
            csp.setElapsedTime( new Date( elapsedMissionTime * 1000 ).toISOString().substring( 11, 19 ) );

        }, 1000 );

        window.setInterval(() => {
            if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE) {
                this.getWeapons((buffer: ArrayBuffer) => {
                    var time = getApp().getWeaponsManager()?.update(buffer); 
                    return time;
                }, true);
            }
        }, 5000);
    }

    refreshAll() {
        this.getAirbases((data: AirbasesData) => {
            this.checkSessionHash(data.sessionHash);
            getApp().getMissionManager()?.updateAirbases(data);
            return data.time;
        });

        this.getBullseye((data: BullseyesData) => {
            this.checkSessionHash(data.sessionHash);
            getApp().getMissionManager()?.updateBullseyes(data);
            return data.time;
        });

        this.getLogs((data: any) => {
            this.checkSessionHash(data.sessionHash);
            (getApp().getPanelsManager().get("log") as LogPanel).appendLogs(data.logs)
            return data.time;
        });

        this.getWeapons((buffer: ArrayBuffer) => {
            var time = getApp().getWeaponsManager()?.update(buffer); 
            return time;
        }, true);

        this.getUnits((buffer: ArrayBuffer) => {
            var time = getApp().getUnitsManager()?.update(buffer); 
            return time;
        }, true);
    }

    checkSessionHash(newSessionHash: string) {
        if (this.#sessionHash != null) {
            if (newSessionHash !== this.#sessionHash)
                location.reload();
        }
        else
            this.#sessionHash = newSessionHash;
    }

    setConnected(newConnected: boolean) {
        if (this.#connected != newConnected) {
            newConnected ? (getApp().getPopupsManager().get("infoPopup") as Popup).setText("Connected to DCS Olympus server") : (getApp().getPopupsManager().get("infoPopup") as Popup).setText("Disconnected from DCS Olympus server");
            if (newConnected) {
                document.getElementById("splash-screen")?.classList.add("hide");
                document.getElementById("gray-out")?.classList.add("hide");
            }
        }

        this.#connected = newConnected;
    }

    getConnected() {
        return this.#connected;
    }

    setPaused(newPaused: boolean) {
        this.#paused = newPaused;
        this.#paused ? (getApp().getPopupsManager().get("infoPopup") as Popup).setText("View paused") : (getApp().getPopupsManager().get("infoPopup") as Popup).setText("View unpaused");
    }

    getPaused() {
        return this.#paused;
    }

    getServerIsPaused() {
        return this.#serverIsPaused;
    }
}

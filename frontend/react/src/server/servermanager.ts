import { LatLng } from "leaflet";
import { getApp } from "../olympusapp";
import {
  AIRBASES_URI,
  BULLSEYE_URI,
  COMMANDS_URI,
  LOGS_URI,
  MISSION_URI,
  NONE,
  ROEs,
  UNITS_URI,
  WEAPONS_URI,
  emissionsCountermeasures,
  reactionsToThreat,
} from "../constants/constants";
import { AirbasesData, BullseyesData, GeneralSettings, MissionData, Radio, ServerRequestOptions, ServerStatus, TACAN } from "../interfaces";

export class ServerManager {
  #connected: boolean = false;
  #paused: boolean = false;
  #REST_ADDRESS = "http://localhost:3001/olympus";
  #username = "no-username";
  #password = "";
  #sessionHash: string | null = null;
  #lastUpdateTimes: { [key: string]: number } = {};
  #previousMissionElapsedTime: number = 0; // Track if mission elapsed time is increasing (i.e. is the server paused)
  #serverIsPaused: boolean = false;
  #intervals: number[] = [];
  #requests: { [key: string]: XMLHttpRequest } = {};

  constructor() {
    this.#lastUpdateTimes[UNITS_URI] = Date.now();
    this.#lastUpdateTimes[WEAPONS_URI] = Date.now();
    this.#lastUpdateTimes[LOGS_URI] = Date.now();
    this.#lastUpdateTimes[AIRBASES_URI] = Date.now();
    this.#lastUpdateTimes[BULLSEYE_URI] = Date.now();
    this.#lastUpdateTimes[MISSION_URI] = Date.now();
  }

  setUsername(newUsername: string) {
    this.#username = newUsername;
  }

  setPassword(newPassword: string) {
    this.#password = newPassword;
  }

  GET(
    callback: CallableFunction,
    errorCallback: CallableFunction,
    uri: string,
    options?: ServerRequestOptions,
    responseType: string = "text",
    force: boolean = false
  ) {
    var xmlHttp = new XMLHttpRequest();

    /* If a request on this uri is still pending (meaning it's not done or did not yet fail), skip the request, to avoid clogging the TCP workers */
    /* If we are forcing the request we don't care if one already exists, just send it. CAREFUL: this makes sense only for low frequency requests, like refreshes, when we
            are reasonably confident any previous request will be done before we make a new one on the same URI. */
    if (uri in this.#requests && this.#requests[uri].readyState !== 4 && !force) {
      console.warn(`GET request on ${uri} URI still pending, skipping...`);
      return;
    }

    if (!force) this.#requests[uri] = xmlHttp;

    /* Assemble the request options string */
    var optionsString = "";
    if (options?.time != undefined) optionsString = `time=${options.time}`;
    if (options?.commandHash != undefined) optionsString = `commandHash=${options.commandHash}`;

    /* On the connection */
    xmlHttp.open("GET", `${this.#REST_ADDRESS}/${uri}${optionsString ? `?${optionsString}` : ""}`, true);

    /* If provided, set the credentials */
    if (this.#username && this.#password) xmlHttp.setRequestHeader("Authorization", "Basic " + btoa(`${this.#username}:${this.#password}`));

    /* If specified, set the response type */
    if (responseType) xmlHttp.responseType = responseType as XMLHttpRequestResponseType;

    xmlHttp.onload = (e) => {
      if (xmlHttp.status == 200) {
        /* Success */
        this.setConnected(true);
        if (xmlHttp.responseType == "arraybuffer") this.#lastUpdateTimes[uri] = callback(xmlHttp.response);
        else {
          const result = JSON.parse(xmlHttp.responseText);
          this.#lastUpdateTimes[uri] = callback(result);

          if (result.frameRate !== undefined && result.load !== undefined) {
            getApp().getMissionManager().setLoad(result.load);
            getApp().getMissionManager().setFrameRate(result.frameRate);
          }
        }
      } else if (xmlHttp.status == 401) {
        /* Bad credentials */
        console.error("Incorrect username/password");
        errorCallback && errorCallback(xmlHttp.status);
      } else {
        /* Failure, probably disconnected */
        this.setConnected(false);
        errorCallback && errorCallback(xmlHttp.status);
      }
    };
    xmlHttp.onreadystatechange = (res) => {
      if (xmlHttp.readyState == 4 && xmlHttp.status === 0) {
        console.error("An error occurred during the XMLHttpRequest");
        this.setConnected(false);
        errorCallback && errorCallback(xmlHttp.status);
      }
    };
    xmlHttp.send(null);
  }

  PUT(request: object, callback: CallableFunction) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("PUT", this.#REST_ADDRESS);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    if (this.#username && this.#password) xmlHttp.setRequestHeader("Authorization", "Basic " + btoa(`${this.#username}:${this.#password}`));
    xmlHttp.onload = (res: any) => {
      var res = JSON.parse(xmlHttp.responseText);
      callback(res.commandHash);
    };
    xmlHttp.send(JSON.stringify(request));
    console.log(`Sending PUT request:`);
    console.log(request);
  }

  getConfig(callback: CallableFunction) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", window.location.href.split("?")[0].replace("vite/", "") + "config", true);
    xmlHttp.onload = function (e) {
      var data = JSON.parse(xmlHttp.responseText);
      callback(data);
    };
    xmlHttp.onerror = function () {
      console.error("An error occurred during the XMLHttpRequest, could not retrieve configuration file");
    };
    xmlHttp.send(null);
  }

  setAddress(address: string) {
    this.#REST_ADDRESS = `${address.replace("vite/", "")}olympus`;
    console.log(`Setting REST address to ${this.#REST_ADDRESS}`);
  }

  getAirbases(callback: CallableFunction, errorCallback: CallableFunction = () => {}) {
    this.GET(callback, errorCallback, AIRBASES_URI);
  }

  getBullseye(callback: CallableFunction, errorCallback: CallableFunction = () => {}) {
    this.GET(callback, errorCallback, BULLSEYE_URI);
  }

  getLogs(callback: CallableFunction, refresh: boolean = false, errorCallback: CallableFunction = () => {}) {
    this.GET(callback, errorCallback, LOGS_URI, { time: refresh ? 0 : this.#lastUpdateTimes[LOGS_URI] }, "text", refresh);
  }

  getMission(callback: CallableFunction, errorCallback: CallableFunction = () => {}) {
    this.GET(callback, errorCallback, MISSION_URI);
  }

  getUnits(callback: CallableFunction, refresh: boolean = false, errorCallback: CallableFunction = () => {}) {
    this.GET(callback, errorCallback, UNITS_URI, { time: refresh ? 0 : this.#lastUpdateTimes[UNITS_URI] }, "arraybuffer", refresh);
  }

  getWeapons(callback: CallableFunction, refresh: boolean = false, errorCallback: CallableFunction = () => {}) {
    this.GET(callback, errorCallback, WEAPONS_URI, { time: refresh ? 0 : this.#lastUpdateTimes[WEAPONS_URI] }, "arraybuffer", refresh);
  }

  isCommandExecuted(callback: CallableFunction, commandHash: string, errorCallback: CallableFunction = () => {}) {
    this.GET(callback, errorCallback, COMMANDS_URI, {
      commandHash: commandHash,
    });
  }

  addDestination(ID: number, path: any, callback: CallableFunction = () => {}) {
    var command = { ID: ID, path: path };
    var data = { setPath: command };
    this.PUT(data, callback);
  }

  spawnSmoke(color: string, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { color: color, location: latlng };
    var data = { smoke: command };
    this.PUT(data, callback);
  }

  spawnExplosion(intensity: number, explosionType: string, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = {
      explosionType: explosionType,
      intensity: intensity,
      location: latlng,
    };
    var data = { explosion: command };
    this.PUT(data, callback);
  }

  spawnAircrafts(
    units: any,
    coalition: string,
    airbaseName: string,
    country: string,
    immediate: boolean,
    spawnPoints: number,
    callback: CallableFunction = () => {}
  ) {
    var command = {
      units: units,
      coalition: coalition,
      airbaseName: airbaseName,
      country: country,
      immediate: immediate,
      spawnPoints: spawnPoints,
    };
    var data = { spawnAircrafts: command };
    this.PUT(data, callback);
  }

  spawnHelicopters(
    units: any,
    coalition: string,
    airbaseName: string,
    country: string,
    immediate: boolean,
    spawnPoints: number,
    callback: CallableFunction = () => {}
  ) {
    var command = {
      units: units,
      coalition: coalition,
      airbaseName: airbaseName,
      country: country,
      immediate: immediate,
      spawnPoints: spawnPoints,
    };
    var data = { spawnHelicopters: command };
    this.PUT(data, callback);
  }

  spawnGroundUnits(units: any, coalition: string, country: string, immediate: boolean, spawnPoints: number, callback: CallableFunction = () => {}) {
    var command = {
      units: units,
      coalition: coalition,
      country: country,
      immediate: immediate,
      spawnPoints: spawnPoints,
    };
    var data = { spawnGroundUnits: command };
    this.PUT(data, callback);
  }

  spawnNavyUnits(units: any, coalition: string, country: string, immediate: boolean, spawnPoints: number, callback: CallableFunction = () => {}) {
    var command = {
      units: units,
      coalition: coalition,
      country: country,
      immediate: immediate,
      spawnPoints: spawnPoints,
    };
    var data = { spawnNavyUnits: command };
    this.PUT(data, callback);
  }

  attackUnit(ID: number, targetID: number, callback: CallableFunction = () => {}) {
    var command = { ID: ID, targetID: targetID };
    var data = { attackUnit: command };
    this.PUT(data, callback);
  }

  followUnit(ID: number, targetID: number, offset: { x: number; y: number; z: number }, callback: CallableFunction = () => {}) {
    // X: front-rear, positive front
    // Y: top-bottom, positive bottom
    // Z: left-right, positive right

    var command = {
      ID: ID,
      targetID: targetID,
      offsetX: offset["x"],
      offsetY: offset["y"],
      offsetZ: offset["z"],
    };
    var data = { followUnit: command };
    this.PUT(data, callback);
  }

  cloneUnits(units: { ID: number; location: LatLng }[], deleteOriginal: boolean, spawnPoints: number, callback: CallableFunction = () => {}) {
    var command = {
      units: units,
      deleteOriginal: deleteOriginal,
      spawnPoints: spawnPoints,
    };
    var data = { cloneUnits: command };
    this.PUT(data, callback);
  }

  deleteUnit(ID: number, explosion: boolean, explosionType: string, immediate: boolean, callback: CallableFunction = () => {}) {
    var command = {
      ID: ID,
      explosion: explosion,
      explosionType: explosionType,
      immediate: immediate,
    };
    var data = { deleteUnit: command };
    this.PUT(data, callback);
  }

  landAt(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { ID: ID, location: latlng };
    var data = { landAt: command };
    this.PUT(data, callback);
  }

  changeSpeed(ID: number, speedChange: string, callback: CallableFunction = () => {}) {
    var command = { ID: ID, change: speedChange };
    var data = { changeSpeed: command };
    this.PUT(data, callback);
  }

  setSpeed(ID: number, speed: number, callback: CallableFunction = () => {}) {
    var command = { ID: ID, speed: speed };
    var data = { setSpeed: command };
    this.PUT(data, callback);
  }

  setSpeedType(ID: number, speedType: string, callback: CallableFunction = () => {}) {
    var command = { ID: ID, speedType: speedType };
    var data = { setSpeedType: command };
    this.PUT(data, callback);
  }

  changeAltitude(ID: number, altitudeChange: string, callback: CallableFunction = () => {}) {
    var command = { ID: ID, change: altitudeChange };
    var data = { changeAltitude: command };
    this.PUT(data, callback);
  }

  setAltitudeType(ID: number, altitudeType: string, callback: CallableFunction = () => {}) {
    var command = { ID: ID, altitudeType: altitudeType };
    var data = { setAltitudeType: command };
    this.PUT(data, callback);
  }

  setAltitude(ID: number, altitude: number, callback: CallableFunction = () => {}) {
    var command = { ID: ID, altitude: altitude };
    var data = { setAltitude: command };
    this.PUT(data, callback);
  }

  createFormation(ID: number, isLeader: boolean, wingmenIDs: number[], callback: CallableFunction = () => {}) {
    var command = { ID: ID, wingmenIDs: wingmenIDs, isLeader: isLeader };
    var data = { setLeader: command };
    this.PUT(data, callback);
  }

  setROE(ID: number, ROE: string, callback: CallableFunction = () => {}) {
    var command = { ID: ID, ROE: ROEs.indexOf(ROE) };
    var data = { setROE: command };
    this.PUT(data, callback);
  }

  setReactionToThreat(ID: number, reactionToThreat: string, callback: CallableFunction = () => {}) {
    var command = {
      ID: ID,
      reactionToThreat: reactionsToThreat.indexOf(reactionToThreat),
    };
    var data = { setReactionToThreat: command };
    this.PUT(data, callback);
  }

  setEmissionsCountermeasures(ID: number, emissionCountermeasure: string, callback: CallableFunction = () => {}) {
    var command = {
      ID: ID,
      emissionsCountermeasures: emissionsCountermeasures.indexOf(emissionCountermeasure),
    };
    var data = { setEmissionsCountermeasures: command };
    this.PUT(data, callback);
  }

  setOnOff(ID: number, onOff: boolean, callback: CallableFunction = () => {}) {
    var command = { ID: ID, onOff: onOff };
    var data = { setOnOff: command };
    this.PUT(data, callback);
  }

  setFollowRoads(ID: number, followRoads: boolean, callback: CallableFunction = () => {}) {
    var command = { ID: ID, followRoads: followRoads };
    var data = { setFollowRoads: command };
    this.PUT(data, callback);
  }

  setOperateAs(ID: number, operateAs: number, callback: CallableFunction = () => {}) {
    var command = { ID: ID, operateAs: operateAs };
    var data = { setOperateAs: command };
    this.PUT(data, callback);
  }

  refuel(ID: number, callback: CallableFunction = () => {}) {
    var command = { ID: ID };
    var data = { refuel: command };
    this.PUT(data, callback);
  }

  bombPoint(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { ID: ID, location: latlng };
    var data = { bombPoint: command };
    this.PUT(data, callback);
  }

  carpetBomb(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { ID: ID, location: latlng };
    var data = { carpetBomb: command };
    this.PUT(data, callback);
  }

  bombBuilding(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { ID: ID, location: latlng };
    var data = { bombBuilding: command };
    this.PUT(data, callback);
  }

  fireAtArea(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { ID: ID, location: latlng };
    var data = { fireAtArea: command };
    this.PUT(data, callback);
  }

  simulateFireFight(ID: number, latlng: LatLng, altitude: number, callback: CallableFunction = () => {}) {
    var command = { ID: ID, location: latlng, altitude: altitude };
    var data = { simulateFireFight: command };
    this.PUT(data, callback);
  }

  // TODO: Remove coalition
  scenicAAA(ID: number, coalition: string, callback: CallableFunction = () => {}) {
    var command = { ID: ID, coalition: coalition };
    var data = { scenicAAA: command };
    this.PUT(data, callback);
  }

  // TODO: Remove coalition
  missOnPurpose(ID: number, coalition: string, callback: CallableFunction = () => {}) {
    var command = { ID: ID, coalition: coalition };
    var data = { missOnPurpose: command };
    this.PUT(data, callback);
  }

  landAtPoint(ID: number, latlng: LatLng, callback: CallableFunction = () => {}) {
    var command = { ID: ID, location: latlng };
    var data = { landAtPoint: command };
    this.PUT(data, callback);
  }

  setShotsScatter(ID: number, shotsScatter: number, callback: CallableFunction = () => {}) {
    var command = { ID: ID, shotsScatter: shotsScatter };
    var data = { setShotsScatter: command };
    this.PUT(data, callback);
  }

  setShotsIntensity(ID: number, shotsIntensity: number, callback: CallableFunction = () => {}) {
    var command = { ID: ID, shotsIntensity: shotsIntensity };
    var data = { setShotsIntensity: command };
    this.PUT(data, callback);
  }

  setAdvacedOptions(
    ID: number,
    isActiveTanker: boolean,
    isActiveAWACS: boolean,
    TACAN: TACAN,
    radio: Radio,
    generalSettings: GeneralSettings,
    callback: CallableFunction = () => {}
  ) {
    var command = {
      ID: ID,
      isActiveTanker: isActiveTanker,
      isActiveAWACS: isActiveAWACS,
      TACAN: TACAN,
      radio: radio,
      generalSettings: generalSettings,
    };

    var data = { setAdvancedOptions: command };
    this.PUT(data, callback);
  }

  setCommandModeOptions(
    restrictSpawns: boolean,
    restrictToCoalition: boolean,
    spawnPoints: { blue: number; red: number },
    eras: string[],
    setupTime: number,
    callback: CallableFunction = () => {}
  ) {
    var command = {
      restrictSpawns: restrictSpawns,
      restrictToCoalition: restrictToCoalition,
      spawnPoints: spawnPoints,
      eras: eras,
      setupTime: setupTime,
    };

    var data = { setCommandModeOptions: command };
    this.PUT(data, callback);
  }

  reloadDatabases(callback: CallableFunction = () => {}) {
    var data = { reloadDatabases: {} };
    this.PUT(data, callback);
  }

  startUpdate() {
    /* Clear any existing interval */
    this.#intervals.forEach((interval: number) => {
      window.clearInterval(interval);
    });
    this.#intervals = [];

    this.#intervals.push(
      window.setInterval(() => {
        if (!this.getPaused()) {
          this.getMission((data: MissionData) => {
            this.checkSessionHash(data.sessionHash);
            getApp().getMissionManager()?.updateMission(data);
            return data.time;
          });
        }
      }, 1000)
    );

    this.#intervals.push(
      window.setInterval(() => {
        if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE) {
          this.getAirbases((data: AirbasesData) => {
            this.checkSessionHash(data.sessionHash);
            getApp().getMissionManager()?.updateAirbases(data);
            return data.time;
          });
        }
      }, 10000)
    );

    this.#intervals.push(
      window.setInterval(() => {
        if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE) {
          this.getBullseye((data: BullseyesData) => {
            this.checkSessionHash(data.sessionHash);
            getApp().getMissionManager()?.updateBullseyes(data);
            return data.time;
          });
        }
      }, 10000)
    );

    this.#intervals.push(
      window.setInterval(() => {
        if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE) {
          this.getLogs((data: any) => {
            this.checkSessionHash(data.sessionHash);
            //(getApp().getPanelsManager().get("log") as LogPanel).appendLogs(data.logs)
            return data.time;
          });
        }
      }, 1000)
    );

    this.#intervals.push(
      window.setInterval(() => {
        if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE) {
          this.getUnits((buffer: ArrayBuffer) => {
            var time = getApp().getUnitsManager()?.update(buffer);
            return time;
          }, false);
        }
      }, 250)
    );

    this.#intervals.push(
      window.setInterval(() => {
        if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE) {
          this.getWeapons((buffer: ArrayBuffer) => {
            var time = getApp().getWeaponsManager()?.update(buffer);
            return time;
          }, false);
        }
      }, 250)
    );

    this.#intervals.push(
      window.setInterval(
        () => {
          if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE) {
            this.getUnits((buffer: ArrayBuffer) => {
              var time = getApp().getUnitsManager()?.update(buffer);
              return time;
            }, true);
          }
        },
        this.getServerIsPaused() ? 500 : 5000
      )
    );

    //  Mission clock and elapsed time
    this.#intervals.push(
      window.setInterval(() => {
        const elapsedMissionTime = getApp().getMissionManager().getDateAndTime().elapsedTime;
        this.#serverIsPaused = elapsedMissionTime === this.#previousMissionElapsedTime;
        this.#previousMissionElapsedTime = elapsedMissionTime;

        document.dispatchEvent(
          new CustomEvent("serverStatusUpdated", {
            detail: {
              frameRate: getApp().getMissionManager().getFrameRate(),
              load: getApp().getMissionManager().getLoad(),
              elapsedTime: getApp().getMissionManager().getDateAndTime().elapsedTime,
              missionTime: getApp().getMissionManager().getDateAndTime().time,
              connected: this.getConnected(),
              paused: this.getPaused(),
            } as ServerStatus,
          })
        );
      }, 1000)
    );

    this.#intervals.push(
      window.setInterval(() => {
        if (!this.getPaused() && getApp().getMissionManager().getCommandModeOptions().commandMode != NONE) {
          this.getWeapons((buffer: ArrayBuffer) => {
            var time = getApp().getWeaponsManager()?.update(buffer);
            return time;
          }, true);
        }
      }, 5000)
    );
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
      //(getApp().getPanelsManager().get("log") as LogPanel).appendLogs(data.logs)
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
      if (newSessionHash !== this.#sessionHash) location.reload();
    } else this.#sessionHash = newSessionHash;
  }

  setConnected(newConnected: boolean) {
    if (this.#connected != newConnected) {
      //newConnected ? (getApp().getPopupsManager().get("infoPopup") as Popup).setText("Connected to DCS Olympus server") : (getApp().getPopupsManager().get("infoPopup") as Popup).setText("Disconnected from DCS Olympus server");
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
    //this.#paused ? (getApp().getPopupsManager().get("infoPopup") as Popup).setText("View paused") : (getApp().getPopupsManager().get("infoPopup") as Popup).setText("View unpaused");
  }

  getPaused() {
    return this.#paused;
  }

  getServerIsPaused() {
    return this.#serverIsPaused;
  }

  getRequests() {
    return this.#requests;
  }
}

import { LatLng } from "leaflet";
import { getApp } from "../olympusapp";
import { Airbase } from "./airbase";
import { Bullseye } from "./bullseye";
import { BLUE_COMMANDER, GAME_MASTER, NONE, RED_COMMANDER } from "../constants/constants";
import { AirbasesData, BullseyesData, CommandModeOptions, DateAndTime, MissionData } from "../interfaces";
import { Coalition } from "../types/types";
import { Carrier } from "./carrier";
import { NavyUnit } from "../unit/unit";
import { CommandModeOptionsChangedEvent, InfoPopupEvent } from "../events";

/** The MissionManager  */
export class MissionManager {
  #bullseyes: { [name: string]: Bullseye } = {};
  #airbases: { [name: string]: Airbase | Carrier } = {};
  #theatre: string = "";
  #dateAndTime: DateAndTime = {
    date: { Year: 0, Month: 0, Day: 0 },
    time: { h: 0, m: 0, s: 0 },
    startTime: 0,
    elapsedTime: 0,
  };
  #load: number = 0;
  #frameRate: number = 0;
  #commandModeOptions: CommandModeOptions = {
    commandMode: NONE,
    restrictSpawns: false,
    restrictToCoalition: false,
    setupTime: Infinity,
    spawnPoints: { red: Infinity, blue: Infinity },
    eras: [],
  };
  #remainingSetupTime: number = 0;
  #spentSpawnPoint: number = 0;
  #coalitions: { red: string[]; blue: string[] } = { red: [], blue: [] };

  constructor() {}

  /** Update location of bullseyes
   *
   * @param object <BulleyesData>
   */
  updateBullseyes(data: BullseyesData) {
    const commandMode = getApp().getMissionManager().getCommandModeOptions().commandMode;
    for (let idx in data.bullseyes) {
      const bullseye = data.bullseyes[idx];

      //  Prevent Red and Blue coalitions seeing each other's bulleye(s)
      if ((bullseye.coalition === "red" && commandMode === BLUE_COMMANDER) || (bullseye.coalition === "blue" && commandMode === RED_COMMANDER)) {
        continue;
      }

      if (!(idx in this.#bullseyes)) this.#bullseyes[idx] = new Bullseye([0, 0]).addTo(getApp().getMap());

      if (bullseye.latitude && bullseye.longitude && bullseye.coalition) {
        this.#bullseyes[idx].setLatLng(new LatLng(bullseye.latitude, bullseye.longitude));
        this.#bullseyes[idx].setCoalition(bullseye.coalition);
      }
    }
  }

  /** Update airbase information
   *
   * @param object <AirbasesData>
   */
  updateAirbases(data: AirbasesData) {
    for (let idx in data.airbases) {
      var airbase = data.airbases[idx];
      var airbaseCallsign = airbase.callsign !== ""? airbase.callsign: `carrier-${airbase.unitId}`
      if (this.#airbases[airbaseCallsign] === undefined) {
        if (airbase.callsign != "") {
          this.#airbases[airbaseCallsign] = new Airbase({
            position: new LatLng(airbase.latitude, airbase.longitude),
            name: airbaseCallsign,
          }).addTo(getApp().getMap());
          this.#loadAirbaseChartData(airbaseCallsign);
        }
      }

      if (this.#airbases[airbaseCallsign] != undefined && airbase.latitude && airbase.longitude && airbase.coalition) {
        this.#airbases[airbaseCallsign].setLatLng(new LatLng(airbase.latitude, airbase.longitude));
        this.#airbases[airbaseCallsign].setCoalition(airbase.coalition);
      }
    }
  }

  /** Update mission information
   *
   * @param object <MissionData>
   */
  updateMission(data: MissionData) {
    if (data.mission) {
      /* Set the mission theatre */
      if (data.mission.theatre != this.#theatre) {
        this.#theatre = data.mission.theatre;
        getApp().getMap().setTheatre(this.#theatre);
        getApp().addInfoMessage("Map set to " + this.#theatre);
      }

      /* Set the date and time data */
      this.#dateAndTime = data.mission.dateAndTime;
      data.mission.dateAndTime.time.s -= 1; //  ED has seconds 1-60 and not 0-59?!

      /* Set the coalition countries */
      this.#coalitions = data.mission.coalitions;

      /* Set the command mode options */
      this.#setcommandModeOptions(data.mission.commandModeOptions);
      this.#remainingSetupTime = this.getCommandModeOptions().setupTime - this.getDateAndTime().elapsedTime;
    }
  }

  /** Get the bullseyes set in this theatre
   *
   * @returns object
   */
  getBullseyes() {
    return this.#bullseyes;
  }

  /** Get the airbases in this theatre
   *
   * @returns object
   */
  getAirbases() {
    return this.#airbases;
  }

  /** Get the options/settings as set in the command mode
   *
   * @returns object
   */
  getCommandModeOptions() {
    return this.#commandModeOptions;
  }

  /** Get the current date and time of the mission (based on local time)
   *
   * @returns object
   */
  getDateAndTime() {
    return this.#dateAndTime;
  }

  /**
   * Get the number of seconds left of setup time
   * @returns number
   */
  getRemainingSetupTime() {
    return this.#remainingSetupTime;
  }

  /** Get an object with the coalitions in it
   *
   * @returns object
   */
  getCoalitions() {
    return this.#coalitions;
  }

  /** Get the current theatre (map) name
   *
   * @returns string
   */
  getTheatre() {
    return this.#theatre;
  }

  getAvailableSpawnPoints() {
    if (this.getCommandModeOptions().commandMode === GAME_MASTER) return Infinity;
    else if (this.getCommandModeOptions().commandMode === BLUE_COMMANDER) return this.getCommandModeOptions().spawnPoints.blue - this.#spentSpawnPoint;
    else if (this.getCommandModeOptions().commandMode === RED_COMMANDER) return this.getCommandModeOptions().spawnPoints.red - this.#spentSpawnPoint;
    else return 0;
  }

  getCommandedCoalition() {
    if (this.getCommandModeOptions().commandMode === BLUE_COMMANDER) return "blue" as Coalition;
    else if (this.getCommandModeOptions().commandMode === RED_COMMANDER) return "red" as Coalition;
    else return "all" as Coalition;
  }

  refreshSpawnPoints() {
    var spawnPointsEl = document.querySelector("#spawn-points");
    if (spawnPointsEl) {
      spawnPointsEl.textContent = `${this.getAvailableSpawnPoints()}`;
    }
  }

  setSpentSpawnPoints(spawnPoints: number) {
    this.#spentSpawnPoint = spawnPoints;
    this.refreshSpawnPoints();
  }

  setLoad(load: number) {
    this.#load = load;
  }

  getLoad() {
    return this.#load;
  }

  setFrameRate(frameRate: number) {
    this.#frameRate = frameRate;
  }

  getFrameRate() {
    return this.#frameRate;
  }

  #setcommandModeOptions(commandModeOptions: CommandModeOptions) {
    /* Refresh all the data if we have exited the NONE state */
    var requestRefresh = false;
    if (this.#commandModeOptions.commandMode === NONE && commandModeOptions.commandMode !== NONE) requestRefresh = true;

    /* Refresh the page if we have lost Game Master priviledges */
    if (this.#commandModeOptions.commandMode === GAME_MASTER && commandModeOptions.commandMode !== GAME_MASTER) location.reload();

    /* Check if any option has changed */
    var commandModeOptionsChanged =
      !commandModeOptions.eras.every((value: string, idx: number) => {
        return value === this.getCommandModeOptions().eras[idx];
      }) ||
      commandModeOptions.spawnPoints.red !== this.getCommandModeOptions().spawnPoints.red ||
      commandModeOptions.spawnPoints.blue !== this.getCommandModeOptions().spawnPoints.blue ||
      commandModeOptions.restrictSpawns !== this.getCommandModeOptions().restrictSpawns ||
      commandModeOptions.restrictToCoalition !== this.getCommandModeOptions().restrictToCoalition || 
      commandModeOptions.setupTime !== this.getCommandModeOptions().setupTime;

    this.#commandModeOptions = commandModeOptions;
    this.setSpentSpawnPoints(0);
    this.refreshSpawnPoints();

    if (commandModeOptionsChanged) {
      CommandModeOptionsChangedEvent.dispatch(this.#commandModeOptions);
    }

    document
      .querySelector("#spawn-points-container")
      ?.classList.toggle("hide", this.getCommandModeOptions().commandMode === GAME_MASTER || !this.getCommandModeOptions().restrictSpawns);
    document.querySelector("#command-mode-settings-button")?.classList.toggle("hide", this.getCommandModeOptions().commandMode !== GAME_MASTER);

    if (requestRefresh) getApp().getServerManager().refreshAll();
  }

  #loadAirbaseChartData(callsign: string) {
    if (!this.#theatre) {
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", getApp().getExpressAddress() + `/api/airbases/${this.#theatre.toLowerCase()}/${callsign}`, true);
    xhr.responseType = "json";
    xhr.onload = () => {
      var status = xhr.status;
      if (status === 200) {
        const data = xhr.response;
        this.getAirbases()[callsign].setChartData(data);
      } else {
        console.error(`Error retrieving data for ${callsign} airbase`);
      }
    };
    xhr.send();
  }
}

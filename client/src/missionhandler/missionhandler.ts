import { LatLng } from "leaflet";
import { getInfoPopup, getMap, getUnitsManager } from "..";
import { Airbase } from "./airbase";
import { Bullseye } from "./bullseye";
import { BLUE_COMMANDER, GAME_MASTER, RED_COMMANDER } from "../constants/constants";

export class MissionHandler {
    #bullseyes: { [name: string]: Bullseye } = {};
    #airbases: { [name: string]: Airbase } = {};
    #theatre: string = "";
    #dateAndTime: DateAndTime = {date: {Year: 0, Month: 0, Day: 0}, time: {h: 0, m: 0, s: 0}, startTime: 0, elapsedTime: 0};
    #RTSOptions: RTSOptions = {commandMode: "Hide all", restrictSpawns: false, restrictToCoalition: false, setupTime: Infinity, spawnPoints: {red: Infinity, blue: Infinity}, eras: []};
    #remainingSetupTime: number = 0;
    #spentSpawnPoint: number = 0;

    constructor() {

    }

    updateBullseyes(data: BullseyesData) {
        for (let idx in data.bullseyes) {
            const bullseye = data.bullseyes[idx];
            if (!(idx in this.#bullseyes))
                this.#bullseyes[idx] = new Bullseye([0, 0]).addTo(getMap());

            if (bullseye.latitude && bullseye.longitude && bullseye.coalition) {
                this.#bullseyes[idx].setLatLng(new LatLng(bullseye.latitude, bullseye.longitude));
                this.#bullseyes[idx].setCoalition(bullseye.coalition);
            }
        }
    }

    updateAirbases(data: AirbasesData) {
        for (let idx in data.airbases) {
            var airbase = data.airbases[idx]
            if (this.#airbases[idx] === undefined && airbase.callsign != '') {
                this.#airbases[idx] = new Airbase({
                    position: new LatLng(airbase.latitude, airbase.longitude),
                    name: airbase.callsign
                }).addTo(getMap());
                this.#airbases[idx].on('contextmenu', (e) => this.#onAirbaseClick(e));
            }

            if (this.#airbases[idx] != undefined && airbase.latitude && airbase.longitude && airbase.coalition) {
                this.#airbases[idx].setLatLng(new LatLng(airbase.latitude, airbase.longitude));
                this.#airbases[idx].setCoalition(airbase.coalition);
            }
        }
    }

    updateMission(data: MissionData) {
        if (data.theatre != this.#theatre) {
            this.#theatre = data.theatre;
            getMap().setTheatre(this.#theatre);
            getInfoPopup().setText("Map set to " + this.#theatre);
        }

        this.#dateAndTime = data.dateAndTime;

        this.#setRTSOptions(data.RTSOptions);
        getUnitsManager().setCommandMode(this.#RTSOptions.commandMode);

        this.#remainingSetupTime = this.#RTSOptions.setupTime - this.getDateAndTime().elapsedTime;
        var RTSPhaseEl = document.querySelector("#rts-phase");
        if (RTSPhaseEl) {
            if (this.#remainingSetupTime > 0) {
                var remainingTime = `Time to start: -${new Date(this.#remainingSetupTime * 1000).toISOString().substring(14, 19)}`;
                RTSPhaseEl.textContent = remainingTime;
            } else {
                RTSPhaseEl.textContent = "FIGHT";
            }
        }
    }

    getBullseyes() {
        return this.#bullseyes;
    }

    getAirbases() {
        return this.#airbases;
    }

    getRTSOptions() {
        return this.#RTSOptions;
    }

    getDateAndTime() {
        return this.#dateAndTime;
    }

    getRemainingSetupTime() {
        return this.#remainingSetupTime;
    }

    getAvailableSpawnPoints() {
        if (getUnitsManager().getCommandMode() === GAME_MASTER)
            return Infinity;
        else if (getUnitsManager().getCommandMode() === BLUE_COMMANDER)
            return this.getRTSOptions().spawnPoints.blue - this.#spentSpawnPoint;
        else if (getUnitsManager().getCommandMode() === RED_COMMANDER)
            return this.getRTSOptions().spawnPoints.red - this.#spentSpawnPoint;
        else
            return 0;
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

    #setRTSOptions(RTSOptions: RTSOptions) {
        var RTSOptionsChanged = (!RTSOptions.eras.every((value: string, idx: number) => {return value === this.#RTSOptions.eras[idx]}) || 
                                RTSOptions.spawnPoints.red !== this.#RTSOptions.spawnPoints.red || 
                                RTSOptions.spawnPoints.blue !== this.#RTSOptions.spawnPoints.blue ||
                                RTSOptions.restrictSpawns !== this.#RTSOptions.restrictSpawns ||
                                RTSOptions.restrictToCoalition !== this.#RTSOptions.restrictToCoalition);
        
        this.#RTSOptions = RTSOptions;
        this.setSpentSpawnPoints(0);
        this.refreshSpawnPoints();

        if (RTSOptionsChanged)
            document.dispatchEvent(new CustomEvent("RTSOptionsChanged", { detail: this }));
    }

    #onAirbaseClick(e: any) {
        getMap().showAirbaseContextMenu(e.originalEvent.x, e.originalEvent.y, e.latlng, e.sourceTarget);
    }
}
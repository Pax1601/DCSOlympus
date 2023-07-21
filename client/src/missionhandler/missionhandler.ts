import { LatLng } from "leaflet";
import { getInfoPopup, getMap, getUnitsManager } from "..";
import { Airbase } from "./airbase";
import { Bullseye } from "./bullseye";
import { BLUE_COMMANDER, GAME_MASTER, RED_COMMANDER } from "../constants/constants";
import { setRTSOptions } from "../server/server";
import { Dropdown } from "../controls/dropdown";
import { groundUnitDatabase } from "../units/groundunitdatabase";
import { createCheckboxOption, getCheckboxOptions } from "../other/utils";
import { aircraftDatabase } from "../units/aircraftdatabase";
import { helicopterDatabase } from "../units/helicopterdatabase";
import { navyUnitDatabase } from "../units/navyunitdatabase";

export class MissionHandler {
    #bullseyes: { [name: string]: Bullseye } = {};
    #airbases: { [name: string]: Airbase } = {};
    #theatre: string = "";
    #dateAndTime: DateAndTime = {date: {Year: 0, Month: 0, Day: 0}, time: {h: 0, m: 0, s: 0}, startTime: 0, elapsedTime: 0};
    #RTSOptions: RTSOptions = {commandMode: "Hide all", restrictSpawns: false, restrictToCoalition: false, setupTime: Infinity, spawnPoints: {red: Infinity, blue: Infinity}, eras: []};
    #remainingSetupTime: number = 0;
    #spentSpawnPoint: number = 0;
    #RTSSettingsDialog: HTMLElement;
    #rtsErasDropdown: Dropdown;

    constructor() {
        document.addEventListener("showRTSSettingsDialog", () => this.showRTSSettingsDialog());
        document.addEventListener("applyRTSOptions", () => this.#applyRTSOptions());

        /* RTS settings dialog */
        this.#RTSSettingsDialog = <HTMLElement> document.querySelector("#rts-settings-dialog");

        this.#rtsErasDropdown = new Dropdown("rts-era-options", () => {});
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
        if (data.mission.theatre != this.#theatre) {
            this.#theatre = data.mission.theatre;
            getMap().setTheatre(this.#theatre);
            getInfoPopup().setText("Map set to " + this.#theatre);
        }

        this.#dateAndTime = data.mission.dateAndTime;

        this.#setRTSOptions(data.mission.RTSOptions);
        getUnitsManager().setCommandMode(this.#RTSOptions.commandMode);

        this.#remainingSetupTime = this.#RTSOptions.setupTime - this.getDateAndTime().elapsedTime;
        var RTSPhaseEl = document.querySelector("#rts-phase") as HTMLElement;
        if (RTSPhaseEl) {
            if (this.#remainingSetupTime > 0) {
                var remainingTime = `-${new Date(this.#remainingSetupTime * 1000).toISOString().substring(14, 19)}`;
                RTSPhaseEl.dataset.remainingTime = remainingTime;
            } 
            
            RTSPhaseEl.classList.toggle("setup-phase", this.#remainingSetupTime > 0);
            RTSPhaseEl.classList.toggle("game-commenced", this.#remainingSetupTime <= 0);
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

    showRTSSettingsDialog() {
        /* Create the checkboxes to select the unit eras */
        var eras = aircraftDatabase.getEras().concat(helicopterDatabase.getEras()).concat(groundUnitDatabase.getEras()).concat(navyUnitDatabase.getEras());
        eras = eras.filter((item: string, index: number) => eras.indexOf(item) === index).sort();
        this.#rtsErasDropdown.setOptionsElements(eras.map((era: string) => {
            return createCheckboxOption(era, `Enable ${era} units spawns`, this.#RTSOptions.eras.includes(era));
        }));

        this.#RTSSettingsDialog.classList.remove("hide");

        const restrictSpawnsCheckbox = this.#RTSSettingsDialog.querySelector("#restrict-spawns")?.querySelector("input") as HTMLInputElement;
        const restrictToCoalitionCheckbox = this.#RTSSettingsDialog.querySelector("#restrict-to-coalition")?.querySelector("input") as HTMLInputElement;
        const blueSpawnPointsInput = this.#RTSSettingsDialog.querySelector("#blue-spawn-points")?.querySelector("input") as HTMLInputElement;
        const redSpawnPointsInput = this.#RTSSettingsDialog.querySelector("#red-spawn-points")?.querySelector("input") as HTMLInputElement;
        const setupTimeInput = this.#RTSSettingsDialog.querySelector("#setup-time")?.querySelector("input") as HTMLInputElement;

        restrictSpawnsCheckbox.checked = this.#RTSOptions.restrictSpawns;
        restrictToCoalitionCheckbox.checked = this.#RTSOptions.restrictToCoalition;
        blueSpawnPointsInput.value = String(this.#RTSOptions.spawnPoints.blue);
        redSpawnPointsInput.value = String(this.#RTSOptions.spawnPoints.red);
        setupTimeInput.value = String(Math.floor(this.#RTSOptions.setupTime / 60.0));
    }

    #applyRTSOptions() {
        this.#RTSSettingsDialog.classList.add("hide");

        const restrictSpawnsCheckbox = this.#RTSSettingsDialog.querySelector("#restrict-spawns")?.querySelector("input") as HTMLInputElement;
        const restrictToCoalitionCheckbox = this.#RTSSettingsDialog.querySelector("#restrict-to-coalition")?.querySelector("input") as HTMLInputElement;
        const blueSpawnPointsInput = this.#RTSSettingsDialog.querySelector("#blue-spawn-points")?.querySelector("input") as HTMLInputElement;
        const redSpawnPointsInput = this.#RTSSettingsDialog.querySelector("#red-spawn-points")?.querySelector("input") as HTMLInputElement;
        const setupTimeInput = this.#RTSSettingsDialog.querySelector("#setup-time")?.querySelector("input") as HTMLInputElement;

        var eras: string[] = [];
        const enabledEras = getCheckboxOptions(this.#rtsErasDropdown);
        Object.keys(enabledEras).forEach((key: string) => {if (enabledEras[key]) eras.push(key)});
        setRTSOptions(restrictSpawnsCheckbox.checked, restrictToCoalitionCheckbox.checked, {blue: parseInt(blueSpawnPointsInput.value), red: parseInt(redSpawnPointsInput.value)}, eras, parseInt(setupTimeInput.value) * 60);
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

        if (RTSOptionsChanged) {
            document.dispatchEvent(new CustomEvent("RTSOptionsChanged", { detail: this }));

            document.getElementById("rts-toolbar")?.classList.remove("hide");
            const el = document.getElementById("command-mode");
            if (el) {
                el.dataset.mode = RTSOptions.commandMode;
                el.textContent = RTSOptions.commandMode.toUpperCase();
            }
        }

        document.querySelector("#spawn-points-container")?.classList.toggle("hide", getUnitsManager().getCommandMode() === GAME_MASTER);
        document.querySelector("#rts-settings-button")?.classList.toggle("hide", getUnitsManager().getCommandMode() !== GAME_MASTER);
    }

    #onAirbaseClick(e: any) {
        getMap().showAirbaseContextMenu(e.originalEvent.x, e.originalEvent.y, e.latlng, e.sourceTarget);
    }
}
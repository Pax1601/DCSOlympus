import { LatLng } from "leaflet";
import { getInfoPopup, getMap } from "..";
import { Airbase } from "./airbase";
import { Bullseye } from "./bullseye";
import { BLUE_COMMANDER, GAME_MASTER, NONE, RED_COMMANDER } from "../constants/constants";
import { refreshAll, setCommandModeOptions } from "../server/server";
import { Dropdown } from "../controls/dropdown";
import { groundUnitDatabase } from "../unit/groundunitdatabase";
import { createCheckboxOption, getCheckboxOptions } from "../other/utils";
import { aircraftDatabase } from "../unit/aircraftdatabase";
import { helicopterDatabase } from "../unit/helicopterdatabase";
import { navyUnitDatabase } from "../unit/navyunitdatabase";

export class MissionManager {
    #bullseyes: { [name: string]: Bullseye } = {};
    #airbases: { [name: string]: Airbase } = {};
    #theatre: string = "";
    #dateAndTime: DateAndTime = {date: {Year: 0, Month: 0, Day: 0}, time: {h: 0, m: 0, s: 0}, startTime: 0, elapsedTime: 0};
    #commandModeOptions: CommandModeOptions = {commandMode: NONE, restrictSpawns: false, restrictToCoalition: false, setupTime: Infinity, spawnPoints: {red: Infinity, blue: Infinity}, eras: []};
    #remainingSetupTime: number = 0;
    #spentSpawnPoint: number = 0;
    #commandModeDialog: HTMLElement;
    #commandModeErasDropdown: Dropdown;
    #coalitions: {red: string[], blue: string[]} = {red: [], blue: []};

    constructor() {
        document.addEventListener("showCommandModeDialog", () => this.showCommandModeDialog());
        document.addEventListener("applycommandModeOptions", () => this.#applycommandModeOptions());

        /* command-mode settings dialog */
        this.#commandModeDialog = <HTMLElement> document.querySelector("#command-mode-settings-dialog");

        this.#commandModeErasDropdown = new Dropdown("command-mode-era-options", () => {});
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
            if (this.#airbases[airbase.callsign] === undefined && airbase.callsign != '') {
                this.#airbases[airbase.callsign] = new Airbase({
                    position: new LatLng(airbase.latitude, airbase.longitude),
                    name: airbase.callsign
                }).addTo(getMap());
                this.#airbases[airbase.callsign].on('contextmenu', (e) => this.#onAirbaseClick(e));
                this.#loadAirbaseChartData(airbase.callsign);
            }

            if (this.#airbases[airbase.callsign] != undefined && airbase.latitude && airbase.longitude && airbase.coalition) {
                this.#airbases[airbase.callsign].setLatLng(new LatLng(airbase.latitude, airbase.longitude));
                this.#airbases[airbase.callsign].setCoalition(airbase.coalition);
            }
        }
    }

    updateMission(data: MissionData) {
        if (data.mission) {

            /* Set the mission theatre */
            if (data.mission.theatre != this.#theatre) {
                this.#theatre = data.mission.theatre;
                getMap().setTheatre(this.#theatre);
                getInfoPopup().setText("Map set to " + this.#theatre);
            }

            /* Set the date and time data */
            this.#dateAndTime = data.mission.dateAndTime;

            /* Set the coalition countries */
            this.#coalitions = data.mission.coalitions;

            /* Set the command mode options */
            this.#setcommandModeOptions(data.mission.commandModeOptions);
            this.#remainingSetupTime = this.getCommandModeOptions().setupTime - this.getDateAndTime().elapsedTime;
            var commandModePhaseEl = document.querySelector("#command-mode-phase") as HTMLElement;
            if (commandModePhaseEl) {
                if (this.#remainingSetupTime > 0) {
                    var remainingTime = `-${new Date(this.#remainingSetupTime * 1000).toISOString().substring(14, 19)}`;
                    commandModePhaseEl.dataset.remainingTime = remainingTime;
                } 
                
                commandModePhaseEl.classList.toggle("setup-phase", this.#remainingSetupTime > 0 && this.getCommandModeOptions().restrictSpawns);
                commandModePhaseEl.classList.toggle("game-commenced", this.#remainingSetupTime <= 0 || !this.getCommandModeOptions().restrictSpawns);
                commandModePhaseEl.classList.toggle("no-restrictions", !this.getCommandModeOptions().restrictSpawns);
            }
        }
    }

    getBullseyes() {
        return this.#bullseyes;
    }

    getAirbases() {
        return this.#airbases;
    }

    getCommandModeOptions() {
        return this.#commandModeOptions;
    }

    getDateAndTime() {
        return this.#dateAndTime;
    }

    getRemainingSetupTime() {
        return this.#remainingSetupTime;
    }

    getCoalitions() {
        return this.#coalitions;
    }

    getAvailableSpawnPoints() {
        if (this.getCommandModeOptions().commandMode === GAME_MASTER)
            return Infinity;
        else if (this.getCommandModeOptions().commandMode === BLUE_COMMANDER)
            return this.getCommandModeOptions().spawnPoints.blue - this.#spentSpawnPoint;
        else if (this.getCommandModeOptions().commandMode === RED_COMMANDER)
            return this.getCommandModeOptions().spawnPoints.red - this.#spentSpawnPoint;
        else
            return 0;
    }

    getCommandedCoalition() {
        if (this.getCommandModeOptions().commandMode === BLUE_COMMANDER)
            return "blue";
        else if (this.getCommandModeOptions().commandMode === RED_COMMANDER)
            return "red";
        else
            return "all";
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

    showCommandModeDialog() {
        /* Create the checkboxes to select the unit eras */
        var eras = aircraftDatabase.getEras().concat(helicopterDatabase.getEras()).concat(groundUnitDatabase.getEras()).concat(navyUnitDatabase.getEras());
        eras = eras.filter((item: string, index: number) => eras.indexOf(item) === index).sort();
        this.#commandModeErasDropdown.setOptionsElements(eras.map((era: string) => {
            return createCheckboxOption(era, `Enable ${era} units spawns`, this.getCommandModeOptions().eras.includes(era));
        }));

        this.#commandModeDialog.classList.remove("hide");

        const restrictSpawnsCheckbox = this.#commandModeDialog.querySelector("#restrict-spawns")?.querySelector("input") as HTMLInputElement;
        const restrictToCoalitionCheckbox = this.#commandModeDialog.querySelector("#restrict-to-coalition")?.querySelector("input") as HTMLInputElement;
        const blueSpawnPointsInput = this.#commandModeDialog.querySelector("#blue-spawn-points")?.querySelector("input") as HTMLInputElement;
        const redSpawnPointsInput = this.#commandModeDialog.querySelector("#red-spawn-points")?.querySelector("input") as HTMLInputElement;
        const setupTimeInput = this.#commandModeDialog.querySelector("#setup-time")?.querySelector("input") as HTMLInputElement;

        restrictSpawnsCheckbox.checked = this.getCommandModeOptions().restrictSpawns;
        restrictToCoalitionCheckbox.checked = this.getCommandModeOptions().restrictToCoalition;
        blueSpawnPointsInput.value = String(this.getCommandModeOptions().spawnPoints.blue);
        redSpawnPointsInput.value = String(this.getCommandModeOptions().spawnPoints.red);
        setupTimeInput.value = String(Math.floor(this.getCommandModeOptions().setupTime / 60.0));
    }

    #applycommandModeOptions() {
        this.#commandModeDialog.classList.add("hide");

        const restrictSpawnsCheckbox = this.#commandModeDialog.querySelector("#restrict-spawns")?.querySelector("input") as HTMLInputElement;
        const restrictToCoalitionCheckbox = this.#commandModeDialog.querySelector("#restrict-to-coalition")?.querySelector("input") as HTMLInputElement;
        const blueSpawnPointsInput = this.#commandModeDialog.querySelector("#blue-spawn-points")?.querySelector("input") as HTMLInputElement;
        const redSpawnPointsInput = this.#commandModeDialog.querySelector("#red-spawn-points")?.querySelector("input") as HTMLInputElement;
        const setupTimeInput = this.#commandModeDialog.querySelector("#setup-time")?.querySelector("input") as HTMLInputElement;

        var eras: string[] = [];
        const enabledEras = getCheckboxOptions(this.#commandModeErasDropdown);
        Object.keys(enabledEras).forEach((key: string) => {if (enabledEras[key]) eras.push(key)});
        setCommandModeOptions(restrictSpawnsCheckbox.checked, restrictToCoalitionCheckbox.checked, {blue: parseInt(blueSpawnPointsInput.value), red: parseInt(redSpawnPointsInput.value)}, eras, parseInt(setupTimeInput.value) * 60);
    }

    #setcommandModeOptions(commandModeOptions: CommandModeOptions) {
        /* Refresh all the data if we have exited the NONE state */ 
        var requestRefresh = false;
        if (this.#commandModeOptions.commandMode === NONE && commandModeOptions.commandMode !== NONE)
            requestRefresh = true;

        /* Refresh the page if we have lost Game Master priviledges */
        if (this.#commandModeOptions.commandMode === GAME_MASTER && commandModeOptions.commandMode !== GAME_MASTER)
            location.reload();

        /* Check if any option has changed */
        var commandModeOptionsChanged = (!commandModeOptions.eras.every((value: string, idx: number) => {return value === this.getCommandModeOptions().eras[idx]}) || 
                                commandModeOptions.spawnPoints.red !== this.getCommandModeOptions().spawnPoints.red || 
                                commandModeOptions.spawnPoints.blue !== this.getCommandModeOptions().spawnPoints.blue ||
                                commandModeOptions.restrictSpawns !== this.getCommandModeOptions().restrictSpawns ||
                                commandModeOptions.restrictToCoalition !== this.getCommandModeOptions().restrictToCoalition);
        
        this.#commandModeOptions = commandModeOptions;
        this.setSpentSpawnPoints(0);
        this.refreshSpawnPoints();

        if (commandModeOptionsChanged) {
            document.dispatchEvent(new CustomEvent("commandModeOptionsChanged", { detail: this }));
            document.getElementById("command-mode-toolbar")?.classList.remove("hide");
            const el = document.getElementById("command-mode");
            if (el) {
                el.dataset.mode = commandModeOptions.commandMode;
                el.textContent = commandModeOptions.commandMode.toUpperCase();
            }
        }

        document.querySelector("#spawn-points-container")?.classList.toggle("hide", this.getCommandModeOptions().commandMode === GAME_MASTER || !this.getCommandModeOptions().restrictSpawns);
        document.querySelector("#command-mode-settings-button")?.classList.toggle("hide", this.getCommandModeOptions().commandMode !== GAME_MASTER);

        if (requestRefresh)
            refreshAll();
    }

    #onAirbaseClick(e: any) {
        getMap().showAirbaseContextMenu(e.originalEvent.x, e.originalEvent.y, e.latlng, e.sourceTarget);
    }

    #loadAirbaseChartData(callsign: string) {
        if ( !this.#theatre ) {
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open('GET', `api/airbases/${this.#theatre.toLowerCase()}/${callsign}`, true);
        xhr.responseType = 'json';
        xhr.onload = () => {
            var status = xhr.status;
            if (status === 200) {
                const data = xhr.response;
                this.getAirbases()[callsign].setChartData(data);
            } else {
                console.error(`Error retrieving data for ${callsign} airbase`)
            }
        };
        xhr.send();
    }
}
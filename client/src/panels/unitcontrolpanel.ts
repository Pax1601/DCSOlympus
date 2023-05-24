import { getUnitsManager } from "..";
import { Dropdown } from "../controls/dropdown";
import { Slider } from "../controls/slider";
import { aircraftDatabase } from "../units/aircraftdatabase";
import { groundUnitsDatabase } from "../units/groundunitsdatabase";
import { Aircraft, GroundUnit, Unit } from "../units/unit";
import { UnitDatabase } from "../units/unitdatabase";
import { Panel } from "./panel";

const ROEs: string[] = ["Hold", "Return", "Designated", "Free"];
const reactionsToThreat: string[] = ["None", "Manoeuvre", "Passive", "Evade"];
const emissionsCountermeasures: string[] = ["Silent", "Attack", "Defend", "Free"];

const ROEDescriptions: string[] = ["Hold (Never fire)", "Return (Only fire if fired upon)", "Designated (Attack the designated target only)", "Free (Attack anyone)"];
const reactionsToThreatDescriptions: string[] = ["None (No reaction)", "Manoeuvre (no countermeasures)", "Passive (Countermeasures only, no manoeuvre)", "Evade (Countermeasures and manoeuvers)"];
const emissionsCountermeasuresDescriptions: string[] = ["Silent (Radar OFF, no ECM)", "Attack (Radar only for targeting, ECM only if locked)", "Defend (Radar for searching, ECM if locked)", "Always on (Radar and ECM always on)"];

const minSpeedValues: { [key: string]: number } = { Aircraft: 100, Helicopter: 0, NavyUnit: 0, GroundUnit: 0 };
const maxSpeedValues: { [key: string]: number } = { Aircraft: 800, Helicopter: 300, NavyUnit: 60, GroundUnit: 60 };
const speedIncrements: { [key: string]: number } = { Aircraft: 25, Helicopter: 10, NavyUnit: 5, GroundUnit: 5 };
const minAltitudeValues: { [key: string]: number } = { Aircraft: 0, Helicopter: 0 };
const maxAltitudeValues: { [key: string]: number } = { Aircraft: 50000, Helicopter: 10000 };
const altitudeIncrements: { [key: string]: number } = { Aircraft: 500, Helicopter: 100 };

export class UnitControlPanel extends Panel {
    #altitudeSlider: Slider;
    #airspeedSlider: Slider;
    #TACANXYDropdown: Dropdown;
    #radioDecimalsDropdown: Dropdown;
    #radioCallsignDropdown: Dropdown;
    #expectedAltitude: number = -1;
    #expectedSpeed: number = -1;
    #optionButtons: { [key: string]: HTMLButtonElement[] } = {}
    #advancedSettingsDialog: HTMLElement;

    constructor(ID: string) {
        super(ID);

        /* Unit control sliders */
        this.#altitudeSlider = new Slider("altitude-slider", 0, 100, "ft", (value: number) => {
            this.#expectedAltitude = value;
            getUnitsManager().selectedUnitsSetAltitude(value * 0.3048)
        });

        this.#airspeedSlider = new Slider("airspeed-slider", 0, 100, "kts", (value: number) => {
            this.#expectedSpeed = value;
            getUnitsManager().selectedUnitsSetSpeed(value / 1.94384)
        });

        /* Advanced settings dropdowns */
        this.#TACANXYDropdown = new Dropdown("TACAN-XY", () => {});
        this.#TACANXYDropdown.setOptions(["X", "Y"]);
        this.#radioDecimalsDropdown = new Dropdown("radio-decimals", () => {});
        this.#radioDecimalsDropdown.setOptions([".000", ".250", ".500", ".750"]);
        this.#radioCallsignDropdown = new Dropdown("radio-callsign", () => {});

        /* Option buttons */
        this.#optionButtons["ROE"] = ROEs.map((option: string, index: number) => {
            return this.#createOptionButton(option, `roe/${option.toLowerCase()}.svg`, ROEDescriptions[index], () => { getUnitsManager().selectedUnitsSetROE(option); });
        });

        this.#optionButtons["reactionToThreat"] = reactionsToThreat.map((option: string, index: number) => {
            return this.#createOptionButton(option, `threat/${option.toLowerCase()}.svg`, reactionsToThreatDescriptions[index],() => { getUnitsManager().selectedUnitsSetReactionToThreat(option); });
        });

        this.#optionButtons["emissionsCountermeasures"] = emissionsCountermeasures.map((option: string, index: number) => {
            return this.#createOptionButton(option, `emissions/${option.toLowerCase()}.svg`, emissionsCountermeasuresDescriptions[index],() => { getUnitsManager().selectedUnitsSetEmissionsCountermeasures(option); });
        });

        this.getElement().querySelector("#roe-buttons-container")?.append(...this.#optionButtons["ROE"]);
        this.getElement().querySelector("#reaction-to-threat-buttons-container")?.append(...this.#optionButtons["reactionToThreat"]);
        this.getElement().querySelector("#emissions-countermeasures-buttons-container")?.append(...this.#optionButtons["emissionsCountermeasures"]);

        this.#advancedSettingsDialog = <HTMLElement> document.querySelector("#advanced-settings-dialog");

        window.setInterval(() => {this.update();}, 25);

        document.addEventListener("unitsSelection", (e: CustomEvent<Unit[]>) => { this.show(); this.addButtons();});
        document.addEventListener("clearSelection", () => { this.hide() });
        document.addEventListener("applyAdvancedSettings", () => {this.#applyAdvancedSettings();})
        document.addEventListener("showAdvancedSettings", () => {
            this.#updateAdvancedSettingsDialog(getUnitsManager().getSelectedUnits());
            this.#advancedSettingsDialog.classList.remove("hide");
        })

        this.hide();
    }

    //  Do this after panel is hidden (make sure there's a reset)
    hide() {
        super.hide();

        this.#expectedAltitude = -1;
        this.#expectedSpeed = -1;
    }

    addButtons() {
        var units = getUnitsManager().getSelectedUnits();
        if (units.length < 20) {
            this.getElement().querySelector("#selected-units-container")?.replaceChildren(...units.map((unit: Unit, index: number) => {
                let database: UnitDatabase | null;
                if (unit instanceof Aircraft)
                    database = aircraftDatabase;
                else if (unit instanceof GroundUnit)
                    database = groundUnitsDatabase;
                else
                    database = null; // TODO add databases for other unit types

                var button = document.createElement("button");
                var callsign = unit.getBaseData().unitName || "";

                button.setAttribute("data-short-label", database?.getByName(unit.getBaseData().name)?.shortLabel || unit.getBaseData().name);
                button.setAttribute("data-callsign", callsign);

                button.setAttribute("data-coalition", unit.getMissionData().coalition);
                button.classList.add("pill", "highlight-coalition")

                button.addEventListener("click", () => {
                    getUnitsManager().deselectAllUnits();
                    getUnitsManager().selectUnit(unit.ID, true);
                });
                return (button);
            }));
        } else {
            var el = document.createElement("div");
            el.innerText = "Too many units selected";
            this.getElement().querySelector("#selected-units-container")?.replaceChildren(el);
        }
    }

    update() {
        if (this.getVisible()){
            var units = getUnitsManager().getSelectedUnits();
            this.getElement().querySelector("#advanced-settings-div")?.classList.toggle("hide", units.length != 1);
            if (this.getElement() != null && units.length > 0) {
                this.#showFlightControlSliders(units);

                this.#optionButtons["ROE"].forEach((button: HTMLButtonElement) => {
                    button.classList.toggle("selected", units.every((unit: Unit) => unit.getOptionsData().ROE === button.value))
                });

                this.#optionButtons["reactionToThreat"].forEach((button: HTMLButtonElement) => {
                    button.classList.toggle("selected", units.every((unit: Unit) => unit.getOptionsData().reactionToThreat === button.value))
                });

                this.#optionButtons["emissionsCountermeasures"].forEach((button: HTMLButtonElement) => {
                    button.classList.toggle("selected", units.every((unit: Unit) => unit.getOptionsData().emissionsCountermeasures === button.value))
                });
            }
        }
    }

    /*  Update function will only be allowed to update the sliders once it's matched the expected value for the first time (due to lag of Ajax request) */
    #updateCanSetAltitudeSlider(altitude: number) {
        if (this.#expectedAltitude < 0 || altitude === this.#expectedAltitude) {
            this.#expectedAltitude = -1;
            return true;
        }
        return false;
    }

    #updateCanSetSpeedSlider(altitude: number) {
        if (this.#expectedSpeed < 0 || altitude === this.#expectedSpeed) {
            this.#expectedSpeed = -1;
            return true;
        }
        return false;
    }

    #showFlightControlSliders(units: Unit[]) {
        if (getUnitsManager().getSelectedUnitsType() !== undefined)
            this.#airspeedSlider.show()
        else
            this.#airspeedSlider.hide();

        if (getUnitsManager().getSelectedUnitsType() === "Aircraft" || getUnitsManager().getSelectedUnitsType() === "Helicopter")
            this.#altitudeSlider.show()
        else
            this.#altitudeSlider.hide();

        this.getElement().querySelector(`#categories-tooltip`)?.classList.toggle("hide", getUnitsManager().getSelectedUnitsType() !== undefined);

        var unitsType = getUnitsManager().getSelectedUnitsType();
        var targetAltitude = getUnitsManager().getSelectedUnitsTargetAltitude();
        var targetSpeed = getUnitsManager().getSelectedUnitsTargetSpeed();

        if (unitsType != undefined) {
            if (["GroundUnit", "NavyUnit"].includes(unitsType))
                this.#altitudeSlider.hide()

            this.#airspeedSlider.setMinMax(minSpeedValues[unitsType], maxSpeedValues[unitsType]);
            this.#altitudeSlider.setMinMax(minAltitudeValues[unitsType], maxAltitudeValues[unitsType]);
            this.#airspeedSlider.setIncrement(speedIncrements[unitsType]);
            this.#altitudeSlider.setIncrement(altitudeIncrements[unitsType]);

            this.#airspeedSlider.setActive(targetSpeed != undefined);
            if (targetSpeed != undefined) {
                targetSpeed *= 1.94384;
                if (this.#updateCanSetSpeedSlider(targetSpeed)) {
                    this.#airspeedSlider.setValue(targetSpeed);
                }
            }

            this.#altitudeSlider.setActive(targetAltitude != undefined);
            if (targetAltitude != undefined) {
                targetAltitude /= 0.3048;
                if (this.#updateCanSetAltitudeSlider(targetAltitude)) {
                    this.#altitudeSlider.setValue(targetAltitude);
                }
            }
        }
        else {
            this.#airspeedSlider.setActive(false);
            this.#altitudeSlider.setActive(false);
        }
    }

    #updateAdvancedSettingsDialog(units: Unit[])
    {
        if (units.length == 1)
        {
            /* HTML Elements */
            const unitNameEl = this.#advancedSettingsDialog.querySelector("#unit-name") as HTMLElement;
            const prohibitJettisonCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-jettison-checkbox")?.querySelector("input") as HTMLInputElement;
            const prohibitAfterburnerCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-afterburner-checkbox")?.querySelector("input") as HTMLInputElement;
            const prohibitAACheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-AA-checkbox")?.querySelector("input") as HTMLInputElement;
            const prohibitAGCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-AG-checkbox")?.querySelector("input") as HTMLInputElement;
            const prohibitAirWpnCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-air-wpn-checkbox")?.querySelector("input") as HTMLInputElement;
            const tankerCheckbox = this.#advancedSettingsDialog.querySelector("#tanker-checkbox")?.querySelector("input") as HTMLInputElement;
            const AWACSCheckbox = this.#advancedSettingsDialog.querySelector("#AWACS-checkbox")?.querySelector("input") as HTMLInputElement;
            const TACANCheckbox = this.#advancedSettingsDialog.querySelector("#TACAN-checkbox")?.querySelector("input") as HTMLInputElement;
            const TACANChannelInput = this.#advancedSettingsDialog.querySelector("#TACAN-channel")?.querySelector("input") as HTMLInputElement;
            const TACANCallsignInput = this.#advancedSettingsDialog.querySelector("#tacan-callsign")?.querySelector("input") as HTMLInputElement;
            const radioMhzInput = this.#advancedSettingsDialog.querySelector("#radio-mhz")?.querySelector("input") as HTMLInputElement;
            const radioCallsignNumberInput = this.#advancedSettingsDialog.querySelector("#radio-callsign-number")?.querySelector("input") as HTMLInputElement;
            
            const unit = units[0];
            const roles = aircraftDatabase.getByName(unit.getBaseData().name)?.loadouts.map((loadout) => {return loadout.roles})
            const tanker = roles != undefined && Array.prototype.concat.apply([], roles)?.includes("Tanker");
            const AWACS = roles != undefined && Array.prototype.concat.apply([], roles)?.includes("AWACS");
            const radioMHz = Math.floor(unit.getOptionsData().radio.frequency / 1000000);
            const radioDecimals = (unit.getOptionsData().radio.frequency / 1000000 - radioMHz) * 1000;

            /* Activate the correct options depending on unit type */
            this.#advancedSettingsDialog.toggleAttribute("data-show-settings", !tanker && !AWACS);
            this.#advancedSettingsDialog.toggleAttribute("data-show-tasking", tanker || AWACS);
            this.#advancedSettingsDialog.toggleAttribute("data-show-tanker", tanker);
            this.#advancedSettingsDialog.toggleAttribute("data-show-AWACS", AWACS);
            this.#advancedSettingsDialog.toggleAttribute("data-show-TACAN", tanker);
            this.#advancedSettingsDialog.toggleAttribute("data-show-radio", tanker || AWACS);

            /* Set common properties */
            // Name
            unitNameEl.innerText = unit.getBaseData().unitName;

            // General settings
            prohibitJettisonCheckbox.checked = unit.getOptionsData().generalSettings.prohibitJettison;
            prohibitAfterburnerCheckbox.checked = unit.getOptionsData().generalSettings.prohibitAfterburner;
            prohibitAACheckbox.checked = unit.getOptionsData().generalSettings.prohibitAA;
            prohibitAGCheckbox.checked = unit.getOptionsData().generalSettings.prohibitAG;
            prohibitAirWpnCheckbox.checked = unit.getOptionsData().generalSettings.prohibitAirWpn;

            // Tasking
            tankerCheckbox.checked = unit.getTaskData().isTanker;
            AWACSCheckbox.checked = unit.getTaskData().isAWACS;

            // TACAN
            TACANCheckbox.checked = unit.getOptionsData().TACAN.isOn;
            TACANChannelInput.value = String(unit.getOptionsData().TACAN.channel);
            TACANCallsignInput.value = String(unit.getOptionsData().TACAN.callsign);
            this.#TACANXYDropdown.setValue(unit.getOptionsData().TACAN.XY);

            // Radio
            radioMhzInput.value = String(radioMHz);
            radioCallsignNumberInput.value = String(unit.getOptionsData().radio.callsignNumber);
            this.#radioDecimalsDropdown.setValue("." + radioDecimals);
                    
            if (tanker) /* Set tanker specific options */
                this.#radioCallsignDropdown.setOptions(["Texaco", "Arco", "Shell"]);
            else if (AWACS) /* Set AWACS specific options */
                this.#radioCallsignDropdown.setOptions(["Overlord", "Magic", "Wizard", "Focus", "Darkstar"]);
            else
                this.#radioCallsignDropdown.setOptions(["Enfield", "Springfield", "Uzi", "Colt", "Dodge", "Ford", "Chevy", "Pontiac"]);

            // This must be done after setting the options
            if (!this.#radioCallsignDropdown.selectValue(unit.getOptionsData().radio.callsign - 1)) // Ensure the selected value is in the acceptable range
                this.#radioCallsignDropdown.selectValue(0);
        }
    }

    #applyAdvancedSettings()
    {
        /* HTML Elements */
        const prohibitJettisonCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-jettison-checkbox")?.querySelector("input") as HTMLInputElement;
        const prohibitAfterburnerCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-afterburner-checkbox")?.querySelector("input") as HTMLInputElement;
        const prohibitAACheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-AA-checkbox")?.querySelector("input") as HTMLInputElement;
        const prohibitAGCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-AG-checkbox")?.querySelector("input") as HTMLInputElement;
        const prohibitAirWpnCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-air-wpn-checkbox")?.querySelector("input") as HTMLInputElement;
        const tankerCheckbox = this.#advancedSettingsDialog.querySelector("#tanker-checkbox")?.querySelector("input") as HTMLInputElement;
        const AWACSCheckbox = this.#advancedSettingsDialog.querySelector("#AWACS-checkbox")?.querySelector("input") as HTMLInputElement;
        const TACANCheckbox = this.#advancedSettingsDialog.querySelector("#TACAN-checkbox")?.querySelector("input") as HTMLInputElement;
        const TACANChannelInput = this.#advancedSettingsDialog.querySelector("#TACAN-channel")?.querySelector("input") as HTMLInputElement;
        const TACANCallsignInput = this.#advancedSettingsDialog.querySelector("#tacan-callsign")?.querySelector("input") as HTMLInputElement;
        const radioMhzInput = this.#advancedSettingsDialog.querySelector("#radio-mhz")?.querySelector("input") as HTMLInputElement;
        const radioCallsignNumberInput = this.#advancedSettingsDialog.querySelector("#radio-callsign-number")?.querySelector("input") as HTMLInputElement;

        /* Tasking */
        const isTanker = tankerCheckbox.checked? true: false;
        const isAWACS = AWACSCheckbox.checked? true: false;

        /* TACAN */
        const TACAN: TACAN = {
            isOn: TACANCheckbox.checked? true: false,
            channel: Number(TACANChannelInput.value),
            XY: this.#TACANXYDropdown.getValue(),
            callsign: TACANCallsignInput.value as string
        }

        /* Radio */
        const radioMHz = Number(radioMhzInput.value);
        const radioDecimals = this.#radioDecimalsDropdown.getValue();
        const radio: Radio = {
            frequency: (radioMHz * 1000 + Number(radioDecimals.substring(1))) * 1000,
            callsign: this.#radioCallsignDropdown.getIndex() + 1,
            callsignNumber:  Number(radioCallsignNumberInput.value)
        }

        /* General settings */
        const generalSettings: GeneralSettings = {
            prohibitJettison: prohibitJettisonCheckbox.checked? true: false,
            prohibitAfterburner: prohibitAfterburnerCheckbox.checked? true: false,
            prohibitAA: prohibitAACheckbox.checked? true: false,
            prohibitAG: prohibitAGCheckbox.checked? true: false,
            prohibitAirWpn: prohibitAirWpnCheckbox.checked? true: false
        }
        
        /* Send command and close */
        var units = getUnitsManager().getSelectedUnits();
        if (units.length > 0)
            units[0].setAdvancedOptions(isTanker, isAWACS, TACAN, radio, generalSettings);

        this.#advancedSettingsDialog.classList.add("hide");
    }

    #createOptionButton(value: string, url: string, title: string, callback: EventListenerOrEventListenerObject) {
        var button = document.createElement("button");
        button.title = title;
        button.value = value;
        button.innerHTML = `<img src="/resources/theme/images/buttons/${url}" />`
        button.addEventListener("click", callback);
        return button;
    }
}
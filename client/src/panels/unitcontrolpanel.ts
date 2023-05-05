import { getUnitsManager } from "..";
import { Dropdown } from "../controls/dropdown";
import { Slider } from "../controls/slider";
import { dataPointMap } from "../other/utils";
import { aircraftDatabase } from "../units/aircraftdatabase";
import { groundUnitsDatabase } from "../units/groundunitsdatabase";
import { Aircraft, GroundUnit, Unit } from "../units/unit";
import { UnitDatabase } from "../units/unitdatabase";
import { Panel } from "./panel";

const ROEs: string[] = ["Hold", "Return", "Designated", "Free"];
const reactionsToThreat: string[] = ["None", "Passive", "Evade"];

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
            var button = document.createElement("button");
            button.title = option;
            button.value = option;
            button.addEventListener("click", () => { getUnitsManager().selectedUnitsSetROE(button.title); });
            return button;
        });

        this.#optionButtons["reactionToThreat"] = reactionsToThreat.map((option: string, index: number) => {
            var button = document.createElement("button");
            button.title = option;
            button.value = option;
            button.addEventListener("click", () => { getUnitsManager().selectedUnitsSetReactionToThreat(button.title); });
            return button;
        });

        this.getElement().querySelector("#roe-buttons-container")?.append(...this.#optionButtons["ROE"]);
        this.getElement().querySelector("#reaction-to-threat-buttons-container")?.append(...this.#optionButtons["reactionToThreat"]);

        this.#advancedSettingsDialog = <HTMLElement> document.querySelector("#advanced-settings-dialog");

        document.addEventListener("unitUpdated", (e: CustomEvent<Unit>) => { if (e.detail.getSelected()) this.update() });
        document.addEventListener("unitsSelection", (e: CustomEvent<Unit[]>) => { this.show(); this.addButtons(); this.update()});
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

            button.setAttribute("data-short-label", database?.getByName(unit.getBaseData().name)?.shortLabel || "");
            button.setAttribute("data-callsign", callsign);

            button.setAttribute("data-coalition", unit.getMissionData().coalition);
            button.classList.add("pill", "highlight-coalition")

            button.addEventListener("click", () => {
                getUnitsManager().deselectAllUnits();
                getUnitsManager().selectUnit(unit.ID, true);
            });
            return (button);
        }));
    }

    update() {
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
        }
    }

    //  Update function will only be allowed to update the sliders once it's matched the expected value for the first time (due to lag of Ajax request)
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
            const unit = units[0];
            (<HTMLElement>this.#advancedSettingsDialog.querySelector("#unit-name")).innerText = unit.getBaseData().unitName;

            if (getUnitsManager().getSelectedUnits().length == 1)
            {
                var radioMHz = Math.floor(unit.getTaskData().radioFrequency / 1000000);
                var radioDecimals = (unit.getTaskData().radioFrequency / 1000000 - radioMHz) * 1000;

                // Default values for "normal" units
                this.#radioCallsignDropdown.setOptions(["Enfield", "Springfield", "Uzi", "Colt", "Dodge", "Ford", "Chevy", "Pontiac"]);
                this.#radioCallsignDropdown.selectValue(unit.getTaskData().radioCallsign);

                // Input values
                var tankerCheckbox = this.#advancedSettingsDialog.querySelector("#tanker-checkbox")?.querySelector("input")
                var AWACSCheckbox = this.#advancedSettingsDialog.querySelector("#AWACS-checkbox")?.querySelector("input")

                var TACANChannelInput = this.#advancedSettingsDialog.querySelector("#TACAN-channel")?.querySelector("input");
                var TACANCallsignInput = this.#advancedSettingsDialog.querySelector("#tacan-callsign")?.querySelector("input");
                var radioMhzInput = this.#advancedSettingsDialog.querySelector("#radio-mhz")?.querySelector("input");
                var radioCallsignNumberInput = this.#advancedSettingsDialog.querySelector("#radio-callsign-number")?.querySelector("input");

                if (tankerCheckbox) tankerCheckbox.checked = unit.getTaskData().isTanker;
                if (AWACSCheckbox) AWACSCheckbox.checked = unit.getTaskData().isAWACS;
                if (TACANChannelInput) TACANChannelInput.value = String(unit.getTaskData().TACANChannel);
                if (TACANCallsignInput) TACANCallsignInput.value = String(unit.getTaskData().TACANCallsign);
                if (radioMhzInput) radioMhzInput.value = String(radioMHz);
                if (radioCallsignNumberInput) radioCallsignNumberInput.value = String(unit.getTaskData().radioCallsignNumber);

                this.#TACANXYDropdown.setValue(unit.getTaskData().TACANXY);
                this.#radioDecimalsDropdown.setValue("." + radioDecimals);

                // Make sure its in the valid range
                if (!this.#radioCallsignDropdown.selectValue(unit.getTaskData().radioCallsign))
                    this.#radioCallsignDropdown.selectValue(0);

                // Set options for tankers
                var roles = aircraftDatabase.getByName(unit.getBaseData().name)?.loadouts.map((loadout) => {return loadout.roles})
                if (roles != undefined && Array.prototype.concat.apply([], roles)?.includes("Tanker")){
                    this.#advancedSettingsDialog.querySelector("#tanker-checkbox")?.classList.remove("hide");
                    this.#radioCallsignDropdown.setOptions(["Texaco", "Arco", "Shell"]);
                    this.#radioCallsignDropdown.selectValue(unit.getTaskData().radioCallsign);
                }
                else {
                    this.#advancedSettingsDialog.querySelector("#tanker-checkbox")?.classList.add("hide");
                }

                // Set options for AWACS
                if (roles != undefined && Array.prototype.concat.apply([], roles)?.includes("AWACS")){
                    this.#advancedSettingsDialog.querySelector("#AWACS-checkbox")?.classList.remove("hide");
                    this.#radioCallsignDropdown.setOptions(["Overlord", "Magic", "Wizard", "Focus", "Darkstar"]);
                    this.#radioCallsignDropdown.selectValue(unit.getTaskData().radioCallsign);
                } else {
                    this.#advancedSettingsDialog.querySelector("#AWACS-checkbox")?.classList.add("hide");
                }
            }
        }
    }

    #applyAdvancedSettings()
    {
        const isTanker = this.#advancedSettingsDialog.querySelector("#tanker-checkbox")?.querySelector("input")?.checked? true: false;
        const isAWACS = this.#advancedSettingsDialog.querySelector("#AWACS-checkbox")?.querySelector("input")?.checked? true: false;
        const TACANChannel = Number(this.#advancedSettingsDialog.querySelector("#TACAN-channel")?.querySelector("input")?.value);
        const TACANXY = this.#TACANXYDropdown.getValue();
        const TACANCallsign = <string> this.#advancedSettingsDialog.querySelector("#tacan-callsign")?.querySelector("input")?.value
        const radioMHz = Number(this.#advancedSettingsDialog.querySelector("#radio-mhz")?.querySelector("input")?.value);
        const radioDecimals = this.#radioDecimalsDropdown.getValue();
        const radioCallsign = this.#radioCallsignDropdown.getIndex();
        const radioCallsignNumber = Number(this.#advancedSettingsDialog.querySelector("#radio-callsign-number")?.querySelector("input")?.value);

        var radioFrequency = (radioMHz * 1000 + Number(radioDecimals.substring(1))) * 1000;

        var units = getUnitsManager().getSelectedUnits();
        if (units.length > 0)
            units[0].setAdvancedOptions(isTanker, isAWACS, TACANChannel, TACANXY, TACANCallsign, radioFrequency, radioCallsign, radioCallsignNumber);

        this.#advancedSettingsDialog.classList.add("hide");
    }
}
import { getUnitsManager } from "..";
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
const altitudeIncrements: { [key: string]: number } = { Aircraft: 2500, Helicopter: 1000 };

export class UnitControlPanel extends Panel {
    #altitudeSlider: Slider;
    #airspeedSlider: Slider;
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
        document.addEventListener("unitsSelection", (e: CustomEvent<Unit[]>) => { this.show(); this.update() });
        document.addEventListener("clearSelection", () => { this.hide() });

        this.hide();
    }


    //  Do this after panel is hidden (make sure there's a reset)
    protected onHide() {
        this.#expectedAltitude = -1;
        this.#expectedSpeed = -1;
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

    update() {
        var units = getUnitsManager().getSelectedUnits();
        if (this.getElement() != null && units.length > 0) {
            this.#showFlightControlSliders(units);
            this.#updateAdvancedSettingsDialog(units);

            this.getElement().querySelector("#selected-units-container")?.replaceChildren(...units.map((unit: Unit, index: number) => {
                let database: UnitDatabase | null;
                if (unit instanceof Aircraft)
                    database = aircraftDatabase;
                else if (unit instanceof GroundUnit)
                    database = groundUnitsDatabase;
                else
                    database = null; // TODO add databases for other unit types

                console.log(unit.getBaseData());

                var button = document.createElement("button");
                var callsign = unit.getBaseData().unitName || "";

                button.setAttribute("data-short-label", database?.getByName(unit.getBaseData().name)?.shortLabel || "");
                button.setAttribute("data-callsign", callsign);

                button.setAttribute("data-coalition", unit.getMissionData().coalition);
                button.classList.add("pill", "highlight-coalition")

                button.addEventListener("click", () => getUnitsManager().selectUnit(unit.ID, true));
                return (button);
            }));

            this.#optionButtons["ROE"].forEach((button: HTMLButtonElement) => {
                button.classList.toggle("selected", units.every((unit: Unit) => unit.getOptionsData().ROE === button.value))
            });

            this.#optionButtons["reactionToThreat"].forEach((button: HTMLButtonElement) => {
                button.classList.toggle("selected", units.every((unit: Unit) => unit.getOptionsData().reactionToThreat === button.value))
            });
        }
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
        this.getElement().querySelector("#advanced-settings-div")?.classList.toggle("hide", units.length != 1);
        
        if (units.length == 1)
        {
            const unit = units[0];
            (<HTMLElement>this.#advancedSettingsDialog.querySelector("#unit-name")).innerText = unit.getBaseData().unitName;

            if (getUnitsManager().getSelectedUnits().length == 1){
                var roles = aircraftDatabase.getByName(unit.getBaseData().name)?.loadouts.map((loadout) => {return loadout.roles})
                if (roles != undefined && Array.prototype.concat.apply([], roles)?.includes("Tanker")){
                    this.#advancedSettingsDialog.querySelector("#tanker-checkbox")?.querySelector("input")?.setAttribute('checked', String(unit.getTaskData().isTanker));
                    this.#advancedSettingsDialog.querySelector("#tanker-checkbox")?.classList.remove("hide");
                }
                else {
                    this.#advancedSettingsDialog.querySelector("#tanker-checkbox")?.classList.add("hide");
                }

                if (roles != undefined && Array.prototype.concat.apply([], roles)?.includes("AWACS")){
                    this.#advancedSettingsDialog.querySelector("#AWACS-checkbox")?.querySelector("input")?.setAttribute('checked', String(unit.getTaskData().isAWACS));
                    this.#advancedSettingsDialog.querySelector("#AWACS-checkbox")?.classList.remove("hide");
                } else {
                    this.#advancedSettingsDialog.querySelector("#AWACS-checkbox")?.classList.add("hide");
                }
            }
        }
    }
}
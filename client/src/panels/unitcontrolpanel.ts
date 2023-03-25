import { getUnitsManager } from "..";
import { Slider } from "../controls/slider";
import { aircraftDatabase } from "../units/aircraftdatabase";
import { groundUnitsDatabase } from "../units/groundunitsdatabase";
import { Aircraft, GroundUnit, Unit } from "../units/unit";
import { UnitDatabase } from "../units/unitdatabase";
import { Panel } from "./panel";

//  const ROEs: string[] = ["Free", "Designated free", "Designated", "Return", "Hold"];  //  Full list
//  const reactionsToThreat: string[] = ["None", "Passive", "Evade", "Escape", "Abort"];  //  Full list

const ROEs: string[] = [ "Hold", "Return", "Designated", "Free" ];
const reactionsToThreat: string[] = [ "None", "Passive", "Evade"  ];

const minSpeedValues: { [key: string]: number } = { Aircraft: 100, Helicopter: 0, NavyUnit: 0, GroundUnit: 0 };
const maxSpeedValues: { [key: string]: number } = { Aircraft: 800, Helicopter: 300, NavyUnit: 60, GroundUnit: 60 };
const speedIncrements: { [key: string]: number } = { Aircraft: 25, Helicopter: 10, NavyUnit: 5, GroundUnit: 5 };
const minAltitudeValues: { [key: string]: number } = { Aircraft: 0, Helicopter: 0 };
const maxAltitudeValues: { [key: string]: number } = { Aircraft: 50000, Helicopter: 10000 };
const altitudeIncrements: { [key: string]: number } = { Aircraft: 2500, Helicopter: 1000 };

export class UnitControlPanel extends Panel {
    #altitudeSlider: Slider;
    #airspeedSlider: Slider;
    #optionButtons: { [key: string]: HTMLButtonElement[] } = {}

    constructor(ID: string) {
        super(ID);

        /* Unit control sliders */
        this.#altitudeSlider = new Slider("altitude-slider", 0, 100, "ft", (value: number) => getUnitsManager().selectedUnitsSetAltitude(value * 0.3048));
        this.#airspeedSlider = new Slider("airspeed-slider", 0, 100, "kts", (value: number) => getUnitsManager().selectedUnitsSetSpeed(value / 1.94384));

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

        document.addEventListener("unitUpdated", (e: CustomEvent<Unit>) => { if (e.detail.getSelected()) this.update() });
        document.addEventListener("unitsSelection", (e: CustomEvent<Unit[]>) => { this.show(); this.update() });
        document.addEventListener("clearSelection", () => { this.hide() });

        this.hide();
    }

    update() {
        var units = getUnitsManager().getSelectedUnits();
        if (this.getElement() != null && units.length > 0) {
            this.#showFlightControlSliders(units);

            this.getElement().querySelector("#selected-units-container")?.replaceChildren(...units.map((unit: Unit, index: number) => {
                let database: UnitDatabase | null;
                if (unit instanceof Aircraft)
                    database = aircraftDatabase;
                else if (unit instanceof GroundUnit)
                    database = groundUnitsDatabase;
                else
                    database = null; // TODO add databases for other unit types

                if (index === 0) {
                    this.getElement().querySelectorAll(`[data-object|="unit"]`).forEach(marker => {
                        marker.setAttribute("data-coalition", unit.getMissionData().coalition);
                        const shortLabel = <HTMLElement>marker.querySelector(".unit-short-label");
                        if (shortLabel)
                            shortLabel.innerText = database?.getByName(unit.getBaseData().name)?.shortLabel || "";
                    });
                }

                var button = document.createElement("button");
                const unitName = <HTMLInputElement>this.getElement().querySelector("#unit-name");
                var callsign = aircraftDatabase.getByName(unit.getBaseData().unitName)?.label || "";

                button.innerText = "";
                button.setAttribute("data-short-label", database?.getByName(unit.getBaseData().name)?.shortLabel || "");
                button.setAttribute("data-callsign", callsign);
                unitName.value = callsign;

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

    #showFlightControlSliders(units: Unit[])
    {
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
            if (targetSpeed != undefined)
                this.#airspeedSlider.setValue(targetSpeed * 1.94384);

            this.#altitudeSlider.setActive(targetAltitude != undefined);
            if (targetAltitude != undefined)
                this.#altitudeSlider.setValue(targetAltitude / 0.3048);
        }
        else {
            this.#airspeedSlider.setActive(false);
            this.#altitudeSlider.setActive(false);
        }
    }
}
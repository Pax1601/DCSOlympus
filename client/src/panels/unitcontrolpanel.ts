import { getUnitsManager } from "..";
import { Slider } from "../controls/slider";
import { Aircraft, AirUnit, GroundUnit, Helicopter, NavyUnit, Unit } from "../units/unit";
import { Panel } from "./panel";

const ROEs: string[] = ["Free", "Designated free", "Designated", "Return", "Hold"];
const reactionsToThreat: string[] = [ "None", "Passive", "Evade", "Escape", "Abort"];
const minSpeedValues: {[key: string]: number} = {Aircraft: 100, Helicopter: 0, NavyUnit: 0, GroundUnit: 0};
const maxSpeedValues: {[key: string]: number} = {Aircraft: 800, Helicopter: 300, NavyUnit: 60, GroundUnit: 60};
const minAltitudeValues: {[key: string]: number} = {Aircraft: 500, Helicopter: 0, NavyUnit: 0, GroundUnit: 0};
const maxAltitudeValues: {[key: string]: number} = {Aircraft: 50000, Helicopter: 10000, NavyUnit: 60, GroundUnit: 60};

export class UnitControlPanel extends Panel {
    #altitudeSlider: Slider;
    #airspeedSlider: Slider;
    #optionButtons: {[key: string]: HTMLButtonElement[]} = {}
    
    constructor(ID: string) {
        super(ID);

        /* Unit control sliders */
        this.#altitudeSlider = new Slider("altitude-slider", 0, 100, "ft", (value: number) => getUnitsManager().selectedUnitsSetAltitude(value * 0.3048));
        this.#airspeedSlider = new Slider("airspeed-slider", 0, 100, "kts", (value: number) => getUnitsManager().selectedUnitsSetSpeed(value / 1.94384));

        /* Option buttons */
        this.#optionButtons["ROE"] = ROEs.map((option: string) => {
            var button = document.createElement("button");
            button.innerText = option;
            button.addEventListener("click", () => getUnitsManager().selectedUnitsSetROE(button.value));
            return button;
        })

        this.#optionButtons["reactionToThreat"] = reactionsToThreat.map((option: string) => {
            var button = document.createElement("button");
            button.innerText = option;
            button.addEventListener("click", () => getUnitsManager().selectedUnitsSetROE(button.value));
            return button;
        })

        this.getElement().querySelector("#roe-buttons-container")?.append(...this.#optionButtons["ROE"]);
        this.getElement().querySelector("#reaction-to-threat-buttons-container")?.append(...this.#optionButtons["reactionToThreat"]);

        document.addEventListener("unitsSelection", (e: CustomEvent<Unit[]>) => {this.show(); this.update(e.detail)});
        document.addEventListener("clearSelection", () => {this.hide()});        

        this.hide();
    }

    update(units: Unit[]) {
        if (this.getElement() != null)
        {
            this.#showFlightControlSliders(units);
            this.getElement().querySelector("#selected-units-container")?.replaceChildren(...units.map((unit: Unit) =>
            {
                var button = document.createElement("button");
                button.innerText = unit.getData().unitName;
                button.addEventListener("click", () => getUnitsManager().selectUnit(unit.ID, true));
                return (button);
            }));

            this.#optionButtons["ROE"].forEach((button: HTMLButtonElement) => {
                button.classList.toggle("active", units.every((unit: Unit) => unit.getOptionsData().ROE === button.value))
            });    

            this.#optionButtons["reactionToThreat"].forEach((button: HTMLButtonElement) => {
                button.classList.toggle("active", units.every((unit: Unit) => unit.getOptionsData().reactionToThreat === button.value))
            });     
        }
    }

    #showFlightControlSliders(units: Unit[])
    {
        this.#airspeedSlider.show();
        this.#altitudeSlider.show();

        var unitsType = getUnitsManager().getSelectedUnitsType();
        var targetAltitude = getUnitsManager().getSelectedUnitsTargetAltitude();
        var targetSpeed = getUnitsManager().getSelectedUnitsTargetSpeed();

        if (["GroundUnit", "NavyUnit"].includes(unitsType))
            this.#altitudeSlider.hide()

        this.#airspeedSlider.setMinMax(minSpeedValues[unitsType], maxSpeedValues[unitsType]);
        this.#altitudeSlider.setMinMax(minAltitudeValues[unitsType], maxAltitudeValues[unitsType]);
        this.#airspeedSlider.setActive(targetSpeed != undefined);
        this.#airspeedSlider.setValue(targetSpeed * 1.94384);
        this.#altitudeSlider.setActive(targetAltitude != undefined);
        this.#altitudeSlider.setValue(targetAltitude / 0.3048);
    }
}
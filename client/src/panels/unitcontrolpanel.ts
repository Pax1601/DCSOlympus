import { getUnitsManager } from "..";
import { Slider } from "../controls/slider";
import { Aircraft, AirUnit, GroundUnit, Helicopter, NavyUnit, Unit } from "../units/unit";
import { Panel } from "./panel";

interface Button {
    id: string,
    value: string,
    element: null | HTMLElement
}

export class UnitControlPanel extends Panel {
    #altitudeSlider: Slider;
    #airspeedSlider: Slider;
    #formationCreationContainer: HTMLElement;
    #ROEButtonsContainer: HTMLElement;
    #reactionToThreatButtonsContainer: HTMLElement;
    #selectedUnitsContainer: HTMLElement;
    #ROEButtons: Button[] = [
        {id: "#free", value: "Free", element: null}, 
        {id: "#designated-free", value: "Designated free", element: null}, 
        {id: "#designated", value: "Designated", element: null}, 
        {id: "#return", value: "Return", element: null}, 
        {id: "#hold", value: "Hold", element: null}
    ]
    #reactionToThreatButtons: Button[] = [
        {id: "#none", value: "None", element: null}, 
        {id: "#passive", value: "Passive", element: null}, 
        {id: "#evade", value: "Evade", element: null}, 
        {id: "#escape", value: "Escape", element: null}, 
        {id: "#abort", value: "Abort", element: null}
    ]

    constructor(ID: string) {
        super(ID);

        /* Selected units container */
        this.#selectedUnitsContainer = <HTMLElement>(this.getElement().querySelector("#selected-units-container"));

        /* Unit control sliders */
        this.#altitudeSlider = new Slider("altitude-slider", 0, 100, "ft", (value: number) => getUnitsManager().selectedUnitsSetAltitude(value * 0.3048));
        this.#airspeedSlider = new Slider("airspeed-slider", 0, 100, "kts", (value: number) => getUnitsManager().selectedUnitsSetSpeed(value / 1.94384));

        /* Formation control buttons */
        this.#formationCreationContainer = <HTMLElement>(this.getElement().querySelector("#formation-creation-container"));
        //var createButton = <HTMLElement>this.#formationCreationContainer.querySelector("#create-formation");
        //createButton?.addEventListener("click", () => getUnitsManager().selectedUnitsCreateFormation());
        //var undoButton = <HTMLElement>this.#formationCreationContainer.querySelector("#undo-formation");
        //undoButton?.addEventListener("click", () => getUnitsManager().selectedUnitsUndoFormation());
      
        /* ROE buttons */
        this.#ROEButtonsContainer = <HTMLElement>(this.getElement().querySelector("#roe-buttons-container"));
        for (let button of this.#ROEButtons)
        {
            button.element = <HTMLElement>(this.#ROEButtonsContainer.querySelector(button.id));
            button.element?.addEventListener("click", () => getUnitsManager().selectedUnitsSetROE(button.value));
        }
        
        /* Reaction to threat buttons */
        this.#reactionToThreatButtonsContainer = <HTMLElement>(this.getElement().querySelector("#reaction-to-threat-buttons-container"));
        for (let button of this.#reactionToThreatButtons)
        {
            button.element = <HTMLElement>(this.#reactionToThreatButtonsContainer.querySelector(button.id));
            button.element?.addEventListener("click", () => getUnitsManager().selectedUnitsSetReactionToThreat(button.value));
        }

        this.hide();
    }

    update(units: Unit[]) {
        if (this.getElement() != null)
        {
            this.#addUnitsButtons(units);
            //this.#showFormationButtons(units);
            
            this.#showFlightControlSliders(units);

            for (let button of this.#ROEButtons)
                button.element?.classList.toggle("white", this.#getROE(units) === button.value);      
                
            for (let button of this.#reactionToThreatButtons)
                button.element?.classList.toggle("white", this.#getReactionToThreat(units) === button.value);           
        }
    }

    #showFlightControlSliders(units: Unit[])
    {
        this.#airspeedSlider.show();
        this.#altitudeSlider.show();

        if (this.#checkAllUnitsAircraft(units))
        {
            this.#airspeedSlider.setMinMax(100, 600);
            this.#altitudeSlider.setMinMax(0, 50000);
        }
        else if (this.#checkAllUnitsHelicopter(units))
        {
            this.#airspeedSlider.setMinMax(0, 200);
            this.#altitudeSlider.setMinMax(0, 10000);
        }
        else if (this.#checkAllUnitsGroundUnit(units))
        {
            this.#airspeedSlider.setMinMax(0, 60);
            this.#altitudeSlider.hide();
        }
        else if (this.#checkAllUnitsNavyUnit(units))
        {
            this.#airspeedSlider.setMinMax(0, 60);
            this.#altitudeSlider.hide();
        }
        else {
            this.#airspeedSlider.hide();
            this.#altitudeSlider.hide();
        }

        var targetSpeed = this.#getTargetAirspeed(units);
        if (targetSpeed != null)
        {
            this.#airspeedSlider.setActive(true);
            this.#airspeedSlider.setValue(targetSpeed * 1.94384);
        }
        else
        {
            this.#airspeedSlider.setActive(false);
        }

        var targetAltitude = this.#getTargetAltitude(units);
        if (targetAltitude != null)
        {
            this.#altitudeSlider.setActive(true);
            this.#altitudeSlider.setValue(targetAltitude / 0.3048);
        }
        else
        {
            this.#altitudeSlider.setActive(false);
        }
    }

    #addUnitsButtons(units: Unit[])
    {
        /* Remove any pre-existing unit button */
        var elements = this.#selectedUnitsContainer.getElementsByClassName("js-unit-container");
        while (elements.length > 0)
            this.#selectedUnitsContainer.removeChild(elements[0])

        /* Create all the units buttons */
        for (let unit of units)
        {
            this.#addUnitButton(unit, this.#selectedUnitsContainer);
            if (unit.getFormationData().isLeader)
                for (let wingman of unit.getWingmen())
                    this.#addUnitButton(wingman, this.#selectedUnitsContainer);
        }
    }

    #addUnitButton(unit: Unit, container: HTMLElement)
    {
        var el = document.createElement("div");
            
        /* Unit name (actually type, but DCS calls it name for some reason) */
        var nameDiv = document.createElement("div");
        nameDiv.classList.add("ol-rounded-container-small");
        if (unit.getData().name.length >= 7)
            nameDiv.innerHTML = `${unit.getData().name.substring(0, 4)} ...`;
        else 
            nameDiv.innerHTML = `${unit.getData().name}`;

        /* Unit icon */
        var icon = document.createElement("img");
        if (unit.getFormationData().isLeader)
            icon.src = "images/icons/formation.png"
        else if (unit.getFormationData().isWingman)
        {
            var wingmen = unit.getLeader()?.getWingmen();
            if (wingmen && wingmen.lastIndexOf(unit) == wingmen.length - 1)
                icon.src = "images/icons/formation-end.svg" 
            else
                icon.src = "images/icons/formation-middle.svg" 
        }
            
        else
            icon.src = "images/icons/singleton.png"

        el.innerHTML = unit.getData().unitName;

        el.prepend(nameDiv);

        /* Show the icon only for air units */
        if ((unit instanceof AirUnit))
            el.append(icon);

        el.classList.add("ol-rounded-container", "js-unit-container");

        if (!unit.getSelected())
            el.classList.add("not-selected")

        /* Set background color */
        el.classList.toggle("red", unit.getMissionData().coalition === "red");
        icon.classList.toggle("red", unit.getMissionData().coalition === "red");
        el.classList.toggle("blue", unit.getMissionData().coalition === "blue");
        icon.classList.toggle("blue", unit.getMissionData().coalition === "blue");
        el.classList.toggle("neutral", unit.getMissionData().coalition === "neutral"); 
        icon.classList.toggle("neutral", unit.getMissionData().coalition === "neutral");
        
        el.addEventListener("click", () => getUnitsManager().selectUnit(unit.ID));
        container.appendChild(el);
    }

    #showFormationButtons(units: Unit[])
    {
        var createButton = <HTMLElement>this.#formationCreationContainer.querySelector("#create-formation");
        var undoButton = <HTMLElement>this.#formationCreationContainer.querySelector("#undo-formation");
        if (createButton && undoButton && this.#checkAllUnitsAir(units))
        {
            if (!this.#checkUnitsAlreadyInFormation(units))
            {
                createButton.style.display = '';
                undoButton.style.display = 'none';
            }
            else if (this.#checkUnitsAlreadyInFormation(units) && this.#checkAllUnitsSameFormation(units))
            {
                createButton.style.display = 'none';
                undoButton.style.display = '';
            }
            else
            {
                createButton.style.display = 'none';
                undoButton.style.display = 'none';
            }
        }
    }

    #checkAllUnitsAir(units: Unit[])
    {
        for (let unit of units)
            if (!(unit instanceof AirUnit))
                return false
        return true
    }

    #checkAllUnitsAircraft(units: Unit[])
    {
        for (let unit of units)
            if (!(unit instanceof Aircraft))
                return false
        return true
    }

    #checkAllUnitsHelicopter(units: Unit[])
    {
        for (let unit of units)
            if (!(unit instanceof Helicopter))
                return false
        return true
    }

    #checkAllUnitsGroundUnit(units: Unit[])
    {
        for (let unit of units)
            if (!(unit instanceof GroundUnit))
                return false
        return true
    }

    #checkAllUnitsNavyUnit(units: Unit[])
    {
        for (let unit of units)
            if (!(unit instanceof NavyUnit))
                return false
        return true
    }

    #checkAllUnitsSameFormation(units: Unit[])
    {
        var leaderFound = false;
        for (let unit of units)
        {
            if (unit.getFormationData().isLeader)
            {
                if (leaderFound)
                    return false
                else 
                    leaderFound = true;
            }
            if (!unit.getFormationData().isLeader)
                return false
        }
        return true
    }

    #checkUnitsAlreadyInFormation(units: Unit[])
    {
        for (let unit of units)
            if (unit.getFormationData().isLeader)
                return true
        return false
    }

    #getTargetAirspeed(units: Unit[])
    {
        var airspeed = null;
        for (let unit of units)
        {
            if (unit.getTaskData().targetSpeed != airspeed && airspeed != null)
                return null
            else
                airspeed = unit.getTaskData().targetSpeed;
        }
        return airspeed;
    }

    #getTargetAltitude(units: Unit[])
    {
        var altitude = null;
        for (let unit of units)
        {
            if (unit.getTaskData().targetAltitude != altitude && altitude != null)
                return null
            else
                altitude = unit.getTaskData().targetAltitude;
        }
        return altitude;
    }

    #getROE(units: Unit[])
    {
        var ROE = null;
        for (let unit of units)
        {
            if (unit.getOptionsData().ROE !== ROE && ROE != null)
                return null
            else
                ROE = unit.getOptionsData().ROE;
        }
        return ROE;
    }

    #getReactionToThreat(units: Unit[])
    {
        var reactionToThreat = null;
        for (let unit of units)
        {
            if (unit.getOptionsData().reactionToThreat !== reactionToThreat && reactionToThreat != null)
                return null
            else
                reactionToThreat = unit.getOptionsData().reactionToThreat;
        }
        return reactionToThreat;
    }
}
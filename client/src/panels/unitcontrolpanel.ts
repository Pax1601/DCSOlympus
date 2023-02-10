import { imageOverlay } from "leaflet";
import { getUnitControlSliders, getUnitsManager } from "..";
import { ConvertDDToDMS, rad2deg } from "../other/utils";
import { Aircraft, AirUnit, GroundUnit, Helicopter, NavyUnit, Unit } from "../units/unit";

export class UnitControlPanel {
    #element: HTMLElement
    #display: string;

    constructor(ID: string) {
        this.#element = <HTMLElement>document.getElementById(ID);
        this.#display = '';
        if (this.#element != null) {
            this.#display = this.#element.style.display;
            var formationCreationContainer = <HTMLElement>(this.#element.querySelector("#formation-creation-container"));
            if (formationCreationContainer != null)
            {
                var createButton = <HTMLElement>formationCreationContainer.querySelector("#create-formation");
                createButton?.addEventListener("click", () => getUnitsManager().selectedUnitsCreateFormation());

                var undoButton = <HTMLElement>formationCreationContainer.querySelector("#undo-formation");
                undoButton?.addEventListener("click", () => getUnitsManager().selectedUnitsUndoFormation());
            }
            var ROEButtonsContainer = <HTMLElement>(this.#element.querySelector("#roe-buttons-container"));
            if (ROEButtonsContainer != null)
            {
                (<HTMLElement>ROEButtonsContainer.querySelector("#free"))?.addEventListener("click", () => getUnitsManager().selectedUnitsSetROE("Free"));
                (<HTMLElement>ROEButtonsContainer.querySelector("#designated-free"))?.addEventListener("click", () => getUnitsManager().selectedUnitsSetROE("Designated free"));
                (<HTMLElement>ROEButtonsContainer.querySelector("#designated"))?.addEventListener("click", () => getUnitsManager().selectedUnitsSetROE("Designated"));
                (<HTMLElement>ROEButtonsContainer.querySelector("#return"))?.addEventListener("click", () => getUnitsManager().selectedUnitsSetROE("Return"));
                (<HTMLElement>ROEButtonsContainer.querySelector("#hold"))?.addEventListener("click", () => getUnitsManager().selectedUnitsSetROE("Hold"));
            }

            var reactionToThreatButtonsContainer = <HTMLElement>(this.#element.querySelector("#reaction-to-threat-buttons-container"));
            if (reactionToThreatButtonsContainer != null)
            {
                (<HTMLElement>reactionToThreatButtonsContainer.querySelector("#none"))?.addEventListener("click", () => getUnitsManager().selectedUnitsSetReactionToThreat("None"));
                (<HTMLElement>reactionToThreatButtonsContainer.querySelector("#passive"))?.addEventListener("click", () => getUnitsManager().selectedUnitsSetReactionToThreat("Passive"));
                (<HTMLElement>reactionToThreatButtonsContainer.querySelector("#evade"))?.addEventListener("click", () => getUnitsManager().selectedUnitsSetReactionToThreat("Evade"));
                (<HTMLElement>reactionToThreatButtonsContainer.querySelector("#escape"))?.addEventListener("click", () => getUnitsManager().selectedUnitsSetReactionToThreat("Escape"));
                (<HTMLElement>reactionToThreatButtonsContainer.querySelector("#abort"))?.addEventListener("click", () => getUnitsManager().selectedUnitsSetReactionToThreat("Abort"));
            }
            this.hide();
        }
    }

    show() {
        this.#element.style.display = this.#display;
    }

    hide() {
        this.#element.style.display = "none";
    }

    update(units: Unit[]) {
        if (this.#element != null)
        {
            var selectedUnitsContainer = <HTMLElement>(this.#element.querySelector("#selected-units-container"));
            var formationCreationContainer = <HTMLElement>(this.#element.querySelector("#formation-creation-container"));
            if (selectedUnitsContainer != null && formationCreationContainer != null)
            {
                this.#addUnitsButtons(units, selectedUnitsContainer);
                this.#showFlightControlSliders(units);
                this.#showFormationButtons(units, formationCreationContainer);
            }

            var ROEButtonsContainer = <HTMLElement>(this.#element.querySelector("#roe-buttons-container"));
            if (ROEButtonsContainer != null)
            {
                (<HTMLElement>ROEButtonsContainer.querySelector("#free"))?.classList.toggle("white", this.#getROE(units) === "Free");
                (<HTMLElement>ROEButtonsContainer.querySelector("#designated-free"))?.classList.toggle("white", this.#getROE(units) === "Designated free");
                (<HTMLElement>ROEButtonsContainer.querySelector("#designated"))?.classList.toggle("white", this.#getROE(units) === "Designated");
                (<HTMLElement>ROEButtonsContainer.querySelector("#return"))?.classList.toggle("white", this.#getROE(units) === "Return");
                (<HTMLElement>ROEButtonsContainer.querySelector("#hold"))?.classList.toggle("white", this.#getROE(units) === "Hold");
            }

            var reactionToThreatButtonsContainer = <HTMLElement>(this.#element.querySelector("#reaction-to-threat-buttons-container"));
            if (reactionToThreatButtonsContainer != null)
            {
                (<HTMLElement>reactionToThreatButtonsContainer.querySelector("#none"))?.classList.toggle("white", this.#getReactionToThreat(units) === "None");
                (<HTMLElement>reactionToThreatButtonsContainer.querySelector("#passive"))?.classList.toggle("white", this.#getReactionToThreat(units) === "Passive");
                (<HTMLElement>reactionToThreatButtonsContainer.querySelector("#evade"))?.classList.toggle("white", this.#getReactionToThreat(units) === "Evade");
                (<HTMLElement>reactionToThreatButtonsContainer.querySelector("#escape"))?.classList.toggle("white", this.#getReactionToThreat(units) === "Escape");
                (<HTMLElement>reactionToThreatButtonsContainer.querySelector("#abort"))?.classList.toggle("white", this.#getReactionToThreat(units) === "Abort");
            }
        }
    }

    #showFlightControlSliders(units: Unit[])
    {
        var sliders = getUnitControlSliders();
        sliders.airspeed.show();
        sliders.altitude.show();

        if (this.#checkAllUnitsAircraft(units))
        {
            sliders.airspeed.setMinMax(100, 600);
            sliders.altitude.setMinMax(0, 50000);
        }
        else if (this.#checkAllUnitsHelicopter(units))
        {
            sliders.airspeed.setMinMax(0, 200);
            sliders.altitude.setMinMax(0, 10000);
        }
        else if (this.#checkAllUnitsGroundUnit(units))
        {
            sliders.airspeed.setMinMax(0, 60);
            sliders.altitude.hide();
        }
        else if (this.#checkAllUnitsNavyUnit(units))
        {
            sliders.airspeed.setMinMax(0, 60);
            sliders.altitude.hide();
        }
        else {
            sliders.airspeed.hide();
            sliders.altitude.hide();
        }

        var targetSpeed = this.#getTargetAirspeed(units);
        if (targetSpeed != null)
        {
            sliders.airspeed.setActive(true);
            sliders.airspeed.setValue(targetSpeed * 1.94384);
        }
        else
        {
            sliders.airspeed.setActive(false);
        }

        var targetAltitude = this.#getTargetAltitude(units);
        if (targetAltitude != null)
        {
            sliders.altitude.setActive(true);
            sliders.altitude.setValue(targetAltitude / 0.3048);
        }
        else
        {
            sliders.altitude.setActive(false);
        }
    }

    #addUnitsButtons(units: Unit[], selectedUnitsContainer: HTMLElement)
    {
        /* Remove any pre-existing unit button */
        var elements = selectedUnitsContainer.getElementsByClassName("js-unit-container");
        while (elements.length > 0)
            selectedUnitsContainer.removeChild(elements[0])

        /* Create all the units buttons */
        for (let unit of units)
        {
            this.#addUnitButton(unit, selectedUnitsContainer);
            if (unit.isLeader)
                for (let wingman of unit.getWingmen())
                    this.#addUnitButton(wingman, selectedUnitsContainer);
        }
    }

    #addUnitButton(unit: Unit, container: HTMLElement)
    {
        var el = document.createElement("div");
            
        /* Unit name (actually type, but DCS calls it name for some reason) */
        var nameDiv = document.createElement("div");
        nameDiv.classList.add("rounded-container-small");
        if (unit.name.length >= 7)
            nameDiv.innerHTML = `${unit.name.substring(0, 4)} ...`;
        else 
            nameDiv.innerHTML = `${unit.name}`;

        /* Unit icon */
        var icon = document.createElement("img");
        if (unit.isLeader)
            icon.src = "images/icons/formation.png"
        else if (unit.isWingman)
        {
            var wingmen = unit.getLeader()?.getWingmen();
            if (wingmen && wingmen.lastIndexOf(unit) == wingmen.length - 1)
                icon.src = "images/icons/formation-end.svg" 
            else
                icon.src = "images/icons/formation-middle.svg" 
        }
            
        else
            icon.src = "images/icons/singleton.png"

        el.innerHTML = unit.unitName;

        el.prepend(nameDiv);

        /* Show the icon only for air units */
        if ((unit instanceof AirUnit))
            el.append(icon);

        el.classList.add("rounded-container", "js-unit-container");

        if (!unit.getSelected())
            el.classList.add("not-selected")

        /* Set background color */
        if (unit.coalitionID == 1)
        {
            el.classList.add("red");
            icon.classList.add("red");
        }
        else if (unit.coalitionID == 2)
        {
            el.classList.add("blue");
            icon.classList.add("blue");
        }
        else
        {
            el.classList.add("neutral"); 
            icon.classList.add("neutral");
        }

        el.addEventListener("click", () => getUnitsManager().selectUnit(unit.ID));
        container.appendChild(el);
    }

    #showFormationButtons(units: Unit[], formationCreationContainer: HTMLElement)
    {
        var createButton = <HTMLElement>formationCreationContainer.querySelector("#create-formation");
        var undoButton = <HTMLElement>formationCreationContainer.querySelector("#undo-formation");
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
            if (unit.isLeader)
            {
                if (leaderFound)
                    return false
                else 
                    leaderFound = true;
            }
            if (!unit.isLeader)
                return false
        }
        return true
    }

    #checkUnitsAlreadyInFormation(units: Unit[])
    {
        for (let unit of units)
            if (unit.isLeader)
                return true
        return false
    }

    #getTargetAirspeed(units: Unit[])
    {
        var airspeed = null;
        for (let unit of units)
        {
            if (unit.targetSpeed != airspeed && airspeed != null)
                return null
            else
                airspeed = unit.targetSpeed;
        }
        return airspeed;
    }

    #getTargetAltitude(units: Unit[])
    {
        var altitude = null;
        for (let unit of units)
        {
            if (unit.targetAltitude != altitude && altitude != null)
                return null
            else
                altitude = unit.targetAltitude;
        }
        return altitude;
    }

    #getROE(units: Unit[])
    {
        var ROE = null;
        for (let unit of units)
        {
            if (unit.ROE !== ROE && ROE != null)
                return null
            else
                ROE = unit.ROE;
        }
        return ROE;
    }

    #getReactionToThreat(units: Unit[])
    {
        var reactionToThreat = null;
        for (let unit of units)
        {
            if (unit.reactionToThreat !== reactionToThreat && reactionToThreat != null)
                return null
            else
                reactionToThreat = unit.reactionToThreat;
        }
        return reactionToThreat;
    }
}
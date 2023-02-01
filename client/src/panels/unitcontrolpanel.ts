import { imageOverlay } from "leaflet";
import { getUnitsManager } from "..";
import { ConvertDDToDMS, rad2deg } from "../other/utils";
import { AirUnit, Unit } from "../units/unit";

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
                this.#showFormationButtons(units, formationCreationContainer);
            }
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
}
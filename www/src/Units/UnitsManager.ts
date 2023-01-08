import { Unit } from 'Unit.js'
import { LatLng } from 'leaflet';
import { cloneUnit } from 'DCS/DCSCommands.js'
import { showMessage } from 'index.js';

export class UnitsManager
{
    #units: { [ID: number]: Unit};
    #copiedUnits: Unit[];

    constructor()
    {
        this.#units = {};
        this.#copiedUnits = [];
    }

    addUnit(ID, data)
    {
        // The name of the unit category is exactly the same as the constructor name
        var constructor = eval(data.category);        
        if (constructor != undefined)
        {
            this.#units[ID] = new constructor(ID, data);
        }
    }

    getUnitByID(ID)
    {
        return this.#units[ID];
    }

    removeUnit(ID)
    {

    }

    deselectAllUnits()
    {
        for (let ID in this.#units)
        {
            this.#units[ID].setSelected(false);
        }
    }

    update(data)
    {
        for (let ID in data["units"])
        {
            // Create the unit if missing from the local array, then update the data. Drawing is handled by leaflet.
            if (!(ID in this.#units)) 
            {
                this.addUnit(parseInt(ID), data["units"][ID]);
            }
            this.#units[ID].update(data["units"][ID]);
        }
    }

    onUnitSelection()
    {
        if (this.getSelectedUnits().length > 0) 
        {
            map.setState("MOVE_UNIT");
            unitControlPanel.setEnabled(true);
        }
        else 
        {
            map.setState("IDLE");
            unitControlPanel.setEnabled(false);
        }
    }

    selectFromBounds(bounds)
    {
        this.deselectAllUnits();
        for (let ID in this.#units)
        {
            var latlng = new LatLng(this.#units[ID].latitude, this.#units[ID].longitude);
            if (bounds.contains(latlng))
            {
                this.#units[ID].setSelected(true);
            }
        }
    }

    getSelectedUnits()
    {
        var selectedUnits = [];
        for (let ID in this.#units)
        {
            if (this.#units[ID].getSelected()) 
            {
                selectedUnits.push(this.#units[ID]);
            }
        }
        return selectedUnits;
    }

    addDestination(latlng)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            var commandedUnit = selectedUnits[idx];
            if (selectedUnits[idx].wingman)
            {
                commandedUnit = this.getLeader(selectedUnits[idx].ID);
            }
            commandedUnit.addDestination(latlng);
        }
    }

    clearDestinations()
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            var commandedUnit = selectedUnits[idx];
            if (selectedUnits[idx].wingman)
            {
                commandedUnit = this.getLeader(selectedUnits[idx].ID);
            }
            commandedUnit.clearDestinations();
        }
    }

    selectedUnitsMove()
    {
        
    }

    selectedUnitsChangeSpeed(speedChange)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].changeSpeed(speedChange);
        }
    }

    selectedUnitsChangeAltitude(altitudeChange)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].changeAltitude(altitudeChange);
        }
    }

    handleKeyEvent(e)
    {
        if (e.originalEvent.code === 'KeyC' && e.originalEvent.ctrlKey)
        {
            this.copyUnits();
        }
        else if (e.originalEvent.code === 'KeyV' && e.originalEvent.ctrlKey)
        {
            this.pasteUnits();
        }
    }

    copyUnits()
    {
        this.#copiedUnits = this.getSelectedUnits();
    }

    pasteUnits()
    {
        for (let idx in this.#copiedUnits)
        {
            var unit = this.#copiedUnits[idx];
            cloneUnit(unit.ID);
        }
    }

    attackUnit(ID)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            // If a unit is a wingman, send the command to its leader
            var commandedUnit = selectedUnits[idx];
            if (selectedUnits[idx].wingman)
            {
                commandedUnit = this.getLeader(selectedUnits[idx].ID);
            }
            commandedUnit.attackUnit(ID);
        }
    }

    createFormation(ID)
    {
        var selectedUnits = this.getSelectedUnits();
        var wingmenIDs = [];
        for (let idx in selectedUnits)
        {
            if (selectedUnits[idx].wingman)
            {
                showMessage(selectedUnits[idx].unitName + " is already in a formation.");
                return;
            }
            else if (selectedUnits[idx].leader)
            {
                showMessage(selectedUnits[idx].unitName + " is already in a formation.");
                return;
            }
            else
            {
                /* TODO
                if (selectedUnits[idx].category !== this.getUnitByID(ID).category)
                {
                    showMessage("All units must be of the same category to create a formation.");
                }
                */
                if (selectedUnits[idx].ID != ID)
                {
                    wingmenIDs.push(selectedUnits[idx].ID);
                }
            }
        }
        if (wingmenIDs.length > 0)
        {
            this.getUnitByID(ID).setLeader(wingmenIDs);
        }
        else
        {
            showMessage("At least 2 units must be selected to create a formation.");
        }
    }

    getLeader(ID)
    {
        for (let idx in this.#units)
        {
            var unit = this.#units[idx];
            if (unit.leader)
            {
                if (unit.wingmen.includes(this.getUnitByID(ID)))
                {
                    return unit;
                }
            }
        }
        showMessage("Error: no leader found for this unit")
    }
}
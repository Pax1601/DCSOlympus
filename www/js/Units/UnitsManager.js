class UnitsManager
{
    constructor()
    {
        this._units = {};
        this._copiedUnits = [];
    }

    addUnit(ID, data)
    {
        // The name of the unit category is exactly the same as the constructor name
        var constructor = eval(data.category);        
        if (constructor != undefined)
        {
            this._units[ID] = new constructor(ID, data);
        }
    }

    getUnitByID(ID)
    {
        return this._units[ID];
    }

    removeUnit(ID)
    {

    }

    deselectAllUnits()
    {
        for (let ID in this._units)
        {
            this._units[ID].setSelected(false);
        }
    }

    update(data)
    {
        for (let ID in data["units"])
        {
            // Create the unit if missing from the local array, then update the data. Drawing is handled by leaflet.
            if (!(ID in this._units)) 
            {
                this.addUnit(parseInt(ID), data["units"][ID]);
            }
            this._units[ID].update(data["units"][ID]);
        }
    }

    onUnitSelection()
    {
        if (this.getSelectedUnits().length > 0) 
        {
            map.setState("MOVE_UNIT");
            unitControlPanel.setEnabled(true);
            actionPanel.setEnabled(true);
        }
        else 
        {
            map.setState("IDLE");
            unitControlPanel.setEnabled(false);
            actionPanel.setEnabled(false);
        }
    }

    selectFromBounds(bounds)
    {
        this.deselectAllUnits();
        for (let ID in this._units)
        {
            var latlng = new L.LatLng(this._units[ID].latitude, this._units[ID].longitude);
            if (bounds.contains(latlng))
            {
                this._units[ID].setSelected(true);
            }
        }
    }

    getSelectedUnits()
    {
        var selectedUnits = [];
        for (let ID in this._units)
        {
            if (this._units[ID].getSelected()) 
            {
                selectedUnits.push(this._units[ID]);
            }
        }
        return selectedUnits;
    }

    addDestination(latlng)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].addDestination(latlng);
        }
    }

    clearDestinations()
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].clearDestinations();
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
        this._copiedUnits = this.getSelectedUnits();
    }

    pasteUnits()
    {
        for (let idx in this._copiedUnits)
        {
            var unit = this._copiedUnits[idx];
            cloneUnit(unit.ID);
        }
    }

    attackUnit(ID)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].attackUnit(ID);
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
                if (selectedUnits[idx].category !== this.getUnitByID(ID).category)
                {
                    showMessage("All units must be of the same category to create a formation.");
                }
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

    getUnitsByFormationID(formationID)
    {
        var formationUnits = [];
        for (let ID in this._units)
        {
            if (this._units[ID].formationID == formationID)
            {
                formationUnits.push(this._units[ID]);
            }
        }
        return formationUnits;
    }

    getLeaderByFormationID(formationID)
    {
        var formationUnits = this.getUnitsByFormationID(formationID);
        for (let unit of formationUnits)
        {
            if (unit.leader)
            {
                return unit;
            }
        }
    }
}
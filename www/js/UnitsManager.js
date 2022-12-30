class UnitsManager
{
    constructor()
    {
        this._units = {};
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

    getUnit(ID)
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
            map.setState("UNIT_SELECTED");
            unitControlPanel.enableButtons(true);
        }
        else 
        {
            map.setState("IDLE");
            unitControlPanel.disableButtons();
        }
    }

    onUnitRightClick(ID)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].attackUnit(ID);
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
}
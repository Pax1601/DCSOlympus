class UnitsManager
{
    constructor()
    {
        this._units = {};
    }

    units()
    {
        return this._units;
    }

    addUnit(ID)
    {
        this._units[ID] = new Unit(ID)
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
                this.addUnit(parseInt(ID));
            }
            this._units[ID].update(data["units"][ID]);
        }
    }

    onUnitSelection()
    {
        if (this.getSelectedUnits().length > 0) 
        {
            map.setState("UNIT_SELECTED");
            topPanel.enableButtons(true);
        }
        else 
        {
            map.setState("IDLE");
            topPanel.disableButtons();
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
        for (let ID in this._units)
        {
            if (this._units[ID].getSelected()) 
            {
                this._units[ID].addDestination(latlng);
            }
        }
    }

    clearDestinations()
    {
        for (let ID in this._units)
        {
            if (this._units[ID].getSelected()) 
            {
                this._units[ID].clearDestinations();
            }
        }
    }

    selectedUnitsMove()
    {
        var asd = 1;
    }

    selectedUnitsChangeSpeed(speedChange)
    {

    }

    selectedUnitsChangeAltitude(altitudeChange)
    {

    }
}
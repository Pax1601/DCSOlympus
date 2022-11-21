class UnitsFactory
{
    constructor()
    {
        this._units = {};
    }

    createUnit(ID)
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
            if (!(ID in this._units)) this.createUnit(parseInt(ID));
            this._units[ID].update(data["units"][ID]);
        }
    }

    onUnitSelection()
    {
        if (this.getSelectedUnits().length > 0) map.setState("UNIT_SELECTED");
        else map.setState("IDLE");
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

    clearDestinations(latlng)
    {
        for (let ID in this._units)
        {
            if (this._units[ID].getSelected()) 
            {
                this._units[ID].clearDestinations();
            }
        }
    }
}
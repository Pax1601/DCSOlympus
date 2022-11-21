class Map
{
    constructor()
    {
        this._state = "IDLE";

        this._map = L.map('map', {doubleClickZoom: false}).setView([37.23, -115.8], 12);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }).addTo(this._map);

        // Main update rate. 250ms is minimum time, equal to server update time.
        setInterval(() => this.update(), 250);

        // Register event handles
        this._map.on('contextmenu', (e) => this.onContextMenu(e));
        this._map.on('click', (e) => this.onClick(e));
        this._map.on('dblclick', (e) => this.onDoubleClick(e));

        this.setState("IDLE");

        this._selectionWheel = undefined;
    }

    getMap()
    {
        return this._map;
    }

    // GET new data from the server
    update()
    {
        // Request the updated unit data from the server 
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", RESTaddress, true); 

        xmlHttp.onload = function(e) {
            var data = JSON.parse(xmlHttp.responseText);
            
            missionData.update(data);
            unitsFactory.update(data);
            leftPanel.update(unitsFactory.getSelectedUnits());
        };

        xmlHttp.onerror = function () {
            console.error("An error occurred during the XMLHttpRequest");
        };
        xmlHttp.send( null );
    }

    // State machine 
    setState(newState)
    {
        this._state = newState;
        if (this._state === "IDLE")
        {
            L.DomUtil.removeClass(this._map._container, 'move-cursor-enabled');
        }
        else if (this._state === "UNIT_SELECTED")
        {
            L.DomUtil.addClass(this._map._container, 'move-cursor-enabled');
        }
    }

    // Event handlers
    onContextMenu(e)
    {
        unitsFactory.deselectAllUnits();
        this._removeSelectionWheel();
    }

    onClick(e)
    {
        this._removeSelectionWheel();
        if (this._state === "IDLE")
        {
            
        }
        else if (this._state === "UNIT_SELECTED")
        {
            if (!e.originalEvent.ctrlKey)
            {
                unitsFactory.clearDestinations();
            }
            unitsFactory.addDestination(e.latlng)
        }
    }

    onDoubleClick(e)
    {
        this._selectionWheel = new SelectionWheel(e.originalEvent.x, e.originalEvent.y, ['1', '2', '3']);
    }

    _removeSelectionWheel()
    {
        if (this._selectionWheel !== undefined)
        {
            this._selectionWheel.remove();
            this._selectionWheel = undefined;
        }
    }
}
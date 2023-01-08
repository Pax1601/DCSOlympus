class Map
{
    constructor()
    {
        this._state = "IDLE";

        this._map = L.map('map', {doubleClickZoom: false}).setView([37.23, -115.8], 12);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }).addTo(this._map);

        // Register event handles
        this._map.on('contextmenu', (e) => this._onContextMenu(e));
        this._map.on('click', (e) => this._onClick(e));
        this._map.on('dblclick', (e) => this._onDoubleClick(e));
        this._map.on('movestart', () => {this.removeSelectionWheel(); this.removeSelectionScroll();});
        this._map.on('zoomstart', () => {this.removeSelectionWheel(); this.removeSelectionScroll();});
        this._map.on('selectionend', (e) => unitsManager.selectFromBounds(e.selectionBounds));
        this._map.on('keyup', (e) => unitsManager.handleKeyEvent(e));

        this._map._container.classList.add("action-cursor");

        this.setState("IDLE");

        this._selectionWheel = undefined;
        this._selectionScroll = undefined;

        /* Edit the default zoom box effect to use it as a multiple units selection */
        L.Map.BoxZoom.prototype._onMouseUp = function (e) {
            if ((e.which !== 1) && (e.button !== 1)) { return; }
        
            this._finish();
        
            if (!this._moved) { return; }
            // Postpone to next JS tick so internal click event handling
            // still see it as "moved".
            setTimeout(L.bind(this._resetState, this), 0);
            var bounds = new L.LatLngBounds(
                this._map.containerPointToLatLng(this._startPoint),
                this._map.containerPointToLatLng(this._point));
        
            this._map.fire('selectionend', {selectionBounds: bounds});
        }

        this._activeCoalition = "blue";
    }

    getMap()
    {
        return this._map;
    }

    /* State machine */
    setState(newState)
    {
        this._state = newState;
        
        var cursorElements = document.getElementsByClassName("action-cursor");
        for (let item of cursorElements)
        {
            item.classList.remove("move-cursor-enabled", "attack-cursor-enabled", "formation-cursor-enabled");
        }
        if (this._state === "IDLE")
        {
            
        }
        else if (this._state === "MOVE_UNIT")
        {
            for (let item of cursorElements)
            {
                item.classList.add("move-cursor-enabled");
            }
        }
        else if (this._state === "ATTACK")
        {
            for (let item of cursorElements)
            {
                item.classList.add("attack-cursor-enabled");
            }
        }
        else if (this._state === "FORMATION")
        {
            for (let item of cursorElements)
            {
                item.classList.add("formation-cursor-enabled");
            }
        }
    }

    getState()
    {
        return this._state;
    }

    /* Set the active coalition (for persistency) */
    setActiveCoalition(coalition)
    {
        this._activeCoalition = coalition;
    }

    getActiveCoalition()
    {
        return this._activeCoalition;
    }

    /* Event handlers */
    // Right click
    _onContextMenu(e)   
    {
        this.setState("IDLE");
        unitsManager.deselectAllUnits();
        this.removeSelectionWheel();
        this.removeSelectionScroll();
    }

    _onClick(e)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        if (this._state === "IDLE")
        {
            
        }
        else if (this._state === "MOVE_UNIT")
        {
            if (!e.originalEvent.ctrlKey)
            {
                unitsManager.clearDestinations();
            }
            unitsManager.addDestination(e.latlng)
        }
    }

    _onDoubleClick(e)
    {
        if (this._state == 'IDLE')
        {
            var options = [
                {'tooltip': 'Air unit',       'src': 'spawnAir.png',          'callback': () => this._aircraftSpawnMenu(e)},
                {'tooltip': 'Ground unit',    'src': 'spawnGround.png',       'callback': () => this._groundUnitSpawnMenu(e)},
                {'tooltip': 'Smoke',          'src': 'spawnSmoke.png',        'callback': () => this._smokeSpawnMenu(e)},
                {'tooltip': 'Explosion',      'src': 'spawnExplosion.png',    'callback': () => this._explosionSpawnMenu(e)}
            ]
            this._selectionWheel = new SelectionWheel(e.originalEvent.x, e.originalEvent.y, options);
        }
    }

    /* Selection wheel and selection scroll functions */
    removeSelectionWheel()
    {
        if (this._selectionWheel !== undefined)
        {
            this._selectionWheel.remove();
            this._selectionWheel = undefined;
        }
    }

    removeSelectionScroll()
    {
        if (this._selectionScroll !== undefined)
        {
            this._selectionScroll.remove();
            this._selectionScroll = undefined;
        }
    }

    /* Show unit selection for air units */
    spawnFromAirbase(e)
    {
        this._selectAircraft(e);
    }

    /* Spawn a new ground unit selection wheel */
    _aircraftSpawnMenu(e)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        var options = [
            {'coalition': true, 'tooltip': 'CAP',       'src': 'spawnCAP.png',      'callback': () => this._selectAircraft(e, "CAP")},
            {'coalition': true, 'tooltip': 'CAS',       'src': 'spawnCAS.png',      'callback': () => this._selectAircraft(e, "CAS")},
            {'coalition': true, 'tooltip': 'Tanker',    'src': 'spawnTanker.png',   'callback': () => this._selectAircraft(e, "tanker")},
            {'coalition': true, 'tooltip': 'AWACS',     'src': 'spawnAWACS.png',    'callback': () => this._selectAircraft(e, "awacs")},
            {'coalition': true, 'tooltip': 'Strike',    'src': 'spawnStrike.png',   'callback': () => this._selectAircraft(e, "strike")},
            {'coalition': true, 'tooltip': 'Drone',     'src': 'spawnDrone.png',    'callback': () => this._selectAircraft(e, "drone")},
            {'coalition': true, 'tooltip': 'Transport', 'src': 'spawnTransport.png','callback': () => this._selectAircraft(e, "transport")},
        ]
        this._selectionWheel = new SelectionWheel(e.originalEvent.x, e.originalEvent.y, options);
    }

    /* Spawn a new ground unit selection wheel */
    _groundUnitSpawnMenu(e)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        var options = [
            {'coalition': true, 'tooltip': 'Howitzer',   'src': 'spawnHowitzer.png', 'callback': () => this._selectGroundUnit(e, "Howitzers")},
            {'coalition': true, 'tooltip': 'SAM',        'src': 'spawnSAM.png',      'callback': () => this._selectGroundUnit(e, "SAM")},
            {'coalition': true, 'tooltip': 'IFV',        'src': 'spawnIFV.png',      'callback': () => this._selectGroundUnit(e, "IFV")},
            {'coalition': true, 'tooltip': 'Tank',       'src': 'spawnTank.png',     'callback': () => this._selectGroundUnit(e, "Tanks")},
            {'coalition': true, 'tooltip': 'MLRS',       'src': 'spawnMLRS.png',     'callback': () => this._selectGroundUnit(e, "MLRS")},
            {'coalition': true, 'tooltip': 'Radar',      'src': 'spawnRadar.png',    'callback': () => this._selectGroundUnit(e, "Radar")},
            {'coalition': true, 'tooltip': 'Unarmed',    'src': 'spawnUnarmed.png',  'callback': () => this._selectGroundUnit(e, "Unarmed")}
        ]
        this._selectionWheel = new SelectionWheel(e.originalEvent.x, e.originalEvent.y, options);
    }

    /* Spawn smoke selection wheel */
    _smokeSpawnMenu(e)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        var options = [
            {'tooltip': 'Red smoke',      'src': 'spawnSmoke.png',  'callback': () => {this.removeSelectionWheel(); this.removeSelectionScroll(); spawnSmoke('red', e.latlng)}, 'tint': 'red'},
            {'tooltip': 'White smoke',    'src': 'spawnSmoke.png',  'callback': () => {this.removeSelectionWheel(); this.removeSelectionScroll(); spawnSmoke('white', e.latlng)}, 'tint': 'white'},
            {'tooltip': 'Blue smoke',     'src': 'spawnSmoke.png',  'callback': () => {this.removeSelectionWheel(); this.removeSelectionScroll(); spawnSmoke('blue', e.latlng)}, 'tint': 'blue'},
            {'tooltip': 'Green smoke',    'src': 'spawnSmoke.png',  'callback': () => {this.removeSelectionWheel(); this.removeSelectionScroll(); spawnSmoke('green', e.latlng)}, 'tint': 'green'},
            {'tooltip': 'Orange smoke',   'src': 'spawnSmoke.png',  'callback': () => {this.removeSelectionWheel(); this.removeSelectionScroll(); spawnSmoke('orange', e.latlng)}, 'tint': 'orange'},
        ]
        this._selectionWheel = new SelectionWheel(e.originalEvent.x, e.originalEvent.y, options);
    }

    /* Spawn an explosion selection wheel (TODO) */
    _explosionSpawnMenu(e)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        var options = [
            
        ]
        this._selectionWheel = new SelectionWheel(e.originalEvent.x, e.originalEvent.y, options);
    }

    /* Show unit selection for air units */
    _selectAircraft(e, group)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        var options = unitTypes.air[group];
        options.sort();
        this._selectionScroll = new SelectionScroll(e.originalEvent.x, e.originalEvent.y, options, (unitType) => {
            this.removeSelectionWheel(); 
            this.removeSelectionScroll(); 
            this._unitSelectPayload(unitType, e);
        });
    }

    /* Show weapon selection for air units */
    _unitSelectPayload(unitType, e)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        var options = [];
        options = payloadNames[unitType]
        if (options != undefined && options.length > 0)
        {
            options.sort();
            this._selectionScroll = new SelectionScroll(e.originalEvent.x, e.originalEvent.y, options, (payloadName) => {
                this.removeSelectionWheel(); 
                this.removeSelectionScroll(); 
                spawnAircraft(unitType, e.latlng, this._activeCoalition, payloadName, e.airbaseName);
            });
        } 
        else
        {
            spawnAircraft(unitType, e.latlng, this._activeCoalition);
        }
    }

    /* Show unit selection for ground units */
    _selectGroundUnit(e, group)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        var options = unitTypes.vehicles[group];
        options.sort();
        this._selectionScroll = new SelectionScroll(e.originalEvent.x, e.originalEvent.y, options, (type) => {
            this.removeSelectionWheel(); 
            this.removeSelectionScroll(); 
            spawnGroundUnit(type, e.latlng, this._activeCoalition);
        });
    }
}
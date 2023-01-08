import { map, tileLayer } from 'leaflet'
import { SelectionWheel } from './SelectionWheel.js';
import { SelectionScroll } from './SelectionScroll.js';
import { spawnAircraft, spawnGroundUnit, spawnSmoke } from '../DCS/DCSCommands.js';
import { payloadNames } from '../DCS/payloadNames.js';

export class Map
{
    #state          : string;
    #map            : any;  // TODO Fix, has same name of global variable
    #selectionWheel : SelectionWheel;
    #selectionScroll: SelectionScroll;
    #activeCoalition: string;

    constructor()
    {
        this.#state = "IDLE";

        this.#map = map('map', {doubleClickZoom: false}).setView([37.23, -115.8], 12);

        tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }).addTo(this.#map);

        // Register event handles
        this.#map.on('contextmenu', (e) => this.#onContextMenu(e));
        this.#map.on('click', (e) => this.#onClick(e));
        this.#map.on('dblclick', (e) => this.#onDoubleClick(e));
        this.#map.on('movestart', () => {this.removeSelectionWheel(); this.removeSelectionScroll();});
        this.#map.on('zoomstart', () => {this.removeSelectionWheel(); this.removeSelectionScroll();});
        this.#map.on('selectionend', (e) => unitsManager.selectFromBounds(e.selectionBounds));
        this.#map.on('keyup', (e) => unitsManager.handleKeyEvent(e));

        this.#map._container.classList.add("action-cursor");

        this.setState("IDLE");

        this.#selectionWheel = undefined;
        this.#selectionScroll = undefined;

        // TODO
        /* Edit the default zoom box effect to use it as a multiple units selection 
        Map.BoxZoom.prototype._onMouseUp = function (e) {
            if ((e.which !== 1) && (e.button !== 1)) { return; }
        
            this.#finish();
        
            if (!this.#moved) { return; }
            // Postpone to next JS tick so internal click event handling
            // still see it as "moved".
            setTimeout(L.bind(this.#resetState, this), 0);
            var bounds = new L.LatLngBounds(
                this.#map.containerPointToLatLng(this.#startPoint),
                this.#map.containerPointToLatLng(this.#point));
        
            this.#map.fire('selectionend', {selectionBounds: bounds});
        }
        */

        this.#activeCoalition = "blue";
    }

    getMap()
    {
        return this.#map;
    }

    /* State machine */
    setState(newState)
    {
        this.#state = newState;
        
        var cursorElements = document.getElementsByClassName("action-cursor");
        for (let idx in cursorElements)
        {
            var item = cursorElements[idx];
            item.classList.remove("move-cursor-enabled", "attack-cursor-enabled", "formation-cursor-enabled");
        }
        if (this.#state === "IDLE")
        {
            
        }
        else if (this.#state === "MOVE_UNIT")
        {
            for (let idx in cursorElements)
            {
                var item = cursorElements[idx];
                item.classList.add("move-cursor-enabled");
            }
        }
        else if (this.#state === "ATTACK")
        {
            for (let idx in cursorElements)
            {
                var item = cursorElements[idx];
                item.classList.add("attack-cursor-enabled");
            }
        }
        else if (this.#state === "FORMATION")
        {
            for (let idx in cursorElements)
            {
                var item = cursorElements[idx];
                item.classList.add("formation-cursor-enabled");
            }
        }
    }

    getState()
    {
        return this.#state;
    }

    /* Set the active coalition (for persistency) */
    setActiveCoalition(coalition)
    {
        this.#activeCoalition = coalition;
    }

    getActiveCoalition()
    {
        return this.#activeCoalition;
    }

    /* Event handlers */
    // Right click
    #onContextMenu(e)   
    {
        this.setState("IDLE");
        unitsManager.deselectAllUnits();
        this.removeSelectionWheel();
        this.removeSelectionScroll();
    }

    #onClick(e)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        if (this.#state === "IDLE")
        {
            
        }
        else if (this.#state === "MOVE_UNIT")
        {
            if (!e.originalEvent.ctrlKey)
            {
                unitsManager.clearDestinations();
            }
            unitsManager.addDestination(e.latlng)
        }
    }

    #onDoubleClick(e)
    {
        if (this.#state == 'IDLE')
        {
            var options = [
                {'tooltip': 'Air unit',       'src': 'spawnAir.png',          'callback': () => this.#aircraftSpawnMenu(e)},
                {'tooltip': 'Ground unit',    'src': 'spawnGround.png',       'callback': () => this.#groundUnitSpawnMenu(e)},
                {'tooltip': 'Smoke',          'src': 'spawnSmoke.png',        'callback': () => this.#smokeSpawnMenu(e)},
                {'tooltip': 'Explosion',      'src': 'spawnExplosion.png',    'callback': () => this.#explosionSpawnMenu(e)}
            ]
            this.showSelectionWheel(e, options, true);
        }
    }

    showSelectionWheel(e, options, coalition)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        this.#selectionWheel = new SelectionWheel(e.originalEvent.x, e.originalEvent.y, options, coalition);
    }

    /* Selection wheel and selection scroll functions */
    removeSelectionWheel()
    {
        if (this.#selectionWheel !== undefined)
        {
            this.#selectionWheel.remove();
            this.#selectionWheel = undefined;
        }
    }

    removeSelectionScroll()
    {
        if (this.#selectionScroll !== undefined)
        {
            this.#selectionScroll.remove();
            this.#selectionScroll = undefined;
        }
    }

    /* Show unit selection for air units */
    spawnFromAirbase(e)
    {
        this.#selectAircraft(e, undefined);
    }

    /* Spawn a new ground unit selection wheel */
    #aircraftSpawnMenu(e)
    {
        var options = [
            {'coalition': true, 'tooltip': 'CAP',       'src': 'spawnCAP.png',      'callback': () => this.#selectAircraft(e, "CAP")},
            {'coalition': true, 'tooltip': 'CAS',       'src': 'spawnCAS.png',      'callback': () => this.#selectAircraft(e, "CAS")},
            {'coalition': true, 'tooltip': 'Tanker',    'src': 'spawnTanker.png',   'callback': () => this.#selectAircraft(e, "tanker")},
            {'coalition': true, 'tooltip': 'AWACS',     'src': 'spawnAWACS.png',    'callback': () => this.#selectAircraft(e, "awacs")},
            {'coalition': true, 'tooltip': 'Strike',    'src': 'spawnStrike.png',   'callback': () => this.#selectAircraft(e, "strike")},
            {'coalition': true, 'tooltip': 'Drone',     'src': 'spawnDrone.png',    'callback': () => this.#selectAircraft(e, "drone")},
            {'coalition': true, 'tooltip': 'Transport', 'src': 'spawnTransport.png','callback': () => this.#selectAircraft(e, "transport")},
        ]
        this.showSelectionWheel(e, options, true);
    }

    /* Spawn a new ground unit selection wheel */
    #groundUnitSpawnMenu(e)
    {
        var options = [
            {'coalition': true, 'tooltip': 'Howitzer',   'src': 'spawnHowitzer.png', 'callback': () => this.#selectGroundUnit(e, "Howitzers")},
            {'coalition': true, 'tooltip': 'SAM',        'src': 'spawnSAM.png',      'callback': () => this.#selectGroundUnit(e, "SAM")},
            {'coalition': true, 'tooltip': 'IFV',        'src': 'spawnIFV.png',      'callback': () => this.#selectGroundUnit(e, "IFV")},
            {'coalition': true, 'tooltip': 'Tank',       'src': 'spawnTank.png',     'callback': () => this.#selectGroundUnit(e, "Tanks")},
            {'coalition': true, 'tooltip': 'MLRS',       'src': 'spawnMLRS.png',     'callback': () => this.#selectGroundUnit(e, "MLRS")},
            {'coalition': true, 'tooltip': 'Radar',      'src': 'spawnRadar.png',    'callback': () => this.#selectGroundUnit(e, "Radar")},
            {'coalition': true, 'tooltip': 'Unarmed',    'src': 'spawnUnarmed.png',  'callback': () => this.#selectGroundUnit(e, "Unarmed")}
        ]
        this.showSelectionWheel(e, options, true);
    }

    /* Spawn smoke selection wheel */
    #smokeSpawnMenu(e)
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
        this.showSelectionWheel(e, options, true);
    }

    /* Spawn an explosion selection wheel (TODO) */
    #explosionSpawnMenu(e)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        var options = [
            
        ]
        this.showSelectionWheel(e, options, true);
    }

    /* Show unit selection for air units */
    #selectAircraft(e, group)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        var options = unitTypes.air[group];
        options.sort();
        this.#selectionScroll = new SelectionScroll(e.originalEvent.x, e.originalEvent.y, options, (unitType) => {
            this.removeSelectionWheel(); 
            this.removeSelectionScroll(); 
            this.#unitSelectPayload(unitType, e);
        });
    }

    /* Show weapon selection for air units */
    #unitSelectPayload(unitType, e)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        var options = [];
        options = payloadNames[unitType]
        if (options != undefined && options.length > 0)
        {
            options.sort();
            this.#selectionScroll = new SelectionScroll(e.originalEvent.x, e.originalEvent.y, options, (payloadName) => {
                this.removeSelectionWheel(); 
                this.removeSelectionScroll(); 
                spawnAircraft(unitType, e.latlng, this.#activeCoalition, payloadName, e.airbaseName);
            });
        } 
        else
        {
            spawnAircraft(unitType, e.latlng, this.#activeCoalition);
        }
    }

    /* Show unit selection for ground units */
    #selectGroundUnit(e, group)
    {
        this.removeSelectionWheel();
        this.removeSelectionScroll();
        var options = unitTypes.vehicles[group];
        options.sort();
        this.#selectionScroll = new SelectionScroll(e.originalEvent.x, e.originalEvent.y, options, (type) => {
            this.removeSelectionWheel(); 
            this.removeSelectionScroll(); 
            spawnGroundUnit(type, e.latlng, this.#activeCoalition);
        });
    }
}
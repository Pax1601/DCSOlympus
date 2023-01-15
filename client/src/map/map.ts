import * as L from "leaflet"
import { getSelectionWheel, getSelectionScroll, getUnitsManager, getActiveCoalition } from "..";
import { spawnAircraft } from "../dcs/dcs";
import { payloadNames } from "../units/payloadNames";
import { unitTypes } from "../units/unitTypes";

export class Map extends L.Map 
{
    #state: string;

    constructor(containerId: string)
    {
        /* Init the leaflet map */
        super(containerId, {doubleClickZoom: false});
        this.setView([37.23, -115.8], 12);
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        }).addTo(this);

        /* Init the state machine */
        this.#state = "IDLE";

        /* Register event handles */
        this.on("contextmenu", (e) => this.#onContextMenu(e));
        this.on("click", (e) => this.#onClick(e));
        this.on("dblclick", (e) => this.#onDoubleClick(e));
    }

    /* State machine */
    setState(state: string)
    {
        this.#state = state;
        
        if (this.#state === "IDLE")
        {
            
        }
        else if (this.#state === "MOVE_UNIT")
        {
            
        }
        else if (this.#state === "ATTACK")
        {
            
        }
        else if (this.#state === "FORMATION")
        {
            
        }
    }

    getState()
    {
        return this.#state;
    }

    /* Selection wheel */
    showSelectionWheel(e: PointerEvent, options: any, showCoalition: boolean)
    {
        var x = e.x;
        var y = e.y;
        getSelectionWheel().show(x, y, options, showCoalition);
    }

    hideSelectionWheel()
    {
        getSelectionWheel().hide();
    }

    /* Selection scroll */
    showSelectionScroll(e: PointerEvent, options: any, callback: CallableFunction)
    {
        var x = e.x;
        var y = e.y;
        getSelectionScroll().show(x, y, options, callback);
    }

    hideSelectionScroll()
    {
        getSelectionScroll().hide();
    }
    
    /* Event handlers */
    #onContextMenu(e: any)
    {
        this.setState("IDLE");
        getUnitsManager().deselectAllUnits();
        this.hideSelectionWheel();
        this.hideSelectionScroll();
    }

    #onClick(e: any)
    {
        this.hideSelectionWheel();
        this.hideSelectionScroll();
        if (this.#state === "IDLE")
        {
            
        }
        else if (this.#state === "MOVE_UNIT")
        {
            if (!e.originalEvent.ctrlKey)
            {
                //unitsManager.clearDestinations();
            }
            //unitsManager.addDestination(e.latlng)
        }
    }

    #onDoubleClick(e: any)
    {
        if (this.#state == "IDLE")
        {
            var options = [
                {"tooltip": "Air unit",       "src": "spawnAir.png",          "callback": () => this.#aircraftSpawnMenu(e)},
                {"tooltip": "Ground unit",    "src": "spawnGround.png",       "callback": () => this.#groundUnitSpawnMenu(e)},
                {"tooltip": "Smoke",          "src": "spawnSmoke.png",        "callback": () => this.#smokeSpawnMenu(e)},
                {"tooltip": "Explosion",      "src": "spawnExplosion.png",    "callback": () => this.#explosionSpawnMenu(e)}
            ]
            this.showSelectionWheel(e.originalEvent, options, true);
        }
    }

    /* Spawning menus */ 
    #groundUnitSpawnMenu(e: any)
    {

    }

    #smokeSpawnMenu(e: any)
    {
        
    }

    #explosionSpawnMenu(e: any)
    {
        
    }

    #aircraftSpawnMenu(e: any)
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
        this.showSelectionWheel(e.originalEvent, options, true);
    }

    /* Show unit selection for air units */
    #selectAircraft(e: any, group: string)
    {
        this.hideSelectionWheel();
        this.hideSelectionScroll();
        var options = unitTypes.air[group];
        options.sort();
        this.showSelectionScroll(e.originalEvent, options, (unitType: string) => {
            this.hideSelectionWheel(); 
            this.hideSelectionScroll(); 
            this.#unitSelectPayload(e, unitType);
        });
    }

    /* Show weapon selection for air units */
    #unitSelectPayload(e: any, unitType: string)
    {
        this.hideSelectionWheel();
        this.hideSelectionScroll();
        var options = [];
        options = payloadNames[unitType]
        if (options != undefined && options.length > 0)
        {
            options.sort();
            this.showSelectionScroll(e.originalEvent, options, (payloadName: string) => {
                this.hideSelectionWheel(); 
                this.hideSelectionScroll(); 
                spawnAircraft(unitType, e.latlng, getActiveCoalition(), payloadName, e.airbaseName);
            });
        } 
        else
        {
            spawnAircraft(unitType, e.latlng, getActiveCoalition());
        }
    }
} 

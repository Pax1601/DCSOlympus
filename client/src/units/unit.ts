import { Marker, LatLng, Polyline } from 'leaflet';
import { ConvertDDToDMS } from '../other/utils';
import { getMap, getUnitsManager } from '..';
import { UnitMarker, MarkerOptions } from './unitmarker';
import { addDestination, attackUnit } from '../dcs/dcs';

export class Unit 
{
    ID                  : number;
    leader              : boolean;
    wingman             : boolean;
    wingmen             : Unit[];
    formation           : string;
    name                : string;
    unitName            : string;
    groupName           : string;
    latitude            : number;
    longitude           : number;
    altitude            : number;
    heading             : number;
    coalitionID         : number;
    alive               : boolean;
    speed               : number;
    currentTask         : string;
    type                : Object | null;
    flags               : Object | null;
    activePath          : any | null;   // TODO: declare inteface
    missionData         : Object | null;

    #selectable         : boolean;
    #selected           : boolean;
    #preventClick       : boolean;
    #pathMarkers        : Marker[];
    #pathPolyline       : Polyline;
    #targetsPolylines   : Polyline[];
    #marker             : UnitMarker;
    #timer              : number;

    static getConstructor(name: string)
    {
        if (name === "GroundUnit") return GroundUnit;
        if (name === "Aircraft") return Aircraft;
        if (name === "Helicopter") return Helicopter;
        if (name === "Missile") return Missile;
        if (name === "Bomb") return Bomb;
        if (name === "NavyUnit") return NavyUnit;
    }

    constructor(ID: number, marker: UnitMarker) 
    {
        this.ID = ID;
    
        /* Names */
        this.name           = "";
        this.unitName       = "";
        this.groupName      = ""; 

        /* Position and speed */
        this.latitude       = 0;
        this.longitude      = 0;
        this.altitude       = 0;
        this.heading        = 0;
        this.speed          = 0;

        /* Tasking */
        this.coalitionID    = 0;
        this.alive          = true;
        this.currentTask    = "";

        /* Formation */
        this.leader         = false;
        this.wingman        = false; 
        this.wingmen        = [];
        this.formation      = "";

        /* Structures */
        this.type           = null;
        this.flags          = null;
        this.activePath     = null;
        this.missionData    = null;

        this.#selectable = true;
        this.#timer = 0;

        /* The marker is set by the inherited class */
        this.#marker = marker;
        this.#marker.on('click', (e) => this.#onClick(e));
        this.#marker.on('dblclick', (e) => this.#onDoubleClick(e));
        
        this.#selected = false;
        this.#preventClick = false;
        this.#pathMarkers = [];
        this.#pathPolyline = new Polyline([], {color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1});
        this.#pathPolyline.addTo(getMap());
        this.#targetsPolylines = [];
    }

    update(response: JSON)
    {
        for (let entry in response)
        {
            // @ts-ignore
            this[entry] = response[entry];
        }

        this.#updateMarker();

        if (this.getSelected())
            this.#drawPath();
        else
            this.#clearPath();
        
        /*
        this.wingmen = [];
        if (response["wingmenIDs"] != undefined)
        {
            for (let ID of response["wingmenIDs"])
            {
                this.wingmen.push(unitsManager.getUnitByID(ID));
            }
        }
        this.formation = response["formation"];

        this.missionData = missionData.getUnitData(this.ID)

        this.setSelected(this.getSelected() && this.alive)
        
        

        this.clearTargets();
        this.missionData = missionData.getUnitData(this.ID);
        if (this.missionData != undefined)
        {
            if (this.getSelected())
            {
                this.drawTargets();
            }
        }
        */
    }

    setSelected(selected: boolean)
    {
        /* Only alive units can be selected. Some units are not selectable (weapons) */
        if ((this.alive || !selected) && this.#selectable && this.#selected != selected)
        {
            this.#selected = selected;
            this.#marker.setSelected(selected);
            getUnitsManager().onUnitSelection();
        }
    }

    getSelected()
    {
        return this.#selected;
    }

    addDestination(latlng: L.LatLng)
    {
        var path: any = {};
        if (this.activePath != undefined)
        {
            path = this.activePath;
            path[(Object.keys(path).length + 1).toString()] = latlng;
        }
        else
        {
            path = {"1": latlng};
        }
        addDestination(this.ID, path);
    }

    clearDestinations()
    {
        this.activePath = undefined;
    }

    #onClick(e: any) 
    {
        this.#timer = setTimeout(() => {
            if (!this.#preventClick) {
                if (getMap().getState() === 'IDLE' || getMap().getState() === 'MOVE_UNIT' || e.originalEvent.ctrlKey)
                {
                    if (!e.originalEvent.ctrlKey)
                    {
                        getUnitsManager().deselectAllUnits();
                    }
                    this.setSelected(true);
                }
            }
            this.#preventClick = false;
          }, 200);
    }

    #onDoubleClick(e: any) 
    {
        clearTimeout(this.#timer);
        this.#preventClick = true;

        var options = [
            {'tooltip': 'Attack',           'src': 'attack.png',    'callback': () => {getMap().hideSelectionWheel(); getUnitsManager().attackUnit(this.ID);}},
            {'tooltip': 'Go to tanker',     'src': 'tanker.png',    'callback': () => {getMap().hideSelectionWheel(); /*showMessage("Function not implemented yet");*/}},
            {'tooltip': 'RTB',              'src': 'rtb.png',       'callback': () => {getMap().hideSelectionWheel(); /*showMessage("Function not implemented yet");*/}}
        ]

        if (!this.leader && !this.wingman)
        {
            options.push({'tooltip': 'Create formation', 'src': 'formation.png', 'callback': () => {getMap().hideSelectionWheel(); /*unitsManager.createFormation(this.ID);*/}});
        }

        getMap().showSelectionWheel(e.originalEvent, options, false);
    }

    #updateMarker()
    {
        /* Add the marker if not present */
        if (!getMap().hasLayer(this.#marker))
        {
            this.#marker.addTo(getMap());
        }

        this.#marker.setLatLng(new LatLng(this.latitude, this.longitude));
        this.#marker.draw({
            heading: this.heading,
            speed: this.speed,
            altitude: this.altitude,
            alive: this.alive
        });
    }

    #drawPath()
    {
        if (this.activePath != null)
        {
            var _points = [];
            _points.push(new LatLng(this.latitude, this.longitude));

            /* Add markers if missing */
            while (this.#pathMarkers.length < Object.keys(this.activePath).length)
            {
                var marker = new Marker([0, 0]).addTo(getMap());
                this.#pathMarkers.push(marker);
            }

            /* Remove markers if too many */
            while (this.#pathMarkers.length > Object.keys(this.activePath).length)
            {
                getMap().removeLayer(this.#pathMarkers[this.#pathMarkers.length - 1]);
                this.#pathMarkers.splice(this.#pathMarkers.length - 1, 1)
            }

            /* Update the position of the existing markers (to avoid creating markers uselessly) */
            for (let WP in this.activePath)
            {
                var destination = this.activePath[WP];
                this.#pathMarkers[parseInt(WP) - 1].setLatLng([destination.lat, destination.lng]);
                _points.push(new LatLng(destination.lat, destination.lng));
                this.#pathPolyline.setLatLngs(_points);
            }
        }
    }

    #clearPath()
    {
        for (let WP in this.#pathMarkers)
        {
            getMap().removeLayer(this.#pathMarkers[WP]);
        }
        this.#pathMarkers = [];
        this.#pathPolyline.setLatLngs([]);
    }

    /*
    drawTargets()
    {
        for (let typeIndex in this.missionData['targets'])
        {
            for (let index in this.missionData['targets'][typeIndex])
            {
                var targetData = this.missionData['targets'][typeIndex][index];
                var target = unitsManager.getUnitByID(targetData.object["id_"])
                if (target != undefined){
                    var startLatLng = new LatLng(this.latitude, this.longitude)
                    var endLatLng = new LatLng(target.latitude, target.longitude)
                    
                    var color;
                    if (typeIndex === "radar")
                    {
                        color = "#FFFF00";
                    }
                    else if (typeIndex === "visual")
                    {
                        color = "#FF00FF";
                    }
                    else if (typeIndex === "rwr")
                    {
                        color = "#00FF00";
                    }
                    else
                    {
                        color = "#FFFFFF";
                    }
                    var targetPolyline = new Polyline([startLatLng, endLatLng], {color: color, weight: 3, opacity: 1, smoothFactor: 1});
                    targetPolyline.addTo(map.getMap());
                    this.#targetsPolylines.push(targetPolyline)
                }
            }
        }
    }

    clearTargets()
    {
        for (let index in this.#targetsPolylines)
        {
            map.getMap().removeLayer(this.#targetsPolylines[index])
        }
    }
    */

    attackUnit(targetID: number)
    {
        // Call DCS attackUnit function
        if (this.ID != targetID)
        {        
            attackUnit(this.ID, targetID);
        }
        else
        {
            // TODO: show a message
        }
    }

    /*
    changeSpeed(speedChange)
    {
        // TODO move in dedicated file
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", RESTaddress);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                console.log(this.unitName + " speed change request: " + speedChange);
            }
        };

        var command = {"ID": this.ID, "change": speedChange}
        var data = {"changeSpeed": command}

        xhr.send(JSON.stringify(data));
    }

    changeAltitude(altitudeChange)
    {
        // TODO move in dedicated file
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", RESTaddress);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                console.log(this.unitName + " altitude change request: " + altitudeChange);
            }
        };

        var command = {"ID": this.ID, "change": altitudeChange}
        var data = {"changeAltitude": command}

        xhr.send(JSON.stringify(data));
    }

    setformation(formation)
    {
        // TODO move in dedicated file
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", RESTaddress);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                console.log(this.unitName + " formation change: " + formation);
            }
        };

        var command = {"ID": this.ID, "formation": formation}
        var data = {"setFormation": command}

        xhr.send(JSON.stringify(data));
    }

    setLeader(wingmenIDs)
    {
        // TODO move in dedicated file
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", RESTaddress);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                console.log(this.unitName + " created formation with: " + wingmenIDs);
            }
        };

        var command = {"ID": this.ID, "wingmenIDs": wingmenIDs}
        var data = {"setLeader": command}

        xhr.send(JSON.stringify(data));
    }
    */
}

export class AirUnit extends Unit
{

}

export class Aircraft extends AirUnit
{
    constructor(ID: number, options: MarkerOptions)
    {
        var marker = new UnitMarker(options);
        super(ID, marker);
    }
}

export class Helicopter extends AirUnit
{
    constructor(ID: number, options: MarkerOptions)
    {
        var marker = new UnitMarker(options);
        super(ID, marker);
    }
}

export class GroundUnit extends Unit
{
    constructor(ID: number, options: MarkerOptions)
    {
        var marker = new UnitMarker(options);
        super(ID, marker);
    }
}

export class NavyUnit extends Unit
{
    constructor(ID: number, options: MarkerOptions)
    {
        var marker = new UnitMarker(options);
        super(ID, marker);
    }
}

export class Weapon extends Unit
{

}

export class Missile extends Weapon
{
    constructor(ID: number, options: MarkerOptions)
    {
        var marker = new UnitMarker(options);
        super(ID, marker);
    }
}

export class Bomb extends Weapon
{
    constructor(ID: number, options: MarkerOptions)
    {
        var marker = new UnitMarker(options);
        super(ID, marker);
    }
}

import * as L from 'leaflet'
import { Symbol } from 'milsymbol'

export interface MarkerOptions 
{
    unitName:       string
    name:           string
    human:          boolean
    coalitionID:    number
    type:           any
}

export interface MarkerData
{
    heading:        number
    speed:          number
    altitude:       number
    alive:          boolean
}

export class UnitMarker extends L.Marker
{
    #unitName:      string
    #name:          string
    #human:         boolean
    #coalitionID:   number
    #alive:         boolean

    constructor(options: MarkerOptions)
    {
        super(new L.LatLng(0, 0), {riseOnHover: true});
        this.#unitName = options.unitName
        this.#name = options.name
        this.#human = options.human
        this.#coalitionID = options.coalitionID
        
        this.#alive = true;

        var symbol = new Symbol(this.#computeMarkerCode(options), {size: 100});
        var img    = symbol.asCanvas().toDataURL('image/png');

        var icon = new L.DivIcon({
            html: `<table class="unit-marker-container" id="container">
                    <tr>
                        <td>
                            <div class="unit-marker-icon" id="icon"><img src="${img}"></div>
                            <div class="unit-marker-unitName" id="unitName">${this.#unitName}</div>
                            <div class="unit-marker-altitude" id="altitude"></div>
                            <div class="unit-marker-speed" id="speed"></div>
                            <div class="unit-marker-name" id="name">${this.#name}</div>
                        </td>
                    </tr>
                </table>`, 
            className: 'unit-marker'});
        this.setIcon(icon);   
    }

    onAdd(map: L.Map): this 
    {
        super.onAdd(map);
        var element = <HTMLElement>this.getElement();
        this.addEventListener('mouseover', function(e: any) { e.target?.setHovered(true);});
        this.addEventListener('mouseout', function(e: any) { e.target?.setHovered(false);});
        return this
    }

    draw(data: MarkerData)
    {
        var element = this.getElement();
        if (element != null)
        {
            var nameDiv = <HTMLElement>element.querySelector("#name");
            var unitNameDiv = <HTMLElement>element.querySelector("#unitName");
            var container = <HTMLElement>element.querySelector("#container");
            var icon = <HTMLElement>element.querySelector("#icon");
            var altitudeDiv = <HTMLElement>element.querySelector("#altitude");
            var speedDiv = <HTMLElement>element.querySelector("#speed");

            nameDiv.style.left = (-(nameDiv.offsetWidth - container.offsetWidth) / 2) + "px";
            unitNameDiv.style.left = (-(unitNameDiv.offsetWidth - container.offsetWidth) / 2) + "px";
            
            icon.style.transform = "rotate(" + data.heading + "rad)";
            altitudeDiv.innerHTML = String(Math.round(data.altitude / 0.3048 / 100) / 10);
            speedDiv.innerHTML = String(Math.round(data.speed * 1.94384));
        }
    }

    setSelected(selected: boolean)
    {
        this.getElement()?.querySelector("#icon")?.classList.remove("unit-marker-hovered");
        this.getElement()?.querySelector("#icon")?.classList.toggle("unit-marker-selected", selected);
    }

    setHovered(hovered: boolean)
    {
        this.getElement()?.querySelector("#icon")?.classList.toggle("unit-marker-hovered", hovered && this.#alive);
    }

    #computeMarkerCode(options: MarkerOptions)
    {
        var identity = "00";
        var set = "00";
        var entity = "00";
        var entityType = "00";
        var entitySubtype = "00";

        /* Identity */
        if (options.coalitionID == 1)
            identity = "06" /* Hostile */
        else if (options.coalitionID == 2)
            identity = "03" /* Friendly */
        else
            identity = "04" /* Neutral */

        if (options.type.level1 == 1)
        {
            set = "01"
            entity = "11"
            if (options.type.level2 == 1)
                entityType = "01"
            else if (options.type.level2 == 1)
                entityType = "02"

            if (options.type.level3 == 1)
                entitySubtype = "04";
            else if (options.type.level3 == 2)
                entitySubtype = "05";
            else if (options.type.level3 == 3)
                entitySubtype = "04";
            else if (options.type.level3 == 4)
                entitySubtype = "02";
            else if (options.type.level3 == 5)
                entitySubtype = "00";
            else if (options.type.level3 == 6)
                entitySubtype = "00";
        }
        else if (options.type.level1 == 2)
            set = "10"
        else if (options.type.level1 == 3)
            set = "30"
        else if (options.type.level1 == 2)
            set = "02"
        
        
        return `10${identity}${set}0000${entity}${entityType}${entitySubtype}0000`
    }
}

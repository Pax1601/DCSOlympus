import { getUnitsManager } from "..";
import { ConvertDDToDMS, rad2deg } from "../other/utils";
import { aircraftDatabase } from "../units/aircraftdatabase";
import { Unit } from "../units/unit";
import { Panel } from "./panel";

export class UnitInfoPanel extends Panel {
    #altitude: HTMLElement;
    #currentTask: HTMLElement;
    #fuelBar: HTMLElement;
    #fuelPercentage: HTMLElement;
    #groundSpeed: HTMLElement;
    #groupName: HTMLElement;
    #heading: HTMLElement;
    #name: HTMLElement;
    #latitude: HTMLElement;
    #longitude: HTMLElement;
    #loadoutContainer: HTMLElement;
    #silhouette: HTMLElement;
    #unitControl: HTMLElement;
    #unitLabel: HTMLElement;
    #unitName: HTMLElement;

    constructor(ID: string) {
        super(ID);

        this.#altitude         = <HTMLElement>(this.getElement().querySelector("#altitude"));
        this.#currentTask      = <HTMLElement>(this.getElement().querySelector("#current-task"));
        this.#groundSpeed      = <HTMLElement>(this.getElement().querySelector("#ground-speed"));
        this.#fuelBar          = <HTMLElement>(this.getElement().querySelector("#fuel-bar"));
        this.#fuelPercentage   = <HTMLElement>(this.getElement().querySelector("#fuel-percentage"));
        this.#groupName        = <HTMLElement>(this.getElement().querySelector("#group-name"));
        this.#heading          = <HTMLElement>(this.getElement().querySelector("#heading"));
        this.#name             = <HTMLElement>(this.getElement().querySelector("#name"));
        this.#latitude         = <HTMLElement>(this.getElement().querySelector("#latitude"));
        this.#loadoutContainer = <HTMLElement>(this.getElement().querySelector("#loadout-container"));
        this.#longitude        = <HTMLElement>(this.getElement().querySelector("#longitude"));
        this.#silhouette       = <HTMLElement>(this.getElement().querySelector("#loadout-silhouette"));
        this.#unitControl      = <HTMLElement>(this.getElement().querySelector("#unit-control"));
        this.#unitLabel        = <HTMLElement>(this.getElement().querySelector("#unit-label"));
        this.#unitName         = <HTMLElement>(this.getElement().querySelector("#unit-name"));

        document.addEventListener("unitsSelection", (e: CustomEvent<Unit[]>) => this.#onUnitsSelection(e.detail));
        document.addEventListener("unitsDeselection", (e: CustomEvent<Unit[]>) => this.#onUnitsDeselection(e.detail));
        document.addEventListener("clearSelection", (e: CustomEvent<Unit[]>) => this.#onUnitsDeselection([]));
        document.addEventListener("unitUpdated", (e: CustomEvent<Unit>) => this.#onUnitUpdate(e.detail));

        this.hide();
    }
    
    #onUnitUpdate(unit: Unit) {
        if (this.getElement() != null && this.getVisible() && unit.getSelected()) {

            const baseData = unit.getBaseData();

            /* Set the unit info */
            this.#unitLabel.innerText   = aircraftDatabase.getByName(baseData.name)?.label || "";
            this.#unitName.innerText    = baseData.unitName;
            this.#unitControl.innerText = ( ( baseData.AI ) ? "AI" : "Human" ) + " controlled";
            // this.#groupName.innerText = baseData.groupName;
            //this.#name.innerText = baseData.name;
            //this.#heading.innerText = String(Math.floor(rad2deg(unit.getFlightData().heading)) + " °");
            //this.#altitude.innerText = String(Math.floor(unit.getFlightData().altitude / 0.3048) + " ft");
            //this.#groundSpeed.innerText = String(Math.floor(unit.getFlightData().speed * 1.94384) + " kts");
            this.#fuelBar.style.width = String(unit.getMissionData().fuel + "%");
            this.#fuelPercentage.dataset.percentage = "" + unit.getMissionData().fuel;
            //this.#latitude.innerText = ConvertDDToDMS(unit.getFlightData().latitude, false);
            //this.#longitude.innerText = ConvertDDToDMS(unit.getFlightData().longitude, true);
            this.#currentTask.dataset.currentTask = unit.getTaskData().currentTask !== ""? unit.getTaskData().currentTask: "No task";
            this.#currentTask.dataset.coalition = unit.getMissionData().coalition;
            
            this.#silhouette.setAttribute( "style", `--loadout-background-image:url('/images/units/${aircraftDatabase.getByName( baseData.name )?.filename}');` );;
            
            /* Add the loadout elements */
            const items = <HTMLElement>this.#loadoutContainer.querySelector( "#loadout-items" );


            if ( items ) {

                const ammo = Object.values( unit.getMissionData().ammo ); 

                if ( ammo.length > 0 ) {

                    items.replaceChildren(...Object.values(unit.getMissionData().ammo).map(
                        (ammo: any) => {
                            var el = document.createElement("div");
                            el.dataset.qty  = ammo.count;
                            el.dataset.item = ammo.desc.displayName;
                            return el;
                        }
                    ));

                } else {

                    items.innerText = "No loadout";
                    
                }

            }
        }
    }

    #onUnitsSelection(units: Unit[]){
        if (units.length == 1)
            this.show();
        else
            this.hide();
    }

    #onUnitsDeselection(units: Unit[]){
        if (units.length == 1)
            this.show();
        else
            this.hide();
    }
}
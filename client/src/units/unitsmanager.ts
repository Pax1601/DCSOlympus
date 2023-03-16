import { LatLng, LatLngBounds } from "leaflet";
import { getMap } from "..";
import { Unit } from "./unit";
import { cloneUnit } from "../server/server";
import { IDLE, MOVE_UNIT } from "../map/map";

export class UnitsManager {
    #units: { [ID: number]: Unit };
    #copiedUnits: Unit[];
    #selectionEventDisabled: boolean = false;

    constructor() {
        this.#units = {};
        this.#copiedUnits = [];

        document.addEventListener('copy', () => this.copyUnits());
        document.addEventListener('paste', () => this.pasteUnits());
        document.addEventListener('unitSelection', (e: CustomEvent) => this.#onUnitSelection(e.detail));
        document.addEventListener('unitDeselection', (e: CustomEvent) => this.#onUnitDeselection(e.detail));
        document.addEventListener('keydown', (event) => this.#onKeyDown(event));
    }

    getUnits() {
        return this.#units;
    }

    getUnitByID(ID: number) {
        if (ID in this.#units)
            return this.#units[ID];
        else
            return null;
    }

    addUnit(ID: number, data: UnitData) {
        /* The name of the unit category is exactly the same as the constructor name */
        var constructor = Unit.getConstructor(data.baseData.category);
        if (constructor != undefined) {
            this.#units[ID] = new constructor(ID, data);
        }
    }
    
    removeUnit(ID: number) {

    }

    update(data: UnitsData) {
        Object.keys(data.units)
                .filter((ID: string) => !(ID in this.#units))
                .reduce((timeout: number, ID: string) => {
                    setTimeout(() => {
                        if (!(ID in this.#units))
                            this.addUnit(parseInt(ID), data.units[ID]);
                        this.#units[parseInt(ID)]?.setData(data.units[ID]);
                    }, timeout);
                    return timeout + 10;
                }, 10);
          
        Object.keys(data.units)
        .filter((ID: string) => ID in this.#units)
        .forEach((ID: string) => this.#units[parseInt(ID)]?.setData(data.units[ID]));
    }

    selectUnit(ID: number, deselectAllUnits: boolean = true)
    {
        if (deselectAllUnits) 
            this.getSelectedUnits().filter((unit: Unit) => unit.ID !== ID ).forEach((unit: Unit) => unit.setSelected(false));
        this.#units[ID]?.setSelected(true);
    }

    selectFromBounds(bounds: LatLngBounds)
    {
        this.deselectAllUnits();
        for (let ID in this.#units)
        {
            if (this.#units[ID].getHidden() == false)
            {
                var latlng = new LatLng(this.#units[ID].getFlightData().latitude, this.#units[ID].getFlightData().longitude);
                if (bounds.contains(latlng))
                {
                    this.#units[ID].setSelected(true);
                }
            }
        }
    }

    getSelectedUnits() {
        var selectedUnits = [];
        for (let ID in this.#units) {
            if (this.#units[ID].getSelected()) {
                selectedUnits.push(this.#units[ID]);
            }
        }
        return selectedUnits;
    }

    deselectAllUnits() {
        for (let ID in this.#units) {
            this.#units[ID].setSelected(false);
        }
    }

    getSelectedLeaders() {
        var leaders: Unit[] = [];
        for (let idx in this.getSelectedUnits())
        {
            var unit = this.getSelectedUnits()[idx];
            if (unit.getFormationData().isLeader)
                leaders.push(unit);
            else if (unit.getFormationData().isWingman)
            {
                var leader = unit.getLeader();
                if (leader && !leaders.includes(leader))
                    leaders.push(leader);
            }
        }
        return leaders;
    }

    getSelectedSingletons() {
        var singletons: Unit[] = [];
        for (let idx in this.getSelectedUnits())
        {
            var unit = this.getSelectedUnits()[idx];
            if (!unit.getFormationData().isLeader && !unit.getFormationData().isWingman)
                singletons.push(unit);
        }
        return singletons;
    }

    getSelectedUnitsType () {
        if (this.getSelectedUnits().length == 0)
            return undefined;
        return this.getSelectedUnits().map((unit: Unit) => {
            return unit.constructor.name
        })?.reduce((a: any, b: any) => {
            return a == b? a: undefined
        });
    };

    getSelectedUnitsTargetSpeed () {
        if (this.getSelectedUnits().length == 0)
            return undefined;
        return this.getSelectedUnits().map((unit: Unit) => {
            return unit.getTaskData().targetSpeed
        })?.reduce((a: any, b: any) => {
            return a == b? a: undefined
        });
    };

    getSelectedUnitsTargetAltitude () {
        if (this.getSelectedUnits().length == 0)
            return undefined;
        return this.getSelectedUnits().map((unit: Unit) => {
            return unit.getTaskData().targetAltitude
        })?.reduce((a: any, b: any) => {
            return a == b? a: undefined
        });
    };

    getSelectedUnitsCoalition () {
        if (this.getSelectedUnits().length == 0)
            return undefined;
        return this.getSelectedUnits().map((unit: Unit) => {
            return unit.getMissionData().coalition
        })?.reduce((a: any, b: any) => {
            return a == b? a: undefined
        });
    };

    selectedUnitsAddDestination(latlng: L.LatLng) {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits) {
            var commandedUnit = selectedUnits[idx];
            commandedUnit.addDestination(latlng);
        }
    }

    selectedUnitsClearDestinations() {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits) {
            var commandedUnit = selectedUnits[idx];
            commandedUnit.clearDestinations();
        }
    }

    selectedUnitsLandAt(latlng: LatLng)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].landAt(latlng);
        }
    }

    selectedUnitsChangeSpeed(speedChange: string)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].changeSpeed(speedChange);
        }
    }

    selectedUnitsChangeAltitude(altitudeChange: string)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].changeAltitude(altitudeChange);
        }
    }

    selectedUnitsSetSpeed(speed: number)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].setSpeed(speed);
        }
    }

    selectedUnitsSetAltitude(altitude: number)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].setAltitude(altitude);
        }
    }

    selectedUnitsSetROE(ROE: string)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].setROE(ROE);
        }
    }

    selectedUnitsSetReactionToThreat(reactionToThreat: string)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].setReactionToThreat(reactionToThreat);
        }
    }

    selectedUnitsAttackUnit(ID: number) {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits) {
            /* If a unit is a wingman, send the command to its leader */
            var commandedUnit = selectedUnits[idx];
            //if (selectedUnits[idx].wingman)
            //{
            //    commandedUnit = this.getLeader(selectedUnits[idx].ID);
            //}
            commandedUnit.attackUnit(ID);
        }
    }

    selectedUnitsCreateFormation(ID: number | null = null)
    {
        var selectedUnits = this.getSelectedUnits();
        if (selectedUnits.length >= 2)
        {
            if (ID == null)
                ID = selectedUnits[0].ID
            
            var wingmenIDs = [];
            for (let idx in selectedUnits)
            {
                if (selectedUnits[idx].getFormationData().isWingman)
                {
                    //console.log(selectedUnits[idx].unitName + " is already in a formation.");
                    return;
                }
                else if (selectedUnits[idx].getFormationData().isLeader)
                {
                    //console.log(selectedUnits[idx].unitName + " is already in a formation.");
                    return;
                }
                else
                {
                    /* TODO
                    if (selectedUnits[idx].category !== this.getUnitByID(ID).category)
                    {
                        showMessage("All units must be of the same category to create a formation.");
                    }
                    */
                    if (selectedUnits[idx].ID != ID)
                    {
                        wingmenIDs.push(selectedUnits[idx].ID);
                    }
                }
            }
            if (wingmenIDs.length > 0)
            {
                this.getUnitByID(ID)?.setLeader(true, wingmenIDs);
            }
            else
            {
                //console.log("At least 2 units must be selected to create a formation.");
            }
        }
    }

    selectedUnitsUndoFormation()
    {
        for (let leader of this.getSelectedLeaders())
        {
            leader.setLeader(false);
        }
    }

    selectedUnitsDelete()
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].delete();
        }
    }

    copyUnits()
    {
        this.#copiedUnits = this.getSelectedUnits();
    }

    pasteUnits()
    {
        for (let idx in this.#copiedUnits)
        {
            var unit = this.#copiedUnits[idx];
            cloneUnit(unit.ID, getMap().getMouseCoordinates());
        }
    }

    #onKeyDown(event: KeyboardEvent)
    {
        if (event.key === "Delete")
        {
            this.selectedUnitsDelete();
        }
    }

    #onUnitSelection(unit: Unit) {
        if (this.getSelectedUnits().length > 0) {
            getMap().setState(MOVE_UNIT);
            /* Disable the firing of the selection event for a certain amount of time. This avoids firing many events if many units are selected */
            if (!this.#selectionEventDisabled)
            {
                setTimeout(() => {
                    document.dispatchEvent(new CustomEvent("unitsSelection", {detail: this.getSelectedUnits()}));
                    this.#selectionEventDisabled = false;
                }, 300);
                this.#selectionEventDisabled = true;
            }
        }
        else {
            getMap().setState(IDLE);
            document.dispatchEvent(new CustomEvent("clearSelection"));
        }
    }

    #onUnitDeselection(unit: Unit) {
        if (this.getSelectedUnits().length == 0) {
            getMap().setState(IDLE);
            document.dispatchEvent(new CustomEvent("clearSelection"));
        }
        else 
            document.dispatchEvent(new CustomEvent("unitsDeselection", {detail: this.getSelectedUnits()}));
    }
}
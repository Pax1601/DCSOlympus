import { LatLng, LatLngBounds } from "leaflet";
import { getMap, getUnitControlPanel, getUnitInfoPanel } from "..";
import { Unit, GroundUnit } from "./unit";
import { cloneUnit } from "../server/server";

export class UnitsManager {
    #units: { [ID: number]: Unit };
    #copiedUnits: Unit[];

    constructor() {
        this.#units = {};
        this.#copiedUnits = [];

        document.addEventListener('copy', () => this.copyUnits());
        document.addEventListener('paste', () => this.pasteUnits());
        document.addEventListener('unitSelection', () => this.onUnitSelection());
        document.addEventListener('keydown', (event) => this.#onKeyDown(event));
    }

    #updateUnitControlPanel() {
        /* Update the unit control panel */
        if (this.getSelectedUnits().length > 0) {
            getUnitControlPanel().show();
            getUnitControlPanel().update(this.getSelectedLeaders().concat(this.getSelectedSingletons()));
        }
        else {
            getUnitControlPanel().hide();
        }
    }

    #onKeyDown(event: KeyboardEvent)
    {
        if (event.key === "Delete")
        {
            this.selectedUnitsDelete();
        }
    }

    getUnits() {
        return this.#units;
    }

    addUnit(ID: number, data: UnitData) {
        /* The name of the unit category is exactly the same as the constructor name */
        var constructor = Unit.getConstructor(data.category);
        if (constructor != undefined) {
            this.#units[ID] = new constructor(ID, data);
        }
    }

    getUnitByID(ID: number) {
        if (ID in this.#units)
            return this.#units[ID];
        else
            return null;
    }

    removeUnit(ID: number) {

    }

    deselectAllUnits() {
        for (let ID in this.#units) {
            this.#units[ID].setSelected(false);
        }
    }

    selectUnit(ID: number, deselectAllUnits: boolean = true)
    {
        if (deselectAllUnits)
            this.deselectAllUnits();
        this.#units[ID]?.setSelected(true);
    }

    update(data: ServerData) {
        for (let ID in data.units) {
            /* Create the unit if missing from the local array, then update the data. Drawing is handled by leaflet. */
            if (!(ID in this.#units)) {
                this.addUnit(parseInt(ID), data.units[ID]);
            }
            this.#units[parseInt(ID)].update(data.units[ID]);
        }

        /* Update the unit info panel */
        if (this.getSelectedUnits().length == 1) {
            getUnitInfoPanel().show();
            getUnitInfoPanel().update(this.getSelectedUnits()[0]);
        }
        else {
            getUnitInfoPanel().hide();
        }
    }

    forceUpdate() {
        for (let ID in this.#units) {
            this.#units[ID].forceUpdate();
        }
    }

    onUnitSelection() {
        if (this.getSelectedUnits().length > 0) {
            getMap().setState("MOVE_UNIT");
            document.dispatchEvent(new CustomEvent("unitsSelection", {detail: this.getSelectedUnits()}));
        }
        else {
            getMap().setState("IDLE");
            document.dispatchEvent(new CustomEvent("clearSelection"));
        }
        this.#updateUnitControlPanel();
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

    selectedUnitsAddDestination(latlng: L.LatLng) {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits) {
            var commandedUnit = selectedUnits[idx];
            //if (selectedUnits[idx].wingman)
            //{
            //    commandedUnit = this.getLeader(selectedUnits[idx].ID);
            //}
            commandedUnit.addDestination(latlng);
        }
    }

    selectedUnitsClearDestinations() {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits) {
            var commandedUnit = selectedUnits[idx];
            //if (selectedUnits[idx].wingman)
            //{
            //    commandedUnit = this.getLeader(selectedUnits[idx].ID);
            //}
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

        setTimeout(() => this.#updateUnitControlPanel(), 300); // TODO find better method, may fail
    }

    selectedUnitsChangeAltitude(altitudeChange: string)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].changeAltitude(altitudeChange);
        }

        setTimeout(() => this.#updateUnitControlPanel(), 300); // TODO find better method, may fail
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

        setTimeout(() => this.#updateUnitControlPanel(), 300); // TODO find better method, may fail
    }

    selectedUnitsSetReactionToThreat(reactionToThreat: string)
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].setReactionToThreat(reactionToThreat);
        }
        
        setTimeout(() => this.#updateUnitControlPanel(), 300); // TODO find better method, may fail
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
        setTimeout(() => this.#updateUnitControlPanel(), 300); // TODO find better method, may fail
    }

    selectedUnitsUndoFormation(ID: number | null = null)
    {
        for (let leader of this.getSelectedLeaders())
        {
            leader.setLeader(false);
        }
        setTimeout(() => this.#updateUnitControlPanel(), 300); // TODO find better method, may fail 
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

    selectedUnitsDelete()
    {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits)
        {
            selectedUnits[idx].delete();
        }
    }
}
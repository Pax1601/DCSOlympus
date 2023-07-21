import { LatLng, LatLngBounds } from "leaflet";
import { getHotgroupPanel, getInfoPopup, getMap, getMissionHandler, getUnitsManager } from "..";
import { Unit } from "./unit";
import { cloneUnit, deleteUnit, spawnAircrafts, spawnGroundUnits, spawnHelicopters, spawnNavyUnits } from "../server/server";
import { bearingAndDistanceToLatLng, deg2rad, keyEventWasInInput, latLngToMercator, mToFt, mercatorToLatLng, msToKnots, polyContains, polygonArea, randomPointInPoly, randomUnitBlueprint } from "../other/utils";
import { CoalitionArea } from "../map/coalitionarea";
import { groundUnitDatabase } from "./groundunitdatabase";
import { BLUE_COMMANDER, DataIndexes, GAME_MASTER, IADSDensities, IDLE, MOVE_UNIT, NONE, RED_COMMANDER } from "../constants/constants";
import { DataExtractor } from "./dataextractor";
import { Contact } from "../@types/unit";
import { citiesDatabase } from "./citiesdatabase";
import { aircraftDatabase } from "./aircraftdatabase";
import { helicopterDatabase } from "./helicopterdatabase";
import { navyUnitDatabase } from "./navyunitdatabase";

export class UnitsManager {
    #units: { [ID: number]: Unit };
    #copiedUnits: any[];
    #selectionEventDisabled: boolean = false;
    #pasteDisabled: boolean = false;
    #hiddenTypes: string[] = [];
    #commandMode: string = NONE;
    #requestDetectionUpdate: boolean = false;

    constructor() {
        this.#units = {};
        this.#copiedUnits = [];

        document.addEventListener('copy', () => this.copyUnits());
        document.addEventListener('paste', () => this.pasteUnits());
        document.addEventListener('unitSelection', (e: CustomEvent) => this.#onUnitSelection(e.detail));
        document.addEventListener('unitDeselection', (e: CustomEvent) => this.#onUnitDeselection(e.detail));
        document.addEventListener('deleteSelectedUnits', () => this.selectedUnitsDelete());
        document.addEventListener('explodeSelectedUnits', () => this.selectedUnitsDelete(true));
        document.addEventListener('keyup', (event) => this.#onKeyUp(event));
        document.addEventListener('exportToFile', () => this.exportToFile());
        document.addEventListener('importFromFile', () => this.importFromFile());
        document.addEventListener('contactsUpdated', (e: CustomEvent) => {this.#requestDetectionUpdate = true});
    }

    getSelectableAircraft() {
        const units = this.getUnits();
        return Object.keys(units).reduce((acc: { [key: number]: Unit }, unitId: any) => {
            if (units[unitId].getCategory() === "Aircraft" && units[unitId].getAlive() === true) {
                acc[unitId] = units[unitId];
            }
            return acc;
        }, {});
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

    getUnitsByHotgroup(hotgroup: number) {
        return Object.values(this.#units).filter((unit: Unit) => { return unit.getAlive() && unit.getHotgroup() == hotgroup });
    }

    addUnit(ID: number, category: string) {
        if (category){
            /* The name of the unit category is exactly the same as the constructor name */
            var constructor = Unit.getConstructor(category);
            if (constructor != undefined) {
                this.#units[ID] = new constructor(ID);
            }
        }
    }

    removeUnit(ID: number) {

    }

    update(buffer: ArrayBuffer) {
        var dataExtractor = new DataExtractor(buffer);
        var updateTime = Number(dataExtractor.extractUInt64());
        var requestRefresh = false;
        while (dataExtractor.getSeekPosition() < buffer.byteLength) {
            const ID = dataExtractor.extractUInt32();
            if (!(ID in this.#units)) {
                const datumIndex = dataExtractor.extractUInt8();
                if (datumIndex == DataIndexes.category) {
                    const category = dataExtractor.extractString();
                    this.addUnit(ID, category);
                }
                else {
                    requestRefresh = true;
                }
            }
            this.#units[ID]?.setData(dataExtractor);
        }

        if (this.#requestDetectionUpdate && this.getCommandMode() != GAME_MASTER) {
            for (let ID in this.#units) {
                var unit = this.#units[ID];
                if (!unit.belongsToCommandedCoalition())
                    unit.setDetectionMethods(this.getUnitDetectedMethods(unit));
            }
            this.#requestDetectionUpdate = false;
        }

        for (let ID in this.#units) {
            if (this.#units[ID].getSelected())
                this.#units[ID].drawLines();
        };

        return updateTime;
    }

    setHiddenType(key: string, value: boolean) {
        if (value) {
            if (this.#hiddenTypes.includes(key))
                delete this.#hiddenTypes[this.#hiddenTypes.indexOf(key)];
        }
        else
            this.#hiddenTypes.push(key);
        Object.values(this.getUnits()).forEach((unit: Unit) => unit.updateVisibility());
    }

    getHiddenTypes() {
        return this.#hiddenTypes;
    }

    setCommandMode(newCommandMode: string) {
        if (newCommandMode !== this.#commandMode) {
            document.dispatchEvent(new CustomEvent("commandModeChanged", { detail: this }));
            this.#commandMode = newCommandMode;
            for (let ID in this.#units) 
                this.#units[ID].updateVisibility();
        }
    }

    getCommandMode() {
        return this.#commandMode;
    }

    getCommandedCoalition() {
        if (this.getCommandMode() === BLUE_COMMANDER)
            return "blue";
        else if (this.getCommandMode() === RED_COMMANDER)
            return "red";
        else
            return "all";
    }

    selectUnit(ID: number, deselectAllUnits: boolean = true) {
        if (deselectAllUnits)
            this.getSelectedUnits().filter((unit: Unit) => unit.ID !== ID).forEach((unit: Unit) => unit.setSelected(false));
        this.#units[ID]?.setSelected(true);
    }

    selectFromBounds(bounds: LatLngBounds) {
        this.deselectAllUnits();
        for (let ID in this.#units) {
            if (this.#units[ID].getHidden() == false) {
                var latlng = new LatLng(this.#units[ID].getPosition().lat, this.#units[ID].getPosition().lng);
                if (bounds.contains(latlng)) {
                    this.#units[ID].setSelected(true);
                }
            }
        }
    }

    getSelectedUnits(options?: { excludeHumans?: boolean, onlyOnePerGroup?: boolean }) {
        var selectedUnits = [];
        for (let ID in this.#units) {
            if (this.#units[ID].getSelected()) {
                selectedUnits.push(this.#units[ID]);
            }
        }
        if (options) {
            if (options.excludeHumans)
                selectedUnits = selectedUnits.filter((unit: Unit) => { return !unit.getHuman() });
            if (options.onlyOnePerGroup) {
                var temp: Unit[] = [];
                for (let unit of selectedUnits) {
                    if (!temp.some((otherUnit: Unit) => unit.getGroupName() == otherUnit.getGroupName()))
                        temp.push(unit);
                }
                selectedUnits = temp;
            }
        }
        return selectedUnits;
    }

    deselectAllUnits() {
        for (let ID in this.#units) {
            this.#units[ID].setSelected(false);
        }
    }

    selectUnitsByHotgroup(hotgroup: number) {
        this.deselectAllUnits();
        this.getUnitsByHotgroup(hotgroup).forEach((unit: Unit) => unit.setSelected(true))
    }

    getSelectedUnitsTypes() {
        const selectedUnits = this.getSelectedUnits();
        if (selectedUnits.length == 0)
            return [];
        return selectedUnits.map((unit: Unit) => {
            return unit.getCategory();
        })?.filter((value: any, index: any, array: string[]) => {
            return array.indexOf(value) === index;
        });
    };

    /* Gets the value of a variable from the selected units. If all the units have the same value, returns the value, else returns undefined */
    getSelectedUnitsVariable(variableGetter: CallableFunction) {
        const selectedUnits = this.getSelectedUnits();
        if (selectedUnits.length == 0)
            return undefined;
        return selectedUnits.map((unit: Unit) => {
            return variableGetter(unit);
        })?.reduce((a: any, b: any) => {
            return a === b ? a : undefined
        });
    };

    getSelectedUnitsCoalition() {
        const selectedUnits = this.getSelectedUnits();
        if (selectedUnits.length == 0)
            return undefined;
        return selectedUnits.map((unit: Unit) => {
            return unit.getCoalition()
        })?.reduce((a: any, b: any) => {
            return a == b ? a : undefined
        });
    };

    getByType(type: string) {
        Object.values(this.getUnits()).filter((unit: Unit) => {
            return unit.getType() === type;
        })
    }

    getUnitDetectedMethods(unit: Unit) {
        var detectionMethods: number[] = [];
        for (let idx in this.#units) {
            if (this.#units[idx].getAlive() && this.#units[idx].getIsLeader() && this.#units[idx].getCoalition() !== "neutral" && this.#units[idx].getCoalition() != unit.getCoalition())
            {
                this.#units[idx].getContacts().forEach((contact: Contact) => {
                    if (contact.ID == unit.ID && !detectionMethods.includes(contact.detectionMethod)) 
                        detectionMethods.push(contact.detectionMethod);
                });
            }
        }
        return detectionMethods;
    }

    /*********************** Actions on selected units ************************/
    selectedUnitsAddDestination(latlng: L.LatLng, mantainRelativePosition: boolean, rotation: number) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });

        /* Compute the destination for each unit. If mantainRelativePosition is true, compute the destination so to hold the relative distances */
        var unitDestinations: { [key: number]: LatLng } = {};
        if (mantainRelativePosition)
            unitDestinations = this.selectedUnitsComputeGroupDestination(latlng, rotation);
        else
            selectedUnits.forEach((unit: Unit) => { unitDestinations[unit.ID] = latlng; });

        for (let idx in selectedUnits) {
            const unit = selectedUnits[idx];
            /* If a unit is following another unit, and that unit is also selected, send the command to the followed unit */
            if (unit.getState() === "Follow") {
                const leader = this.getUnitByID(unit.getLeaderID())
                if (leader && leader.getSelected())
                    leader.addDestination(latlng);
                else
                    unit.addDestination(latlng);
            }
            else {
                if (unit.ID in unitDestinations)
                    unit.addDestination(unitDestinations[unit.ID]);
            }

        }
        this.#showActionMessage(selectedUnits, " new destination added");
    }

    selectedUnitsClearDestinations() {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            const unit = selectedUnits[idx];
            if (unit.getState() === "Follow") {
                const leader = this.getUnitByID(unit.getLeaderID())
                if (leader && leader.getSelected())
                    leader.clearDestinations();
                else
                    unit.clearDestinations();
            }
            else
                unit.clearDestinations();
        }
    }

    selectedUnitsLandAt(latlng: LatLng) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].landAt(latlng);
        }
        this.#showActionMessage(selectedUnits, " landing");
    }

    selectedUnitsChangeSpeed(speedChange: string) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].changeSpeed(speedChange);
        }
    }

    selectedUnitsChangeAltitude(altitudeChange: string) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].changeAltitude(altitudeChange);
        }
    }

    selectedUnitsSetSpeed(speed: number) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].setSpeed(speed);
        }
        this.#showActionMessage(selectedUnits, `setting speed to ${msToKnots(speed)} kts`);
    }

    selectedUnitsSetSpeedType(speedType: string) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].setSpeedType(speedType);
        }
        this.#showActionMessage(selectedUnits, `setting speed type to ${speedType}`);
    }

    selectedUnitsSetAltitude(altitude: number) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].setAltitude(altitude);
        }
        this.#showActionMessage(selectedUnits, `setting altitude to ${mToFt(altitude)} ft`);
    }

    selectedUnitsSetAltitudeType(altitudeType: string) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].setAltitudeType(altitudeType);
        }
        this.#showActionMessage(selectedUnits, `setting altitude type to ${altitudeType}`);
    }

    selectedUnitsSetROE(ROE: string) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].setROE(ROE);
        }
        this.#showActionMessage(selectedUnits, `ROE set to ${ROE}`);
    }

    selectedUnitsSetReactionToThreat(reactionToThreat: string) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].setReactionToThreat(reactionToThreat);
        }
        this.#showActionMessage(selectedUnits, `reaction to threat set to ${reactionToThreat}`);
    }

    selectedUnitsSetEmissionsCountermeasures(emissionCountermeasure: string) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].setEmissionsCountermeasures(emissionCountermeasure);
        }
        this.#showActionMessage(selectedUnits, `emissions & countermeasures set to ${emissionCountermeasure}`);
    }

    selectedUnitsSetOnOff(onOff: boolean) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].setOnOff(onOff);
        }
        this.#showActionMessage(selectedUnits, `unit active set to ${onOff}`);
    }

    selectedUnitsSetFollowRoads(followRoads: boolean) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].setFollowRoads(followRoads);
        }
        this.#showActionMessage(selectedUnits, `follow roads set to ${followRoads}`);
    }


    selectedUnitsAttackUnit(ID: number) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].attackUnit(ID);
        }
        this.#showActionMessage(selectedUnits, `attacking unit ${this.getUnitByID(ID)?.getUnitName()}`);
    }

    selectedUnitsDelete(explosion: boolean = false) {
        var selectedUnits = this.getSelectedUnits(); /* Can be applied to humans too */
        const selectionContainsAHuman = selectedUnits.some( ( unit:Unit ) => {
            return unit.getHuman() === true;
        });

        if (selectionContainsAHuman && !confirm( "Your selection includes a human player. Deleting humans causes their vehicle to crash.\n\nAre you sure you want to do this?" ) ) {
            return;
        }

        var immediate = false;
        if (selectedUnits.length > 20)
            immediate = confirm(`You are trying to delete ${selectedUnits.length} units, do you want to delete them immediately? This may cause lag for players.`)
            
        for (let idx in selectedUnits) {
            selectedUnits[idx].delete(explosion, immediate);
        }
        this.#showActionMessage(selectedUnits, `deleted`);
    }

    selectedUnitsRefuel() {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].refuel();
        }
        this.#showActionMessage(selectedUnits, `sent to nearest tanker`);
    }

    selectedUnitsFollowUnit(ID: number, offset?: { "x": number, "y": number, "z": number }, formation?: string) {
        if (offset == undefined) {
            /* Simple formations with fixed offsets */
            // X: front-rear, positive front
            // Y: top-bottom, positive top
            // Z: left-right, positive right
            offset = { "x": 0, "y": 0, "z": 0 };
            if (formation === "trail") { offset.x = -50; offset.y = -30; offset.z = 0; }
            else if (formation === "echelon-lh") { offset.x = -50; offset.y = -10; offset.z = -50; }
            else if (formation === "echelon-rh") { offset.x = -50; offset.y = -10; offset.z = 50; }
            else if (formation === "line-abreast-rh") { offset.x = 0; offset.y = 0; offset.z = 50; }
            else if (formation === "line-abreast-lh") { offset.x = 0; offset.y = 0; offset.z = -50; }
            else if (formation === "front") { offset.x = 100; offset.y = 0; offset.z = 0; }
            else offset = undefined;
        }
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        var count = 1;
        var xr = 0; var yr = 1; var zr = -1;
        var layer = 1;
        for (let idx in selectedUnits) {
            var unit = selectedUnits[idx];
            if (offset != undefined)
                /* Offset is set, apply it */
                unit.followUnit(ID, { "x": offset.x * count, "y": offset.y * count, "z": offset.z * count });
            else {
                /* More complex formations with variable offsets */
                if (formation === "diamond") {
                    var xl = xr * Math.cos(Math.PI / 4) - yr * Math.sin(Math.PI / 4);
                    var yl = xr * Math.sin(Math.PI / 4) + yr * Math.cos(Math.PI / 4);
                    unit.followUnit(ID, { "x": -yl * 50, "y": zr * 10, "z": xl * 50 });

                    if (yr == 0) { layer++; xr = 0; yr = layer; zr = -layer; }
                    else {
                        if (xr < layer) { xr++; zr--; }
                        else { yr--; zr++; }
                    }
                }
            }
            count++;
        }
        this.#showActionMessage(selectedUnits, `following unit ${this.getUnitByID(ID)?.getUnitName()}`);
    }

    selectedUnitsSetHotgroup(hotgroup: number) {
        this.getUnitsByHotgroup(hotgroup).forEach((unit: Unit) => unit.setHotgroup(null));
        this.selectedUnitsAddToHotgroup(hotgroup);
    }

    selectedUnitsAddToHotgroup(hotgroup: number) {
        var selectedUnits = this.getSelectedUnits();
        for (let idx in selectedUnits) {
            selectedUnits[idx].setHotgroup(hotgroup);
        }
        this.#showActionMessage(selectedUnits, `added to hotgroup ${hotgroup}`);
        getHotgroupPanel().refreshHotgroups();
    }

    selectedUnitsComputeGroupDestination(latlng: LatLng, rotation: number) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        /* Compute the center of the group */
        var center = { x: 0, y: 0 };
        selectedUnits.forEach((unit: Unit) => {
            var mercator = latLngToMercator(unit.getPosition().lat, unit.getPosition().lng);
            center.x += mercator.x / selectedUnits.length;
            center.y += mercator.y / selectedUnits.length;
        });

        /* Compute the distances from the center of the group */
        var unitDestinations: { [key: number]: LatLng } = {};
        selectedUnits.forEach((unit: Unit) => {
            var mercator = latLngToMercator(unit.getPosition().lat, unit.getPosition().lng);
            var distancesFromCenter = { dx: mercator.x - center.x, dy: mercator.y - center.y };

            /* Rotate the distance according to the group rotation */
            var rotatedDistancesFromCenter: { dx: number, dy: number } = { dx: 0, dy: 0 };
            rotatedDistancesFromCenter.dx = distancesFromCenter.dx * Math.cos(deg2rad(rotation)) - distancesFromCenter.dy * Math.sin(deg2rad(rotation));
            rotatedDistancesFromCenter.dy = distancesFromCenter.dx * Math.sin(deg2rad(rotation)) + distancesFromCenter.dy * Math.cos(deg2rad(rotation));

            /* Compute the final position of the unit */
            var destMercator = latLngToMercator(latlng.lat, latlng.lng);    // Convert destination point to mercator
            var unitMercator = { x: destMercator.x + rotatedDistancesFromCenter.dx, y: destMercator.y + rotatedDistancesFromCenter.dy };  // Compute final position of this unit in mercator coordinates
            var unitLatLng = mercatorToLatLng(unitMercator.x, unitMercator.y);
            unitDestinations[unit.ID] = new LatLng(unitLatLng.lat, unitLatLng.lng);
        });

        return unitDestinations;
    }

    selectedUnitsBombPoint(mouseCoordinates: LatLng) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].bombPoint(mouseCoordinates);
        }
        this.#showActionMessage(selectedUnits, `unit bombing point`);
    }

    selectedUnitsCarpetBomb(mouseCoordinates: LatLng) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].carpetBomb(mouseCoordinates);
        }
        this.#showActionMessage(selectedUnits, `unit bombing point`);
    }

    selectedUnitsBombBuilding(mouseCoordinates: LatLng) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].bombBuilding(mouseCoordinates);
        }
        this.#showActionMessage(selectedUnits, `unit bombing point`);
    }

    selectedUnitsFireAtArea(mouseCoordinates: LatLng) {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true });
        for (let idx in selectedUnits) {
            selectedUnits[idx].fireAtArea(mouseCoordinates);
        }
        this.#showActionMessage(selectedUnits, `unit bombing point`);
    }

    // TODO add undo group
    selectedUnitsCreateGroup() {
        var selectedUnits = this.getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: false });
        var units = [];
        var coalition = "neutral";
        for (let idx in selectedUnits) {
            var unit = selectedUnits[idx];
            coalition = unit.getCoalition();
            deleteUnit(unit.ID, false, true);
            units.push({unitType: unit.getName(), location: unit.getPosition()});
        }
        const category = this.getSelectedUnitsTypes()[0];
        this.spawnUnits(category, units, coalition, true);
    }

    /***********************************************/
    copyUnits() {
        this.#copiedUnits = JSON.parse(JSON.stringify(this.getSelectedUnits().map((unit: Unit) => {return unit.getData()}))); /* Can be applied to humans too */
        getInfoPopup().setText(`${this.#copiedUnits.length} units copied`);
    }

    pasteUnits() {
        if (!this.#pasteDisabled && getUnitsManager().getCommandMode() == GAME_MASTER) {
            /* Compute the position of the center of the copied units */
            var nUnits = this.#copiedUnits.length;
            var avgLat = 0;
            var avgLng = 0;
            for (let idx in this.#copiedUnits) {
                var unit = this.#copiedUnits[idx];
                avgLat += unit.position.lat / nUnits;
                avgLng += unit.position.lng / nUnits;
            }

            /* Organize the copied units in groups */
            var groups: {[key: string]: any} = {};
            this.#copiedUnits.forEach((unit: any) => {
                if (!(unit.groupName in groups))
                    groups[unit.groupName] = [];
                groups[unit.groupName].push(unit);
            });

            for (let groupName in groups) {
                /* Paste the units as groups. Only for ground and navy units because of loadouts, TODO: find a better solution so it works for them too*/
                if (!["Aircraft", "Helicopter"].includes(groups[groupName][0].category)) {
                    var units = groups[groupName].map((unit: any) => {
                        var position = new LatLng(getMap().getMouseCoordinates().lat + unit.position.lat - avgLat, getMap().getMouseCoordinates().lng + unit.position.lng - avgLng);
                        getMap().addTemporaryMarker(position, unit.name, unit.coalition);
                        return {unitType: unit.name, location: position};
                    });
                    this.spawnUnits(groups[groupName][0].category, units, groups[groupName][0].coalition, true);
                }
                else {
                    groups[groupName].forEach((unit: any) => {
                        var position = new LatLng(getMap().getMouseCoordinates().lat + unit.position.lat - avgLat, getMap().getMouseCoordinates().lng + unit.position.lng - avgLng);
                        getMap().addTemporaryMarker(position, unit.name, unit.coalition);
                        cloneUnit(unit.ID, position);
                    });
                }
            }
            getInfoPopup().setText(`${this.#copiedUnits.length - 1} units pasted`);
        }
        else {
            getInfoPopup().setText(`Unit cloning is disabled in ${getUnitsManager().getCommandMode()} mode`);
        }
    }

    createIADS(coalitionArea: CoalitionArea, types: {[key: string]: boolean}, eras: {[key: string]: boolean}, ranges: {[key: string]: boolean}, density: number, distribution: number) {
        const activeTypes = Object.keys(types).filter((key: string) => { return types[key]; }); 
        const activeEras = Object.keys(eras).filter((key: string) => { return eras[key]; }); 
        const activeRanges = Object.keys(ranges).filter((key: string) => { return ranges[key]; }); 

        citiesDatabase.forEach((city: {lat: number, lng: number, pop: number}) => {
            if (polyContains(new LatLng(city.lat, city.lng), coalitionArea)) {
                var pointsNumber = 2 + Math.pow(city.pop, 0.2) * density / 100;
                for (let i = 0; i < pointsNumber; i++) {
                    var bearing = Math.random() * 360;
                    var distance = Math.random() * distribution * 100;
                    const latlng = bearingAndDistanceToLatLng(city.lat, city.lng, bearing, distance);
                    if (polyContains(latlng, coalitionArea)) {
                        const type = activeTypes[Math.floor(Math.random() * activeTypes.length)];
                        if (Math.random() < IADSDensities[type]) {
                            const unitBlueprint = randomUnitBlueprint(groundUnitDatabase, {type: type, eras: activeEras, ranges: activeRanges});
                            if (unitBlueprint) {
                                this.spawnUnits("GroundUnit", [{unitType: unitBlueprint.name, location: latlng}], coalitionArea.getCoalition(), true);
                                getMap().addTemporaryMarker(latlng, unitBlueprint.name, coalitionArea.getCoalition());
                            }
                        }
                    }
                }
            }
        })
    }

    exportToFile() {
        var unitsToExport: {[key: string]: any} = {};
        for (let ID in this.#units) {
            var unit = this.#units[ID];
            if (!["Aircraft", "Helicopter"].includes(unit.getCategory())) {
                var data: any = unit.getData();
                if (unit.getGroupName() in unitsToExport)
                    unitsToExport[unit.getGroupName()].push(data);
                else 
                    unitsToExport[unit.getGroupName()] = [data];
            }
        }
        var a = document.createElement("a");
        var file = new Blob([JSON.stringify(unitsToExport)], {type: 'text/plain'});
        a.href = URL.createObjectURL(file);
        a.download = 'export.json';
        a.click();
    }

    importFromFile() {
        var input = document.createElement("input");
        input.type = "file";
        input.addEventListener("change", (e: any) => {
            var file = e.target.files[0];
            if (!file) {
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e: any) {
                var contents = e.target.result;
                var groups = JSON.parse(contents);
                for (let groupName in groups) {
                    if (groupName !== "" && groups[groupName].length > 0 && groups[groupName].every((unit: any) => {return unit.category == "GroundUnit";})) {
                        var units = groups[groupName].map((unit: any) => {return {unitType: unit.name, location: unit.position}});
                        getUnitsManager().spawnUnits("GroundUnit", units, groups[groupName][0].coalition, true);
                    }
                }
            };
            reader.readAsText(file);
        })
        input.click();
    }

    spawnUnits(category: string, units: any, coalition: string = "blue", immediate: boolean = true, airbase: string = "") {
        var spawnPoints = 0;
        if (category === "Aircraft") {
            if (airbase == "" && getMissionHandler().getRemainingSetupTime() < 0 && this.getCommandMode() !== GAME_MASTER) {
                getInfoPopup().setText("Aircrafts can be air spawned during the SETUP phase only");
                return false;
            }
            spawnPoints = units.reduce((points: number, unit: any) => {return points + aircraftDatabase.getSpawnPointsByName(unit.unitType)}, 0);
            spawnAircrafts(units, coalition, airbase, immediate, spawnPoints);
        } else if (category === "Helicopter") {
            if (airbase == "" && getMissionHandler().getRemainingSetupTime() < 0 && this.getCommandMode() !== GAME_MASTER) {
                getInfoPopup().setText("Helicopters can be air spawned during the SETUP phase only");
                return false;
            }
            spawnPoints = units.reduce((points: number, unit: any) => {return points + helicopterDatabase.getSpawnPointsByName(unit.unitType)}, 0);
            spawnHelicopters(units, coalition, airbase, immediate, spawnPoints);
        } else if (category === "GroundUnit") {
            if (getMissionHandler().getRemainingSetupTime() < 0 && this.getCommandMode() !== GAME_MASTER) {
                getInfoPopup().setText("Ground units can be spawned during the SETUP phase only");
                return false;
            }
            spawnPoints = units.reduce((points: number, unit: any) => {return points + groundUnitDatabase.getSpawnPointsByName(unit.unitType)}, 0);
            spawnGroundUnits(units, coalition, immediate, spawnPoints);
        } else if (category === "NavyUnit") {
            if (getMissionHandler().getRemainingSetupTime() < 0 && this.getCommandMode() !== GAME_MASTER) {
                getInfoPopup().setText("Navy units can be spawned during the SETUP phase only");
                return false;
            }
            spawnPoints = units.reduce((points: number, unit: any) => {return points + navyUnitDatabase.getSpawnPointsByName(unit.unitType)}, 0);
            spawnNavyUnits(units, coalition, immediate, spawnPoints);
        }
        if (spawnPoints <= getMissionHandler().getAvailableSpawnPoints()) {
            getMissionHandler().setSpentSpawnPoints(spawnPoints);
            return true;
        } else {
            getInfoPopup().setText("Not enough spawn points available!");
            return false;
        }
    }

    /***********************************************/
    #onKeyUp(event: KeyboardEvent) {
        if (!keyEventWasInInput(event)) {
            if (event.key === "Delete")
                this.selectedUnitsDelete();
            else if (event.key === "a" && event.ctrlKey)
                Object.values(this.getUnits()).filter((unit: Unit) => {return !unit.getHidden()}).forEach((unit: Unit) => unit.setSelected(true));
        }
    }

    #onUnitSelection(unit: Unit) {
        if (this.getSelectedUnits().length > 0) {
            getMap().setState(MOVE_UNIT);
            /* Disable the firing of the selection event for a certain amount of time. This avoids firing many events if many units are selected */
            if (!this.#selectionEventDisabled) {
                window.setTimeout(() => {
                    document.dispatchEvent(new CustomEvent("unitsSelection", { detail: this.getSelectedUnits() }));
                    this.#selectionEventDisabled = false;
                }, 100);
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
            document.dispatchEvent(new CustomEvent("unitsDeselection", { detail: this.getSelectedUnits() }));
    }

    #showActionMessage(units: any[], message: string) {
        if (units.length == 1)
            getInfoPopup().setText(`${units[0].getUnitName()} ${message}`);
        else if (units.length > 1)
            getInfoPopup().setText(`${units[0].getUnitName()} and ${units.length - 1} other units ${message}`);
    }
}
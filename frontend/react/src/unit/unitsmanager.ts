import * as turf from "@turf/turf";
import { LatLng, LatLngBounds } from "leaflet";
import {
  BLUE_COMMANDER,
  DataIndexes,
  GAME_MASTER,
  IADSDensities,
  OlympusState,
  RED_COMMANDER,
  UnitControlSubState
} from "../constants/constants";
import {
  AWACSReferenceChangedEvent,
  CommandModeOptionsChangedEvent,
  ContactsUpdatedEvent,
  CopiedUnitsEvents,
  HotgroupsChangedEvent,
  SelectedUnitsChangedEvent,
  SelectionClearedEvent,
  SessionDataLoadedEvent,
  UnitDeadEvent,
  UnitDeselectedEvent,
  UnitSelectedEvent,
  UnitsRefreshedEvent,
  UnitsUpdatedEvent,
} from "../events";
import { Contact, GeneralSettings, Radio, TACAN, UnitBlueprint, UnitData, UnitSpawnTable } from "../interfaces";
import { CoalitionCircle } from "../map/coalitionarea/coalitioncircle";
import { CoalitionPolygon } from "../map/coalitionarea/coalitionpolygon";
import { PathMarker } from "../map/markers/pathmarker";
import { TemporaryUnitMarker } from "../map/markers/temporaryunitmarker";
import { getApp } from "../olympusapp";
import {
  areaContains,
  bearingAndDistanceToLatLng,
  deepCopyTable,
  deg2rad,
  getGroundElevation,
  latLngToMercator,
  mToFt,
  mercatorToLatLng,
  msToKnots,
} from "../other/utils";
import { DataExtractor } from "../server/dataextractor";
import { Coalition } from "../types/types";
import { ContextActionSet } from "./contextactionset";
import { citiesDatabase } from "./databases/citiesdatabase";
import { UnitDatabase } from "./databases/unitdatabase";
import { Group } from "./group";
import { AirUnit, GroundUnit, NavyUnit, Unit } from "./unit";

/** The UnitsManager handles the creation, update, and control of units. Data is strictly updated by the server ONLY. This means that any interaction from the user will always and only
 * result in a command to the server, executed by means of a REST PUT request. Any subsequent change in data will be reflected only when the new data is sent back by the server. This strategy allows
 * to avoid client/server and client/client inconsistencies.
 */
export class UnitsManager {
  #copiedUnits: UnitData[] = [];
  #deselectionEventDisabled: boolean = false;
  #requestDetectionUpdate: boolean = false;
  #selectionEventDisabled: boolean = false;
  #units: { [ID: number]: Unit } = {};
  #groups: { [groupName: string]: Group } = {};
  #unitDatabase: UnitDatabase;
  #protectionCallback: (units: Unit[]) => void = (units) => {};
  #AWACSReference: Unit | null = null;
  #clusters: { [key: number]: Unit[] } = {};
  #pathMarkers: PathMarker[] = [];

  constructor() {
    this.#unitDatabase = new UnitDatabase();
    this.#unitDatabase.load("./api/databases/units/aircraftdatabase", "aircraft");
    this.#unitDatabase.load("./api/databases/units/helicopterdatabase", "helicopter");
    this.#unitDatabase.load("./api/databases/units/groundunitdatabase", "groundunit");
    this.#unitDatabase.load("./api/databases/units/navyunitdatabase", "navyunit");
    this.#unitDatabase.load("./api/databases/units/mods");

    CommandModeOptionsChangedEvent.on(() => {
      Object.values(this.#units).forEach((unit: Unit) => unit.updateVisibility());
    });
    ContactsUpdatedEvent.on(() => {
      this.#requestDetectionUpdate = true;
    });
    UnitSelectedEvent.on((unit) => this.#onUnitSelection(unit));
    UnitDeselectedEvent.on((unit) => this.#onUnitDeselection(unit));

    UnitDeadEvent.on((unit) => {
      if (unit.getHotgroup()) HotgroupsChangedEvent.dispatch(this.getHotgroups());
    });

    SessionDataLoadedEvent.on((sessionData) => {
      UnitsRefreshedEvent.on((units) => {
        const localSessionData = deepCopyTable(sessionData);
        if (localSessionData.hotgroups) {
          Object.keys(localSessionData.hotgroups).forEach((hotgroup) => {
            localSessionData.hotgroups[hotgroup].forEach((ID) => {
              let unit = this.getUnitByID(ID);
              if (unit) this.addToHotgroup(Number(hotgroup), [unit]);
            });
          });
        }
      }, true);
    });

    getApp()
      .getShortcutManager()
      .addShortcut("selectAll", {
        label: "Select all units",
        keyUpCallback: () => {
          Object.values(this.getUnits())
            .filter((unit: Unit) => {
              return !unit.getHidden();
            })
            .forEach((unit: Unit) => unit.setSelected(true));
        },
        code: "KeyA",
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
      })
      .addShortcut("copyUnits", {
        label: "Copy units",
        keyUpCallback: () => this.copy(),
        code: "KeyC",
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
      })
      .addShortcut("pasteUnits", {
        label: "Paste units",
        keyUpCallback: () => this.paste(),
        code: "KeyV",
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
      });

    const digits = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9"];
    digits.forEach((code, idx) => {
      getApp()
        .getShortcutManager()
        .addShortcut(`hotgroup${idx + 1}only`, {
          label: `Hotgroup ${idx + 1} (Select only)`,
          keyUpCallback: (ev: KeyboardEvent) => {
            this.selectUnitsByHotgroup(parseInt(ev.code.substring(5)));
          },
          code: code,
          shiftKey: false,
          altKey: false,
          ctrlKey: false,
        })
        .addShortcut(`hotgroup${idx + 1}add`, {
          label: `Hotgroup ${idx + 1} (Add to)`,
          keyUpCallback: (ev: KeyboardEvent) => {
            this.addToHotgroup(parseInt(ev.code.substring(5)));
          },
          code: code,
          shiftKey: true,
          altKey: false,
          ctrlKey: false,
        })
        .addShortcut(`hotgroup${idx + 1}set`, {
          label: `Hotgroup ${idx + 1} (Set)`,
          keyUpCallback: (ev: KeyboardEvent) => {
            this.setHotgroup(parseInt(ev.code.substring(5)));
          },
          code: code,
          ctrlKey: true,
          altKey: false,
          shiftKey: false,
        })
        .addShortcut(`hotgroup${idx + 1}also`, {
          label: `Hotgroup ${idx + 1} (Select also)`,
          keyUpCallback: (ev: KeyboardEvent) => {
            this.selectUnitsByHotgroup(parseInt(ev.code.substring(5)), false);
          },
          code: code,
          ctrlKey: true,
          shiftKey: true,
          altKey: false,
        });
    });
  }

  /**
   *
   * @returns All the existing units, both alive and dead
   */
  getUnits() {
    return this.#units;
  }

  /** Get a specific unit by ID
   *
   * @param ID ID of the unit. The ID shall be the same as the unit ID in DCS.
   * @returns Unit object, or null if no unit with said ID exists.
   */
  getUnitByID(ID: number) {
    if (ID in this.#units) return this.#units[ID];
    else return null;
  }

  /** Returns all the units that belong to a hotgroup
   *
   * @param hotgroup Hotgroup number
   * @returns Array of units that belong to hotgroup
   */
  getUnitsByHotgroup(hotgroup: number) {
    return Object.values(this.#units).filter((unit: Unit) => {
      return unit.getAlive() && unit.getHotgroup() == hotgroup;
    });
  }

  /** Add a new unit to the manager
   *
   * @param ID ID of the new unit
   * @param category Either "Aircraft", "Helicopter", "GroundUnit", or "NavyUnit". Determines what class will be used to create the new unit accordingly.
   */
  addUnit(ID: number, category: string) {
    if (category) {
      /* Get the constructor from the unit category */
      var constructor = Unit.getConstructor(category);
      if (constructor != undefined) {
        this.#units[ID] = new constructor(ID);
      }
    }
  }

  /** Update the data of all the units. The data is directly decoded from the binary buffer received from the REST Server. This is necessary for performance and bandwidth reasons.
   *
   * @param buffer The arraybuffer, encoded according to the ICD defined in: TODO Add reference to ICD
   * @returns The decoded updateTime of the data update.
   */
  update(buffer: ArrayBuffer, fullUpdate: boolean) {
    /* Extract the data from the arraybuffer. Since data is encoded dynamically (not all data is always present, but rather only the data that was actually updated since the last request).
        No a prori casting can be performed. On the contrary, the array is decoded incrementally, depending on the DataIndexes of the data. The actual data decoding is performed by the Unit class directly. 
        Every time a piece of data is decoded the decoder seeker is incremented. */
    var dataExtractor = new DataExtractor(buffer);

    var updateTime = Number(dataExtractor.extractUInt64());
    let updatedUnits: Unit[] = [];

    /* Run until all data is extracted or an error occurs */
    while (dataExtractor.getSeekPosition() < buffer.byteLength) {
      /* Extract the unit ID */
      const ID = dataExtractor.extractUInt32();

      /* If the ID of the unit does not yet exist, create the unit, if the category is known. If it isn't, some data must have been lost and we need to wait for another update */
      if (!(ID in this.#units)) {
        const datumIndex = dataExtractor.extractUInt8();
        if (datumIndex == DataIndexes.category) {
          const category = dataExtractor.extractString();
          this.addUnit(ID, category);
          
        } else {
          /* Inconsistent data, we need to wait for a refresh */
          return updateTime;
        }
      }
      /* Update the data of the unit */
      if (ID in this.#units) {
        this.#units[ID].setData(dataExtractor);
        this.#units[ID].getAlive() && updatedUnits.push(this.#units[ID]);
        
      }
    }

    /* Update the unit groups */
    for (let ID in this.#units) {
      const unit = this.#units[ID];
      const groupName = unit.getGroupName();

      if (groupName !== "") {
        /* If the group does not yet exist, create it */
        if (!(groupName in this.#groups)) this.#groups[groupName] = new Group(groupName);

        /* If the unit was not assigned to a group yet, assign it */
        if (unit.getGroup() === null) this.#groups[groupName].addMember(unit);
      }
    }

    /* If we are not in Game Master mode, visibility of units by the user is determined by the detections of the units themselves. This is performed here.
        This operation is computationally expensive, therefore it is only performed when #requestDetectionUpdate is true. This happens whenever a change in the detectionUpdates is detected 
        */
    if (this.#requestDetectionUpdate && getApp().getMissionManager().getCommandModeOptions().commandMode != GAME_MASTER) {
      /* Create a dictionary of empty detection methods arrays */
      var detectionMethods: { [key: string]: number[] } = {};
      for (let ID in this.#units) detectionMethods[ID] = [];
      for (let ID in getApp().getWeaponsManager().getWeapons()) detectionMethods[ID] = [];

      /* Fill the array with the detection methods */
      for (let ID in this.#units) {
        const unit = this.#units[ID];
        if (unit.getAlive() && unit.belongsToCommandedCoalition()) {
          const contacts = unit.getContacts();
          contacts.forEach((contact: Contact) => {
            const contactID = contact.ID;
            if (contactID in detectionMethods && !detectionMethods[contactID].includes(contact.detectionMethod))
              detectionMethods[contactID]?.push(contact.detectionMethod);
          });
        }
      }

      /* Set the detection methods for every unit */
      for (let ID in this.#units) {
        const unit = this.#units[ID];
        unit?.setDetectionMethods(detectionMethods[ID]);
      }

      /* Set the detection methods for every weapon (weapons must be detected too) */
      for (let ID in getApp().getWeaponsManager().getWeapons()) {
        const weapon = getApp().getWeaponsManager().getWeaponByID(parseInt(ID));
        weapon?.setDetectionMethods(detectionMethods[ID]);
      }

      this.#requestDetectionUpdate = false;
    }

    /* Update all the lines of all the selected units. This code is handled by the UnitsManager since, for example, it must be run both when the detected OR the detecting unit is updated */
    let pathMarkersCoordinates: LatLng[] = [];
    for (let ID in this.#units) {
      if (this.#units[ID].getSelected()) {
        this.#units[ID].drawLines();
        const unitPath = this.#units[ID].getActivePath();
        unitPath.forEach((latlng: LatLng) => {
          if (pathMarkersCoordinates.every((coord: LatLng) => coord.lat != latlng.lat && coord.lng != latlng.lng)) pathMarkersCoordinates.push(latlng);
        });
      }
    }

    /* Update the path markers */
    if (this.#pathMarkers.find((pathMarker: PathMarker) => pathMarker.options["freeze"]) === undefined) {
      this.#pathMarkers.forEach((pathMarker: PathMarker) => {
        if (!pathMarkersCoordinates.some((coord: LatLng) => pathMarker.getLatLng().equals(coord))) {
          pathMarker.remove();
          this.#pathMarkers = this.#pathMarkers.filter((marker: PathMarker) => marker !== pathMarker);
        }
      });

      pathMarkersCoordinates.forEach((latlng: LatLng) => {
        if (!this.#pathMarkers.some((pathMarker: PathMarker) => pathMarker.getLatLng().equals(latlng))) {
          const pathMarker = new PathMarker(latlng);

          pathMarker.on("dragstart", (event) => {
            event.target.options["freeze"] = true;
            event.target.options["originalPosition"] = event.target.getLatLng();
          });
          pathMarker.on("dragend", (event) => {
            event.target.options["freeze"] = false;
            this.getSelectedUnits().forEach((unit) => {
              let path = [...unit.getActivePath()];
              const idx = path.findIndex((coord: LatLng) => coord.equals(event.target.options["originalPosition"]));
              if (idx !== -1) {
                path[idx] = event.target.getLatLng();
                getApp().getServerManager().addDestination(unit.ID, path);
              }
            });
          });

          pathMarker.addTo(getApp().getMap());
          this.#pathMarkers.push(pathMarker);
        }
      });
    }

    /* Compute the base air unit clusters */
    this.#clusters = this.computeClusters(AirUnit);

    /* Compute the base ground unit clusters */
    Object.values(this.#units).forEach((unit: Unit) => unit.setIsClusterLeader(true));
    if (getApp().getMap().getOptions().clusterGroundUnits) {
      /* Get a list of all existing ground unit types */
      let groundUnitTypes: string[] = [];
      Object.values(this.#units)
        .filter((unit) => unit.getAlive())
        .forEach((unit: Unit) => {
          if (unit.getCategory() === "GroundUnit" && !groundUnitTypes.includes(unit.getType())) groundUnitTypes.push(unit.getType());
        });

      ["blue", "red", "neutral"].forEach((coalition: string) => {
        groundUnitTypes.forEach((type: string) => {
          let clusters = this.computeClusters(
            GroundUnit,
            (unit: Unit) => {
              if (getApp().getMap().getOptions().hideGroupMembers) return unit.getType() === type && unit.getIsLeader();
              else return unit.getType() === type;
            },
            2,
            coalition as Coalition,
            5
          );

          /* Find the unit closest to the cluster center */
          Object.values(clusters).forEach((clusterUnits: Unit[]) => {
            const clusterCenter = turf.center(
              turf.featureCollection(clusterUnits.map((unit: Unit) => turf.point([unit.getPosition().lng, unit.getPosition().lat])))
            );
            const clusterCenterCoords = clusterCenter.geometry.coordinates;
            const clusterCenterLatLng = new LatLng(clusterCenterCoords[1], clusterCenterCoords[0]);

            const closestUnit = clusterUnits.reduce((prev, current) => {
              return prev.getPosition().distanceTo(clusterCenterLatLng) < current.getPosition().distanceTo(clusterCenterLatLng) ? prev : current;
            });

            clusterUnits.forEach((unit: Unit) => unit.setIsClusterLeader(unit === closestUnit));
            closestUnit.setClusterUnits(clusterUnits);
          });
        });
      });
    }

    if (fullUpdate) UnitsRefreshedEvent.dispatch(Object.values(this.#units));
    else UnitsUpdatedEvent.dispatch(updatedUnits);

    return updateTime;
  }

  /** Set a unit as "selected", which will allow to perform operations on it, like giving it a destination, setting it to attack a target, and so on
   *
   * @param ID The ID of the unit to select
   * @param deselectAllUnits If true, the unit will be the only selected unit
   */
  selectUnit(ID: number, deselectAllUnits: boolean = true) {
    if (deselectAllUnits)
      this.getSelectedUnits()
        .filter((unit: Unit) => unit.ID !== ID)
        .forEach((unit: Unit) => unit.setSelected(false));
    this.#units[ID]?.setSelected(true);
  }

  /** Select all visible units inside a bounding rectangle
   *
   * @param bounds Leaflet bounds object defining the selection area
   */
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

  /** Select units by hotgroup. A hotgroup can be created to quickly select multiple units using keyboard bindings
   *
   * @param hotgroup The hotgroup number
   */
  selectUnitsByHotgroup(hotgroup: number, deselectAllUnits: boolean = true) {
    if (deselectAllUnits) {
      this.deselectAllUnits();
    }

    this.getUnitsByHotgroup(hotgroup).forEach((unit: Unit) => unit.setSelected(true));
  }

  /** Get all the currently selected units
   *
   * @returns Array of selected units
   */
  getSelectedUnits() {
    return Object.values(this.#units).filter((unit) => unit.getSelected());
  }

  /** Deselects all currently selected units
   *
   */
  deselectAllUnits() {
    for (let ID in this.#units) {
      this.#units[ID].setSelected(false);
    }
  }

  /** This function allows to quickly determine the categories (Aircraft, Helicopter, GroundUnit, NavyUnit) of an array of units. This allows to enable/disable specific controls which can only be applied
   * to specific categories.
   *
   * @param units Array of units of which to retrieve the categories
   * @returns Array of categories. Each category is present only once.
   */
  getUnitsCategories(units: Unit[]) {
    if (units.length == 0) return [];
    return units
      .map((unit: Unit) => {
        return unit.getCategory();
      })
      ?.filter((value: any, index: number, array: string[]) => {
        return array.indexOf(value) === index;
      });
  }

  /**  This function returns the value of a variable for each of the units in the input array. If all the units have the same value, returns the value, else returns undefined. This function is useful to
   * present units data in the control panel, which will print a specific value only if it is the same for all the units. If the values are different, the control panel will show a "mixed values" value, or similar.
   *
   * @param variableGetter CallableFunction that returns the requested variable. Example: getUnitsVariable((unit: Unit) => unit.getName(), foo) will return a string value if all the units have the same name, otherwise it will return undefined.
   * @param units Array of units of which to retrieve the variable
   * @returns The value of the variable if all units have the same value, else undefined
   */
  getUnitsVariable(variableGetter: CallableFunction, units: Unit[]) {
    if (units.length == 0) return undefined;

    var value: any = variableGetter(units[0]);
    units.forEach((unit: Unit) => {
      if (variableGetter(unit) !== value) value = undefined;
    });
    return value;
  }

  /** For a given unit, it returns if and how it is being detected by other units. NOTE: this function will return how a unit is being detected, i.e. how other units are detecting it. It will not return
   * what the unit is detecting.
   *
   * @param unit The unit of which to retrieve the "detected" methods.
   * @returns Array of detection methods
   */
  getUnitDetectedMethods(unit: Unit) {
    var detectionMethods: number[] = [];
    for (let idx in this.#units) {
      if (
        this.#units[idx].getAlive() &&
        this.#units[idx].getIsLeader() &&
        this.#units[idx].getCoalition() !== "neutral" &&
        this.#units[idx].getCoalition() != unit.getCoalition()
      ) {
        this.#units[idx].getContacts().forEach((contact: Contact) => {
          if (contact.ID == unit.ID && !detectionMethods.includes(contact.detectionMethod)) detectionMethods.push(contact.detectionMethod);
        });
      }
    }
    return detectionMethods;
  }

  /*********************** Unit actions on selected units ************************/
  /** Give a new destination to the selected units
   *
   * @param latlng Position of the new destination
   * @param mantainRelativePosition If true, the selected units will mantain their relative positions when reaching the target. This is useful to maintain a formation for groun/navy units
   * @param rotation Rotation in radians by which the formation will be rigidly rotated. E.g. a ( V ) formation will look like this ( < ) if rotated pi/4 radians (90 degrees)
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  addDestination(latlng: L.LatLng, mantainRelativePosition: boolean, rotation: number, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();

    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      /* Compute the destination for each unit. If mantainRelativePosition is true, compute the destination so to hold the relative positions */
      var unitDestinations: { [key: number]: LatLng } = {};
      if (mantainRelativePosition) unitDestinations = this.computeGroupDestination(latlng, rotation);
      else
        units.forEach((unit: Unit) => {
          unitDestinations[unit.ID] = latlng;
        });

      units.forEach((unit: Unit) => {
        /* If a unit is following another unit, and that unit is also selected, send the command to the followed ("leader") unit */
        if (unit.getState() === "follow") {
          const leader = this.getUnitByID(unit.getLeaderID());
          if (leader && leader.getSelected()) leader.addDestination(latlng);
          else unit.addDestination(latlng);
        } else {
          if (unit.ID in unitDestinations) unit.addDestination(unitDestinations[unit.ID]);
        }
      });
      this.#showActionMessage(units, " new destination added");
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }

  /** Clear the destinations of all the selected units
   *
   */
  clearDestinations(units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units: Unit[]) => {
      for (let idx in units) {
        const unit = units[idx];
        if (unit.getState() === "follow") {
          const leader = this.getUnitByID(unit.getLeaderID());
          if (leader && leader.getSelected()) leader.clearDestinations();
          else unit.clearDestinations();
        } else unit.clearDestinations();
      }
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }

  stop(units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units: Unit[]) => {
      onExecution();
      for (let idx in units) {
        getApp().getServerManager().addDestination(units[idx].ID, []);
      }
      this.#showActionMessage(units, " stopped");
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }

  /** Instruct all the selected units to land at a specific location
   *
   * @param latlng Location where to land at
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  landAt(latlng: LatLng, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.landAt(latlng));

      this.#showActionMessage(units, " landing");
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Instruct all the selected units to change their speed
   *
   * @param speedChange Speed change, either "stop", "slow", or "fast". The specific value depends on the unit category
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  changeSpeed(speedChange: string, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.changeSpeed(speedChange));
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Instruct all the selected units to change their altitude
   *
   * @param altitudeChange Altitude change, either "climb" or "descend". The specific value depends on the unit category
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  changeAltitude(altitudeChange: string, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.changeAltitude(altitudeChange));
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Set a specific speed to all the selected units
   *
   * @param speed Value to set, in m/s
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setSpeed(speed: number, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setSpeed(speed));
      this.#showActionMessage(units, `setting speed to ${msToKnots(speed)} kts`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Set a specific speed type to all the selected units
   *
   * @param speedType Value to set, either "CAS" or "GS". If "CAS" is selected, the unit will try to maintain the selected Calibrated Air Speed, but DCS will still only maintain a Ground Speed value so errors may arise depending on wind.
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setSpeedType(speedType: string, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setSpeedType(speedType));
      this.#showActionMessage(units, `setting speed type to ${speedType}`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Set a specific altitude to all the selected units
   *
   * @param altitude Value to set, in m
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setAltitude(altitude: number, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setAltitude(altitude));
      this.#showActionMessage(units, `setting altitude to ${mToFt(altitude)} ft`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Set a specific altitude type to all the selected units
   *
   * @param altitudeType Value to set, either "ASL" or "AGL". If "AGL" is selected, the unit will try to maintain the selected Above Ground Level altitude. Due to a DCS bug, this will only be true at the final position.
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setAltitudeType(altitudeType: string, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setAltitudeType(altitudeType));
      this.#showActionMessage(units, `setting altitude type to ${altitudeType}`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Set a specific ROE to all the selected units
   *
   * @param ROE Value to set, see constants for acceptable values
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setROE(ROE: string, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setROE(ROE));
      this.#showActionMessage(units, `ROE set to ${ROE}`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }

  /** Set a specific Alarm State to all the selected units
   *
   * @param AlarmState Value to set, see constants for acceptable values
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setAlarmState(alarmState: number, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setAlarmState(alarmState));
      this.#showActionMessage(units, `Alarm State set to ${alarmState.toString()}`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Set a specific reaction to threat to all the selected units
   *
   * @param reactionToThreat Value to set, see constants for acceptable values
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setReactionToThreat(reactionToThreat: string, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setReactionToThreat(reactionToThreat));
      this.#showActionMessage(units, `reaction to threat set to ${reactionToThreat}`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Set a specific emissions & countermeasures to all the selected units
   *
   * @param emissionCountermeasure Value to set, see constants for acceptable values
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setEmissionsCountermeasures(emissionCountermeasure: string, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setEmissionsCountermeasures(emissionCountermeasure));
      this.#showActionMessage(units, `emissions & countermeasures set to ${emissionCountermeasure}`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Turn selected units on or off, only works on ground and navy units
   *
   * @param onOff If true, the unit will be turned on
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setOnOff(onOff: boolean, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setOnOff(onOff));
      this.#showActionMessage(units, `unit active set to ${onOff}`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Instruct the selected units to follow roads, only works on ground units
   *
   * @param followRoads If true, units will follow roads
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setFollowRoads(followRoads: boolean, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setFollowRoads(followRoads));
      this.#showActionMessage(units, `follow roads set to ${followRoads}`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Instruct selected units to operate as a certain coalition
   *
   * @param operateAs Coalition to operate as. Values are "red", "blue", "neutral"
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setOperateAs(operateAs: string, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setOperateAs(operateAs));
      this.#showActionMessage(units, `operate as set to ${operateAs}`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }

  /** Set the advanced options for the selected units
   *
   * @param isActiveTanker If true, the unit will be a tanker
   * @param isActiveAWACS If true, the unit will be an AWACS
   * @param TACAN TACAN settings
   * @param radio Radio settings
   * @param generalSettings General settings
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   * @param onExecution Function to execute after the operation is completed
   */
  setAdvancedOptions(
    isActiveTanker: boolean,
    isActiveAWACS: boolean,
    TACAN: TACAN,
    radio: Radio,
    generalSettings: GeneralSettings,
    units: Unit[] | null = null,
    onExecution: () => void = () => {}
  ) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());
    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setAdvancedOptions(isActiveTanker, isActiveAWACS, TACAN, radio, generalSettings));
      this.#showActionMessage(units, `advanced options set`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }

  //TODO
  setEngagementProperties(
    barrelHeight: number,
    muzzleVelocity: number,
    aimTime: number,
    shotsToFire: number,
    shotsBaseInterval: number,
    shotsBaseScatter: number,
    engagementRange: number,
    targetingRange: number,
    aimMethodRange: number,
    acquisitionRange: number,
    units: Unit[] | null = null,
    onExecution: () => void = () => {}
  ) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());
    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) =>
        unit.setEngagementProperties(
          barrelHeight,
          muzzleVelocity,
          aimTime,
          shotsToFire,
          shotsBaseInterval,
          shotsBaseScatter,
          engagementRange,
          targetingRange,
          aimMethodRange,
          acquisitionRange
        )
      );
      this.#showActionMessage(units, `engagement parameters set`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }

  /** Instruct units to attack a specific unit
   *
   * @param ID ID of the unit to attack
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  attackUnit(ID: number, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.attackUnit(ID));
      this.#showActionMessage(units, `attacking unit ${this.getUnitByID(ID)?.getUnitName()}`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Instruct units to refuel at the nearest tanker, if possible. Else units will RTB
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  refuel(units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();

    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.refuel());
      this.#showActionMessage(units, `sent to nearest tanker`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Instruct the selected units to follow another unit in a formation. Only works for aircrafts and helicopters.
   *
   * @param ID ID of the unit to follow
   * @param offset Optional parameter, defines a static offset. X: front-rear, positive front, Y: top-bottom, positive top, Z: left-right, positive right
   * @param formation Optional parameter, defines a predefined formation type. Values are: "trail", "echelon-lh", "echelon-rh", "line-abreast-lh", "line-abreast-rh", "front", "diamond"
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  followUnit(ID: number, offset?: { x: number; y: number; z: number }, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
        getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
        this.#protectionCallback = callback;
      } else callback(units);
    };

    this.#showActionMessage(units, `following unit ${this.getUnitByID(ID)?.getUnitName()}`);
  }

  /** Instruct the selected units to perform precision bombing of specific coordinates
   *
   * @param latlng Location to bomb
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  bombPoint(latlng: LatLng, mantainRelativePosition: boolean, rotation: number = 0, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      /* Compute the target for each unit. If mantainRelativePosition is true, compute the target so to hold the relative positions */
      var unitTargets: { [key: number]: LatLng } = {};
      if (mantainRelativePosition) unitTargets = this.computeGroupDestination(latlng, rotation);
      else
        units.forEach((unit: Unit) => {
          unitTargets[unit.ID] = latlng;
        });
      units.forEach((unit: Unit) => unit.bombPoint(unitTargets[unit.ID]));
      this.#showActionMessage(units, `unit bombing point`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Instruct the selected units to perform carpet bombing of specific coordinates
   *
   * @param latlng Location to bomb
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  carpetBomb(latlng: LatLng, mantainRelativePosition: boolean, rotation: number = 0, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      /* Compute the target for each unit. If mantainRelativePosition is true, compute the target so to hold the relative positions */
      var unitTargets: { [key: number]: LatLng } = {};
      if (mantainRelativePosition) unitTargets = this.computeGroupDestination(latlng, rotation);
      else
        units.forEach((unit: Unit) => {
          unitTargets[unit.ID] = latlng;
        });
      units.forEach((unit: Unit) => unit.carpetBomb(unitTargets[unit.ID]));
      this.#showActionMessage(units, `unit carpet bombing point`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Instruct the selected units to fire at specific coordinates
   *
   * @param latlng Location to fire at
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  fireAtArea(latlng: LatLng, mantainRelativePosition: boolean, rotation: number = 0, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      /* Compute the target for each unit. If mantainRelativePosition is true, compute the target so to hold the relative positions */
      var unitTargets: { [key: number]: LatLng } = {};
      if (mantainRelativePosition) unitTargets = this.computeGroupDestination(latlng, rotation);
      else
        units.forEach((unit: Unit) => {
          unitTargets[unit.ID] = latlng;
        });
      units.forEach((unit: Unit) => unit.fireAtArea(unitTargets[unit.ID]));
      this.#showActionMessage(units, `unit firing at area`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }

  /** Instruct the selected units to fire at specific coordinates
   *
   * @param latlng Location to fire at
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  fireLaser(latlng: LatLng, mantainRelativePosition: boolean, rotation: number = 0, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      /* Compute the target for each unit. If mantainRelativePosition is true, compute the target so to hold the relative positions */
      var unitTargets: { [key: number]: LatLng } = {};
      if (mantainRelativePosition) unitTargets = this.computeGroupDestination(latlng, rotation);
      else
        units.forEach((unit: Unit) => {
          unitTargets[unit.ID] = latlng;
        });
      units.forEach((unit: Unit) => unit.fireLaser(unitTargets[unit.ID]));
      this.#showActionMessage(units, `unit shining laser at point`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }

  /** Instruct the selected units to fire at specific coordinates
   *
   * @param latlng Location to fire at
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  fireInfrared(latlng: LatLng, mantainRelativePosition: boolean, rotation: number = 0, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      /* Compute the target for each unit. If mantainRelativePosition is true, compute the target so to hold the relative positions */
      var unitTargets: { [key: number]: LatLng } = {};
      if (mantainRelativePosition) unitTargets = this.computeGroupDestination(latlng, rotation);
      else
        units.forEach((unit: Unit) => {
          unitTargets[unit.ID] = latlng;
        });
      units.forEach((unit: Unit) => unit.fireInfrared(unitTargets[unit.ID]));
      this.#showActionMessage(units, `unit shining infrared at point`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }

  /** Instruct the selected units to simulate a fire fight at specific coordinates
   *
   * @param latlng Location to fire at
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  simulateFireFight(latlng: LatLng, mantainRelativePosition: boolean, rotation: number = 0, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      getGroundElevation(latlng, (response: string) => {
        var groundElevation: number | null = null;
        try {
          groundElevation = parseFloat(response);
          /* Compute the target for each unit. If mantainRelativePosition is true, compute the target so to hold the relative positions */
          var unitTargets: { [key: number]: LatLng } = {};
          if (mantainRelativePosition) unitTargets = this.computeGroupDestination(latlng, rotation);
          else
            units.forEach((unit: Unit) => {
              unitTargets[unit.ID] = latlng;
            });
          units.forEach((unit: Unit) => unit.simulateFireFight(unitTargets[unit.ID], groundElevation));
          this.#showActionMessage(units, `simulating fire fight`);
        } catch {
          console.warn("Simulate fire fight: could not retrieve ground elevation");
        }
      });
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }

  /** Instruct units to enter into scenic AAA mode. Units will shoot in the air without aiming
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  scenicAAA(units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.scenicAAA());
      this.#showActionMessage(units, `unit set to perform scenic AAA`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Instruct units to enter into dynamic accuracy/miss on purpose mode. Units will aim to the nearest enemy unit but not precisely.
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  missOnPurpose(units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.missOnPurpose());
      this.#showActionMessage(units, `unit set to perform miss-on-purpose AAA`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Instruct units to land at specific point
   *
   * @param latlng Point where to land
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  landAtPoint(latlng: LatLng, mantainRelativePosition: boolean, rotation: number = 0, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      /* Compute the target for each unit. If mantainRelativePosition is true, compute the target so to hold the relative positions */
      var unitTargets: { [key: number]: LatLng } = {};
      if (mantainRelativePosition) unitTargets = this.computeGroupDestination(latlng, rotation);
      else
        units.forEach((unit: Unit) => {
          unitTargets[unit.ID] = latlng;
        });
      units.forEach((unit: Unit) => unit.landAtPoint(unitTargets[unit.ID]));
      this.#showActionMessage(units, `unit landing at point`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Set a specific shots scatter to all the selected units
   *
   * @param shotsScatter Value to set
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setShotsScatter(shotsScatter: number, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setShotsScatter(shotsScatter));
      this.#showActionMessage(units, `shots scatter set to ${shotsScatter}`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /** Set a specific shots intensity to all the selected units
   *
   * @param shotsScatter Value to set
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setShotsIntensity(shotsIntensity: number, units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    let callback = (units) => {
      onExecution();
      units.forEach((unit: Unit) => unit.setShotsIntensity(shotsIntensity));
      this.#showActionMessage(units, `shots intensity set to ${shotsIntensity}`);
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }
  /*********************** Control operations on selected units ************************/
  /**  See getUnitsCategories for more info
   *
   * @returns Category array of the selected units.
   */
  getSelectedUnitsCategories() {
    return this.getUnitsCategories(this.getSelectedUnits());
  }

  /**  See getUnitsVariable for more info
   *
   * @param variableGetter CallableFunction that returns the requested variable. Example: getUnitsVariable((unit: Unit) => unit.getName(), foo) will return a string value if all the units have the same name, otherwise it will return undefined.
   * @returns The value of the variable if all units have the same value, else undefined
   */
  getSelectedUnitsVariable(variableGetter: (unit: Unit) => any) {
    return this.getUnitsVariable(variableGetter, this.getSelectedUnits());
  }

  /** Groups the selected units in a single (DCS) group, if all the units have the same category
   *
   */
  createGroup(units: Unit[] | null = null, onExecution: () => void = () => {}) {
    if (units === null) units = this.getSelectedUnits();
    units = units.filter((unit) => !unit.getHuman());

    // TODO: maybe check units are all of same coalition?

    let callback = (units) => {
      onExecution();
      if (this.getUnitsCategories(units).length == 1) {
        var unitsData: { ID: number; location: LatLng }[] = [];
        units.forEach((unit: Unit) => unitsData.push({ ID: unit.ID, location: unit.getPosition() }));

        /* Determine the coalition */
        let coalition = "all";
        if (getApp().getMissionManager().getCommandModeOptions().commandMode === BLUE_COMMANDER) coalition = "blue";
        else if (getApp().getMissionManager().getCommandModeOptions().commandMode === RED_COMMANDER) coalition = "red";

        getApp()
          .getServerManager()
          .cloneUnits(unitsData, true, 0 /* No spawn points, we delete the original units */, coalition as Coalition);
        this.#showActionMessage(units, `created a group`);
      } else {
        getApp().addInfoMessage(`Groups can only be created from units of the same category`);
      }
    };

    if (getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }

  /** Set the hotgroup for the selected units. It will be the only hotgroup of the unit
   *
   * @param hotgroup Hotgroup number
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  setHotgroup(hotgroup: number, units: Unit[] | null = null) {
    this.getUnitsByHotgroup(hotgroup).forEach((unit: Unit) => unit.setHotgroup(null));
    this.addToHotgroup(hotgroup);
  }

  /** Add the selected units to a hotgroup. Units can be in multiple hotgroups at the same type
   *
   * @param hotgroup Hotgroup number
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   */
  addToHotgroup(hotgroup: number, units: Unit[] | null = null) {
    if (units === null) units = this.getSelectedUnits();
    units.forEach((unit: Unit) => unit.setHotgroup(hotgroup));
    this.#showActionMessage(units, `added to hotgroup ${hotgroup}`);
    HotgroupsChangedEvent.dispatch(this.getHotgroups());
  }

  getHotgroups() {
    let hotgroups: { [key: number]: Unit[] } = {};
    for (let ID in this.#units) {
      const unit = this.#units[ID];
      if (unit.getAlive() && !unit.getHuman()) {
        const hotgroup = unit.getHotgroup();
        if (hotgroup) {
          if (!(hotgroup in hotgroups)) {
            hotgroups[hotgroup] = [unit];
          } else hotgroups[hotgroup].push(unit);
        }
      }
    }
    return hotgroups;
  }

  /** Delete the selected units
   *
   * @param explosion If true, the unit will be deleted using an explosion
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   * @returns
   */
  delete(explosion: boolean = false, explosionType: string = "", units: Unit[] | null = null, onExecution: () => void = () => {}) {
    // TODO add fast delete option
    if (units === null) units = this.getSelectedUnits(); /* Can be applied to humans too */

    let callback = (units) => {
      onExecution();
      units?.forEach((unit: Unit) => unit.delete(explosion, explosionType, false));
      this.#showActionMessage(units as Unit[], `deleted`);
    };

    if ((getApp().getMap().getOptions().protectDCSUnits && !units.every((unit) => unit.isControlledByOlympus())) || units.find((unit) => unit.getHuman())) {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.PROTECTION);
      this.#protectionCallback = callback;
    } else callback(units);
  }

  /** Compute the destinations of every unit in the selected units. This function preserves the relative positions of the units, and rotates the whole formation by rotation.
   *
   * @param latlng Center of the group after the translation
   * @param rotation Rotation of the group, in radians
   * @param units (Optional) Array of units to apply the control to. If not provided, the operation will be completed on all selected units.
   * @returns Array of positions for each unit, in order
   */
  computeGroupDestination(latlng: LatLng, rotation: number, units: Unit[] | null = null) {
    // TODO handle protected units
    if (units === null) units = this.getSelectedUnits();

    units = units.filter((unit) => !unit.getHuman());

    if (units.length === 0) return {};

    /* Compute the center of the group */
    var len = units.length;
    var center = { x: 0, y: 0 };
    units.forEach((unit: Unit) => {
      var mercator = latLngToMercator(unit.getPosition().lat, unit.getPosition().lng);
      center.x += mercator.x / len;
      center.y += mercator.y / len;
    });

    /* Compute the distances from the center of the group */
    var unitDestinations: { [key: number]: LatLng } = {};
    units.forEach((unit: Unit) => {
      var mercator = latLngToMercator(unit.getPosition().lat, unit.getPosition().lng);
      var distancesFromCenter = {
        dx: mercator.x - center.x,
        dy: mercator.y - center.y,
      };

      /* Rotate the distance according to the group rotation */
      var rotatedDistancesFromCenter: { dx: number; dy: number } = {
        dx: 0,
        dy: 0,
      };
      rotatedDistancesFromCenter.dx = distancesFromCenter.dx * Math.cos(deg2rad(rotation)) - distancesFromCenter.dy * Math.sin(deg2rad(rotation));
      rotatedDistancesFromCenter.dy = distancesFromCenter.dx * Math.sin(deg2rad(rotation)) + distancesFromCenter.dy * Math.cos(deg2rad(rotation));

      /* Compute the final position of the unit */
      var destMercator = latLngToMercator(latlng.lat, latlng.lng); // Convert destination point to mercator
      var unitMercator = {
        x: destMercator.x + rotatedDistancesFromCenter.dx,
        y: destMercator.y + rotatedDistancesFromCenter.dy,
      }; // Compute final position of this unit in mercator coordinates
      var unitLatLng = mercatorToLatLng(unitMercator.x, unitMercator.y);
      unitDestinations[unit.ID] = new LatLng(unitLatLng.lat, unitLatLng.lng);
    });

    return unitDestinations;
  }

  /** Copy the selected units and store their properties in memory
   *
   */
  copy(units: Unit[] | null = null) {
    if (units === null) units = this.getSelectedUnits();

    if (units.length === 0) return;

    /* A JSON is used to deepcopy the units, creating a "snapshot" of their properties at the time of the copy */
    this.#copiedUnits = JSON.parse(
      JSON.stringify(
        units.map((unit: Unit) => {
          return unit.getData();
        })
      )
    ); /* Can be applied to humans too */
    getApp().addInfoMessage(`${this.#copiedUnits.length} units copied`);

    CopiedUnitsEvents.dispatch(this.#copiedUnits);
  }

  /*********************** Unit manipulation functions  ************************/
  /** Paste the copied units
   *
   * @returns True if units were pasted successfully
   */
  paste(location?: LatLng) {
    let spawnPoints = 0;

    /* If spawns are restricted, check that the user has the necessary spawn points */
    if (getApp().getMissionManager().getCommandModeOptions().commandMode != GAME_MASTER) {
      if (getApp().getMissionManager().getCommandModeOptions().restrictSpawns && getApp().getMissionManager().getRemainingSetupTime() < 0) {
        getApp().addInfoMessage(`Units can be pasted only during SETUP phase`);
        return false;
      }

      this.#copiedUnits.forEach((unit: UnitData) => {
        let unitSpawnPoints = this.#unitDatabase.getSpawnPointsByName(unit.name);
        if (unitSpawnPoints !== undefined) spawnPoints += unitSpawnPoints;
      });

      if (spawnPoints > getApp().getMissionManager().getAvailableSpawnPoints()) {
        getApp().addInfoMessage("Not enough spawn points available!");
        return false;
      }
    }

    if (this.#copiedUnits.length > 0) {
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
      var groups: { [key: string]: UnitData[] } = {};
      this.#copiedUnits.forEach((unit: UnitData) => {
        if (!(unit.groupName in groups)) groups[unit.groupName] = [];
        groups[unit.groupName].push(unit);
      });

      /* Clone the units in groups */
      for (let groupName in groups) {
        var units: { ID: number; location: LatLng }[] = [];
        let markers: TemporaryUnitMarker[] = [];
        groups[groupName].forEach((unit: UnitData) => {
          var position = location
            ? new LatLng(location.lat + unit.position.lat - avgLat, location.lng + unit.position.lng - avgLng)
            : new LatLng(
                getApp().getMap().getMouseCoordinates().lat + unit.position.lat - avgLat,
                getApp().getMap().getMouseCoordinates().lng + unit.position.lng - avgLng
              );
          markers.push(getApp().getMap().addTemporaryMarker(position, unit.name, unit.coalition, false));
          units.push({ ID: unit.ID, location: position });
        });

        let coalition = "all";
        if (getApp().getMissionManager().getCommandModeOptions().commandMode === BLUE_COMMANDER) coalition = "blue";
        else if (getApp().getMissionManager().getCommandModeOptions().commandMode === RED_COMMANDER) coalition = "red";

        getApp()
          .getServerManager()
          .cloneUnits(
            units,
            false,
            getApp().getMissionManager().getCommandModeOptions().commandMode === GAME_MASTER ? 0 : spawnPoints,
            coalition as Coalition,
            (res: any) => {
              if (res !== undefined) {
                markers.forEach((marker: TemporaryUnitMarker) => {
                  marker.setCommandHash(res);
                });
              }
            }
          );
      }
      getApp().addInfoMessage(`${this.#copiedUnits.length} units pasted`);
    } else {
      getApp().addInfoMessage("No units copied!");
    }
  }

  /** Automatically create an Integrated Air Defence System from a CoalitionArea object. The units will be mostly focused around big cities. The bigger the city, the larger the amount of units created next to it.
   * If the CoalitionArea does not contain any city, no units will be created
   *
   * @param coalitionArea Boundaries of the IADS
   * @param types Array of unit types to add to the IADS, e.g. AAA, SAM, flak, MANPADS
   * @param eras Array of eras to which the units added to the IADS can belong
   * @param ranges Array of weapon ranges the units can have
   * @param density Value between 0 and 100, controls the amout of units created
   * @param distribution Value between 0 and 100, controls how "scattered" the units will be
   */
  createIADS(
    coalitionArea: CoalitionPolygon | CoalitionCircle,
    types: { [key: string]: boolean },
    eras: { [key: string]: boolean },
    ranges: { [key: string]: boolean },
    density: number,
    distribution: number,
    forceCoalition: boolean
  ) {
    const activeTypes = Object.keys(types).filter((key: string) => {
      return types[key];
    });
    const activeEras = Object.keys(eras).filter((key: string) => {
      return eras[key];
    });
    const activeRanges = Object.keys(ranges).filter((key: string) => {
      return ranges[key];
    });

    var airbases = getApp().getMissionManager().getAirbases();
    Object.keys(airbases).forEach((airbaseName: string) => {
      var airbase = airbases[airbaseName];
      /* Check if the city is inside the coalition area */
      if (areaContains(new LatLng(airbase.getLatLng().lat, airbase.getLatLng().lng), coalitionArea)) {
        /* Arbitrary formula to obtain a number of units */
        var pointsNumber = 2 + (10 * density) / 100;
        for (let i = 0; i < pointsNumber; i++) {
          /* Place the unit nearby the airbase, depending on the distribution parameter */
          var bearing = Math.random() * 360;
          var distance = Math.random() * distribution * 100;
          const latlng = bearingAndDistanceToLatLng(airbase.getLatLng().lat, airbase.getLatLng().lng, bearing, distance);

          /* Make sure the unit is still inside the coalition area */
          if (areaContains(latlng, coalitionArea)) {
            const type = activeTypes[Math.floor(Math.random() * activeTypes.length)];
            if (Math.random() < IADSDensities[type]) {
              /* Get a random blueprint depending on the selected parameters and spawn the unit */
              let unitBlueprint: UnitBlueprint | null;
              if (forceCoalition)
                unitBlueprint = this.#unitDatabase.getRandomUnit({
                  type: type,
                  eras: activeEras,
                  ranges: activeRanges,
                  coalition: coalitionArea.getCoalition(),
                });
              else
                unitBlueprint = this.#unitDatabase.getRandomUnit({
                  type: type,
                  eras: activeEras,
                  ranges: activeRanges,
                });

              if (unitBlueprint)
                this.spawnUnits(
                  unitBlueprint.category,
                  [
                    {
                      unitType: unitBlueprint.name,
                      location: latlng,
                      liveryID: "",
                      skill: "High",
                    },
                  ],
                  coalitionArea.getCoalition(),
                  false,
                  "",
                  ""
                );
            }
          }
        }
      }
    });

    citiesDatabase.forEach((city: { lat: number; lng: number; pop: number }) => {
      /* Check if the city is inside the coalition area */
      if (areaContains(new LatLng(city.lat, city.lng), coalitionArea)) {
        /* Arbitrary formula to obtain a number of units depending on the city population */
        var pointsNumber = 2 + (Math.pow(city.pop, 0.15) * density) / 100;
        for (let i = 0; i < pointsNumber; i++) {
          /* Place the unit nearby the city, depending on the distribution parameter */
          var bearing = Math.random() * 360;
          var distance = Math.random() * distribution * 100;
          const latlng = bearingAndDistanceToLatLng(city.lat, city.lng, bearing, distance);

          /* Make sure the unit is still inside the coalition area */
          if (areaContains(latlng, coalitionArea)) {
            const type = activeTypes[Math.floor(Math.random() * activeTypes.length)];
            if (Math.random() < IADSDensities[type]) {
              /* Get a random blueprint depending on the selected parameters and spawn the unit */
              let unitBlueprint: UnitBlueprint | null;
              if (forceCoalition)
                unitBlueprint = this.#unitDatabase.getRandomUnit({
                  type: type,
                  eras: activeEras,
                  ranges: activeRanges,
                  coalition: coalitionArea.getCoalition(),
                });
              else
                unitBlueprint = this.#unitDatabase.getRandomUnit({
                  type: type,
                  eras: activeEras,
                  ranges: activeRanges,
                });

              if (unitBlueprint)
                this.spawnUnits(
                  unitBlueprint.category,
                  [
                    {
                      unitType: unitBlueprint.name,
                      location: latlng,
                      liveryID: "",
                      skill: "High",
                    },
                  ],
                  coalitionArea.getCoalition(),
                  false,
                  "",
                  ""
                );
            }
          }
        }
      }
    });
  }

  /** Spawn a new group of units
   *
   * @param category Category of the new units
   * @param units Array of unit tables
   * @param coalition Coalition to which the new units will belong
   * @param immediate If true the command will be performed immediately, but this may cause lag on the server
   * @param airbase If true, the location of the units will be ignored and the units will spawn at the given airbase. Only works for aircrafts and helicopters
   * @param country Set the country of the units. If empty string, the country will be assigned automatically
   * @param callback CallableFunction called when the command is received by the server
   * @returns True if the spawn command was successfully sent
   */
  spawnUnits(
    category: string,
    units: UnitSpawnTable[],
    coalition: string = "blue",
    immediate: boolean = true,
    airbase: string = "",
    country: string = "",
    callback: CallableFunction = () => {}
  ) {
    var spawnPoints = 0;
    var spawnFunction = () => {};
    var spawnsRestricted =
      getApp().getMissionManager().getCommandModeOptions().restrictSpawns &&
      getApp().getMissionManager().getRemainingSetupTime() < 0 &&
      getApp().getMissionManager().getCommandModeOptions().commandMode !== GAME_MASTER;

    if (category === "aircraft") {
      if (airbase == "" && spawnsRestricted) {
        getApp().addInfoMessage("Aircrafts can be air spawned during the SETUP phase only");
        return false;
      }
      spawnPoints =
        getApp().getMissionManager().getCommandModeOptions().commandMode === GAME_MASTER
          ? 0
          : units.reduce((points: number, unit: UnitSpawnTable) => {
              return points + this.getDatabase().getSpawnPointsByName(unit.unitType);
            }, 0);
      spawnFunction = () => getApp().getServerManager().spawnAircrafts(units, coalition, airbase, country, immediate, spawnPoints, callback);
    } else if (category === "helicopter") {
      if (airbase == "" && spawnsRestricted) {
        getApp().addInfoMessage("Helicopters can be air spawned during the SETUP phase only");
        return false;
      }
      spawnPoints =
        getApp().getMissionManager().getCommandModeOptions().commandMode === GAME_MASTER
          ? 0
          : units.reduce((points: number, unit: UnitSpawnTable) => {
              return points + this.getDatabase().getSpawnPointsByName(unit.unitType);
            }, 0);
      spawnFunction = () => getApp().getServerManager().spawnHelicopters(units, coalition, airbase, country, immediate, spawnPoints, callback);
    } else if (category === "groundunit") {
      if (spawnsRestricted) {
        getApp().addInfoMessage("Ground units can be spawned during the SETUP phase only");
        return false;
      }
      spawnPoints =
        getApp().getMissionManager().getCommandModeOptions().commandMode === GAME_MASTER
          ? 0
          : units.reduce((points: number, unit: UnitSpawnTable) => {
              return points + this.getDatabase().getSpawnPointsByName(unit.unitType);
            }, 0);
      spawnFunction = () => getApp().getServerManager().spawnGroundUnits(units, coalition, country, immediate, spawnPoints, callback);
    } else if (category === "navyunit") {
      if (spawnsRestricted) {
        getApp().addInfoMessage("Navy units can be spawned during the SETUP phase only");
        return false;
      }
      spawnPoints =
        getApp().getMissionManager().getCommandModeOptions().commandMode === GAME_MASTER
          ? 0
          : units.reduce((points: number, unit: UnitSpawnTable) => {
              return points + this.getDatabase().getSpawnPointsByName(unit.unitType);
            }, 0);
      spawnFunction = () => getApp().getServerManager().spawnNavyUnits(units, coalition, country, immediate, spawnPoints, callback);
    }

    if (spawnPoints <= getApp().getMissionManager().getAvailableSpawnPoints()) {
      getApp().getMissionManager().setSpentSpawnPoints(spawnPoints);
      spawnFunction();
      return true;
    } else {
      getApp().addInfoMessage("Not enough spawn points available!");
      return false;
    }
  }

  getDatabase() {
    return this.#unitDatabase;
  }

  executeProtectionCallback() {
    this.#protectionCallback(this.getSelectedUnits());
  }

  setAWACSReference(ID) {
    this.#AWACSReference = this.#units[ID] ?? null;
    AWACSReferenceChangedEvent.dispatch(this.#AWACSReference);
  }

  getAWACSReference() {
    return this.#AWACSReference;
  }

  computeClusters(
    unitType: typeof AirUnit | typeof GroundUnit | typeof NavyUnit,
    filter: (unit: Unit) => boolean = (unit) => true,
    distance: number = 5 /* km */,
    coalition?: Coalition,
    minPoints?: number
  ) {
    let units = Object.values(this.#units)
      .filter((unit) => unit.getAlive() && unit instanceof unitType)
      .filter(filter);

    if (coalition !== undefined) {
      units = units.filter((unit) => unit.getCoalition() === coalition);
    }

    var geojson = turf.featureCollection(units.map((unit) => turf.point([unit.getPosition().lng, unit.getPosition().lat])));

    //@ts-ignore
    var clustered = turf.clustersDbscan(geojson, distance, { minPoints: minPoints ?? 1 });

    let clusters: { [key: number]: Unit[] } = {};
    clustered.features.forEach((feature, idx) => {
      if (feature.properties.cluster !== undefined) {
        if (clusters[feature.properties.cluster] === undefined) clusters[feature.properties.cluster] = [] as Unit[];
        clusters[feature.properties.cluster].push(units[idx]);
      }
    });

    return clusters;
  }

  getClusters() {
    return this.#clusters;
  }

  /***********************************************/
  #onUnitSelection(unit: Unit) {
    if (this.getSelectedUnits().length > 0) {
      /* Disable the firing of the selection event for a certain amount of time. This avoids firing many events if many units are selected */
      if (!this.#selectionEventDisabled) {
        window.setTimeout(() => {
          SelectedUnitsChangedEvent.dispatch(this.getSelectedUnits());

          let newContextActionSet = new ContextActionSet();
          this.getSelectedUnits().forEach((unit) => unit.appendContextActions(newContextActionSet));

          getApp().getMap().setContextAction(null);
          getApp().getMap().setContextActionSet(newContextActionSet);
          getApp().setState(OlympusState.UNIT_CONTROL);

          this.#selectionEventDisabled = false;
          this.#showNumberOfSelectedProtectedUnits();
        }, 100);
        this.#selectionEventDisabled = true;
      }
    } else {
      getApp().setState(OlympusState.IDLE);
      SelectionClearedEvent.dispatch();
    }
  }

  #onUnitDeselection(unit: Unit) {
    if (this.getSelectedUnits().length == 0) {
      if (getApp().getState() === OlympusState.UNIT_CONTROL) getApp().setState(OlympusState.IDLE);
      SelectionClearedEvent.dispatch();
    } else {
      /* Disable the firing of the selection event for a certain amount of time. This avoids firing many events if many units are selected */
      if (!this.#deselectionEventDisabled) {
        window.setTimeout(() => {
          SelectedUnitsChangedEvent.dispatch(this.getSelectedUnits());
          this.#deselectionEventDisabled = false;
        }, 100);
        this.#deselectionEventDisabled = true;
      }
    }
  }

  #showActionMessage(units: Unit[], message: string) {
    if (units.length == 1) getApp().addInfoMessage(`${units[0].getUnitName()} ${message}`);
    else if (units.length > 1) getApp().addInfoMessage(`${units[0].getUnitName()} and ${units.length - 1} other units ${message}`);
  }

  #showSlowDeleteDialog(units: Unit[]) {
    //let button: HTMLButtonElement | null = null;
    //const deletionTime = Math.round(units.length * DELETE_CYCLE_TIME).toString();
    ////const dialog = this.#slowDeleteDialog;
    //const element = dialog.getElement();
    //const listener = (ev: MouseEvent) => {
    //    if (ev.target instanceof HTMLButtonElement && ev.target.matches("[data-action]"))
    //        button = ev.target;
    //}
    //
    //element.querySelectorAll(".deletion-count").forEach(el => el.innerHTML = units.length.toString());
    //element.querySelectorAll(".deletion-time").forEach(el => el.innerHTML = deletionTime);
    //dialog.show();
    //
    //return new Promise((resolve) => {
    //    element.addEventListener("click", listener);
    //
    //    const interval = setInterval(() => {
    //        if (button instanceof HTMLButtonElement) {
    //            clearInterval(interval);
    //            dialog.hide();
    //            element.removeEventListener("click", listener);
    //            resolve(button.getAttribute("data-action"));
    //        }
    //    }, 250);
    //});
  }

  #showNumberOfSelectedProtectedUnits() {
    const units = this.getSelectedUnits();
    const numSelectedUnits = units.length;
    const numProtectedUnits = units.filter((unit: Unit) => !unit.isControlledByOlympus() && !unit.getHuman()).length;
    const numHumanUnits = units.filter((unit: Unit) => unit.getHuman()).length;

    if (getApp().getMap().getOptions().protectDCSUnits && numProtectedUnits === 1 && numSelectedUnits === numProtectedUnits)
      getApp().addInfoMessage(`Notice: unit is protected`);
    if (getApp().getMap().getOptions().protectDCSUnits && numProtectedUnits > 1)
      getApp().addInfoMessage(`Notice: selection contains ${numProtectedUnits} protected units.`);
    if (numHumanUnits) getApp().addInfoMessage(`Notice: selection contains ${numHumanUnits} human units.`);
  }
}

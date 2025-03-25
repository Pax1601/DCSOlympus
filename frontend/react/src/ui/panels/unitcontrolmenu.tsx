import React, { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { Menu } from "./components/menu";
import { Unit } from "../../unit/unit";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { OlRangeSlider } from "../components/olrangeslider";
import { getApp } from "../../olympusapp";
import { OlButtonGroup, OlButtonGroupItem } from "../components/olbuttongroup";
import { OlCheckbox } from "../components/olcheckbox";
import {
  ROEs,
  UnitState,
  altitudeIncrements,
  emissionsCountermeasures,
  maxAltitudeValues,
  maxSpeedValues,
  reactionsToThreat,
  speedIncrements,
} from "../../constants/constants";
import { OlToggle } from "../components/oltoggle";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import {
  olButtonsAlarmstateAuto,
  olButtonsAlarmstateGreen,
  olButtonsAlarmstateRed,
  olButtonsEmissionsAttack,
  olButtonsEmissionsDefend,
  olButtonsEmissionsFree,
  olButtonsEmissionsSilent,
  olButtonsIntensity1,
  olButtonsIntensity2,
  olButtonsIntensity3,
  olButtonsRoeDesignated,
  olButtonsRoeFree,
  olButtonsRoeHold,
  olButtonsRoeReturn,
  olButtonsScatter1,
  olButtonsScatter2,
  olButtonsScatter3,
  olButtonsThreatEvade,
  olButtonsThreatManoeuvre,
  olButtonsThreatNone,
  olButtonsThreatPassive,
  olButtonsVisibilityAircraft,
  olButtonsVisibilityDcs,
  olButtonsVisibilityGroundunit,
  olButtonsVisibilityGroundunitSam,
  olButtonsVisibilityHelicopter,
  olButtonsVisibilityHuman,
  olButtonsVisibilityNavyunit,
  olButtonsVisibilityOlympus,
} from "../components/olicons";
import { Coalition } from "../../types/types";
import { convertROE, deepCopyTable, ftToM, knotsToMs, mToFt, msToKnots, zeroAppend } from "../../other/utils";
import { FaChevronLeft, FaCog, FaExclamationCircle, FaGasPump, FaQuestionCircle, FaSignal, FaTag } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OlSearchBar } from "../components/olsearchbar";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { FaRadio, FaVolumeHigh } from "react-icons/fa6";
import { OlNumberInput } from "../components/olnumberinput";
import { AlarmState, GeneralSettings, Radio, TACAN } from "../../interfaces";
import { OlStringInput } from "../components/olstringinput";
import { OlFrequencyInput } from "../components/olfrequencyinput";
import { UnitSink } from "../../audio/unitsink";
import { AudioManagerStateChangedEvent, SelectedUnitsChangedEvent, SelectionClearedEvent, UnitsUpdatedEvent } from "../../events";
import { faCog, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { OlExpandingTooltip } from "../components/olexpandingtooltip";
import { OlLocation } from "../components/ollocation";
import { OlStateButton } from "../components/olstatebutton";

export function UnitControlMenu(props: { open: boolean; onClose: () => void }) {
  function initializeUnitsData() {
    return {
      desiredAltitude: undefined as undefined | number,
      desiredAltitudeType: undefined as undefined | string,
      desiredSpeed: undefined as undefined | number,
      desiredSpeedType: undefined as undefined | string,
      ROE: undefined as undefined | string,
      reactionToThreat: undefined as undefined | string,
      emissionsCountermeasures: undefined as undefined | string,
      scenicAAA: undefined as undefined | boolean,
      missOnPurpose: undefined as undefined | boolean,
      shotsScatter: undefined as undefined | number,
      shotsIntensity: undefined as undefined | number,
      operateAs: undefined as undefined | Coalition,
      followRoads: undefined as undefined | boolean,
      isActiveAWACS: undefined as undefined | boolean,
      isActiveTanker: undefined as undefined | boolean,
      onOff: undefined as undefined | boolean,
      isAudioSink: undefined as undefined | boolean,
      radio: undefined as undefined | Radio,
      TACAN: undefined as undefined | TACAN,
      generalSettings: undefined as undefined | GeneralSettings,
      alarmState: undefined as undefined | AlarmState,
    };
  }

  const [selectedUnits, setSelectedUnits] = useState([] as Unit[]);
  const [audioManagerState, setAudioManagerState] = useState(false);
  const [selectedUnitsData, setSelectedUnitsData] = useState(initializeUnitsData);
  const [forcedUnitsData, setForcedUnitsData] = useState(initializeUnitsData);
  const [selectionFilter, setSelectionFilter] = useState({
    control: {
      human: true,
      dcs: true,
      olympus: true,
    },
    blue: {
      aircraft: true,
      helicopter: true,
      "groundunit-sam": true,
      groundunit: true,
      navyunit: true,
    },
    neutral: {
      aircraft: true,
      helicopter: true,
      "groundunit-sam": true,
      groundunit: true,
      navyunit: true,
    },
    red: {
      aircraft: true,
      helicopter: true,
      "groundunit-sam": true,
      groundunit: true,
      navyunit: true,
    },
  });
  const [selectionID, setSelectionID] = useState(null as null | number);
  const [searchBarRefState, setSearchBarRefState] = useState(null as MutableRefObject<null> | null);
  const [filterString, setFilterString] = useState("");
  const [showRadioSettings, setShowRadioSettings] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [activeRadioSettings, setActiveRadioSettings] = useState(null as null | { radio: Radio; TACAN: TACAN });
  const [activeAdvancedSettings, setActiveAdvancedSettings] = useState(null as null | GeneralSettings);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const [showScenicModes, setShowScenicModes] = useState(false);
  const [showEngagementSettings, setShowEngagementSettings] = useState(false);
  const [barrelHeight, setBarrelHeight] = useState(0);
  const [muzzleVelocity, setMuzzleVelocity] = useState(0);
  const [aimTime, setAimTime] = useState(0);
  const [shotsToFire, setShotsToFire] = useState(0);
  const [shotsBaseInterval, setShotsBaseInterval] = useState(0);
  const [shotsBaseScatter, setShotsBaseScatter] = useState(0);
  const [engagementRange, setEngagementRange] = useState(0);
  const [targetingRange, setTargetingRange] = useState(0);
  const [aimMethodRange, setAimMethodRange] = useState(0);
  const [acquisitionRange, setAcquisitionRange] = useState(0);

  var searchBarRef = useRef(null);

  useEffect(() => {
    SelectedUnitsChangedEvent.on((units) => setSelectedUnits(units));
    SelectionClearedEvent.on(() => setSelectedUnits([]));
    AudioManagerStateChangedEvent.on((state) => setAudioManagerState(state));
    UnitsUpdatedEvent.on((units) => units.find((unit) => unit.getSelected()) && setLastUpdateTime(Date.now()));
  }, []);

  useEffect(() => {
    if (!searchBarRefState) setSearchBarRefState(searchBarRef);
    if (!props.open && selectionID !== null) setSelectionID(null);
    if (!props.open && filterString !== "") setFilterString("");
  });

  const updateData = useCallback(() => {
    const getters = {
      desiredAltitude: (unit: Unit) => Math.round(mToFt(unit.getDesiredAltitude())),
      desiredAltitudeType: (unit: Unit) => unit.getDesiredAltitudeType(),
      desiredSpeed: (unit: Unit) => Math.round(msToKnots(unit.getDesiredSpeed())),
      desiredSpeedType: (unit: Unit) => unit.getDesiredSpeedType(),
      ROE: (unit: Unit) => unit.getROE(),
      reactionToThreat: (unit: Unit) => unit.getReactionToThreat(),
      emissionsCountermeasures: (unit: Unit) => unit.getEmissionsCountermeasures(),
      scenicAAA: (unit: Unit) => unit.getState() === "scenic-aaa",
      missOnPurpose: (unit: Unit) => unit.getState() === "miss-on-purpose",
      shotsScatter: (unit: Unit) => unit.getShotsScatter(),
      shotsIntensity: (unit: Unit) => unit.getShotsIntensity(),
      operateAs: (unit: Unit) => unit.getOperateAs(),
      followRoads: (unit: Unit) => unit.getFollowRoads(),
      isActiveAWACS: (unit: Unit) => unit.getIsActiveAWACS(),
      isActiveTanker: (unit: Unit) => unit.getIsActiveTanker(),
      onOff: (unit: Unit) => unit.getOnOff(),
      radio: (unit: Unit) => unit.getRadio(),
      TACAN: (unit: Unit) => unit.getTACAN(),
      alarmState: (unit: Unit) => unit.getAlarmState(),
      generalSettings: (unit: Unit) => unit.getGeneralSettings(),
      isAudioSink: (unit: Unit) => {
        return (
          getApp()
            ?.getAudioManager()
            .getSinks()
            .filter((sink) => {
              return sink instanceof UnitSink;
            }).length > 0 &&
          getApp()
            ?.getAudioManager()
            .getSinks()
            .find((sink) => {
              return sink instanceof UnitSink && sink.getUnit() === unit;
            }) !== undefined
        );
      },
    } as { [key in keyof typeof selectedUnitsData]: (unit: Unit) => void };

    var updatedData = {};
    let anyForcedDataUpdated = false;
    Object.entries(getters).forEach(([key, getter]) => {
      let newDatum = getApp()?.getUnitsManager()?.getSelectedUnitsVariable(getter);
      if (forcedUnitsData[key] !== undefined) {
        if (newDatum === forcedUnitsData[key]) {
          anyForcedDataUpdated = true;
          forcedUnitsData[key] = undefined;
        }
        else updatedData[key] = forcedUnitsData[key];
      } else updatedData[key] = newDatum;
    });
    setSelectedUnitsData(updatedData as typeof selectedUnitsData);
    if (anyForcedDataUpdated) setForcedUnitsData({ ...forcedUnitsData });
  }, [forcedUnitsData]);
  useEffect(updateData, [selectedUnits, lastUpdateTime, forcedUnitsData]);

  useEffect(() => {
    setForcedUnitsData(initializeUnitsData);
    setShowRadioSettings(false);
    setShowAdvancedSettings(false);

    if (selectedUnits.length > 0) {
      setBarrelHeight(selectedUnits[0].getBarrelHeight());
      setMuzzleVelocity(selectedUnits[0].getMuzzleVelocity());
      setAimTime(selectedUnits[0].getAimTime());
      setShotsToFire(selectedUnits[0].getShotsToFire());
      setShotsBaseInterval(selectedUnits[0].getShotsBaseInterval());
      setShotsBaseScatter(selectedUnits[0].getShotsBaseScatter());
      setEngagementRange(selectedUnits[0].getEngagementRange());
      setTargetingRange(selectedUnits[0].getTargetingRange());
      setAimMethodRange(selectedUnits[0].getAimMethodRange());
      setAcquisitionRange(selectedUnits[0].getAcquisitionRange());
    }
  }, [selectedUnits]);

  /* Count how many units are selected of each type, divided by coalition */
  var unitOccurences: {
    blue: { [key: string]: { label: string; occurences: number } };
    red: { [key: string]: { label: string; occurences: number } };
    neutral: { [key: string]: { label: string; occurences: number } };
  } = {
    blue: {},
    red: {},
    neutral: {},
  };

  selectedUnits.forEach((unit) => {
    if (!(unit.getName() in unitOccurences[unit.getCoalition()]))
      unitOccurences[unit.getCoalition()][unit.getName()] = { occurences: 1, label: unit.getBlueprint()?.label };
    else unitOccurences[unit.getCoalition()][unit.getName()].occurences++;
  });

  const selectedCategories = getApp()?.getUnitsManager()?.getSelectedUnitsCategories() ?? [];

  const filteredUnits = Object.values(getApp()?.getUnitsManager()?.getUnits() ?? {}).filter(
    (unit) =>
      unit.getUnitName().toLowerCase().indexOf(filterString.toLowerCase()) >= 0 ||
      (unit.getBlueprint()?.label ?? "").toLowerCase()?.indexOf(filterString.toLowerCase()) >= 0
  );

  const everyUnitIsGround = selectedCategories.every((category) => {
    return category === "GroundUnit";
  });
  const everyUnitIsNavy = selectedCategories.every((category) => {
    return category === "NavyUnit";
  });
  const everyUnitIsHelicopter = selectedCategories.every((category) => {
    return category === "Helicopter";
  });

  /* Speed/altitude increments */
  const minAltitude = 0;
  const minSpeed = 0;

  let maxAltitude = maxAltitudeValues.aircraft;
  let maxSpeed = maxSpeedValues.aircraft;
  let speedStep = speedIncrements.aircraft;
  let altitudeStep = altitudeIncrements.aircraft;

  if (everyUnitIsHelicopter) {
    maxAltitude = maxAltitudeValues.helicopter;
    maxSpeed = maxSpeedValues.helicopter;
    speedStep = speedIncrements.helicopter;
    altitudeStep = altitudeIncrements.helicopter;
  } else if (everyUnitIsGround) {
    maxSpeed = maxSpeedValues.groundunit;
    speedStep = speedIncrements.groundunit;
  } else if (everyUnitIsNavy) {
    maxSpeed = maxSpeedValues.navyunit;
    speedStep = speedIncrements.navyunit;
  }

  return (
    <Menu
      open={props.open}
      title={selectedUnits.length > 0 ? `Units selected (x${selectedUnits.length})` : `No units selected`}
      onClose={props.onClose}
      autohide={true}
      wiki={() => {
        return (
          <div
            className={`
              h-full flex-col overflow-auto p-4 text-gray-400 no-scrollbar flex
              gap-2
            `}
          >
            <h2 className="mb-4 font-bold">Unit selection tool</h2>
            <div>
              The unit control menu serves two purposes. If no unit is currently selected, it allows you to select units based on their category, coalition, and
              control mode. You can also select units based on their specific type by using the search input.
            </div>
            <h2 className="my-4 font-bold">Unit control tool</h2>
            <div>
              If units are selected, the menu will display the selected units and allow you to control their altitude, speed, rules of engagement, and other
              settings.
            </div>
            <div>
              The available controls depend on what type of unit is selected. Only controls applicable to every selected unit will be displayed, so make sure to
              refine your selection.{" "}
            </div>
            <div>
              {" "}
              You will be able to inspect the current values of the controls, e.g. the desired altitude, rules of engagement and so on. However, if multiple
              units are selected, you will only see the values of controls that are set to be the same for each selected unit.
            </div>
            <div>
              {" "}
              For example, if two airplanes are selected and they both have been instructed to fly at 1000ft, you will see the altitude slider set at that
              value. But if one airplane is set to fly at 1000ft and the other at 2000ft, you will see the slider display 'Different values'.
            </div>
            <div> If at that point you move the slider, you will instruct both airplanes to fly at the same altitude.</div>
            <div>
              {" "}
              If a single unit is selected, you will also be able to see additional info on the unit, like its fuel level, position and altitude, tasking, and
              available ammunition.{" "}
            </div>
          </div>
        );
      }}
    >
      <>
        {/* ============== Selection tool START ============== */}
        {selectedUnits.length == 0 && (
          <div className="flex flex-col gap-4 p-4">
            <div className="text-lg text-bold text-gray-200">Selection tool</div>
            <div className="flex content-center gap-4">
              <div className="my-auto text-gray-400">
                <FaQuestionCircle />
              </div>
              <div className="text-sm text-gray-400">
                The selection tools allows you to select units depending on their category, coalition, and control mode. You can also select units depending on
                their specific type by using the search input.
              </div>
            </div>
            <div className="flex flex-col gap-4 rounded-lg bg-olympus-600 p-4">
              {selectionID === null && (
                <>
                  <div
                    className={`
                      text-bold border-b-2 border-b-white/10 pb-2 text-gray-400
                    `}
                  >
                    Control mode
                  </div>

                  <div className="flex flex-col justify-start gap-2">
                    {Object.entries({
                      human: ["Human", olButtonsVisibilityHuman],
                      olympus: ["Olympus controlled", olButtonsVisibilityOlympus],
                      dcs: ["From DCS mission", olButtonsVisibilityDcs],
                    }).map((entry, idx) => {
                      return (
                        <div className="flex justify-between" key={idx}>
                          <span className="font-light text-white">{entry[1][0] as string}</span>
                          <OlToggle
                            key={entry[0]}
                            onClick={() => {
                              selectionFilter["control"][entry[0]] = !selectionFilter["control"][entry[0]];
                              setSelectionFilter(deepCopyTable(selectionFilter));
                            }}
                            toggled={selectionFilter["control"][entry[0]]}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className={`
                      text-bold border-b-2 border-b-white/10 pb-2 text-gray-400
                    `}
                  >
                    Types and coalitions
                  </div>
                </>
              )}
              <table>
                <tbody>
                  {selectionID === null && (
                    <tr>
                      <td></td>
                      <td className="pb-4 text-center font-bold text-blue-500">BLUE</td>
                      <td className="pb-4 text-center font-bold text-gray-500">NEUTRAL</td>
                      <td className="pb-4 text-center font-bold text-red-500">RED</td>
                    </tr>
                  )}
                  {selectionID === null &&
                    Object.entries({
                      aircraft: [olButtonsVisibilityAircraft, "Aircrafts"],
                      helicopter: [olButtonsVisibilityHelicopter, "Helicopters"],
                      "groundunit-sam": [olButtonsVisibilityGroundunitSam, "SAMs"],
                      groundunit: [olButtonsVisibilityGroundunit, "Ground units"],
                      navyunit: [olButtonsVisibilityNavyunit, "Navy units"],
                    }).map((entry, idx) => {
                      return (
                        <tr key={idx}>
                          <td className="flex gap-2 text-lg text-gray-200">
                            <FontAwesomeIcon icon={entry[1][0] as IconDefinition} /> <div className={`
                              text-sm text-gray-400
                            `}>{entry[1][1] as string}</div>
                          </td>
                          {["blue", "neutral", "red"].map((coalition) => {
                            return (
                              <td className="text-center" key={coalition}>
                                <OlCheckbox
                                  checked={selectionFilter[coalition][entry[0]]}
                                  disabled={selectionID !== null}
                                  onChange={() => {
                                    selectionFilter[coalition][entry[0]] = !selectionFilter[coalition][entry[0]];
                                    setSelectionFilter(deepCopyTable(selectionFilter));
                                  }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  {selectionID === null && (
                    <tr>
                      <td className="text-gray-200"></td>
                      <td className="text-center">
                        <OlCheckbox
                          checked={Object.values(selectionFilter["blue"]).some((value) => value)}
                          onChange={() => {
                            const newValue = !Object.values(selectionFilter["blue"]).some((value) => value);
                            Object.keys(selectionFilter["blue"]).forEach((key) => {
                              selectionFilter["blue"][key] = newValue;
                            });
                            setSelectionFilter(deepCopyTable(selectionFilter));
                          }}
                        />
                      </td>
                      <td className="text-center">
                        <OlCheckbox
                          checked={Object.values(selectionFilter["neutral"]).some((value) => value)}
                          onChange={() => {
                            const newValue = !Object.values(selectionFilter["neutral"]).some((value) => value);
                            Object.keys(selectionFilter["neutral"]).forEach((key) => {
                              selectionFilter["neutral"][key] = newValue;
                            });
                            setSelectionFilter(deepCopyTable(selectionFilter));
                          }}
                        />
                      </td>
                      <td className="text-center">
                        <OlCheckbox
                          checked={Object.values(selectionFilter["red"]).some((value) => value)}
                          onChange={() => {
                            const newValue = !Object.values(selectionFilter["red"]).some((value) => value);
                            Object.keys(selectionFilter["red"]).forEach((key) => {
                              selectionFilter["red"][key] = newValue;
                            });
                            setSelectionFilter(deepCopyTable(selectionFilter));
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div>
                <div ref={searchBarRef}>
                  <OlSearchBar
                    onChange={(value) => {
                      setFilterString(value);
                      selectionID && setSelectionID(null);
                    }}
                    text={selectionID ? (getApp().getUnitsManager().getUnitByID(selectionID)?.getUnitName() ?? "") : filterString}
                  />
                </div>
                <OlDropdown buttonRef={searchBarRefState} open={filterString !== "" && selectionID === null}>
                  <div className="max-h-48">
                    {filterString !== "" &&
                      filteredUnits.length > 0 &&
                      filteredUnits.map((unit) => {
                        return (
                          <OlDropdownItem
                            key={unit[0]}
                            onClick={() => {
                              setSelectionID(unit.ID);
                            }}
                          >
                            <div
                              data-coalition={unit.getCoalition()}
                              className={`
                                flex content-center justify-between border-l-4
                                pl-2
                                data-[coalition='blue']:border-blue-500
                                data-[coalition='neutral']:border-gray-500
                                data-[coalition='red']:border-red-500
                              `}
                              onMouseEnter={() => {
                                unit.setHighlighted(true);
                              }}
                              onMouseLeave={() => {
                                unit.setHighlighted(false);
                              }}
                            >
                              {unit.getUnitName()} ({unit.getBlueprint()?.label ?? ""})
                            </div>
                          </OlDropdownItem>
                        );
                      })}
                    {filteredUnits.length == 0 && <span>No results</span>}
                  </div>
                </OlDropdown>
              </div>
            </div>
            <button
              type="button"
              className={`
                mb-2 me-2 rounded-lg bg-blue-700 px-5 py-2.5 text-md font-medium
                text-white
                dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
                focus:outline-none focus:ring-4 focus:ring-blue-300
                hover:bg-blue-800
              `}
              onClick={() => {
                Object.values(getApp().getUnitsManager().getUnits()).forEach((unit) => {
                  /* Check if the control type is respected, return if it is not */
                  if (unit.getHuman() && !selectionFilter["control"]["human"]) return;
                  if (unit.isControlledByOlympus() && !selectionFilter["control"]["olympus"]) return;
                  if (!unit.isControlledByDCS() && !selectionFilter["control"]["dcs"]) return;

                  /* If a specific unit is being selected select the unit */
                  if (selectionID) {
                    if (unit.ID !== selectionID) return;
                  } else {
                    if (!selectionFilter[unit.getCoalition()][unit.getMarkerCategory()]) return;
                  }

                  unit.setSelected(true);
                });
              }}
            >
              Select units
            </button>
          </div>
        )}
        {/* ============== Selection tool END ============== */}
      </>
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      <>
        {/* ============== Unit control menu START ============== */}
        {selectedUnits.length > 0 && (
          <>
            {/* ============== Units list START ============== */}
            <div
              className={`
                flex h-fit flex-col gap-0 p-0
                dark:bg-olympus-200/30
              `}
            >
              <div>
                {
                  <>
                    {["blue", "red", "neutral"].map((coalition) => {
                      return Object.keys(unitOccurences[coalition]).map((name, idx) => {
                        return (
                          <div
                            key={`coalition-${idx}`}
                            data-coalition={coalition}
                            className={`
                              flex content-center justify-between border-l-4
                              py-3 pl-4 pr-5
                              data-[coalition='blue']:border-blue-500
                              data-[coalition='neutral']:border-gray-500
                              data-[coalition='red']:border-red-500
                            `}
                          >
                            <span
                              className={`
                                my-auto font-normal
                                dark:text-white
                              `}
                            >
                              {unitOccurences[coalition][name].label}
                            </span>
                            <span
                              className={`
                                my-auto font-bold
                                dark:text-gray-500
                              `}
                            >
                              x{unitOccurences[coalition][name].occurences}
                            </span>
                          </div>
                        );
                      });
                    })}
                  </>
                }
              </div>
            </div>
            {/* ============== Units list END ============== */}
            {/* ============== Unit basic options START ============== */}
            <>
              {!showRadioSettings && !showAdvancedSettings && (
                <div className="flex flex-col gap-5 p-5">
                  {/* ============== Altitude selector START ============== */}
                  {selectedCategories.every((category) => {
                    return ["Aircraft", "Helicopter"].includes(category);
                  }) && (
                    <div>
                      <div
                        className={`
                          flex flex-row content-center items-center
                          justify-between
                        `}
                      >
                        <div className="flex flex-col">
                          <span
                            className={`
                              my-auto font-normal
                              dark:text-white
                            `}
                          >
                            Altitude
                          </span>
                          <span
                            data-flash={selectedUnitsData.desiredAltitude === undefined}
                            className={`
                              font-bold
                              dark:text-blue-500
                              data-[flash='true']:animate-pulse
                            `}
                          >
                            {selectedUnitsData.desiredAltitude !== undefined
                              ? Intl.NumberFormat("en-US").format(selectedUnitsData.desiredAltitude) + " FT"
                              : "Different values"}
                          </span>
                        </div>
                        <OlLabelToggle
                          toggled={selectedUnitsData.desiredAltitudeType === undefined ? undefined : selectedUnitsData.desiredAltitudeType === "AGL"}
                          leftLabel={"ASL"}
                          rightLabel={"AGL"}
                          onClick={() => {
                            getApp()
                              .getUnitsManager()
                              .setAltitudeType(selectedUnitsData.desiredAltitudeType === "ASL" ? "AGL" : "ASL", null, () =>
                                setForcedUnitsData({
                                  ...forcedUnitsData,
                                  desiredAltitudeType: selectedUnitsData.desiredAltitudeType === "ASL" ? "AGL" : "ASL",
                                })
                              );
                          }}
                          tooltip={() => (
                            <OlExpandingTooltip
                              title="Altitude type"
                              content="Sets wether the unit will hold the selected altitude as Above Ground Level or Above Sea Level"
                            />
                          )}
                          tooltipRelativeToParent={true}
                        />
                      </div>
                      <OlRangeSlider
                        onChange={(ev) => {
                          let value = Number(ev.target.value);
                          getApp()
                            .getUnitsManager()
                            .setAltitude(ftToM(value), null, () =>
                              setForcedUnitsData({
                                ...forcedUnitsData,
                                desiredAltitude: value,
                              })
                            );
                        }}
                        value={selectedUnitsData.desiredAltitude}
                        min={minAltitude}
                        max={maxAltitude}
                        step={altitudeStep}
                      />
                    </div>
                  )}
                  {/* ============== Altitude selector END ============== */}
                  {/* ============== Airspeed selector START ============== */}
                  <div>
                    <div
                      className={`
                        flex flex-row content-center items-center
                        justify-between
                      `}
                    >
                      <div className="flex flex-col">
                        <span
                          className={`
                            my-auto font-normal
                            dark:text-white
                          `}
                        >
                          Speed
                        </span>
                        <span
                          data-flash={selectedUnitsData.desiredSpeed === undefined}
                          className={`
                            font-bold
                            dark:text-blue-500
                            data-[flash='true']:animate-pulse
                          `}
                        >
                          {selectedUnitsData.desiredSpeed !== undefined ? selectedUnitsData.desiredSpeed + " KTS" : "Different values"}
                        </span>
                      </div>
                      {!(everyUnitIsGround || everyUnitIsNavy) && (
                        <OlLabelToggle
                          toggled={selectedUnitsData.desiredSpeedType === undefined ? undefined : selectedUnitsData.desiredSpeedType === "GS"}
                          leftLabel={"CAS"}
                          rightLabel={"GS"}
                          onClick={() => {
                            getApp()
                              .getUnitsManager()
                              .setSpeedType(selectedUnitsData.desiredSpeedType === "CAS" ? "GS" : "CAS", null, () =>
                                setForcedUnitsData({
                                  ...forcedUnitsData,
                                  desiredSpeedType: selectedUnitsData.desiredSpeedType === "CAS" ? "GS" : "CAS",
                                })
                              );
                          }}
                          tooltip={() => (
                            <OlExpandingTooltip
                              title="Airspeed type"
                              content="Sets wether the unit will hold the selected airspeed as Calibrated Air Speed or Ground Speed"
                            />
                          )}
                          tooltipRelativeToParent={true}
                        />
                      )}
                    </div>
                    <OlRangeSlider
                      onChange={(ev) => {
                        let value = Number(ev.target.value);
                        getApp()
                          .getUnitsManager()
                          .setSpeed(knotsToMs(value), null, () =>
                            setForcedUnitsData({
                              ...forcedUnitsData,
                              desiredSpeed: value,
                            })
                          );
                      }}
                      value={selectedUnitsData.desiredSpeed}
                      min={minSpeed}
                      max={maxSpeed}
                      step={speedStep}
                    />
                  </div>
                  {/* ============== Airspeed selector END ============== */}
                  {/* ============== Rules of Engagement START ============== */}
                  {!(selectedUnits.length === 1 && selectedUnits[0].isTanker()) && !(selectedUnits.length === 1 && selectedUnits[0].isAWACS()) && (
                    <div className="flex flex-col gap-2">
                      <span
                        className={`
                          my-auto font-normal
                          dark:text-white
                        `}
                      >
                        Rules of engagement
                      </span>
                      <OlButtonGroup
                        tooltip={() => (
                          <OlExpandingTooltip
                            title="Rules of engagement"
                            content={
                              <div className="flex flex-col gap-2">
                                <div>Sets the rule of engagement of the unit, in order:</div>
                                <div className="flex flex-col gap-2 px-2">
                                  <div className="flex content-center gap-2">
                                    {" "}
                                    <FontAwesomeIcon icon={olButtonsRoeHold} className={`
                                      my-auto min-w-8 text-white
                                    `} /> Hold fire: The unit will not shoot in
                                    any circumstance
                                  </div>
                                  <div className="flex content-center gap-2">
                                    {" "}
                                    <FontAwesomeIcon icon={olButtonsRoeReturn} className={`
                                      my-auto min-w-8 text-white
                                    `} /> Return fire: The unit will not fire
                                    unless fired upon
                                  </div>
                                  <div className="flex content-center gap-2">
                                    {" "}
                                    <FontAwesomeIcon icon={olButtonsRoeDesignated} className={`
                                      my-auto min-w-8 text-white
                                    `} />{" "}
                                    <div>
                                      {" "}
                                      Fire on target: The unit will not fire unless fired upon <p className={`
                                        inline font-bold
                                      `}>or</p> ordered to do so{" "}
                                    </div>
                                  </div>
                                  <div className="flex content-center gap-2">
                                    {" "}
                                    <FontAwesomeIcon icon={olButtonsRoeFree} className={`
                                      my-auto min-w-8 text-white
                                    `} /> Free: The unit will fire at any
                                    detected enemy in range
                                  </div>
                                </div>
                                <div className="flex gap-4">
                                  <div className="my-auto">
                                    <FaExclamationCircle className={`
                                      animate-bounce text-xl
                                    `} />
                                  </div>
                                  <div>
                                    Currently, DCS blue and red ground units do not respect{" "}
                                    <FontAwesomeIcon icon={olButtonsRoeReturn} className={`
                                      my-auto text-white
                                    `} /> and{" "}
                                    <FontAwesomeIcon icon={olButtonsRoeDesignated} className={`
                                      my-auto text-white
                                    `} /> rules of engagement, so be careful, they
                                    may start shooting when you don't want them to. Use neutral units for finer control.
                                  </div>
                                </div>
                              </div>
                            }
                          />
                        )}
                        tooltipRelativeToParent={true}
                      >
                        {[olButtonsRoeHold, olButtonsRoeReturn, olButtonsRoeDesignated, olButtonsRoeFree].map((icon, idx) => {
                          return (
                            <OlButtonGroupItem
                              key={idx}
                              onClick={() => {
                                getApp()
                                  .getUnitsManager()
                                  .setROE(ROEs[convertROE(idx)], null, () =>
                                    setForcedUnitsData({
                                      ...forcedUnitsData,
                                      ROE: ROEs[convertROE(idx)],
                                    })
                                  );
                              }}
                              active={selectedUnitsData.ROE === ROEs[convertROE(idx)]}
                              icon={icon}
                            />
                          );
                        })}
                      </OlButtonGroup>
                    </div>
                  )}
                  {/* ============== Rules of Engagement END ============== */}

                  {/* ============== Alarm state selector START ============== */}
                  {
                    <div className="flex flex-col gap-2">
                      <span
                        className={`
                          my-auto font-normal
                          dark:text-white
                        `}
                      >
                        Alarm State
                      </span>
                      <OlButtonGroup
                        tooltip={() => (
                          <OlExpandingTooltip
                            title="Alarm State"
                            content={
                              <div className="flex flex-col gap-2">
                                <div>Sets the alarm state of the unit, in order:</div>
                                <div className="flex flex-col gap-2 px-2">
                                  <div className="flex content-center gap-2">
                                    {" "}
                                    <FontAwesomeIcon
                                      icon={olButtonsAlarmstateGreen}
                                      className={`
                                      my-auto min-w-8 text-white
                                    `}
                                    />{" "}
                                    Green: The unit will not engage with its sensors in any circumstances. The unit will be able to move.
                                  </div>
                                  <div className="flex content-center gap-2">
                                    {" "}
                                    <FontAwesomeIcon
                                      icon={olButtonsAlarmstateAuto}
                                      className={`
                                      my-auto min-w-8 text-white
                                    `}
                                    />{" "}
                                    <div> Auto: The unit will use its sensors to engage based on its ROE.</div>
                                  </div>

                                  <div className="flex content-center gap-2">
                                    {" "}
                                    <FontAwesomeIcon
                                      icon={olButtonsAlarmstateRed}
                                      className={`
                                      my-auto min-w-8 text-white
                                    `}
                                    />{" "}
                                    Red: The unit will be actively searching for target with its sensors. For some units, this will deploy the radar and make
                                    the unit not able to move.
                                  </div>
                                </div>
                              </div>
                            }
                          />
                        )}
                        tooltipRelativeToParent={true}
                      >
                        {[olButtonsAlarmstateGreen, olButtonsAlarmstateAuto, olButtonsAlarmstateRed].map((icon, idx) => {
                          return (
                            <OlButtonGroupItem
                              key={idx}
                              onClick={() => {
                                getApp()
                                  .getUnitsManager()
                                  .setAlarmState([1, 0, 2][idx], null, () =>
                                    setForcedUnitsData({
                                      ...forcedUnitsData,
                                      alarmState: [AlarmState.GREEN, AlarmState.AUTO, AlarmState.RED][idx],
                                    })
                                  );
                              }}
                              active={selectedUnitsData.alarmState === [AlarmState.GREEN, AlarmState.AUTO, AlarmState.RED][idx]}
                              icon={icon}
                            />
                          );
                        })}
                      </OlButtonGroup>
                    </div>
                  }
                  {/* ============== Alarm state selector END ============== */}

                  {selectedCategories.every((category) => {
                    return ["Aircraft", "Helicopter"].includes(category);
                  }) && (
                    <>
                      {/* ============== Threat Reaction START ============== */}
                      <div className={`flex flex-col gap-2`}>
                        <span
                          className={`
                            my-auto font-normal
                            dark:text-white
                          `}
                        >
                          Threat reaction
                        </span>
                        <OlButtonGroup
                          tooltip={() => (
                            <OlExpandingTooltip
                              title="Reaction to threat"
                              content={
                                <div className="flex flex-col gap-2">
                                  <div>Sets the reaction to threat of the unit, in order:</div>
                                  <div className="flex flex-col gap-2 px-2">
                                    <div className="flex content-center gap-2">
                                      {" "}
                                      <FontAwesomeIcon icon={olButtonsThreatNone} className={`
                                        my-auto min-w-8 text-white
                                      `} /> No reaction: The unit will not
                                      react in any circumstance
                                    </div>
                                    <div className="flex content-center gap-2">
                                      {" "}
                                      <FontAwesomeIcon icon={olButtonsThreatPassive} className={`
                                        my-auto min-w-8 text-white
                                      `} /> Passive: The unit will use
                                      counter-measures, but will not alter its course
                                    </div>
                                    <div className="flex content-center gap-2">
                                      {" "}
                                      <FontAwesomeIcon icon={olButtonsThreatManoeuvre} className={`
                                        my-auto min-w-8 text-white
                                      `} /> Manouevre: The unit will try
                                      to evade the threat using manoeuvres, but no counter-measures
                                    </div>
                                    <div className="flex content-center gap-2">
                                      {" "}
                                      <FontAwesomeIcon icon={olButtonsThreatEvade} className={`
                                        my-auto min-w-8 text-white
                                      `} /> Full evasion: the unit will try
                                      to evade the threat both manoeuvering and using counter-measures
                                    </div>
                                  </div>
                                </div>
                              }
                            />
                          )}
                          tooltipRelativeToParent={true}
                        >
                          {[olButtonsThreatNone, olButtonsThreatPassive, olButtonsThreatManoeuvre, olButtonsThreatEvade].map((icon, idx) => {
                            return (
                              <OlButtonGroupItem
                                key={idx}
                                onClick={() => {
                                  getApp()
                                    .getUnitsManager()
                                    .setReactionToThreat(reactionsToThreat[idx], null, () =>
                                      setForcedUnitsData({
                                        ...forcedUnitsData,
                                        reactionToThreat: reactionsToThreat[idx],
                                      })
                                    );
                                }}
                                active={selectedUnitsData.reactionToThreat === reactionsToThreat[idx]}
                                icon={icon}
                              />
                            );
                          })}
                        </OlButtonGroup>
                      </div>
                      {/* ============== Threat Reaction END ============== */}
                      {/* ============== Radar and ECM START ============== */}
                      <div className="flex flex-col gap-2">
                        <span
                          className={`
                            my-auto font-normal
                            dark:text-white
                          `}
                        >
                          Radar and ECM
                        </span>
                        <OlButtonGroup
                          tooltip={() => (
                            <OlExpandingTooltip
                              title="Radar and ECM"
                              content={
                                <div className="flex flex-col gap-2">
                                  <div>Sets the units radar and Electronic Counter Measures (jamming) use policy, in order:</div>
                                  <div className="flex flex-col gap-2 px-2">
                                    <div className="flex content-center gap-2">
                                      {" "}
                                      <FontAwesomeIcon icon={olButtonsEmissionsSilent} className={`
                                        my-auto min-w-8 text-white
                                      `} /> Radio silence: No radar or
                                      ECM will be used
                                    </div>
                                    <div className="flex content-center gap-2">
                                      {" "}
                                      <FontAwesomeIcon icon={olButtonsEmissionsDefend} className={`
                                        my-auto min-w-8 text-white
                                      `} /> Defensive: The unit will turn
                                      radar and ECM on only when threatened
                                    </div>
                                    <div className="flex content-center gap-2">
                                      {" "}
                                      <FontAwesomeIcon icon={olButtonsEmissionsAttack} className={`
                                        my-auto min-w-8 text-white
                                      `} /> Attack: The unit will use
                                      radar and ECM when engaging other units
                                    </div>
                                    <div className="flex content-center gap-2">
                                      {" "}
                                      <FontAwesomeIcon icon={olButtonsEmissionsFree} className={`
                                        my-auto min-w-8 text-white
                                      `} /> Free: the unit will use the
                                      radar and ECM all the time
                                    </div>
                                  </div>
                                </div>
                              }
                            />
                          )}
                          tooltipRelativeToParent={true}
                          tooltipPosition="above"
                        >
                          {[olButtonsEmissionsSilent, olButtonsEmissionsDefend, olButtonsEmissionsAttack, olButtonsEmissionsFree].map((icon, idx) => {
                            return (
                              <OlButtonGroupItem
                                key={idx}
                                onClick={() => {
                                  getApp()
                                    .getUnitsManager()
                                    .setEmissionsCountermeasures(emissionsCountermeasures[idx], null, () =>
                                      setForcedUnitsData({
                                        ...forcedUnitsData,
                                        emissionsCountermeasures: emissionsCountermeasures[idx],
                                      })
                                    );
                                }}
                                active={selectedUnitsData.emissionsCountermeasures === emissionsCountermeasures[idx]}
                                icon={icon}
                              />
                            );
                          })}
                        </OlButtonGroup>
                      </div>
                      {/* ============== Radar and ECM END ============== */}
                    </>
                  )}
                  {/* ============== Tanker and AWACS available button START ============== */}
                  {getApp()
                    ?.getUnitsManager()
                    ?.getSelectedUnitsVariable((unit) => {
                      return unit.isTanker();
                    }) && (
                    <div className="flex content-center justify-between">
                      <span
                        className={`
                          my-auto font-normal
                          dark:text-white
                        `}
                      >
                        Make tanker available
                      </span>
                      <OlToggle
                        toggled={selectedUnitsData.isActiveTanker}
                        onClick={() => {
                          if (
                            selectedUnitsData.isActiveAWACS !== undefined &&
                            selectedUnitsData.TACAN !== undefined &&
                            selectedUnitsData.radio !== undefined &&
                            selectedUnitsData.generalSettings !== undefined
                          )
                            getApp()
                              .getUnitsManager()
                              .setAdvancedOptions(
                                !selectedUnitsData.isActiveTanker,
                                selectedUnitsData.isActiveAWACS,
                                selectedUnitsData.TACAN,
                                selectedUnitsData.radio,
                                selectedUnitsData.generalSettings,
                                null,
                                () =>
                                  setForcedUnitsData({
                                    ...forcedUnitsData,
                                    isActiveTanker: !selectedUnitsData.isActiveTanker,
                                  })
                              );
                        }}
                        tooltip={() => (
                          <OlExpandingTooltip
                            title="Make AAR tanker available"
                            content="This option allows you to make the unit available for refuelling other planes. You can keep moving the unit around while being available as tanker, however this may cause refuelling players to disconnect. If possible, try to avoid issuing commands to the unit while it is refuelling human players. Change the tanker settings to turn the tanker TACAN on or to change the frequency on which it will respond to refuelling requests."
                          />
                        )}
                        tooltipRelativeToParent={true}
                      />
                    </div>
                  )}
                  {getApp()
                    ?.getUnitsManager()
                    ?.getSelectedUnitsVariable((unit) => {
                      return unit.isAWACS();
                    }) && (
                    <div className="flex content-center justify-between">
                      <span
                        className={`
                          my-auto font-normal
                          dark:text-white
                        `}
                      >
                        Make AWACS available
                      </span>
                      <OlToggle
                        toggled={selectedUnitsData.isActiveAWACS}
                        onClick={() => {
                          if (
                            selectedUnitsData.isActiveTanker !== undefined &&
                            selectedUnitsData.TACAN !== undefined &&
                            selectedUnitsData.radio !== undefined &&
                            selectedUnitsData.generalSettings !== undefined
                          )
                            getApp()
                              .getUnitsManager()
                              .setAdvancedOptions(
                                selectedUnitsData.isActiveTanker,
                                !selectedUnitsData.isActiveAWACS,
                                selectedUnitsData.TACAN,
                                selectedUnitsData.radio,
                                selectedUnitsData.generalSettings,
                                null,
                                () =>
                                  setForcedUnitsData({
                                    ...forcedUnitsData,
                                    isActiveAWACS: !selectedUnitsData.isActiveAWACS,
                                  })
                              );
                        }}
                        tooltip={() => (
                          <OlExpandingTooltip
                            title="Make AWACS available"
                            content="This option allows you to make the unit available for AWACS task. It will provide bogey dopes and picture calls on the assigned frequency, which you can change in the AWACS settings."
                          />
                        )}
                        tooltipRelativeToParent={true}
                      />
                    </div>
                  )}
                  {/* ============== Tanker and AWACS available button END ============== */}
                  {/* ============== Radio settings buttons START ============== */}
                  {selectedUnits.length === 1 && (selectedUnits[0].isTanker() || selectedUnits[0].isAWACS()) && (
                    <div className="flex content-center justify-between">
                      <button
                        className={`
                          flex w-full justify-center gap-2 rounded-md
                          border-[1px] p-2 align-middle text-sm
                          dark:text-white
                          hover:bg-white/10
                        `}
                        onClick={() => {
                          setActiveRadioSettings({
                            radio: deepCopyTable(selectedUnits[0].getRadio()),
                            TACAN: deepCopyTable(selectedUnits[0].getTACAN()),
                          });
                          setShowRadioSettings(true);
                        }}
                      >
                        <FaCog className="my-auto" /> {selectedUnits[0].isTanker() ? "Configure tanker settings" : "Configure AWACS settings"}
                      </button>
                    </div>
                  )}
                  {/* ============== Radio settings buttons END ============== */}
                  {/* ============== Advanced settings buttons START ============== */}
                  {selectedUnits.length === 1 &&
                    !selectedUnits[0].isTanker() &&
                    !selectedUnits[0].isAWACS() &&
                    ["Aircraft", "Helicopter"].includes(selectedUnits[0].getCategory()) && (
                      <div className="flex content-center justify-between">
                        <button
                          className={`
                            flex w-full justify-center gap-2 rounded-md
                            border-[1px] p-2 align-middle text-sm
                            dark:text-white
                            hover:bg-white/10
                          `}
                          onClick={() => {
                            setActiveAdvancedSettings(selectedUnits[0].getGeneralSettings());
                            setShowAdvancedSettings(true);
                          }}
                        >
                          <FaCog className="my-auto" /> Configure advanced settings
                        </button>
                      </div>
                    )}
                  {/* ============== Advanced settings buttons END ============== */}

                  {selectedCategories.every((category) => {
                    return ["GroundUnit", "NavyUnit"].includes(category);
                  }) && (
                    <>
                      <div
                        className={`
                          flex flex-col gap-4 rounded-md bg-olympus-200/30 p-4
                        `}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between">
                            <span
                              className={`
                                my-auto font-normal
                                dark:text-white
                              `}
                            >
                              Scenic modes
                            </span>
                            <FaChevronLeft
                              data-open={showScenicModes}
                              className={`
                                my-auto cursor-pointer text-gray-200
                                transition-transform
                                data-[open='true']:-rotate-90
                              `}
                              onClick={() => setShowScenicModes(!showScenicModes)}
                            />
                          </div>
                          {showScenicModes && (
                            <div
                              className={`
                                flex flex-col gap-2 text-sm text-gray-400
                              `}
                            >
                              <div className="flex gap-4">
                                <div className="my-auto">
                                  <FaExclamationCircle className={`
                                    animate-bounce text-xl
                                  `} />
                                </div>
                                <div>
                                  Currently, DCS blue and red ground units do not respect their rules of engagement, so be careful, they may start shooting when
                                  you don't want them to. Use neutral units for finer control, then use the "Operate as" toggle to switch their "side".
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {showScenicModes && (
                          <>
                            {/* ============== Scenic AAA toggle START ============== */}
                            <div className="flex content-center justify-between">
                              <span
                                className={`
                                  my-auto font-normal
                                  dark:text-white
                                `}
                              >
                                Scenic AAA mode
                              </span>
                              <OlToggle
                                toggled={selectedUnitsData.scenicAAA}
                                onClick={() => {
                                  if (selectedUnitsData.scenicAAA) {
                                    getApp()
                                      .getUnitsManager()
                                      .stop(null, () =>
                                        setForcedUnitsData({
                                          ...forcedUnitsData,
                                          scenicAAA: false,
                                        })
                                      );
                                  } else {
                                    getApp()
                                      .getUnitsManager()
                                      .scenicAAA(null, () =>
                                        setForcedUnitsData({
                                          ...forcedUnitsData,
                                          scenicAAA: true,
                                        })
                                      );
                                  }
                                }}
                                tooltip={() => (
                                  <OlExpandingTooltip
                                    title="Enable scenic AAA mode"
                                    content="This mode will make the unit fire in the air any time an enemy unit is nearby. This can help Game Masters create a more immersive scenario without increasing its difficulty."
                                  />
                                )}
                                tooltipRelativeToParent={true}
                              />
                            </div>
                            {/* ============== Scenic AAA toggle END ============== */}
                            {/* ============== Miss on purpose toggle START ============== */}
                            <div className="flex content-center justify-between">
                              <span
                                className={`
                                  my-auto font-normal
                                  dark:text-white
                                `}
                              >
                                Miss on purpose mode
                              </span>
                              <OlToggle
                                toggled={selectedUnitsData.missOnPurpose}
                                onClick={() => {
                                  if (selectedUnitsData.missOnPurpose) {
                                    getApp()
                                      .getUnitsManager()
                                      .stop(null, () =>
                                        setForcedUnitsData({
                                          ...forcedUnitsData,
                                          missOnPurpose: false,
                                        })
                                      );
                                  } else {
                                    getApp()
                                      .getUnitsManager()
                                      .missOnPurpose(null, () =>
                                        setForcedUnitsData({
                                          ...forcedUnitsData,
                                          missOnPurpose: true,
                                        })
                                      );
                                  }
                                }}
                                tooltip={() => (
                                  <OlExpandingTooltip
                                    title="Enable scenic miss on purpose mode"
                                    content="This mode will make the unit fire in the direction of nearby enemy units, without actively aiming at them. It represents a sort of unguided firing, which can help Game Masters create a more immersive scenario without increasing its difficulty."
                                  />
                                )}
                                tooltipRelativeToParent={true}
                              />
                            </div>
                            {/* ============== Miss on purpose toggle END ============== */}
                            <div className="flex gap-4">
                              {/* ============== Shots scatter START ============== */}
                              <div className={`flex w-full justify-between gap-2`}>
                                <span
                                  className={`
                                    my-auto font-normal
                                    dark:text-white
                                  `}
                                >
                                  Shots scatter
                                </span>
                                <OlButtonGroup>
                                  {[olButtonsScatter1, olButtonsScatter2, olButtonsScatter3].map((icon, idx) => {
                                    return (
                                      <OlButtonGroupItem
                                        key={idx}
                                        onClick={() => {
                                          getApp()
                                            .getUnitsManager()
                                            .setShotsScatter(idx + 1, null, () =>
                                              setForcedUnitsData({
                                                ...forcedUnitsData,
                                                shotsScatter: idx + 1,
                                              })
                                            );
                                        }}
                                        active={selectedUnitsData.shotsScatter === idx + 1}
                                        icon={icon}
                                      />
                                    );
                                  })}
                                </OlButtonGroup>
                              </div>
                              {/* ============== Shots scatter END ============== */}
                              {/* ============== Shots intensity START ============== */}
                              {/*<div className="flex flex-col gap-2">
                                <span
                                  className={`
                                    my-auto font-normal
                                    dark:text-white
                                  `}
                                >
                                  Shots intensity
                                </span>
                                <OlButtonGroup>
                                  {[olButtonsIntensity1, olButtonsIntensity2, olButtonsIntensity3].map((icon, idx) => {
                                    return (
                                      <OlButtonGroupItem
                                        key={idx}
                                        onClick={() => {
                                          getApp()
                                            .getUnitsManager()
                                            .setShotsIntensity(idx + 1, null, () =>
                                              setForcedUnitsData({
                                                ...forcedUnitsData,
                                                shotsIntensity: idx + 1,
                                              })
                                            );
                                        }}
                                        active={selectedUnitsData.shotsIntensity === idx + 1}
                                        icon={icon}
                                      />
                                    );
                                  })}
                                </OlButtonGroup>
                              </div>
                              {/* ============== Shots intensity END ============== */}
                              {/*<OlStateButton
                                className="mt-auto"
                                checked={showEngagementSettings}
                                onClick={() => setShowEngagementSettings(!showEngagementSettings)}
                                icon={faCog}
                              ></OlStateButton>
                              */}
                            </div>
                            {/* ============== Operate as toggle START ============== */}
                            {selectedUnits.every((unit) => unit.getCoalition() === "neutral") && (
                              <div className={`
                                flex content-center justify-between
                              `}>
                                <span
                                  className={`
                                    my-auto font-normal
                                    dark:text-white
                                  `}
                                >
                                  Operate as
                                </span>
                                <OlCoalitionToggle
                                  coalition={selectedUnitsData.operateAs as Coalition}
                                  onClick={() => {
                                    getApp()
                                      .getUnitsManager()
                                      .setOperateAs(selectedUnitsData.operateAs === "blue" ? "red" : "blue", null, () =>
                                        setForcedUnitsData({
                                          ...forcedUnitsData,
                                          operateAs: selectedUnitsData.operateAs === "blue" ? "red" : "blue",
                                        })
                                      );
                                  }}
                                  tooltip={() => (
                                    <OlExpandingTooltip
                                      title="Unit operate as coalition"
                                      content="This option is only available for neutral units and it allows you to change what coalition the unit will 'operate as' when performing scenic tasks. For example, a 'red' neutral unit tasked to perform miss on purpose will shoot in the direction of blue units. "
                                    />
                                  )}
                                  tooltipRelativeToParent={true}
                                  tooltipPosition="above"
                                />
                              </div>
                            )}
                            {/* ============== Operate as toggle END ============== */}
                            {showEngagementSettings && (
                              <div
                                className={`
                                  flex flex-col gap-2 text-sm text-gray-200
                                `}
                              >
                                <div className="flex align-center gap-2">
                                  <div className={`my-auto`}>Barrel height: </div>
                                  <OlNumberInput
                                    decimalPlaces={1}
                                    className={`ml-auto`}
                                    value={barrelHeight}
                                    min={0}
                                    max={100}
                                    onChange={(ev) => {
                                      setBarrelHeight(Number(ev.target.value));
                                    }}
                                    onIncrease={() => {
                                      setBarrelHeight(barrelHeight + 0.1);
                                    }}
                                    onDecrease={() => {
                                      setBarrelHeight(barrelHeight - 0.1);
                                    }}
                                  ></OlNumberInput>
                                  <div className={`my-auto`}>m</div>
                                </div>
                                <div className="flex align-center gap-2">
                                  <div className={`my-auto`}>Muzzle velocity: </div>
                                  <OlNumberInput
                                    decimalPlaces={0}
                                    className={`ml-auto`}
                                    value={muzzleVelocity}
                                    min={0}
                                    max={10000}
                                    onChange={(ev) => {
                                      setMuzzleVelocity(Number(ev.target.value));
                                    }}
                                    onIncrease={() => {
                                      setMuzzleVelocity(muzzleVelocity + 10);
                                    }}
                                    onDecrease={() => {
                                      setMuzzleVelocity(muzzleVelocity - 10);
                                    }}
                                  ></OlNumberInput>
                                  <div className={`my-auto`}>m/s</div>
                                </div>
                                <div className="flex align-center gap-2">
                                  <div className={`my-auto`}>Aim time: </div>
                                  <OlNumberInput
                                    decimalPlaces={2}
                                    className={`ml-auto`}
                                    value={aimTime}
                                    min={0}
                                    max={100}
                                    onChange={(ev) => {
                                      setAimTime(Number(ev.target.value));
                                    }}
                                    onIncrease={() => {
                                      setAimTime(aimTime + 0.1);
                                    }}
                                    onDecrease={() => {
                                      setAimTime(aimTime - 0.1);
                                    }}
                                  ></OlNumberInput>
                                  <div className={`my-auto`}>s</div>
                                </div>
                                <div className="flex align-center gap-2">
                                  <div className={`my-auto`}>Shots to fire: </div>
                                  <OlNumberInput
                                    className={`ml-auto`}
                                    value={shotsToFire}
                                    min={0}
                                    max={100}
                                    onChange={(ev) => {
                                      setShotsToFire(Number(ev.target.value));
                                    }}
                                    onIncrease={() => {
                                      setShotsToFire(shotsToFire + 1);
                                    }}
                                    onDecrease={() => {
                                      setShotsToFire(shotsToFire - 1);
                                    }}
                                  ></OlNumberInput>
                                </div>
                                <div className="flex align-center gap-2">
                                  <div className={`my-auto`}>Shots base interval: </div>
                                  <OlNumberInput
                                    decimalPlaces={2}
                                    className={`ml-auto`}
                                    value={shotsBaseInterval}
                                    min={0}
                                    max={100}
                                    onChange={(ev) => {
                                      setShotsBaseInterval(Number(ev.target.value));
                                    }}
                                    onIncrease={() => {
                                      setShotsBaseInterval(shotsBaseInterval + 0.1);
                                    }}
                                    onDecrease={() => {
                                      setShotsBaseInterval(shotsBaseInterval - 0.1);
                                    }}
                                  ></OlNumberInput>
                                  <div className={`my-auto`}>s</div>
                                </div>
                                <div className="flex align-center gap-2">
                                  <div className={`my-auto`}>Shots base scatter: </div>
                                  <OlNumberInput
                                    decimalPlaces={2}
                                    className={`ml-auto`}
                                    value={shotsBaseScatter}
                                    min={0}
                                    max={50}
                                    onChange={(ev) => {
                                      setShotsBaseScatter(Number(ev.target.value));
                                    }}
                                    onIncrease={() => {
                                      setShotsBaseScatter(shotsBaseScatter + 0.1);
                                    }}
                                    onDecrease={() => {
                                      setShotsBaseScatter(shotsBaseScatter - 0.1);
                                    }}
                                  ></OlNumberInput>
                                  <div className={`my-auto`}>deg</div>
                                </div>
                                <div className="flex align-center gap-2">
                                  <div className={`my-auto`}>Engagement range: </div>
                                  <OlNumberInput
                                    className={`ml-auto`}
                                    value={engagementRange}
                                    min={0}
                                    max={100000}
                                    onChange={(ev) => {
                                      setEngagementRange(Number(ev.target.value));
                                    }}
                                    onIncrease={() => {
                                      setEngagementRange(engagementRange + 100);
                                    }}
                                    onDecrease={() => {
                                      setEngagementRange(engagementRange - 100);
                                    }}
                                  ></OlNumberInput>
                                  <div className={`my-auto`}>m</div>
                                </div>
                                <div className="flex align-center gap-2">
                                  <div className={`my-auto`}>Targeting range: </div>
                                  <OlNumberInput
                                    className={`ml-auto`}
                                    value={targetingRange}
                                    min={0}
                                    max={100000}
                                    onChange={(ev) => {
                                      setTargetingRange(Number(ev.target.value));
                                    }}
                                    onIncrease={() => {
                                      setTargetingRange(targetingRange + 100);
                                    }}
                                    onDecrease={() => {
                                      setTargetingRange(targetingRange - 100);
                                    }}
                                  ></OlNumberInput>
                                  <div className={`my-auto`}>m</div>
                                </div>
                                <div className="flex align-center gap-2">
                                  <div className={`my-auto`}>Aim method range: </div>
                                  <OlNumberInput
                                    className={`ml-auto`}
                                    value={aimMethodRange}
                                    min={0}
                                    max={100000}
                                    onChange={(ev) => {
                                      setAimMethodRange(Number(ev.target.value));
                                    }}
                                    onIncrease={() => {
                                      setAimMethodRange(aimMethodRange + 100);
                                    }}
                                    onDecrease={() => {
                                      setAimMethodRange(aimMethodRange - 100);
                                    }}
                                  ></OlNumberInput>
                                  <div className={`my-auto`}>m</div>
                                </div>
                                <div className="flex align-center gap-2">
                                  <div className={`my-auto`}>Acquisition range: </div>
                                  <OlNumberInput
                                    className={`ml-auto`}
                                    value={acquisitionRange}
                                    min={0}
                                    max={100000}
                                    onChange={(ev) => {
                                      setAcquisitionRange(Number(ev.target.value));
                                    }}
                                    onIncrease={() => {
                                      setAcquisitionRange(acquisitionRange + 100);
                                    }}
                                    onDecrease={() => {
                                      setAcquisitionRange(acquisitionRange - 100);
                                    }}
                                  ></OlNumberInput>
                                  <div className={`my-auto`}>m</div>
                                </div>
                                <button
                                  className={`
                                    mb-2 me-2 rounded-sm bg-blue-700 px-5 py-2.5
                                    text-md font-medium text-white
                                    dark:bg-blue-600 dark:hover:bg-blue-700
                                    dark:focus:ring-blue-800
                                    focus:outline-none focus:ring-4
                                    focus:ring-blue-300
                                    hover:bg-blue-800
                                  `}
                                  onClick={() => {
                                    getApp()
                                      .getUnitsManager()
                                      .setEngagementProperties(
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
                                      );
                                  }}
                                >
                                  Save
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {/* ============== Follow roads toggle START ============== */}
                      <div className="flex content-center justify-between">
                        <span
                          className={`
                            my-auto font-normal
                            dark:text-white
                          `}
                        >
                          Follow roads
                        </span>
                        <OlToggle
                          toggled={selectedUnitsData.followRoads}
                          onClick={() => {
                            getApp()
                              .getUnitsManager()
                              .setFollowRoads(!selectedUnitsData.followRoads, null, () =>
                                setForcedUnitsData({
                                  ...forcedUnitsData,
                                  followRoads: !selectedUnitsData.followRoads,
                                })
                              );
                          }}
                          tooltip={() => (
                            <OlExpandingTooltip
                              title="Follow roads when moving"
                              content="If enabled, this option will force the unit to stay on roads when moving to a new location. This can be useful to simulate convoys or to make the unit follow a specific path."
                            />
                          )}
                          tooltipRelativeToParent={true}
                          tooltipPosition="above"
                        />
                      </div>
                      {/* ============== Follow roads toggle END ============== */}
                      {/* ============== Unit active toggle START ============== */}
                      <div className="flex content-center justify-between">
                        <span
                          className={`
                            my-auto font-normal
                            dark:text-white
                          `}
                        >
                          Unit active
                        </span>
                        <OlToggle
                          toggled={selectedUnitsData.onOff}
                          onClick={() => {
                            getApp()
                              .getUnitsManager()
                              .setOnOff(!selectedUnitsData.onOff, null, () =>
                                setForcedUnitsData({
                                  ...forcedUnitsData,
                                  onOff: !selectedUnitsData.onOff,
                                })
                              );
                          }}
                          tooltip={() => (
                            <OlExpandingTooltip
                              title="Turn unit off"
                              content="When enabled, this option will turn the unit completely off, making it inactive. This can be useful to control when a unit starts engaging the enemy."
                            />
                          )}
                          tooltipRelativeToParent={true}
                          tooltipPosition="above"
                        />
                      </div>
                      {/* ============== Unit active toggle END ============== */}
                    </>
                  )}
                  {/* ============== Audio sink toggle START ============== */}
                  <div className="flex content-center justify-between">
                    <span
                      className={`
                        my-auto font-normal
                        dark:text-white
                      `}
                    >
                      Loudspeakers
                    </span>
                    {audioManagerState ? (
                      <OlToggle
                        toggled={selectedUnitsData.isAudioSink}
                        onClick={() => {
                          selectedUnits.forEach((unit) => {
                            if (!selectedUnitsData.isAudioSink) {
                              getApp()?.getAudioManager().addUnitSink(unit);
                              setForcedUnitsData({
                                ...forcedUnitsData,
                                isAudioSink: true,
                              });
                            } else {
                              let sink = getApp()
                                ?.getAudioManager()
                                .getSinks()
                                .find((sink) => {
                                  return sink instanceof UnitSink && sink.getUnit() === unit;
                                });
                              if (sink !== undefined) getApp()?.getAudioManager().removeSink(sink);

                              setForcedUnitsData({
                                ...forcedUnitsData,
                                isAudioSink: false,
                              });
                            }
                          });
                        }}
                        tooltip={() => (
                          <OlExpandingTooltip
                            title="Make the unit emit sounds"
                            content="This option allows the unit to emit sounds as if it had loudspeakers. Turn this on to enable the option, then open the audio menu to connect a sound source to the unit. This is useful to simulate 5MC calls on the carrier, or attach sirens to unit. "
                          />
                        )}
                        tooltipRelativeToParent={true}
                        tooltipPosition="above"
                      />
                    ) : (
                      <div className="text-white">
                        Enable audio with{" "}
                        <span
                          className={`
                            mx-1 mt-[-7px] inline-block translate-y-2
                            rounded-full border-[1px] border-white p-1
                          `}
                        >
                          <FaVolumeHigh />
                        </span>{" "}
                        first
                      </div>
                    )}
                  </div>

                  {/* ============== Audio sink toggle END ============== */}
                </div>
              )}
              {/* ============== Radio settings START ============== */}
              {showRadioSettings && (
                <div className="flex flex-col gap-2 p-4 text-white">
                  <div className="pb-4">Radio settings</div>
                  <div className="text-sm text-gray-200">Callsign</div>
                  <div className="flex content-center gap-2">
                    <OlDropdown
                      label={
                        selectedUnits[0].isAWACS()
                          ? ["Overlord", "Magic", "Wizard", "Focus", "Darkstar"][activeRadioSettings ? activeRadioSettings.radio.callsign - 1 : 0]
                          : ["Texaco", "Arco", "Shell"][activeRadioSettings ? activeRadioSettings.radio.callsign - 1 : 0]
                      }
                      className="my-auto w-full"
                    >
                      <>
                        {selectedUnits[0].isAWACS() && (
                          <>
                            {["Overlord", "Magic", "Wizard", "Focus", "Darkstar"].map((name, idx) => {
                              return (
                                <OlDropdownItem
                                  key={idx}
                                  onClick={() => {
                                    if (activeRadioSettings) activeRadioSettings.radio.callsign = idx + 1;
                                    setActiveRadioSettings(deepCopyTable(activeRadioSettings));
                                  }}
                                >
                                  {name}
                                </OlDropdownItem>
                              );
                            })}
                          </>
                        )}
                      </>
                      <>
                        {selectedUnits[0].isTanker() && (
                          <>
                            {["Texaco", "Arco", "Shell"].map((name, idx) => {
                              return (
                                <OlDropdownItem
                                  key={idx}
                                  onClick={() => {
                                    if (activeRadioSettings) activeRadioSettings.radio.callsign = idx + 1;
                                    setActiveRadioSettings(deepCopyTable(activeRadioSettings));
                                  }}
                                >
                                  {name}
                                </OlDropdownItem>
                              );
                            })}
                          </>
                        )}
                      </>
                    </OlDropdown>
                    <div className="my-auto">-</div>

                    <OlNumberInput
                      min={1}
                      max={9}
                      onChange={(e) => {
                        if (activeRadioSettings) activeRadioSettings.radio.callsignNumber = Math.max(Math.min(Number(e.target.value), 9), 1);
                        setActiveRadioSettings(deepCopyTable(activeRadioSettings));
                      }}
                      onDecrease={() => {
                        if (activeRadioSettings)
                          activeRadioSettings.radio.callsignNumber = Math.max(Math.min(Number(activeRadioSettings.radio.callsignNumber - 1), 9), 1);
                        setActiveRadioSettings(deepCopyTable(activeRadioSettings));
                      }}
                      onIncrease={() => {
                        if (activeRadioSettings)
                          activeRadioSettings.radio.callsignNumber = Math.max(Math.min(Number(activeRadioSettings.radio.callsignNumber + 1), 9), 1);
                        setActiveRadioSettings(deepCopyTable(activeRadioSettings));
                      }}
                      value={activeRadioSettings ? activeRadioSettings.radio.callsignNumber : 1}
                    ></OlNumberInput>
                  </div>
                  <div className="text-sm text-gray-200">TACAN</div>
                  <div className="flex content-center gap-2">
                    <OlNumberInput
                      min={1}
                      max={126}
                      onChange={(e) => {
                        if (activeRadioSettings) activeRadioSettings.TACAN.channel = Math.max(Math.min(Number(e.target.value), 126), 1);
                        setActiveRadioSettings(deepCopyTable(activeRadioSettings));
                      }}
                      onDecrease={() => {
                        if (activeRadioSettings) activeRadioSettings.TACAN.channel = Math.max(Math.min(Number(activeRadioSettings.TACAN.channel - 1), 126), 1);
                        setActiveRadioSettings(deepCopyTable(activeRadioSettings));
                      }}
                      onIncrease={() => {
                        if (activeRadioSettings) activeRadioSettings.TACAN.channel = Math.max(Math.min(Number(activeRadioSettings.TACAN.channel + 1), 126), 1);
                        setActiveRadioSettings(deepCopyTable(activeRadioSettings));
                      }}
                      value={activeRadioSettings ? activeRadioSettings.TACAN.channel : 1}
                    ></OlNumberInput>

                    <OlDropdown label={activeRadioSettings ? activeRadioSettings.TACAN.XY : "X"} className={`
                      my-auto w-20
                    `}>
                      <OlDropdownItem
                        key={"X"}
                        onClick={() => {
                          if (activeRadioSettings) activeRadioSettings.TACAN.XY = "X";
                          setActiveRadioSettings(deepCopyTable(activeRadioSettings));
                        }}
                      >
                        X
                      </OlDropdownItem>
                      <OlDropdownItem
                        key={"Y"}
                        onClick={() => {
                          if (activeRadioSettings) activeRadioSettings.TACAN.XY = "Y";
                          setActiveRadioSettings(deepCopyTable(activeRadioSettings));
                        }}
                      >
                        Y
                      </OlDropdownItem>
                    </OlDropdown>
                    <OlStringInput
                      value={activeRadioSettings ? activeRadioSettings.TACAN.callsign : ""}
                      className="my-auto"
                      onChange={(e) => {
                        if (activeRadioSettings) {
                          activeRadioSettings.TACAN.callsign = e.target.value;
                          if (activeRadioSettings.TACAN.callsign.length > 3)
                            activeRadioSettings.TACAN.callsign = activeRadioSettings.TACAN.callsign.slice(0, 3);
                        }
                        setActiveRadioSettings(deepCopyTable(activeRadioSettings));
                      }}
                    />
                  </div>
                  <div className="flex content-center gap-2">
                    <span className="my-auto text-sm">Enable TACAN</span>{" "}
                    <OlToggle
                      toggled={activeRadioSettings ? activeRadioSettings.TACAN.isOn : false}
                      onClick={() => {
                        if (activeRadioSettings) activeRadioSettings.TACAN.isOn = !activeRadioSettings.TACAN.isOn;
                        setActiveRadioSettings(deepCopyTable(activeRadioSettings));
                      }}
                    />
                  </div>

                  <div className="text-sm text-gray-200">Radio frequency</div>
                  <div className="flex content-center gap-2">
                    <OlFrequencyInput
                      value={activeRadioSettings ? activeRadioSettings.radio.frequency : 251000000}
                      onChange={(value) => {
                        if (activeRadioSettings) {
                          activeRadioSettings.radio.frequency = value;
                          setActiveRadioSettings(deepCopyTable(activeRadioSettings));
                        }
                      }}
                    />
                  </div>

                  <div className="flex pt-8">
                    <button
                      className={`
                        mb-2 me-2 rounded-sm bg-blue-700 px-5 py-2.5 text-md
                        font-medium text-white
                        dark:bg-blue-600 dark:hover:bg-blue-700
                        dark:focus:ring-blue-800
                        focus:outline-none focus:ring-4 focus:ring-blue-300
                        hover:bg-blue-800
                      `}
                      onClick={() => {
                        if (
                          activeRadioSettings &&
                          selectedUnitsData.isActiveTanker !== undefined &&
                          selectedUnitsData.isActiveAWACS !== undefined &&
                          selectedUnitsData.generalSettings !== undefined
                        )
                          getApp()
                            .getUnitsManager()
                            .setAdvancedOptions(
                              selectedUnitsData.isActiveTanker,
                              selectedUnitsData.isActiveAWACS,
                              activeRadioSettings.TACAN,
                              activeRadioSettings.radio,
                              selectedUnitsData.generalSettings
                            );
                        setActiveRadioSettings(null);
                        setShowRadioSettings(false);
                      }}
                    >
                      Save
                    </button>
                    <button
                      className={`
                        mb-2 me-2 rounded-sm border-[1px] border-gray-600
                        bg-blue-700 px-5 py-2.5 text-md font-medium
                        text-gray-400
                        dark:bg-transparent dark:hover:bg-gray-700
                        dark:focus:ring-blue-800
                        focus:outline-none focus:ring-4 focus:ring-blue-300
                        hover:bg-gray-800
                      `}
                      onClick={() => {
                        setActiveRadioSettings(null);
                        setShowRadioSettings(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {/* ============== Radio settings END ============== */}
              {/* ============== Advanced settings START ============== */}
              {showAdvancedSettings && (
                <div className="flex flex-col gap-2 p-4 text-white">
                  <div className="pb-4">Radio settings</div>
                  <div className="flex justify-between text-sm text-gray-200">
                    <span className="my-auto">Prohibit AA</span>
                    <OlToggle
                      onClick={() => {
                        setActiveAdvancedSettings({ ...(activeAdvancedSettings as GeneralSettings), prohibitAA: !activeAdvancedSettings?.prohibitAA });
                      }}
                      toggled={activeAdvancedSettings?.prohibitAA}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-200">
                    <span className="my-auto">Prohibit AG</span>
                    <OlToggle
                      onClick={() => {
                        setActiveAdvancedSettings({ ...(activeAdvancedSettings as GeneralSettings), prohibitAG: !activeAdvancedSettings?.prohibitAG });
                      }}
                      toggled={activeAdvancedSettings?.prohibitAG}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-200">
                    <span className="my-auto">Prohibit Jettison</span>
                    <OlToggle
                      onClick={() => {
                        setActiveAdvancedSettings({
                          ...(activeAdvancedSettings as GeneralSettings),
                          prohibitJettison: !activeAdvancedSettings?.prohibitJettison,
                        });
                      }}
                      toggled={activeAdvancedSettings?.prohibitJettison}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-200">
                    <span className="my-auto">Prohibit afterburner</span>
                    <OlToggle
                      onClick={() => {
                        setActiveAdvancedSettings({
                          ...(activeAdvancedSettings as GeneralSettings),
                          prohibitAfterburner: !activeAdvancedSettings?.prohibitAfterburner,
                        });
                      }}
                      toggled={activeAdvancedSettings?.prohibitAfterburner}
                    />
                  </div>

                  <div className="flex pt-8">
                    <button
                      className={`
                        mb-2 me-2 rounded-sm bg-blue-700 px-5 py-2.5 text-md
                        font-medium text-white
                        dark:bg-blue-600 dark:hover:bg-blue-700
                        dark:focus:ring-blue-800
                        focus:outline-none focus:ring-4 focus:ring-blue-300
                        hover:bg-blue-800
                      `}
                      onClick={() => {
                        if (
                          activeAdvancedSettings &&
                          selectedUnitsData.isActiveTanker !== undefined &&
                          selectedUnitsData.isActiveAWACS !== undefined &&
                          selectedUnitsData.TACAN !== undefined &&
                          selectedUnitsData.radio !== undefined
                        )
                          getApp()
                            .getUnitsManager()
                            .setAdvancedOptions(
                              selectedUnitsData.isActiveTanker,
                              selectedUnitsData.isActiveAWACS,
                              selectedUnitsData.TACAN,
                              selectedUnitsData.radio,
                              activeAdvancedSettings
                            );
                        setActiveAdvancedSettings(null);
                        setShowAdvancedSettings(false);
                      }}
                    >
                      Save
                    </button>
                    <button
                      className={`
                        mb-2 me-2 rounded-sm border-[1px] border-gray-600
                        bg-blue-700 px-5 py-2.5 text-md font-medium
                        text-gray-400
                        dark:bg-transparent dark:hover:bg-gray-700
                        dark:focus:ring-blue-800
                        focus:outline-none focus:ring-4 focus:ring-blue-300
                        hover:bg-gray-800
                      `}
                      onClick={() => {
                        setActiveAdvancedSettings(null);
                        setShowAdvancedSettings(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {/* ============== Advanced settings END ============== */}
            </>
            {/* ============== Unit basic options END ============== */}
            <>
              {/* ============== Fuel/payload/radio section START ============== */}
              {selectedUnits.length === 1 && (
                <div
                  className={`
                    flex flex-col gap-4 border-l-4 border-l-olympus-100
                    bg-olympus-600 p-4
                  `}
                >
                  <div
                    className={`
                      flex flex-col gap-2 border-b-2 border-b-white/10 pb-2
                    `}
                  >
                    <div className={`flex justify-between`}>
                      <div className="my-auto text-white">{selectedUnits[0].getUnitName()}</div>
                      <div
                        className={`
                          flex content-center gap-2 rounded-full
                          ${selectedUnits[0].getFuel() > 40 && `bg-green-700`}
                          ${selectedUnits[0].getFuel() > 10 && selectedUnits[0].getFuel() <= 40 && `
                            bg-yellow-700
                          `}
                          ${selectedUnits[0].getFuel() <= 10 && `bg-red-700`}
                          px-2 py-1 text-sm font-bold text-white
                        `}
                      >
                        <FaGasPump className="my-auto" />
                        {selectedUnits[0].getFuel()}%
                      </div>
                    </div>

                    <div className="my-auto text-sm text-gray-400">{selectedUnits[0].getTask()}</div>
                    {([UnitState.SIMULATE_FIRE_FIGHT, UnitState.MISS_ON_PURPOSE, UnitState.SCENIC_AAA] as string[]).includes(selectedUnits[0].getState()) && (
                      <div className="my-auto text-sm text-gray-400">
                        Time to next tasking: {zeroAppend(selectedUnits[0].getTimeToNextTasking(), 0, true, 2)}s
                      </div>
                    )}

                    <div className="flex content-center gap-2">
                      <OlLocation
                        location={selectedUnits[0].getPosition()}
                        className={`w-[280px] text-sm`}
                      />
                      <div className="my-auto text-gray-200">{Math.round(mToFt(selectedUnits[0].getPosition().alt ?? 0))} ft</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {selectedUnits[0].isControlledByOlympus() && (selectedUnits[0].isTanker() || selectedUnits[0].isAWACS()) && (
                      <>
                        {/* ============== Radio section START ============== */}
                        <div className="flex content-center justify-between">
                          <div className="flex content-center gap-2">
                            <div
                              className={`
                                mx-auto my-auto flex h-6 w-6 rounded-full
                                text-center align-middle text-xs font-bold
                                text-gray-500
                                dark:bg-[#17212D]
                              `}
                            >
                              <FaTag className="mx-auto my-auto" />
                            </div>
                            <div
                              className={`
                                my-auto overflow-hidden text-ellipsis
                                text-nowrap text-sm
                                dark:text-gray-300
                              `}
                            >
                              {`${selectedUnits[0].isTanker() ? ["Texaco", "Arco", "Shell"][selectedUnits[0].getRadio().callsign - 1] : ["Overlord", "Magic", "Wizard", "Focus", "Darkstar"][selectedUnits[0].getRadio().callsign - 1]}-${selectedUnits[0].getRadio().callsignNumber}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex content-center justify-between">
                          <div className="flex content-center gap-2">
                            <div
                              className={`
                                mx-auto my-auto flex h-6 w-6 rounded-full
                                text-center align-middle text-xs font-bold
                                text-gray-500
                                dark:bg-[#17212D]
                              `}
                            >
                              <FaRadio className="mx-auto my-auto" />
                            </div>
                            <div
                              className={`
                                my-auto overflow-hidden text-ellipsis
                                text-nowrap text-sm
                                dark:text-gray-300
                              `}
                            >
                              {`${(selectedUnits[0].getRadio().frequency / 1000000).toFixed(3)} MHz`}
                            </div>
                          </div>
                        </div>

                        <div className="flex content-center justify-between">
                          <div className="flex content-center gap-2">
                            <div
                              className={`
                                mx-auto my-auto flex h-6 w-6 rounded-full
                                text-center align-middle text-xs font-bold
                                text-gray-500
                                dark:bg-[#17212D]
                              `}
                            >
                              <FaSignal className="mx-auto my-auto" />
                            </div>
                            <div
                              className={`
                                my-auto overflow-hidden text-ellipsis
                                text-nowrap text-sm
                                dark:text-gray-300
                              `}
                            >
                              {selectedUnits[0].getTACAN().isOn
                                ? `${selectedUnits[0].getTACAN().channel}${selectedUnits[0].getTACAN().XY} ${selectedUnits[0].getTACAN().callsign}`
                                : "TACAN OFF"}
                            </div>
                          </div>
                          {/* ============== Radio section END ============== */}
                        </div>
                      </>
                    )}
                    {/* ============== Payload section START ============== */}
                    {!selectedUnits[0].isTanker() &&
                      !selectedUnits[0].isAWACS() &&
                      selectedUnits[0].getAmmo().map((ammo, idx) => {
                        return (
                          <div className="flex content-center gap-2" key={idx}>
                            <div
                              className={`
                                my-auto w-fit rounded-full px-2 py-0.5
                                text-center text-sm font-bold text-gray-500
                                dark:bg-[#17212D]
                              `}
                            >
                              {ammo.quantity}
                            </div>
                            <div
                              className={`
                                my-auto overflow-hidden text-ellipsis
                                text-nowrap text-sm
                                dark:text-gray-300
                              `}
                            >
                              {ammo.name}
                            </div>
                          </div>
                        );
                      })}

                    {/* ============== Payload section END ============== */}
                  </div>
                </div>
              )}
            </>
            {/* ============== Fuel/payload/radio section END ============== */}
          </>
        )}
        {/* ============== Unit control menu END ============== */}
      </>
    </Menu>
  );
}

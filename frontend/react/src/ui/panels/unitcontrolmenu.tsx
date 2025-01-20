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
import { convertROE, deepCopyTable, ftToM, knotsToMs, mToFt, msToKnots } from "../../other/utils";
import { FaCog, FaGasPump, FaSignal, FaTag } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OlSearchBar } from "../components/olsearchbar";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { FaRadio, FaVolumeHigh } from "react-icons/fa6";
import { OlNumberInput } from "../components/olnumberinput";
import { GeneralSettings, Radio, TACAN } from "../../interfaces";
import { OlStringInput } from "../components/olstringinput";
import { OlFrequencyInput } from "../components/olfrequencyinput";
import { UnitSink } from "../../audio/unitsink";
import { AudioManagerStateChangedEvent, SelectedUnitsChangedEvent, SelectionClearedEvent, UnitsUpdatedEvent } from "../../events";

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
        if (newDatum === updatedData[key]) {
          anyForcedDataUpdated = true;
          forcedUnitsData[key] === undefined;
        }
        updatedData[key] = forcedUnitsData[key];
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
    (unit) => unit.getUnitName().toLowerCase().indexOf(filterString.toLowerCase()) >= 0
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
      canBeHidden={true}
    >
      <>
        {/* ============== Selection tool START ============== */}
        {selectedUnits.length == 0 && (
          <div className="flex flex-col gap-4 p-4">
            <div className="text-lg text-bold text-gray-200">Selection tool</div>
            <div className="text-sm text-gray-400">
              The selection tools allows you to select units depending on their category, coalition, and control mode. You can also select units depending on
              their specific type by using the search input.
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
                      aircraft: olButtonsVisibilityAircraft,
                      helicopter: olButtonsVisibilityHelicopter,
                      "groundunit-sam": olButtonsVisibilityGroundunitSam,
                      groundunit: olButtonsVisibilityGroundunit,
                      navyunit: olButtonsVisibilityNavyunit,
                    }).map((entry, idx) => {
                      return (
                        <tr key={idx}>
                          <td className="text-lg text-gray-200">
                            <FontAwesomeIcon icon={entry[1]} />
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
                            {unit.getUnitName()}
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
                          leftLabel={"AGL"}
                          rightLabel={"ASL"}
                          onClick={() => {
                            selectedUnits.forEach((unit) => {
                              unit.setAltitudeType(selectedUnitsData.desiredAltitudeType === "ASL" ? "AGL" : "ASL");
                              setForcedUnitsData({
                                ...forcedUnitsData,
                                desiredAltitudeType: selectedUnitsData.desiredAltitudeType === "ASL" ? "AGL" : "ASL",
                              });
                            });
                          }}
                        />
                      </div>
                      <OlRangeSlider
                        onChange={(ev) => {
                          selectedUnits.forEach((unit) => {
                            unit.setAltitude(ftToM(Number(ev.target.value)));
                            setForcedUnitsData({
                              ...forcedUnitsData,
                              desiredAltitude: Number(ev.target.value),
                            });
                          });
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
                          leftLabel={"GS"}
                          rightLabel={"CAS"}
                          onClick={() => {
                            selectedUnits.forEach((unit) => {
                              unit.setSpeedType(selectedUnitsData.desiredSpeedType === "CAS" ? "GS" : "CAS");
                              setForcedUnitsData({
                                ...forcedUnitsData,
                                desiredSpeedType: selectedUnitsData.desiredSpeedType === "CAS" ? "GS" : "CAS",
                              });
                            });
                          }}
                        />
                      )}
                    </div>
                    <OlRangeSlider
                      onChange={(ev) => {
                        selectedUnits.forEach((unit) => {
                          unit.setSpeed(knotsToMs(Number(ev.target.value)));
                          setForcedUnitsData({
                            ...forcedUnitsData,
                            desiredSpeed: Number(ev.target.value),
                          });
                        });
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
                      <OlButtonGroup>
                        {[olButtonsRoeHold, olButtonsRoeReturn, olButtonsRoeDesignated, olButtonsRoeFree].map((icon, idx) => {
                          return (
                            <OlButtonGroupItem
                              key={idx}
                              onClick={() => {
                                selectedUnits.forEach((unit) => {
                                  unit.setROE(ROEs[convertROE(idx)]);
                                  setForcedUnitsData({
                                    ...forcedUnitsData,
                                    ROE: ROEs[convertROE(idx)],
                                  });
                                });
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
                        <OlButtonGroup>
                          {[olButtonsThreatNone, olButtonsThreatPassive, olButtonsThreatManoeuvre, olButtonsThreatEvade].map((icon, idx) => {
                            return (
                              <OlButtonGroupItem
                                key={idx}
                                onClick={() => {
                                  selectedUnits.forEach((unit) => {
                                    unit.setReactionToThreat(reactionsToThreat[idx]);
                                    setForcedUnitsData({
                                      ...forcedUnitsData,
                                      reactionToThreat: reactionsToThreat[idx],
                                    });
                                  });
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
                        <OlButtonGroup>
                          {[olButtonsEmissionsSilent, olButtonsEmissionsDefend, olButtonsEmissionsAttack, olButtonsEmissionsFree].map((icon, idx) => {
                            return (
                              <OlButtonGroupItem
                                key={idx}
                                onClick={() => {
                                  selectedUnits.forEach((unit) => {
                                    unit.setEmissionsCountermeasures(emissionsCountermeasures[idx]);
                                    setForcedUnitsData({
                                      ...forcedUnitsData,
                                      emissionsCountermeasures: emissionsCountermeasures[idx],
                                    });
                                  });
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
                          selectedUnits.forEach((unit) => {
                            unit.setAdvancedOptions(
                              !selectedUnitsData.isActiveTanker,
                              unit.getIsActiveAWACS(),
                              unit.getTACAN(),
                              unit.getRadio(),
                              unit.getGeneralSettings()
                            );
                            setForcedUnitsData({
                              ...forcedUnitsData,
                              isActiveTanker: !selectedUnitsData.isActiveTanker,
                            });
                          });
                        }}
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
                          selectedUnits.forEach((unit) => {
                            unit.setAdvancedOptions(
                              unit.getIsActiveTanker(),
                              !selectedUnitsData.isActiveAWACS,
                              unit.getTACAN(),
                              unit.getRadio(),
                              unit.getGeneralSettings()
                            );
                            setForcedUnitsData({
                              ...forcedUnitsData,
                              isActiveAWACS: !selectedUnitsData.isActiveAWACS,
                            });
                          });
                        }}
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
                              selectedUnits.forEach((unit) => {
                                selectedUnitsData.scenicAAA ? unit.changeSpeed("stop") : unit.scenicAAA();
                                setForcedUnitsData({
                                  ...forcedUnitsData,
                                  scenicAAA: !selectedUnitsData.scenicAAA,
                                  missOnPurpose: false,
                                });
                              });
                            }}
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
                              selectedUnits.forEach((unit) => {
                                selectedUnitsData.missOnPurpose ? unit.changeSpeed("stop") : unit.missOnPurpose();
                                setForcedUnitsData({
                                  ...forcedUnitsData,
                                  scenicAAA: false,
                                  missOnPurpose: !selectedUnitsData.missOnPurpose,
                                });
                              });
                            }}
                          />
                        </div>
                        {/* ============== Miss on purpose toggle END ============== */}
                        <div className="flex gap-4">
                          {/* ============== Shots scatter START ============== */}
                          <div className={`flex flex-col gap-2`}>
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
                                      selectedUnits.forEach((unit) => {
                                        unit.setShotsScatter(idx + 1);
                                        setForcedUnitsData({
                                          ...forcedUnitsData,
                                          shotsScatter: idx + 1,
                                        });
                                      });
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
                          <div className="flex flex-col gap-2">
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
                                      selectedUnits.forEach((unit) => {
                                        unit.setShotsIntensity(idx + 1);
                                        setForcedUnitsData({
                                          ...forcedUnitsData,
                                          shotsIntensity: idx + 1,
                                        });
                                      });
                                    }}
                                    active={selectedUnitsData.shotsIntensity === idx + 1}
                                    icon={icon}
                                  />
                                );
                              })}
                            </OlButtonGroup>
                          </div>
                          {/* ============== Shots intensity END ============== */}
                        </div>
                        {/* ============== Operate as toggle START ============== */}
                        <div className="flex content-center justify-between">
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
                              selectedUnits.forEach((unit) => {
                                unit.setOperateAs(selectedUnitsData.operateAs === "blue" ? "red" : "blue");
                                setForcedUnitsData({
                                  ...forcedUnitsData,
                                  operateAs: selectedUnitsData.operateAs === "blue" ? "red" : "blue",
                                });
                              });
                            }}
                          />
                        </div>
                        {/* ============== Operate as toggle END ============== */}
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
                            selectedUnits.forEach((unit) => {
                              unit.setFollowRoads(!selectedUnitsData.followRoads);
                              setForcedUnitsData({
                                ...forcedUnitsData,
                                followRoads: !selectedUnitsData.followRoads,
                              });
                            });
                          }}
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
                            selectedUnits.forEach((unit) => {
                              unit.setOnOff(!selectedUnitsData.onOff);
                              setForcedUnitsData({
                                ...forcedUnitsData,
                                onOff: !selectedUnitsData.onOff,
                              });
                            });
                          }}
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

                    <OlDropdown
                      label={activeRadioSettings ? activeRadioSettings.TACAN.XY : "X"}
                      className={`my-auto w-20`}
                    >
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
                    <span className="my-auto text-sm">Enabled</span>{" "}
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
                        if (activeRadioSettings)
                          selectedUnits[0].setAdvancedOptions(
                            selectedUnits[0].getIsActiveTanker(),
                            selectedUnits[0].getIsActiveAWACS(),
                            activeRadioSettings.TACAN,
                            activeRadioSettings.radio,
                            selectedUnits[0].getGeneralSettings()
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
                        if (activeAdvancedSettings)
                          selectedUnits[0].setAdvancedOptions(
                            selectedUnits[0].getIsActiveTanker(),
                            selectedUnits[0].getIsActiveAWACS(),
                            selectedUnits[0].getTACAN(),
                            selectedUnits[0].getRadio(),
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
                        setActiveRadioSettings(null);
                        setShowRadioSettings(false);
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
                  <div className="flex border-b-2 border-b-white/10 pb-2">
                    <div
                      className={`
                        flex content-center gap-2 rounded-full
                        ${selectedUnits[0].getFuel() > 40 && `bg-green-700`}
                        ${
                          selectedUnits[0].getFuel() > 10 &&
                          selectedUnits[0].getFuel() <= 40 &&
                          `bg-yellow-700`
                        }
                        ${selectedUnits[0].getFuel() <= 10 && `bg-red-700`}
                        px-2 py-1 text-sm font-bold text-white
                      `}
                    >
                      <FaGasPump className="my-auto" />
                      {selectedUnits[0].getFuel()}%
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

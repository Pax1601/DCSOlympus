import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { Menu } from "./components/menu";
import { Unit } from "../../unit/unit";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { OlRangeSlider } from "../components/olrangeslider";
import { getApp } from "../../olympusapp";
import { OlButtonGroup, OlButtonGroupItem } from "../components/olbuttongroup";
import { OlCheckbox } from "../components/olcheckbox";
import { ROEs, emissionsCountermeasures, reactionsToThreat } from "../../constants/constants";
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
import { ftToM, getUnitDatabaseByCategory, getUnitsByLabel, knotsToMs, mToFt, msToKnots } from "../../other/utils";
import { FaCog, FaGasPump, FaSignal, FaTag } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OlSearchBar } from "../components/olsearchbar";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { UnitBlueprint } from "../../interfaces";
import { FaRadio } from "react-icons/fa6";
import { OlNumberInput } from "../components/olnumberinput";
import { Radio, TACAN } from "../../interfaces";
import { OlStringInput } from "../components/olstringinput";

export function UnitControlMenu(props: { open: boolean; onClose: () => void }) {
  const [selectedUnits, setSelectedUnits] = useState([] as Unit[]);
  const [selectedUnitsData, setSelectedUnitsData] = useState({
    desiredAltitude: undefined as undefined | number,
    desiredAltitudeType: undefined as undefined | string,
    desiredSpeed: undefined as undefined | number,
    desiredSpeedType: undefined as undefined | string,
    ROE: undefined as undefined | string,
    reactionToThreat: undefined as undefined | string,
    emissionsCountermeasures: undefined as undefined | string,
    shotsScatter: undefined as undefined | number,
    shotsIntensity: undefined as undefined | number,
    operateAs: undefined as undefined | string,
    followRoads: undefined as undefined | boolean,
    isActiveAWACS: undefined as undefined | boolean,
    isActiveTanker: undefined as undefined | boolean,
    onOff: undefined as undefined | boolean,
  });
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
  const [selectionBlueprint, setSelectionBlueprint] = useState(null as null | UnitBlueprint);
  const [searchBarRefState, setSearchBarRefState] = useState(null as MutableRefObject<null> | null);
  const [filterString, setFilterString] = useState("");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [activeAdvancedSettings, setActiveAdvancedSettings] = useState(null as null | { radio: Radio; TACAN: TACAN });

  var searchBarRef = useRef(null);

  useEffect(() => {
    if (!searchBarRefState) setSearchBarRefState(searchBarRef);
    if (!props.open && selectionBlueprint !== null) setSelectionBlueprint(null);
    if (!props.open && filterString !== "") setFilterString("");
  });

  /* */
  const minAltitude = 0;
  const maxAltitude = getApp()
    ?.getUnitsManager()
    ?.getSelectedUnitsCategories()
    .every((category) => {
      return category === "Helicopter";
    })
    ? 20000
    : 60000;
  const altitudeStep = getApp()
    ?.getUnitsManager()
    ?.getSelectedUnitsCategories()
    .every((category) => {
      return category === "Helicopter";
    })
    ? 100
    : 500;
  const minSpeed = 0;
  const maxSpeed = getApp()
    ?.getUnitsManager()
    ?.getSelectedUnitsCategories()
    .every((category) => {
      return category === "Helicopter";
    })
    ? 200
    : 800;
  const speedStep = getApp()
    ?.getUnitsManager()
    ?.getSelectedUnitsCategories()
    .every((category) => {
      return category === "Helicopter";
    })
    ? 5
    : 10;

  useEffect(() => {
    /* When a unit is selected, update the data */
    document.addEventListener("unitsSelection", (ev: CustomEventInit) => {
      setSelectedUnits(ev.detail as Unit[]);
      updateData();
    });

    /* When a unit is deselected, refresh the view */
    document.addEventListener("unitDeselection", (ev: CustomEventInit) => {
      window.setTimeout(() => updateData(), 200);
    });

    /* When all units are deselected clean the view */
    document.addEventListener("clearSelection", () => {
      setSelectedUnits([]);
    });
  }, []);

  /* Update the current values of the shown data */
  function updateData() {
    const getters = {
      desiredAltitude: (unit: Unit) => {
        return Math.round(mToFt(unit.getDesiredAltitude()));
      },
      desiredAltitudeType: (unit: Unit) => {
        return unit.getDesiredAltitudeType();
      },
      desiredSpeed: (unit: Unit) => {
        return Math.round(msToKnots(unit.getDesiredSpeed()));
      },
      desiredSpeedType: (unit: Unit) => {
        return unit.getDesiredSpeedType();
      },
      ROE: (unit: Unit) => {
        return unit.getROE();
      },
      reactionToThreat: (unit: Unit) => {
        return unit.getReactionToThreat();
      },
      emissionsCountermeasures: (unit: Unit) => {
        return unit.getEmissionsCountermeasures();
      },
      shotsScatter: (unit: Unit) => {
        return unit.getShotsScatter();
      },
      shotsIntensity: (unit: Unit) => {
        return unit.getShotsIntensity();
      },
      operateAs: (unit: Unit) => {
        return unit.getOperateAs();
      },
      followRoads: (unit: Unit) => {
        return unit.getFollowRoads();
      },
      isActiveAWACS: (unit: Unit) => {
        return unit.getIsActiveAWACS();
      },
      isActiveTanker: (unit: Unit) => {
        return unit.getIsActiveTanker();
      },
      onOff: (unit: Unit) => {
        return unit.getOnOff();
      },
    } as { [key in keyof typeof selectedUnitsData]: (unit: Unit) => void };

    var updatedData = selectedUnitsData;
    Object.entries(getters).forEach(([key, getter]) => {
      updatedData[key] = getApp()?.getUnitsManager()?.getSelectedUnitsVariable(getter);
    });
    setSelectedUnitsData(updatedData);
  }

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

  const [filteredAircraft, filteredHelicopters, filteredAirDefense, filteredGroundUnits, filteredNavyUnits] = getUnitsByLabel(filterString);

  const mergedFilteredUnits = Object.assign({}, filteredAircraft, filteredHelicopters, filteredAirDefense, filteredGroundUnits, filteredNavyUnits) as {
    [key: string]: UnitBlueprint;
  };

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
                }).map((entry) => {
                  return (
                    <div className="flex justify-between">
                      <span className="font-light text-white">{entry[1][0] as string}</span>
                      <OlToggle
                        key={entry[0]}
                        onClick={() => {
                          selectionFilter["control"][entry[0]] = !selectionFilter["control"][entry[0]];
                          setSelectionFilter(JSON.parse(JSON.stringify(selectionFilter)));
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
              <table>
                <tr>
                  <td></td>
                  <td className="pb-4 text-center font-bold text-blue-500">BLUE</td>
                  <td className="pb-4 text-center font-bold text-gray-500">NEUTRAL</td>
                  <td className="pb-4 text-center font-bold text-red-500">RED</td>
                </tr>
                {selectionBlueprint === null &&
                  Object.entries({
                    aircraft: olButtonsVisibilityAircraft,
                    helicopter: olButtonsVisibilityHelicopter,
                    "groundunit-sam": olButtonsVisibilityGroundunitSam,
                    groundunit: olButtonsVisibilityGroundunit,
                    navyunit: olButtonsVisibilityNavyunit,
                  }).map((entry) => {
                    return (
                      <tr>
                        <td className="text-lg text-gray-200">
                          <FontAwesomeIcon icon={entry[1]} />
                        </td>
                        {["blue", "neutral", "red"].map((coalition) => {
                          return (
                            <td className="text-center">
                              <OlCheckbox
                                checked={selectionFilter[coalition][entry[0]]}
                                disabled={selectionBlueprint !== null}
                                onChange={() => {
                                  selectionFilter[coalition][entry[0]] = !selectionFilter[coalition][entry[0]];
                                  setSelectionFilter(JSON.parse(JSON.stringify(selectionFilter)));
                                }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
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
                        setSelectionFilter(JSON.parse(JSON.stringify(selectionFilter)));
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
                        setSelectionFilter(JSON.parse(JSON.stringify(selectionFilter)));
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
                        setSelectionFilter(JSON.parse(JSON.stringify(selectionFilter)));
                      }}
                    />
                  </td>
                </tr>
              </table>
              <div>
                <div ref={searchBarRef}>
                  <OlSearchBar
                    onChange={(value) => {
                      setFilterString(value);
                      selectionBlueprint && setSelectionBlueprint(null);
                    }}
                    text={selectionBlueprint ? selectionBlueprint.label : filterString}
                  />
                </div>
                <OlDropdown buttonRef={searchBarRefState} open={filterString !== "" && selectionBlueprint === null}>
                  <div className="max-h-48">
                    {filterString !== "" &&
                      Object.keys(mergedFilteredUnits).length > 0 &&
                      Object.entries(mergedFilteredUnits).map((entry) => {
                        const blueprint = entry[1];
                        return (
                          <OlDropdownItem
                            key={entry[0]}
                            onClick={() => {
                              setSelectionBlueprint(blueprint);
                            }}
                          >
                            {blueprint.label}
                          </OlDropdownItem>
                        );
                      })}
                    {Object.keys(mergedFilteredUnits).length == 0 && <span>No results</span>}
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

                  /* If a specific unit is being selected check that the label is correct, otherwise check if the unit type is active for the coalition */
                  if (selectionBlueprint) {
                    if (unit.getBlueprint()?.label === undefined || unit.getBlueprint()?.label !== selectionBlueprint.label) return;

                    /* This is a trick to easily reuse the same checkboxes used to globally enable unit types for a coalition,
                      since those checkboxes are checked if at least one type is selected for a specific coalition.
                      */
                    if (!Object.values(selectionFilter[unit.getCoalition()]).some((value) => value)) return;
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
                      return Object.keys(unitOccurences[coalition]).map((name) => {
                        return (
                          <div
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
              {!showAdvancedSettings && (
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
                              font-normal
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
                              setSelectedUnitsData({
                                ...selectedUnitsData,
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
                            setSelectedUnitsData({
                              ...selectedUnitsData,
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
                            font-normal
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
                      <OlLabelToggle
                        toggled={selectedUnitsData.desiredSpeedType === undefined ? undefined : selectedUnitsData.desiredSpeedType === "GS"}
                        leftLabel={"GS"}
                        rightLabel={"CAS"}
                        onClick={() => {
                          selectedUnits.forEach((unit) => {
                            unit.setSpeedType(selectedUnitsData.desiredSpeedType === "CAS" ? "GS" : "CAS");
                            setSelectedUnitsData({
                              ...selectedUnitsData,
                              desiredSpeedType: selectedUnitsData.desiredSpeedType === "CAS" ? "GS" : "CAS",
                            });
                          });
                        }}
                      />
                    </div>
                    <OlRangeSlider
                      onChange={(ev) => {
                        selectedUnits.forEach((unit) => {
                          unit.setSpeed(knotsToMs(Number(ev.target.value)));
                          setSelectedUnitsData({
                            ...selectedUnitsData,
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
                          font-normal
                          dark:text-white
                        `}
                      >
                        Rules of engagement
                      </span>
                      <OlButtonGroup>
                        {[olButtonsRoeHold, olButtonsRoeReturn, olButtonsRoeDesignated, olButtonsRoeFree].map((icon, idx) => {
                          return (
                            <OlButtonGroupItem
                              onClick={() => {
                                selectedUnits.forEach((unit) => {
                                  unit.setROE(ROEs[idx]);
                                  setSelectedUnitsData({
                                    ...selectedUnitsData,
                                    ROE: ROEs[idx],
                                  });
                                });
                              }}
                              active={selectedUnitsData.ROE === ROEs[idx]}
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
                            font-normal
                            dark:text-white
                          `}
                        >
                          Threat reaction
                        </span>
                        <OlButtonGroup>
                          {[olButtonsThreatNone, olButtonsThreatPassive, olButtonsThreatManoeuvre, olButtonsThreatEvade].map((icon, idx) => {
                            return (
                              <OlButtonGroupItem
                                onClick={() => {
                                  selectedUnits.forEach((unit) => {
                                    unit.setReactionToThreat(reactionsToThreat[idx]);
                                    setSelectedUnitsData({
                                      ...selectedUnitsData,
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
                            font-normal
                            dark:text-white
                          `}
                        >
                          Radar and ECM
                        </span>
                        <OlButtonGroup>
                          {[olButtonsEmissionsSilent, olButtonsEmissionsDefend, olButtonsEmissionsAttack, olButtonsEmissionsFree].map((icon, idx) => {
                            return (
                              <OlButtonGroupItem
                                onClick={() => {
                                  selectedUnits.forEach((unit) => {
                                    unit.setEmissionsCountermeasures(emissionsCountermeasures[idx]);
                                    setSelectedUnitsData({
                                      ...selectedUnitsData,
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
                          font-normal
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
                            setSelectedUnitsData({
                              ...selectedUnitsData,
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
                          font-normal
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
                            setSelectedUnitsData({
                              ...selectedUnitsData,
                              isActiveAWACS: !selectedUnitsData.isActiveAWACS,
                            });
                          });
                        }}
                      />
                    </div>
                  )}
                  {/* ============== Tanker and AWACS available button END ============== */}
                  {/* ============== Advanced settings buttons START ============== */}
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
                          setActiveAdvancedSettings({
                            radio: JSON.parse(JSON.stringify(selectedUnits[0].getRadio())),
                            TACAN: JSON.parse(JSON.stringify(selectedUnits[0].getTACAN())),
                          });
                          setShowAdvancedSettings(true);
                        }}
                      >
                        <FaCog className="my-auto" /> {selectedUnits[0].isTanker() ? "Configure tanker settings" : "Configure AWACS settings"}
                      </button>
                    </div>
                  )}
                  {/* ============== Advanced settings buttons END ============== */}

                  {selectedCategories.every((category) => {
                    return ["GroundUnit", "NavyUnit"].includes(category);
                  }) && (
                    <>
                      {/* ============== Shots scatter START ============== */}
                      <div className={`flex flex-col gap-2`}>
                        <span
                          className={`
                            font-normal
                            dark:text-white
                          `}
                        >
                          Shots scatter
                        </span>
                        <OlButtonGroup>
                          {[olButtonsScatter1, olButtonsScatter2, olButtonsScatter3].map((icon, idx) => {
                            return (
                              <OlButtonGroupItem
                                onClick={() => {
                                  selectedUnits.forEach((unit) => {
                                    unit.setShotsScatter(idx + 1);
                                    setSelectedUnitsData({
                                      ...selectedUnitsData,
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
                            font-normal
                            dark:text-white
                          `}
                        >
                          Shots intensity
                        </span>
                        <OlButtonGroup>
                          {[olButtonsIntensity1, olButtonsIntensity2, olButtonsIntensity3].map((icon, idx) => {
                            return (
                              <OlButtonGroupItem
                                onClick={() => {
                                  selectedUnits.forEach((unit) => {
                                    unit.setShotsIntensity(idx + 1);
                                    setSelectedUnitsData({
                                      ...selectedUnitsData,
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
                      {/* ============== Operate as toggle START ============== */}
                      <div className="flex content-center justify-between">
                        <span
                          className={`
                            font-normal
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
                              setSelectedUnitsData({
                                ...selectedUnitsData,
                                operateAs: selectedUnitsData.operateAs === "blue" ? "red" : "blue",
                              });
                            });
                          }}
                        />
                      </div>
                      {/* ============== Operate as toggle END ============== */}
                      {/* ============== Follow roads toggle START ============== */}
                      <div className="flex content-center justify-between">
                        <span
                          className={`
                            font-normal
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
                              setSelectedUnitsData({
                                ...selectedUnitsData,
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
                            font-normal
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
                              setSelectedUnitsData({
                                ...selectedUnitsData,
                                onOff: !selectedUnitsData.onOff,
                              });
                            });
                          }}
                        />
                      </div>

                      {/* ============== Unit active toggle END ============== */}
                    </>
                  )}
                </div>
              )}
              {/* ============== Advanced settings START ============== */}
              {showAdvancedSettings && (
                <div className="flex flex-col gap-2 p-4 text-white">
                  <div className="pb-4">Advanced settings</div>
                  <div className="text-sm text-gray-200">Callsign</div>
                  <div className="flex content-center gap-2">
                    <OlDropdown
                      label={
                        selectedUnits[0].isAWACS()
                          ? ["Overlord", "Magic", "Wizard", "Focus", "Darkstar"][activeAdvancedSettings ? activeAdvancedSettings.radio.callsign - 1 : 0]
                          : ["Texaco", "Arco", "Shell"][activeAdvancedSettings ? activeAdvancedSettings.radio.callsign - 1 : 0]
                      }
                      className="my-auto w-full"
                    >
                      <>
                        {selectedUnits[0].isAWACS() && (
                          <>
                            {["Overlord", "Magic", "Wizard", "Focus", "Darkstar"].map((name, idx) => {
                              return (
                                <OlDropdownItem
                                  onClick={() => {
                                    if (activeAdvancedSettings) activeAdvancedSettings.radio.callsign = idx + 1;
                                    setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
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
                                  onClick={() => {
                                    if (activeAdvancedSettings) activeAdvancedSettings.radio.callsign = idx + 1;
                                    setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
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
                        if (activeAdvancedSettings) activeAdvancedSettings.radio.callsignNumber = Math.max(Math.min(Number(e.target.value), 9), 1);
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                      onDecrease={() => {
                        if (activeAdvancedSettings)
                          activeAdvancedSettings.radio.callsignNumber = Math.max(Math.min(Number(activeAdvancedSettings.radio.callsignNumber - 1), 9), 1);
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                      onIncrease={() => {
                        if (activeAdvancedSettings)
                          activeAdvancedSettings.radio.callsignNumber = Math.max(Math.min(Number(activeAdvancedSettings.radio.callsignNumber + 1), 9), 1);
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                      value={activeAdvancedSettings ? activeAdvancedSettings.radio.callsignNumber : 1}
                    ></OlNumberInput>
                  </div>
                  <div className="text-sm text-gray-200">TACAN</div>
                  <div className="flex content-center gap-2">
                    <OlNumberInput
                      min={1}
                      max={126}
                      onChange={(e) => {
                        if (activeAdvancedSettings) activeAdvancedSettings.TACAN.channel = Math.max(Math.min(Number(e.target.value), 126), 1);
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                      onDecrease={() => {
                        if (activeAdvancedSettings)
                          activeAdvancedSettings.TACAN.channel = Math.max(Math.min(Number(activeAdvancedSettings.TACAN.channel - 1), 126), 1);
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                      onIncrease={() => {
                        if (activeAdvancedSettings)
                          activeAdvancedSettings.TACAN.channel = Math.max(Math.min(Number(activeAdvancedSettings.TACAN.channel + 1), 126), 1);
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                      value={activeAdvancedSettings ? activeAdvancedSettings.TACAN.channel : 1}
                    ></OlNumberInput>

                    <OlDropdown label={activeAdvancedSettings ? activeAdvancedSettings.TACAN.XY : "X"} className={`
                      my-auto w-20
                    `}>
                      <OlDropdownItem
                        onClick={() => {
                          if (activeAdvancedSettings) activeAdvancedSettings.TACAN.XY = "X";
                          setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                        }}
                      >
                        X
                      </OlDropdownItem>
                      <OlDropdownItem
                        onClick={() => {
                          if (activeAdvancedSettings) activeAdvancedSettings.TACAN.XY = "Y";
                          setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                        }}
                      >
                        Y
                      </OlDropdownItem>
                    </OlDropdown>
                    <OlStringInput
                      value={activeAdvancedSettings ? activeAdvancedSettings.TACAN.callsign : ""}
                      className="my-auto"
                      onChange={(e) => {
                        if (activeAdvancedSettings) {
                          activeAdvancedSettings.TACAN.callsign = e.target.value;
                          if (activeAdvancedSettings.TACAN.callsign.length > 3)
                            activeAdvancedSettings.TACAN.callsign = activeAdvancedSettings.TACAN.callsign.slice(0, 3);
                        }
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                    />
                  </div>
                  <div className="flex content-center gap-2">
                    <span className="my-auto text-sm">Enabled</span>{" "}
                    <OlToggle
                      toggled={activeAdvancedSettings ? activeAdvancedSettings.TACAN.isOn : false}
                      onClick={() => {
                        if (activeAdvancedSettings) activeAdvancedSettings.TACAN.isOn = !activeAdvancedSettings.TACAN.isOn;
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                    />
                  </div>

                  <div className="text-sm text-gray-200">Radio frequency</div>
                  <div className="flex content-center gap-2">
                    <OlNumberInput
                      min={1}
                      max={400}
                      onChange={(e) => {
                        let newValue = Math.max(Math.min(Number(e.target.value), 400), 1) * 1000000;
                        if (activeAdvancedSettings) {
                          let decimalPart = activeAdvancedSettings.radio.frequency - Math.floor(activeAdvancedSettings.radio.frequency / 1000000) * 1000000;
                          activeAdvancedSettings.radio.frequency = newValue + decimalPart;
                        }
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                      onDecrease={() => {
                        if (activeAdvancedSettings)
                          activeAdvancedSettings.radio.frequency = Math.max(
                            Math.min(Number(activeAdvancedSettings.radio.frequency - 1000000), 400000000),
                            1000000
                          );
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                      onIncrease={() => {
                        if (activeAdvancedSettings)
                          activeAdvancedSettings.radio.frequency = Math.max(
                            Math.min(Number(activeAdvancedSettings.radio.frequency + 1000000), 400000000),
                            1000000
                          );
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                      value={activeAdvancedSettings ? Math.floor(activeAdvancedSettings.radio.frequency / 1000000) : 124}
                    ></OlNumberInput>
                    <div className="my-auto">.</div>
                    <OlNumberInput
                      min={0}
                      max={990}
                      minLength={3}
                      onChange={(e) => {
                        let newValue = Math.max(Math.min(Number(e.target.value), 990), 0) * 1000;
                        if (activeAdvancedSettings) {
                          let integerPart = Math.floor(activeAdvancedSettings.radio.frequency / 1000000) * 1000000;
                          activeAdvancedSettings.radio.frequency = newValue + integerPart;
                        }
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                      onDecrease={() => {
                        if (activeAdvancedSettings)
                          activeAdvancedSettings.radio.frequency = Math.max(
                            Math.min(Number(activeAdvancedSettings.radio.frequency - 25000), 400000000),
                            1000000
                          );
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                      onIncrease={() => {
                        if (activeAdvancedSettings)
                          activeAdvancedSettings.radio.frequency = Math.max(
                            Math.min(Number(activeAdvancedSettings.radio.frequency + 25000), 400000000),
                            1000000
                          );
                        setActiveAdvancedSettings(JSON.parse(JSON.stringify(activeAdvancedSettings)));
                      }}
                      value={
                        activeAdvancedSettings
                          ? (activeAdvancedSettings.radio.frequency - Math.floor(activeAdvancedSettings.radio.frequency / 1000000) * 1000000) / 1000
                          : 0
                      }
                    ></OlNumberInput>
                    <div className="my-auto">MHz</div>
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
                            activeAdvancedSettings.TACAN,
                            activeAdvancedSettings.radio,
                            selectedUnits[0].getGeneralSettings()
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
                  <div className="flex border-b-2 border-b-white/10 pb-2">
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
                      selectedUnits[0].getAmmo().map((ammo) => {
                        return (
                          <div className="flex content-center gap-2">
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

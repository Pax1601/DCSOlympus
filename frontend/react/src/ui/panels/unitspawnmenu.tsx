import React, { useState, useEffect, useCallback } from "react";
import { OlUnitSummary } from "../components/olunitsummary";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { OlNumberInput } from "../components/olnumberinput";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { OlRangeSlider } from "../components/olrangeslider";
import { OlDropdownItem, OlDropdown } from "../components/oldropdown";
import { LoadoutBlueprint, SpawnRequestTable, UnitBlueprint } from "../../interfaces";
import { OlStateButton } from "../components/olstatebutton";
import { Coalition } from "../../types/types";
import { getApp } from "../../olympusapp";
import { ftToM, hash } from "../../other/utils";
import { LatLng } from "leaflet";
import { Airbase } from "../../mission/airbase";
import { altitudeIncrements, groupUnitCount, maxAltitudeValues, minAltitudeValues, OlympusState, SpawnSubState } from "../../constants/constants";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { OlStringInput } from "../components/olstringinput";
import { countryCodes } from "../data/codes";
import { OlAccordion } from "../components/olaccordion";
import { AppStateChangedEvent } from "../../events";

export function UnitSpawnMenu(props: {
  starredSpawns: { [key: string]: SpawnRequestTable };
  blueprint: UnitBlueprint;
  airbase?: Airbase | null;
  coalition?: Coalition;
}) {
  /* Compute the min and max values depending on the unit type */
  const minNumber = 1;
  const maxNumber = groupUnitCount[props.blueprint.category];
  const minAltitude = minAltitudeValues[props.blueprint.category];
  const maxAltitude = maxAltitudeValues[props.blueprint.category];
  const altitudeStep = altitudeIncrements[props.blueprint.category];

  /* State initialization */
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [spawnCoalition, setSpawnCoalition] = useState("blue" as Coalition);
  const [spawnNumber, setSpawnNumber] = useState(1);
  const [spawnRole, setSpawnRole] = useState("");
  const [spawnLoadoutName, setSpawnLoadout] = useState("");
  const [spawnAltitude, setSpawnAltitude] = useState((maxAltitude - minAltitude) / 2);
  const [spawnAltitudeType, setSpawnAltitudeType] = useState(false);
  const [spawnLiveryID, setSpawnLiveryID] = useState("");
  const [spawnSkill, setSpawnSkill] = useState("High");
  const [showLoadout, setShowLoadout] = useState(false);

  const [quickAccessName, setQuickAccessName] = useState("No name");
  const [key, setKey] = useState("");
  const [spawnRequestTable, setSpawnRequestTable] = useState(null as null | SpawnRequestTable);

  useEffect(() => {
    setAppState(getApp()?.getState())
    AppStateChangedEvent.on((state, subState) => setAppState(state));
  }, []);

  /* When the menu is opened show the unit preview on the map as a cursor */
  const setSpawnRequestTableCallback = useCallback(() => {
    if (!props.airbase && spawnRequestTable && appState === OlympusState.SPAWN) {
      /* Refresh the unique key identified */
      const newKey = hash(JSON.stringify(spawnRequestTable));
      setKey(newKey);

      getApp()?.getMap()?.setSpawnRequestTable(spawnRequestTable);
      getApp().setState(OlympusState.SPAWN, SpawnSubState.SPAWN_UNIT);
    }
  }, [spawnRequestTable, appState]);

  useEffect(setSpawnRequestTableCallback, [spawnRequestTable]);

  /* Callback and effect to update the quick access name of the starredSpawn */
  const updateStarredSpawnQuickAccessNameS = useCallback(() => {
    if (key in props.starredSpawns) props.starredSpawns[key].quickAccessName = quickAccessName;
  }, [props.starredSpawns, key, quickAccessName]);
  useEffect(updateStarredSpawnQuickAccessNameS, [quickAccessName]);

  /* Callback and effect to update the quick access name in the input field */
  const updateQuickAccessName = useCallback(() => {
    if (!props.airbase) {
      /* If the spawn is starred, set the quick access name */
      if (key in props.starredSpawns && props.starredSpawns[key].quickAccessName) setQuickAccessName(props.starredSpawns[key].quickAccessName);
      else setQuickAccessName("No name");
    }
  }, [props.starredSpawns, key]);
  useEffect(updateQuickAccessName, [key]);

  /* Callback and effect to update the spawn request table */
  const updateSpawnRequestTable = useCallback(() => {
    if (props.blueprint !== null) {
      setSpawnRequestTable({
        category: props.blueprint.category,
        unit: {
          unitType: props.blueprint.name,
          location: new LatLng(0, 0), // This will be filled when the user clicks on the map to spawn the unit
          skill: spawnSkill,
          liveryID: spawnLiveryID,
          altitude: ftToM(spawnAltitude),
          loadout: props.blueprint.loadouts?.find((loadout) => loadout.name === spawnLoadoutName)?.code ?? "",
        },
        amount: spawnNumber,
        coalition: spawnCoalition,
      });
    }
  }, [props.blueprint, spawnAltitude, spawnLoadoutName, spawnCoalition, spawnNumber, spawnLiveryID, spawnSkill]);
  useEffect(updateSpawnRequestTable, [props.blueprint, spawnAltitude, spawnLoadoutName, spawnCoalition, spawnNumber, spawnLiveryID, spawnSkill]);

  /* Effect to update the coalition if it is force externally */
  useEffect(() => {
    if (props.coalition) setSpawnCoalition(props.coalition);
  }, [props.coalition]);

  /* Get a list of all the roles */
  const roles: string[] = [];
  (props.blueprint as UnitBlueprint).loadouts?.forEach((loadout) => {
    loadout.roles.forEach((role) => {
      !roles.includes(role) && roles.push(role);
    });
  });

  /* Initialize the role */
  spawnRole === "" && roles.length > 0 && setSpawnRole(roles[0]);

  /* Get a list of all the loadouts */
  const loadouts: LoadoutBlueprint[] = [];
  (props.blueprint as UnitBlueprint).loadouts?.forEach((loadout) => {
    loadout.roles.includes(spawnRole) && loadouts.push(loadout);
  });

  /* Initialize the loadout */
  spawnLoadoutName === "" && loadouts.length > 0 && setSpawnLoadout(loadouts[0].name);
  const spawnLoadout = props.blueprint.loadouts?.find((loadout) => {
    return loadout.name === spawnLoadoutName;
  });

  return (
    <div className="flex flex-col">
      <OlUnitSummary blueprint={props.blueprint} coalition={spawnCoalition} />
      <div className="flex h-fit flex-col gap-5 px-5 pb-8 pt-6">
        <div
          className={`
            inline-flex w-full flex-row content-center justify-between gap-2
          `}
        >
          <div className="my-auto text-sm text-white">Quick access: </div>
          <OlStringInput
            onChange={(e) => {
              setQuickAccessName(e.target.value);
            }}
            value={quickAccessName}
          />
          <OlStateButton
            onClick={() => {
              if (spawnRequestTable)
                key in props.starredSpawns
                  ? getApp().getMap().removeStarredSpawnRequestTable(key)
                  : getApp().getMap().addStarredSpawnRequestTable(key, spawnRequestTable);
            }}
            tooltip="Save this spawn for quick access"
            checked={key in props.starredSpawns}
            icon={faStar}
          ></OlStateButton>
        </div>
        <div
          className={`
            inline-flex w-full flex-row content-center justify-between gap-2
          `}
        >
          {!props.coalition && (
            <OlCoalitionToggle
              coalition={spawnCoalition}
              onClick={() => {
                spawnCoalition === "blue" && setSpawnCoalition("neutral");
                spawnCoalition === "neutral" && setSpawnCoalition("red");
                spawnCoalition === "red" && setSpawnCoalition("blue");
              }}
            />
          )}
          <OlNumberInput
            className={"ml-auto"}
            value={spawnNumber}
            min={minNumber}
            max={maxNumber}
            onDecrease={() => {
              setSpawnNumber(Math.max(minNumber, spawnNumber - 1));
            }}
            onIncrease={() => {
              setSpawnNumber(Math.min(maxNumber, spawnNumber + 1));
            }}
            onChange={(ev) => {
              !isNaN(Number(ev.target.value)) && setSpawnNumber(Math.max(minNumber, Math.min(maxNumber, Number(ev.target.value))));
            }}
          />
        </div>

        {["aircraft", "helicopter"].includes(props.blueprint.category) && (
          <>
            {!props.airbase && (
              <div>
                <div
                  className={`
                    flex flex-row content-center items-center justify-between
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
                      className={`
                        font-bold
                        dark:text-blue-500
                      `}
                    >{`${Intl.NumberFormat("en-US").format(spawnAltitude)} FT`}</span>
                  </div>
                  <OlLabelToggle toggled={spawnAltitudeType} leftLabel={"AGL"} rightLabel={"ASL"} onClick={() => setSpawnAltitudeType(!spawnAltitudeType)} />
                </div>
                <OlRangeSlider
                  onChange={(ev) => setSpawnAltitude(Number(ev.target.value))}
                  value={spawnAltitude}
                  min={minAltitude}
                  max={maxAltitude}
                  step={altitudeStep}
                />
              </div>
            )}
            <div className="flex content-center justify-between gap-2">
              <span
                className={`
                  my-auto font-normal
                  dark:text-white
                `}
              >
                Role
              </span>
              <OlDropdown label={spawnRole} className="w-64">
                {roles.map((role) => {
                  return (
                    <OlDropdownItem
                      key={role}
                      onClick={() => {
                        setSpawnRole(role);
                        setSpawnLoadout("");
                      }}
                      className={`w-full`}
                    >
                      {role}
                    </OlDropdownItem>
                  );
                })}
              </OlDropdown>
            </div>
            <div className="flex content-center justify-between gap-2">
              <span
                className={`
                  my-auto font-normal
                  dark:text-white
                `}
              >
                Weapons
              </span>
              <OlDropdown label={spawnLoadoutName} className={`w-64`}>
                {loadouts.map((loadout) => {
                  return (
                    <OlDropdownItem
                      key={loadout.name}
                      onClick={() => {
                        setSpawnLoadout(loadout.name);
                      }}
                      className={`w-full`}
                    >
                      <span
                        className={`
                          w-full overflow-hidden text-ellipsis text-nowrap
                          text-left w-max-full
                        `}
                      >
                        {loadout.name}
                      </span>
                    </OlDropdownItem>
                  );
                })}
              </OlDropdown>
            </div>
          </>
        )}
        <div className="flex content-center justify-between gap-2">
          <span
            className={`
              my-auto font-normal
              dark:text-white
            `}
          >
            Livery
          </span>
          <OlDropdown label={props.blueprint.liveries ? (props.blueprint.liveries[spawnLiveryID]?.name ?? "Default") : "No livery"} className={`
            w-64
          `}>
            {props.blueprint.liveries &&
              Object.keys(props.blueprint.liveries)
                .sort((ida, idb) => {
                  if (props.blueprint.liveries) {
                    if (props.blueprint.liveries[ida].countries.length > 1) return 1;
                    return props.blueprint.liveries[ida].countries[0] > props.blueprint.liveries[idb].countries[0] ? 1 : -1;
                  } else return -1;
                })
                .map((id) => {
                  let country = Object.values(countryCodes).find((countryCode) => {
                    if (props.blueprint.liveries && countryCode.liveryCodes?.includes(props.blueprint.liveries[id].countries[0])) return true;
                  });
                  return (
                    <OlDropdownItem
                      key={id}
                      onClick={() => {
                        setSpawnLiveryID(id);
                      }}
                      className={`w-full`}
                    >
                      <span
                        className={`
                          w-full content-center overflow-hidden text-ellipsis
                          text-nowrap text-left w-max-full flex gap-2
                        `}
                      >
                        {props.blueprint.liveries && props.blueprint.liveries[id].countries.length == 1 && (
                          <img
                            src={`images/countries/${country?.flagCode.toLowerCase()}.svg`}
                            className={`h-6`}
                          />
                        )}

                        <div className="my-auto truncate">
                          <span
                            className={`
                              w-full overflow-hidden text-left w-max-full
                            `}
                          >
                            {props.blueprint.liveries ? props.blueprint.liveries[id].name : ""}
                          </span>
                        </div>
                      </span>
                    </OlDropdownItem>
                  );
                })}
          </OlDropdown>
        </div>
        <div className="flex content-center justify-between gap-2">
          <span
            className={`
              my-auto font-normal
              dark:text-white
            `}
          >
            Skill
          </span>
          <OlDropdown label={spawnSkill} className={`w-64`}>
            {["Average", "Good", "High", "Excellent"].map((skill) => {
              return (
                <OlDropdownItem
                  key={skill}
                  onClick={() => {
                    setSpawnSkill(skill);
                  }}
                  className={`w-full`}
                >
                  <span
                    className={`
                      w-full content-center overflow-hidden text-ellipsis
                      text-nowrap text-left w-max-full flex gap-2
                    `}
                  >
                    <div className="my-auto">{skill}</div>
                  </span>
                </OlDropdownItem>
              );
            })}
          </OlDropdown>
        </div>
      </div>
      {spawnLoadout && spawnLoadout.items.length > 0 && (
        <div
          className={`
            flex h-fit flex-col gap-1 px-4 py-2
            dark:bg-olympus-200/30
          `}
        >
          <OlAccordion
            onClick={() => {
              setShowLoadout(!showLoadout);
            }}
            open={showLoadout}
            title="Loadout"
          >
            {spawnLoadout.items.map((item) => {
              return (
                <div className="flex content-center gap-2" key={item.name}>
                  <div
                    className={`
                      my-auto w-6 min-w-6 rounded-full py-0.5 text-center
                      text-sm font-bold text-gray-500
                      dark:bg-[#17212D]
                    `}
                  >
                    {item.quantity}
                  </div>
                  <div
                    className={`
                      my-auto overflow-hidden text-ellipsis text-nowrap text-sm
                      dark:text-gray-300
                    `}
                  >
                    {item.name}
                  </div>
                </div>
              );
            })}
          </OlAccordion>
        </div>
      )}
      {props.airbase && (
        <button
          type="button"
          className={`
            m-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium
            text-white
            dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
            focus:outline-none focus:ring-4 focus:ring-blue-300
            hover:bg-blue-800
          `}
          onClick={() => {
            if (spawnRequestTable)
              getApp()
                .getUnitsManager()
                .spawnUnits(
                  spawnRequestTable.category,
                  Array(spawnRequestTable.amount).fill(spawnRequestTable.unit),
                  spawnRequestTable.coalition,
                  false,
                  props.airbase?.getName()
                );
          }}
        >
          Spawn
        </button>
      )}
    </div>
  );
}

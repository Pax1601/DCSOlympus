import React, { useEffect, useRef, useState } from "react";
import { BLUE_COMMANDER, COMMAND_MODE_OPTIONS_DEFAULTS, GAME_MASTER, NO_SUBSTATE, OlympusState, OlympusSubState } from "../../constants/constants";
import { LatLng } from "leaflet";
import {
  AppStateChangedEvent,
  CommandModeOptionsChangedEvent,
  SpawnContextMenuRequestEvent,
  StarredSpawnsChangedEvent,
  UnitDatabaseLoadedEvent,
} from "../../events";
import { getApp } from "../../olympusapp";
import { SpawnRequestTable, UnitBlueprint } from "../../interfaces";
import { faArrowLeft, faEllipsisVertical, faExplosion, faListDots, faSearch, faSmog, faStar } from "@fortawesome/free-solid-svg-icons";
import { EffectSpawnMenu } from "../panels/effectspawnmenu";
import { UnitSpawnMenu } from "../panels/unitspawnmenu";
import { OlEffectListEntry } from "../components/oleffectlistentry";
import {
  olButtonsVisibilityAircraft,
  olButtonsVisibilityGroundunit,
  olButtonsVisibilityGroundunitSam,
  olButtonsVisibilityHelicopter,
  olButtonsVisibilityNavyunit,
} from "../components/olicons";
import { OlUnitListEntry } from "../components/olunitlistentry";
import { OlSearchBar } from "../components/olsearchbar";
import { OlStateButton } from "../components/olstatebutton";
import { OlDropdownItem } from "../components/oldropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { Coalition } from "../../types/types";
import { CompactEffectSpawnMenu } from "../panels/compacteffectspawnmenu";

enum CategoryGroup {
  NONE,
  AIRCRAFT,
  HELICOPTER,
  AIR_DEFENCE,
  GROUND_UNIT,
  NAVY_UNIT,
  EFFECT,
  SEARCH,
  STARRED,
}

export function SpawnContextMenu(props: {}) {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE as OlympusSubState);
  const [xPosition, setXPosition] = useState(0);
  const [yPosition, setYPosition] = useState(0);
  const [latlng, setLatLng] = useState(null as null | LatLng);
  const [starredSpawns, setStarredSpawns] = useState({} as { [key: string]: SpawnRequestTable });
  const [openAccordion, setOpenAccordion] = useState(CategoryGroup.NONE);
  const [blueprint, setBlueprint] = useState(null as null | UnitBlueprint);
  const [effect, setEffect] = useState(null as null | string);
  const [filterString, setFilterString] = useState("");
  const [selectedRole, setSelectedRole] = useState(null as null | string);
  const [selectedType, setSelectedType] = useState(null as null | string);
  const [blueprints, setBlueprints] = useState([] as UnitBlueprint[]);
  const [roles, setRoles] = useState({ aircraft: [] as string[], helicopter: [] as string[] });
  const [types, setTypes] = useState({ groundunit: [] as string[], navyunit: [] as string[] });
  const [commandModeOptions, setCommandModeOptions] = useState(COMMAND_MODE_OPTIONS_DEFAULTS);
  const [showCost, setShowCost] = useState(false);
  const [spawnCoalition, setSpawnCoalition] = useState("blue" as Coalition);
  const [showMore, setShowMore] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (selectedRole) setBlueprints(getApp()?.getUnitsManager().getDatabase().getByRole(selectedRole));
    else if (selectedType) setBlueprints(getApp()?.getUnitsManager().getDatabase().getByType(selectedType));
    else setBlueprints(getApp()?.getUnitsManager().getDatabase().getBlueprints());
  }, [selectedRole, selectedType, openAccordion]);

  useEffect(() => {
    UnitDatabaseLoadedEvent.on(() => {
      setRoles({
        aircraft: getApp()
          ?.getUnitsManager()
          .getDatabase()
          .getRoles((unit) => unit.category === "aircraft"),
        helicopter: getApp()
          ?.getUnitsManager()
          .getDatabase()
          .getRoles((unit) => unit.category === "helicopter"),
      });

      setTypes({
        groundunit: getApp()
          ?.getUnitsManager()
          .getDatabase()
          .getTypes((unit) => unit.category === "groundunit"),
        navyunit: getApp()
          ?.getUnitsManager()
          .getDatabase()
          .getTypes((unit) => unit.category === "navyunit"),
      });
    });

    CommandModeOptionsChangedEvent.on((commandModeOptions) => {
      setCommandModeOptions(commandModeOptions);
      setShowCost(!(commandModeOptions.commandMode == GAME_MASTER || !commandModeOptions.restrictSpawns));
      setOpenAccordion(CategoryGroup.NONE);
    });

    StarredSpawnsChangedEvent.on((starredSpawns) => setStarredSpawns({ ...starredSpawns }));
  }, []);

  useEffect(() => {
    setBlueprint(null);
    setEffect(null);
    setSelectedType(null);
    setSelectedRole(null);
  }, [openAccordion]);

  /* Filter the blueprints according to the label */
  const filteredBlueprints: UnitBlueprint[] = [];
  if (blueprints && filterString !== "") {
    blueprints.forEach((blueprint) => {
      if (blueprint.enabled && (filterString === "" || blueprint.label.toLowerCase().includes(filterString.toLowerCase()))) filteredBlueprints.push(blueprint);
    });
  }

  var contentRef = useRef(null);

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
    StarredSpawnsChangedEvent.on((starredSpawns) => setStarredSpawns({ ...starredSpawns }));
    SpawnContextMenuRequestEvent.on((latlng) => {
      setLatLng(latlng);
      const containerPoint = getApp().getMap().latLngToContainerPoint(latlng);
      setXPosition(getApp().getMap().getContainer().offsetLeft + containerPoint.x);
      setYPosition(getApp().getMap().getContainer().offsetTop + containerPoint.y);
    });
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const content = contentRef.current as HTMLDivElement;

      content.style.left = `${xPosition}px`;
      content.style.top = `${yPosition}px`;

      let newXPosition = xPosition;
      let newYposition = yPosition;

      let [cxr, cyb] = [content.getBoundingClientRect().x + content.clientWidth, content.getBoundingClientRect().y + content.clientHeight];

      /* Try and move the content so it is inside the screen */
      if (cxr > window.innerWidth) newXPosition -= cxr - window.innerWidth;
      if (cyb > window.innerHeight) newYposition -= cyb - window.innerHeight;

      content.style.left = `${newXPosition}px`;
      content.style.top = `${newYposition}px`;

      const resizeObserver = new ResizeObserver(() => {
        setHeight(content.clientHeight);
      });
      resizeObserver.observe(content);
      return () => resizeObserver.disconnect(); // clean up 
    }
  });

  // TODO fix button being moved if overflowing
  return (
    <>
      <div
        ref={contentRef}
        data-hidden={appState !== OlympusState.SPAWN_CONTEXT}
        className={`
          absolute flex w-[395px] data- max-h-[800px] flex-wrap gap-2
          overflow-auto rounded-md bg-olympus-800
          data-[hidden=true]:hidden
        `}
      >
        <div className="flex w-full flex-col gap-4 px-6 py-3">
          <div className="flex flex-wrap justify-between gap-2">
            <OlCoalitionToggle
              coalition={spawnCoalition}
              onClick={() => {
                spawnCoalition === "blue" && setSpawnCoalition("neutral");
                spawnCoalition === "neutral" && setSpawnCoalition("red");
                spawnCoalition === "red" && setSpawnCoalition("blue");
              }}
            />
            <OlStateButton
              checked={openAccordion === CategoryGroup.AIRCRAFT}
              onClick={() => (openAccordion !== CategoryGroup.AIRCRAFT ? setOpenAccordion(CategoryGroup.AIRCRAFT) : setOpenAccordion(CategoryGroup.NONE))}
              icon={olButtonsVisibilityAircraft}
              tooltip="Show aircraft units"
              buttonColor={spawnCoalition === "blue" ? "#2563eb" : spawnCoalition === "neutral" ? "#9ca3af" : "#ef4444"}
            />
            <OlStateButton
              checked={openAccordion === CategoryGroup.HELICOPTER}
              onClick={() => (openAccordion !== CategoryGroup.HELICOPTER ? setOpenAccordion(CategoryGroup.HELICOPTER) : setOpenAccordion(CategoryGroup.NONE))}
              icon={olButtonsVisibilityHelicopter}
              tooltip="Show helicopter units"
              buttonColor={spawnCoalition === "blue" ? "#2563eb" : spawnCoalition === "neutral" ? "#9ca3af" : "#ef4444"}
            />
            <OlStateButton
              checked={openAccordion === CategoryGroup.AIR_DEFENCE}
              onClick={() => (openAccordion !== CategoryGroup.AIR_DEFENCE ? setOpenAccordion(CategoryGroup.AIR_DEFENCE) : setOpenAccordion(CategoryGroup.NONE))}
              icon={olButtonsVisibilityGroundunitSam}
              tooltip="Show air defence units"
              buttonColor={spawnCoalition === "blue" ? "#2563eb" : spawnCoalition === "neutral" ? "#9ca3af" : "#ef4444"}
            />
            <OlStateButton
              checked={openAccordion === CategoryGroup.GROUND_UNIT}
              onClick={() => (openAccordion !== CategoryGroup.GROUND_UNIT ? setOpenAccordion(CategoryGroup.GROUND_UNIT) : setOpenAccordion(CategoryGroup.NONE))}
              icon={olButtonsVisibilityGroundunit}
              tooltip="Show ground units"
              buttonColor={spawnCoalition === "blue" ? "#2563eb" : spawnCoalition === "neutral" ? "#9ca3af" : "#ef4444"}
            />
            <OlStateButton
              checked={openAccordion === CategoryGroup.NAVY_UNIT}
              onClick={() => (openAccordion !== CategoryGroup.NAVY_UNIT ? setOpenAccordion(CategoryGroup.NAVY_UNIT) : setOpenAccordion(CategoryGroup.NONE))}
              icon={olButtonsVisibilityNavyunit}
              tooltip="Show navy units"
              buttonColor={spawnCoalition === "blue" ? "#2563eb" : spawnCoalition === "neutral" ? "#9ca3af" : "#ef4444"}
            />
            <OlStateButton checked={showMore} onClick={() => setShowMore(!showMore)} icon={faEllipsisVertical} tooltip="Show more options" />
            {showMore && (
              <>
                <OlStateButton
                  checked={openAccordion === CategoryGroup.EFFECT}
                  onClick={() => (openAccordion !== CategoryGroup.EFFECT ? setOpenAccordion(CategoryGroup.EFFECT) : setOpenAccordion(CategoryGroup.NONE))}
                  icon={faExplosion}
                  tooltip="Show effects"
                  className="ml-auto"
                />
                <OlStateButton
                  checked={openAccordion === CategoryGroup.SEARCH}
                  onClick={() => (openAccordion !== CategoryGroup.SEARCH ? setOpenAccordion(CategoryGroup.SEARCH) : setOpenAccordion(CategoryGroup.NONE))}
                  icon={faSearch}
                  tooltip="Search unit"
                />
                <OlStateButton
                  checked={openAccordion === CategoryGroup.STARRED}
                  onClick={() => (openAccordion !== CategoryGroup.STARRED ? setOpenAccordion(CategoryGroup.STARRED) : setOpenAccordion(CategoryGroup.NONE))}
                  icon={faStar}
                  tooltip="Show starred spanws"
                />
              </>
            )}
          </div>
          {blueprint === null && effect === null && openAccordion !== CategoryGroup.NONE && (
            <div className="mb-3 flex flex-col gap-4">
              <>
                <>
                  {openAccordion === CategoryGroup.AIRCRAFT && (
                    <>
                      <div className="flex flex-wrap gap-1">
                        {roles.aircraft.sort().map((role) => {
                          return (
                            <div
                              key={role}
                              data-selected={selectedRole === role}
                              className={`
                                cursor-pointer rounded-full bg-olympus-900 px-2
                                py-0.5 text-xs font-bold text-olympus-50
                                data-[selected='true']:bg-blue-500
                                data-[selected='true']:text-gray-200
                              `}
                              onClick={() => {
                                selectedRole === role ? setSelectedRole(null) : setSelectedRole(role);
                              }}
                            >
                              {role}
                            </div>
                          );
                        })}
                      </div>
                      <div
                        className={`
                          flex max-h-[350px] flex-col gap-1 overflow-y-scroll
                          no-scrollbar
                        `}
                      >
                        {blueprints
                          ?.sort((a, b) => (a.label > b.label ? 1 : -1))
                          .filter((blueprint) => blueprint.category === "aircraft")
                          .map((blueprint) => {
                            return (
                              <OlUnitListEntry
                                key={blueprint.name}
                                silhouette={blueprint.filename}
                                blueprint={blueprint}
                                onClick={() => setBlueprint(blueprint)}
                                showCost={showCost}
                                cost={getApp().getUnitsManager().getDatabase().getSpawnPointsByName(blueprint.name)}
                              />
                            );
                          })}
                      </div>
                    </>
                  )}
                  {openAccordion === CategoryGroup.HELICOPTER && (
                    <>
                      <div className="flex flex-wrap gap-1">
                        {roles.helicopter.sort().map((role) => {
                          return (
                            <div
                              key={role}
                              data-selected={selectedRole === role}
                              className={`
                                cursor-pointer rounded-full bg-olympus-900 px-2
                                py-0.5 text-xs font-bold text-olympus-50
                                data-[selected='true']:bg-blue-500
                                data-[selected='true']:text-gray-200
                              `}
                              onClick={() => {
                                selectedRole === role ? setSelectedRole(null) : setSelectedRole(role);
                              }}
                            >
                              {role}
                            </div>
                          );
                        })}
                      </div>
                      <div
                        className={`
                          flex max-h-[350px] flex-col gap-1 overflow-y-scroll
                          no-scrollbar
                        `}
                      >
                        {blueprints
                          ?.sort((a, b) => (a.label > b.label ? 1 : -1))
                          .filter((blueprint) => blueprint.category === "helicopter")
                          .map((blueprint) => {
                            return (
                              <OlUnitListEntry
                                key={blueprint.name}
                                silhouette={blueprint.filename}
                                blueprint={blueprint}
                                onClick={() => setBlueprint(blueprint)}
                                showCost={showCost}
                                cost={getApp().getUnitsManager().getDatabase().getSpawnPointsByName(blueprint.name)}
                              />
                            );
                          })}
                      </div>
                    </>
                  )}
                  {openAccordion === CategoryGroup.AIR_DEFENCE && (
                    <>
                      <div className="flex flex-wrap gap-1">
                        {types.groundunit
                          .sort()
                          ?.filter((type) => type === "SAM Site" || type === "AAA")
                          .map((type) => {
                            return (
                              <div
                                key={type}
                                data-selected={selectedType === type}
                                className={`
                                  cursor-pointer rounded-full bg-olympus-900
                                  px-2 py-0.5 text-xs font-bold text-olympus-50
                                  data-[selected='true']:bg-blue-500
                                  data-[selected='true']:text-gray-200
                                `}
                                onClick={() => {
                                  selectedType === type ? setSelectedType(null) : setSelectedType(type);
                                }}
                              >
                                {type}
                              </div>
                            );
                          })}
                      </div>
                      <div
                        className={`
                          flex max-h-[350px] flex-col gap-1 overflow-y-scroll
                          no-scrollbar
                        `}
                      >
                        {blueprints
                          ?.sort((a, b) => (a.label > b.label ? 1 : -1))
                          .filter((blueprint) => blueprint.category === "groundunit" && (blueprint.type === "SAM Site" || blueprint.type === "AAA"))
                          .map((blueprint) => {
                            return (
                              <OlUnitListEntry
                                key={blueprint.name}
                                icon={olButtonsVisibilityGroundunitSam}
                                blueprint={blueprint}
                                onClick={() => setBlueprint(blueprint)}
                                showCost={showCost}
                                cost={getApp().getUnitsManager().getDatabase().getSpawnPointsByName(blueprint.name)}
                              />
                            );
                          })}
                      </div>
                    </>
                  )}
                  {openAccordion === CategoryGroup.GROUND_UNIT && (
                    <>
                      <div className="flex flex-wrap gap-1">
                        {types.groundunit
                          .sort()
                          ?.filter((type) => type !== "SAM Site" && type !== "AAA")
                          .map((type) => {
                            return (
                              <div
                                key={type}
                                data-selected={selectedType === type}
                                className={`
                                  cursor-pointer rounded-full bg-olympus-900
                                  px-2 py-0.5 text-xs font-bold text-olympus-50
                                  data-[selected='true']:bg-blue-500
                                  data-[selected='true']:text-gray-200
                                `}
                                onClick={() => {
                                  selectedType === type ? setSelectedType(null) : setSelectedType(type);
                                }}
                              >
                                {type}
                              </div>
                            );
                          })}
                      </div>
                      <div
                        className={`
                          flex max-h-[350px] flex-col gap-1 overflow-y-scroll
                          no-scrollbar
                        `}
                      >
                        {blueprints
                          ?.sort((a, b) => (a.label > b.label ? 1 : -1))
                          .filter((blueprint) => blueprint.category === "groundunit" && blueprint.type !== "SAM Site" && blueprint.type !== "AAA")
                          .map((blueprint) => {
                            return (
                              <OlUnitListEntry
                                key={blueprint.name}
                                icon={olButtonsVisibilityGroundunit}
                                blueprint={blueprint}
                                onClick={() => setBlueprint(blueprint)}
                                showCost={showCost}
                                cost={getApp().getUnitsManager().getDatabase().getSpawnPointsByName(blueprint.name)}
                              />
                            );
                          })}
                      </div>
                    </>
                  )}
                  {openAccordion === CategoryGroup.NAVY_UNIT && (
                    <>
                      <div className="flex flex-wrap gap-1">
                        {types.navyunit.sort().map((type) => {
                          return (
                            <div
                              key={type}
                              data-selected={selectedType === type}
                              className={`
                                cursor-pointer rounded-full bg-olympus-900 px-2
                                py-0.5 text-xs font-bold text-olympus-50
                                data-[selected='true']:bg-blue-500
                                data-[selected='true']:text-gray-200
                              `}
                              onClick={() => {
                                selectedType === type ? setSelectedType(null) : setSelectedType(type);
                              }}
                            >
                              {type}
                            </div>
                          );
                        })}
                      </div>
                      <div
                        className={`
                          flex max-h-[350px] flex-col gap-1 overflow-y-scroll
                          no-scrollbar
                        `}
                      >
                        {blueprints
                          ?.sort((a, b) => (a.label > b.label ? 1 : -1))
                          .filter((blueprint) => blueprint.category === "navyunit")
                          .map((blueprint) => {
                            return (
                              <OlUnitListEntry
                                key={blueprint.name}
                                icon={olButtonsVisibilityNavyunit}
                                blueprint={blueprint}
                                onClick={() => setBlueprint(blueprint)}
                                showCost={showCost}
                                cost={getApp().getUnitsManager().getDatabase().getSpawnPointsByName(blueprint.name)}
                              />
                            );
                          })}
                      </div>
                    </>
                  )}
                  {openAccordion === CategoryGroup.EFFECT && (
                    <>
                      <div
                        className={`
                          flex max-h-[350px] flex-col gap-1 overflow-y-scroll
                          no-scrollbar
                        `}
                      >
                        <OlEffectListEntry
                          key={"explosion"}
                          icon={faExplosion}
                          label={"Explosion"}
                          onClick={() => {
                            setEffect("explosion");
                          }}
                        />
                        <OlEffectListEntry
                          key={"smoke"}
                          icon={faSmog}
                          label={"Smoke"}
                          onClick={() => {
                            setEffect("smoke");
                          }}
                        />
                      </div>
                    </>
                  )}
                  {openAccordion === CategoryGroup.SEARCH && (
                    <div className="flex flex-col gap-2">
                      <OlSearchBar onChange={(value) => setFilterString(value)} text={filterString} />
                      <div
                        className={`
                          flex max-h-[350px] flex-col gap-1 overflow-y-scroll
                          no-scrollbar
                        `}
                      >
                        {filteredBlueprints.length > 0 ? (
                          filteredBlueprints.map((blueprint) => {
                            return (
                              <OlUnitListEntry
                                key={blueprint.name}
                                icon={olButtonsVisibilityNavyunit}
                                blueprint={blueprint}
                                onClick={() => setBlueprint(blueprint)}
                                showCost={showCost}
                                cost={getApp().getUnitsManager().getDatabase().getSpawnPointsByName(blueprint.name)}
                              />
                            );
                          })
                        ) : filterString === "" ? (
                          <span className={`text-gray-200`}>Type to search</span>
                        ) : (
                          <span className={`text-gray-200`}>No results</span>
                        )}
                      </div>
                    </div>
                  )}
                  {openAccordion === CategoryGroup.STARRED && (
                    <div className="flex flex-col gap-2">
                      {Object.values(starredSpawns).length > 0 ? (
                        Object.values(starredSpawns).map((spawnRequestTable) => {
                          return (
                            <OlDropdownItem
                              className={`
                                flex w-full content-center gap-2 text-sm
                                text-white
                              `}
                              onClick={() => {
                                if (latlng) {
                                  spawnRequestTable.unit.location = latlng;
                                  getApp()
                                    .getUnitsManager()
                                    .spawnUnits(
                                      spawnRequestTable.category,
                                      Array(spawnRequestTable.amount).fill(spawnRequestTable.unit),
                                      spawnRequestTable.coalition,
                                      false
                                    );
                                  getApp().setState(OlympusState.IDLE);
                                }
                              }}
                            >
                              <FontAwesomeIcon
                                data-coalition={spawnRequestTable.coalition}
                                className={`
                                  my-auto
                                  data-[coalition='blue']:text-blue-500
                                  data-[coalition='neutral']:text-gay-500
                                  data-[coalition='red']:text-red-500
                                `}
                                icon={faStar}
                              />
                              <div>
                                {getApp().getUnitsManager().getDatabase().getByName(spawnRequestTable.unit.unitType)?.label} (
                                {spawnRequestTable.quickAccessName})
                              </div>
                            </OlDropdownItem>
                          );
                        })
                      ) : (
                        <div className="p-2 text-sm text-white">No starred spawns, use the spawn menu to create a quick access spawn</div>
                      )}
                    </div>
                  )}
                </>
              </>
            </div>
          )}
          <UnitSpawnMenu
            compact={true}
            visible={blueprint !== null}
            blueprint={blueprint}
            starredSpawns={starredSpawns}
            latlng={latlng}
            coalition={spawnCoalition}
            onBack={() => setBlueprint(null)}
          />
          {!(effect === null) && latlng && <CompactEffectSpawnMenu effect={effect} latlng={latlng} onBack={() => setEffect(null)} />}
        </div>
      </div>
    </>
  );
}

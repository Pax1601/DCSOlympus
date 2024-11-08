import React, { useState, useEffect } from "react";
import { Menu } from "./components/menu";
import { Coalition } from "../../types/types";
import { Airbase } from "../../mission/airbase";
import { FaArrowLeft, FaCompass } from "react-icons/fa6";
import { UnitBlueprint } from "../../interfaces";
import { OlSearchBar } from "../components/olsearchbar";
import { OlAccordion } from "../components/olaccordion";
import { OlUnitListEntry } from "../components/olunitlistentry";
import { olButtonsVisibilityAircraft, olButtonsVisibilityHelicopter } from "../components/olicons";
import { UnitSpawnMenu } from "./unitspawnmenu";
import { AirbaseSelectedEvent, CommandModeOptionsChangedEvent, UnitDatabaseLoadedEvent } from "../../events";
import { getApp } from "../../olympusapp";
import { BLUE_COMMANDER, COMMAND_MODE_OPTIONS_DEFAULTS, GAME_MASTER, RED_COMMANDER } from "../../constants/constants";

enum CategoryAccordion {
  NONE,
  AIRCRAFT,
  HELICOPTER,
}

export function AirbaseMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [airbase, setAirbase] = useState(null as null | Airbase);
  const [blueprint, setBlueprint] = useState(null as null | UnitBlueprint);
  const [filterString, setFilterString] = useState("");
  const [selectedRole, setSelectedRole] = useState(null as null | string);
  const [runwaysAccordionOpen, setRunwaysAccordionOpen] = useState(false);
  const [blueprints, setBlueprints] = useState([] as UnitBlueprint[]);
  const [roles, setRoles] = useState({ aircraft: [] as string[], helicopter: [] as string[] });
  const [openAccordion, setOpenAccordion] = useState(CategoryAccordion.NONE);
  const [commandModeOptions, setCommandModeOptions] = useState(COMMAND_MODE_OPTIONS_DEFAULTS);
  const [showCost, setShowCost] = useState(false);

  useEffect(() => {
    AirbaseSelectedEvent.on((airbase) => {
      setAirbase(airbase);
    });

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
    });

    CommandModeOptionsChangedEvent.on((commandModeOptions) => {
      setCommandModeOptions(commandModeOptions);
      setShowCost(!(commandModeOptions.commandMode === GAME_MASTER || !commandModeOptions.restrictSpawns));
      setOpenAccordion(CategoryAccordion.NONE);
    });
  }, []);

  useEffect(() => {
    if (selectedRole) setBlueprints(getApp()?.getUnitsManager().getDatabase().getByRole(selectedRole));
    else setBlueprints(getApp()?.getUnitsManager().getDatabase().getBlueprints());
  }, [selectedRole, openAccordion]);

  /* Filter the blueprints according to the label */
  const filteredBlueprints: UnitBlueprint[] = [];
  if (blueprints) {
    blueprints.forEach((blueprint) => {
      if (blueprint.enabled && (filterString === "" || blueprint.label.toLowerCase().includes(filterString.toLowerCase()))) filteredBlueprints.push(blueprint);
    });
  }

  return (
    <Menu title={airbase?.getName() ?? "No airbase selected"} open={props.open} onClose={props.onClose} showBackButton={false} canBeHidden={true}>
      <div
        className={`
          flex flex-col gap-2 font-normal text-gray-800
          dark:text-white
        `}
      >
        <div
          data-coalition={airbase?.getCoalition()}
          className={`
            flex flex-col content-center justify-between gap-2 border-l-4
            bg-olympus-200/30 py-3 pl-4 pr-5
            data-[coalition='blue']:border-blue-500
            data-[coalition='neutral']:border-gray-500
            data-[coalition='red']:border-red-500
          `}
        >
          <div className="flex w-full justify-between">
            <span className="text-gray-400">ICAO name</span>
            <span>{airbase?.getChartData().ICAO !== "" ? airbase?.getChartData().ICAO : "N/A"}</span>
          </div>
          <div className="flex w-full justify-between">
            <span className="text-gray-400">TACAN</span>
            <span>{airbase?.getChartData().TACAN !== "" ? airbase?.getChartData().TACAN : "None"}</span>
          </div>
          <div className="flex w-full justify-between">
            <span className="text-gray-400">Elevation</span>
            <span>{airbase?.getChartData().elevation !== "" ? airbase?.getChartData().elevation : "N/A"}ft</span>
          </div>
          {
            // TODO I can't remember what tho
          }
          <OlAccordion
            title={`Runways`}
            className="!p-0 !text-gray-400"
            onClick={() => setRunwaysAccordionOpen(!runwaysAccordionOpen)}
            open={runwaysAccordionOpen}
          >
            <div className="flex flex-col gap-2">
              {airbase?.getChartData().runways.map((runway, idx) => {
                return (
                  <>
                    {Object.keys(runway.headings[0]).map((runwayName) => {
                      return (
                        <div
                          key={`${idx}-${runwayName}`}
                          className={`flex w-full justify-between`}
                        >
                          <span>
                            {" "}
                            <span className="text-gray-400">RWY</span> {runwayName}
                          </span>
                          <span
                            className={`
                              flex gap-1 rounded-full bg-olympus-200/30 px-2
                              py-1
                            `}
                          >
                            <FaCompass className={`my-auto text-gray-400`} /> {runway.headings[0][runwayName].magHeading}°{" "}
                            <span className={`text-gray-400`}>ILS</span>{" "}
                            {runway.headings[0][runwayName].ILS !== "" ? runway.headings[0][runwayName].ILS + "MHz" : "None"}
                          </span>
                        </div>
                      );
                    })}
                  </>
                );
              })}
            </div>
          </OlAccordion>
        </div>
        {(commandModeOptions.commandMode === GAME_MASTER ||
          (commandModeOptions.commandMode === BLUE_COMMANDER && airbase?.getCoalition() === "blue") ||
          (commandModeOptions.commandMode === RED_COMMANDER && airbase?.getCoalition() === "red")) && (
          <>
            <div className="mt-5 flex gap-2 px-5 text-white bold">
              {blueprint && (
                <FaArrowLeft
                  className={`
                    my-auto h-8 w-8 cursor-pointer rounded-md p-2
                    dark:text-gray-500 dark:hover:bg-gray-700
                    dark:hover:text-white
                  `}
                  onClick={() => setBlueprint(null)}
                />
              )}
              <span className="my-auto">Spawn units at airbase</span>
            </div>
            {blueprint === null && (
              <div className="p-5">
                <OlSearchBar onChange={(value) => setFilterString(value)} text={filterString} />
                <OlAccordion
                  title={`Aircraft`}
                  open={openAccordion == CategoryAccordion.AIRCRAFT}
                  onClick={() => {
                    setOpenAccordion(openAccordion === CategoryAccordion.AIRCRAFT ? CategoryAccordion.NONE : CategoryAccordion.AIRCRAFT);
                    setSelectedRole(null);
                  }}
                >
                  <div className="mb-2 flex flex-wrap gap-1">
                    {roles.aircraft.sort().map((role) => {
                      return (
                        <div
                          key={role}
                          data-selected={selectedRole === role}
                          className={`
                            cursor-pointer rounded-full bg-olympus-800 px-2
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
                      flex max-h-[450px] flex-col gap-1 overflow-y-scroll
                      no-scrollbar
                    `}
                  >
                    {filteredBlueprints
                      .filter((blueprint) => blueprint.category === "aircraft")
                      .map((blueprint) => {
                        return (
                          <OlUnitListEntry
                            key={blueprint.name}
                            icon={olButtonsVisibilityAircraft}
                            blueprint={blueprint}
                            onClick={() => setBlueprint(blueprint)}
                            showCost={showCost}
                            cost={getApp().getUnitsManager().getDatabase().getSpawnPointsByName(blueprint.name)}
                          />
                        );
                      })}
                  </div>
                </OlAccordion>
                <OlAccordion
                  title={`Helicopters`}
                  open={openAccordion == CategoryAccordion.HELICOPTER}
                  onClick={() => {
                    setOpenAccordion(openAccordion === CategoryAccordion.HELICOPTER ? CategoryAccordion.NONE : CategoryAccordion.HELICOPTER);
                    setSelectedRole(null);
                  }}
                >
                  <div className="mb-2 flex flex-wrap gap-1">
                    {roles.helicopter.sort().map((role) => {
                      return (
                        <div
                          key={role}
                          data-selected={selectedRole === role}
                          className={`
                            cursor-pointer rounded-full bg-olympus-800 px-2
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
                      flex max-h-[450px] flex-col gap-1 overflow-y-scroll
                      no-scrollbar
                    `}
                  >
                    {filteredBlueprints
                      .filter((blueprint) => blueprint.category === "helicopter")
                      .map((blueprint) => {
                        return (
                          <OlUnitListEntry
                            key={blueprint.name}
                            icon={olButtonsVisibilityHelicopter}
                            blueprint={blueprint}
                            onClick={() => setBlueprint(blueprint)}
                            showCost={showCost}
                            cost={getApp().getUnitsManager().getDatabase().getSpawnPointsByName(blueprint.name)}
                          />
                        );
                      })}
                  </div>
                </OlAccordion>
              </div>
            )}
            <>
              {!(blueprint === null) && (
                <UnitSpawnMenu blueprint={blueprint} spawnAtLocation={false} airbase={airbase} coalition={(airbase?.getCoalition() ?? "blue") as Coalition} />
              )}
            </>
          </>
        )}
      </div>
    </Menu>
  );
}

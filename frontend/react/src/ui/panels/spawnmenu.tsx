import React, { useState, useEffect } from "react";
import { Menu } from "./components/menu";
import { OlSearchBar } from "../components/olsearchbar";
import { OlAccordion } from "../components/olaccordion";
import { getApp } from "../../olympusapp";
import { OlUnitListEntry } from "../components/olunitlistentry";
import { UnitSpawnMenu } from "./unitspawnmenu";
import { SpawnRequestTable, UnitBlueprint } from "../../interfaces";
import {
  olButtonsVisibilityAircraft,
  olButtonsVisibilityGroundunit,
  olButtonsVisibilityGroundunitSam,
  olButtonsVisibilityHelicopter,
  olButtonsVisibilityNavyunit,
} from "../components/olicons";
import { faExplosion, faSmog } from "@fortawesome/free-solid-svg-icons";
import { OlEffectListEntry } from "../components/oleffectlistentry";
import { EffectSpawnMenu } from "./effectspawnmenu";
import { BLUE_COMMANDER, COMMAND_MODE_OPTIONS_DEFAULTS, GAME_MASTER, NO_SUBSTATE, OlympusState } from "../../constants/constants";
import { AppStateChangedEvent, CommandModeOptionsChangedEvent, StarredSpawnsChangedEvent, UnitDatabaseLoadedEvent } from "../../events";

enum CategoryAccordion {
  NONE,
  AIRCRAFT,
  HELICOPTER,
  SAM,
  AAA,
  GROUND_UNIT,
  NAVY_UNIT,
  EFFECT,
}

export function SpawnMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [openAccordion, setOpenAccordion] = useState(CategoryAccordion.NONE);
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
  const [starredSpawns, setStarredSpawns] = useState({} as { [key: string]: SpawnRequestTable });

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

    AppStateChangedEvent.on((state, subState) => {
      if (subState === NO_SUBSTATE) {
        setBlueprint(null);
        setEffect(null);
      }
    });

    CommandModeOptionsChangedEvent.on((commandModeOptions) => {
      setCommandModeOptions(commandModeOptions);
      setShowCost(!(commandModeOptions.commandMode == GAME_MASTER || !commandModeOptions.restrictSpawns));
      setOpenAccordion(CategoryAccordion.NONE);
    });

    StarredSpawnsChangedEvent.on((starredSpawns) => setStarredSpawns({ ...starredSpawns }));
  }, []);

  /* Filter the blueprints according to the label */
  const filteredBlueprints: UnitBlueprint[] = [];
  if (blueprints) {
    blueprints.forEach((blueprint) => {
      if (blueprint.enabled && (filterString === "" || blueprint.label.toLowerCase().includes(filterString.toLowerCase()))) filteredBlueprints.push(blueprint);
    });
  }

  useEffect(() => {
    if (!props.open) {
      if (blueprint !== null) setBlueprint(null);
      if (effect !== null) setEffect(null);
      if (filterString !== "") setFilterString("");
      if (openAccordion !== CategoryAccordion.NONE) setOpenAccordion(CategoryAccordion.NONE);
    }
  });

  return (
    <Menu
      {...props}
      title="Spawn menu"
      showBackButton={blueprint !== null || effect !== null}
      canBeHidden={true}
      onBack={() => {
        getApp().setState(OlympusState.SPAWN);
        setBlueprint(null);
        setEffect(null);
      }}
    >
      <>
        {blueprint === null && effect === null && (
          <div className="p-5">
            <OlSearchBar onChange={(value) => setFilterString(value)} text={filterString} />
            <OlAccordion
              title={`Aircraft`}
              open={openAccordion == CategoryAccordion.AIRCRAFT}
              onClick={() => {
                setOpenAccordion(openAccordion === CategoryAccordion.AIRCRAFT ? CategoryAccordion.NONE : CategoryAccordion.AIRCRAFT);
                setSelectedRole(null);
                setSelectedType(null);
              }}
            >
              <div className="mb-2 flex flex-wrap gap-1">
                {roles.aircraft.sort().map((role) => {
                  return (
                    <div
                      key={role}
                      data-selected={selectedRole === role}
                      className={`
                        cursor-pointer rounded-full bg-olympus-800 px-2 py-0.5
                        text-xs font-bold text-olympus-50
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
                setSelectedType(null);
              }}
            >
              <div className="mb-2 flex flex-wrap gap-1">
                {roles.helicopter.sort().map((role) => {
                  return (
                    <div
                      key={role}
                      data-selected={selectedRole === role}
                      className={`
                        cursor-pointer rounded-full bg-olympus-800 px-2 py-0.5
                        text-xs font-bold text-olympus-50
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
            <OlAccordion
              title={`Surface to Air Missiles (SAM sites)`}
              open={openAccordion == CategoryAccordion.SAM}
              onClick={() => {
                setOpenAccordion(openAccordion === CategoryAccordion.SAM ? CategoryAccordion.NONE : CategoryAccordion.SAM);
                setSelectedRole(null);
                setSelectedType(null);
              }}
            >
              <div
                className={`
                  flex max-h-[450px] flex-col gap-1 overflow-y-scroll
                  no-scrollbar
                `}
              >
                {filteredBlueprints
                  .filter((blueprint) => blueprint.category === "groundunit" && blueprint.type === "SAM Site")
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
            </OlAccordion>
            <OlAccordion
              title={`Anti Aircraft Artillery (AAA)`}
              open={openAccordion == CategoryAccordion.AAA}
              onClick={() => {
                setOpenAccordion(openAccordion === CategoryAccordion.AAA ? CategoryAccordion.NONE : CategoryAccordion.AAA);
                setSelectedRole(null);
                setSelectedType(null);
              }}
            >
              <div
                className={`
                  flex max-h-[450px] flex-col gap-1 overflow-y-scroll
                  no-scrollbar
                `}
              >
                {filteredBlueprints
                  .filter((blueprint) => blueprint.canAAA)
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
            </OlAccordion>
            <OlAccordion
              title={`Ground Units`}
              open={openAccordion == CategoryAccordion.GROUND_UNIT}
              onClick={() => {
                setOpenAccordion(openAccordion === CategoryAccordion.GROUND_UNIT ? CategoryAccordion.NONE : CategoryAccordion.GROUND_UNIT);
                setSelectedRole(null);
                setSelectedType(null);
              }}
            >
              <div className="mb-2 flex flex-wrap gap-1">
                {types.groundunit
                  .sort()
                  .filter((type) => type !== "SAM Site")
                  .map((type) => {
                    return (
                      <div
                        key={type}
                        data-selected={selectedType === type}
                        className={`
                          cursor-pointer rounded-full bg-olympus-800 px-2 py-0.5
                          text-xs font-bold text-olympus-50
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
                  flex max-h-[450px] flex-col gap-1 overflow-y-scroll
                  no-scrollbar
                `}
              >
                {filteredBlueprints
                  .filter((blueprint) => blueprint.category === "groundunit" && blueprint.type !== "SAM Site")
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
            </OlAccordion>
            <OlAccordion
              title={`Ships and submarines`}
              open={openAccordion == CategoryAccordion.NAVY_UNIT}
              onClick={() => {
                setOpenAccordion(openAccordion === CategoryAccordion.NAVY_UNIT ? CategoryAccordion.NONE : CategoryAccordion.NAVY_UNIT);
                setSelectedRole(null);
                setSelectedType(null);
              }}
            >
              <div className="mb-2 flex flex-wrap gap-1">
                {types.navyunit.sort().map((type) => {
                  return (
                    <div
                      key={type}
                      data-selected={selectedType === type}
                      className={`
                        cursor-pointer rounded-full bg-olympus-800 px-2 py-0.5
                        text-xs font-bold text-olympus-50
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
                  flex max-h-[450px] flex-col gap-1 overflow-y-scroll
                  no-scrollbar
                `}
              >
                {filteredBlueprints
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
            </OlAccordion>
            <OlAccordion
              title="Effects (smokes, explosions etc)"
              open={openAccordion == CategoryAccordion.EFFECT}
              onClick={() => {
                setOpenAccordion(openAccordion === CategoryAccordion.EFFECT ? CategoryAccordion.NONE : CategoryAccordion.EFFECT);
                setSelectedRole(null);
                setSelectedType(null);
              }}
            >
              <div
                className={`
                  flex max-h-[450px] flex-col gap-1 overflow-y-scroll
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
            </OlAccordion>
          </div>
        )}

        {!(blueprint === null) && (
          <UnitSpawnMenu
            blueprint={blueprint}
            starredSpawns={starredSpawns}
            coalition={commandModeOptions.commandMode !== GAME_MASTER ? (commandModeOptions.commandMode === BLUE_COMMANDER ? "blue" : "red") : undefined}
          />
        )}
        {!(effect === null) && <EffectSpawnMenu effect={effect} />}
      </>
    </Menu>
  );
}

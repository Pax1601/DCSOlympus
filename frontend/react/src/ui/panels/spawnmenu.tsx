import React, { useState, useEffect } from "react";
import { Menu } from "./components/menu";
import { OlSearchBar } from "../components/olsearchbar";
import { OlAccordion } from "../components/olaccordion";
import { getApp } from "../../olympusapp";
import { OlUnitListEntry } from "../components/olunitlistentry";
import { UnitSpawnMenu } from "./unitspawnmenu";
import { UnitBlueprint } from "../../interfaces";
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
import { NO_SUBSTATE, OlympusState, SpawnSubState } from "../../constants/constants";
import { aircraftDatabase } from "../../unit/databases/aircraftdatabase";
import { navyUnitDatabase } from "../../unit/databases/navyunitdatabase";
import { filterBlueprintsByLabel } from "../../other/utils";
import { helicopterDatabase } from "../../unit/databases/helicopterdatabase";
import { groundUnitDatabase } from "../../unit/databases/groundunitdatabase";
import { AppStateChangedEvent } from "../../events";

enum Accordion {
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
  const [openAccordion, setOpenAccordion] = useState(Accordion.NONE);
  const [blueprint, setBlueprint] = useState(null as null | UnitBlueprint);
  const [effect, setEffect] = useState(null as null | string);
  const [filterString, setFilterString] = useState("");
  const [selectedRole, setSelectedRole] = useState(null as null | string);
  const [selectedType, setSelectedType] = useState(null as null | string);

  const filteredAircraft = getApp()
    ? filterBlueprintsByLabel(selectedRole ? aircraftDatabase.getByRole(selectedRole) : Object.values(aircraftDatabase.getBlueprints()), filterString)
    : ({} as { [key: string]: UnitBlueprint });
  const filteredHelicopters = getApp()
    ? filterBlueprintsByLabel(selectedRole ? helicopterDatabase.getByRole(selectedRole) : Object.values(helicopterDatabase.getBlueprints()), filterString)
    : ({} as { [key: string]: UnitBlueprint });
  const filteredSAMs = getApp() ? filterBlueprintsByLabel(groundUnitDatabase.getByType("SAM Site"), filterString) : ({} as { [key: string]: UnitBlueprint });
  const filteredAAA = getApp() ? filterBlueprintsByLabel(groundUnitDatabase.getByType("AAA"), filterString) : ({} as { [key: string]: UnitBlueprint });
  const filteredGroundUnits = getApp()
    ? filterBlueprintsByLabel(selectedType ? groundUnitDatabase.getByType(selectedType) : Object.values(groundUnitDatabase.getBlueprints()), filterString)
    : ({} as { [key: string]: UnitBlueprint });
  const filteredNavyUnits = getApp()
    ? filterBlueprintsByLabel(selectedType ? navyUnitDatabase.getByType(selectedType) : Object.values(navyUnitDatabase.getBlueprints()), filterString)
    : ({} as { [key: string]: UnitBlueprint });

  useEffect(() => {
    if (!props.open) {
      if (blueprint !== null) setBlueprint(null);
      if (effect !== null) setEffect(null);
      if (filterString !== "") setFilterString("");
      if (openAccordion !== Accordion.NONE) setOpenAccordion(Accordion.NONE);
    }
  });

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      if (subState === NO_SUBSTATE) {
        setBlueprint(null);
        setEffect(null);
      }
    });
  }, []);

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
              open={openAccordion == Accordion.AIRCRAFT}
              onClick={() => {
                setOpenAccordion(openAccordion === Accordion.AIRCRAFT ? Accordion.NONE : Accordion.AIRCRAFT);
                setSelectedRole(null);
                setSelectedType(null);
              }}
            >
              <div className="mb-2 flex flex-wrap gap-1">
                {aircraftDatabase
                  .getRoles()
                  .sort()
                  .map((role) => {
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
                {Object.entries(filteredAircraft).map((entry) => {
                  return <OlUnitListEntry key={entry[0]} icon={olButtonsVisibilityAircraft} blueprint={entry[1]} onClick={() => setBlueprint(entry[1])} />;
                })}
              </div>
            </OlAccordion>
            <OlAccordion
              title={`Helicopters`}
              open={openAccordion == Accordion.HELICOPTER}
              onClick={() => {
                setOpenAccordion(openAccordion === Accordion.HELICOPTER ? Accordion.NONE : Accordion.HELICOPTER);
                setSelectedRole(null);
                setSelectedType(null);
              }}
            >
              <div className="mb-2 flex flex-wrap gap-1">
                {helicopterDatabase
                  .getRoles()
                  .sort()
                  .map((role) => {
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
                {Object.entries(filteredHelicopters).map((entry) => {
                  return <OlUnitListEntry key={entry[0]} icon={olButtonsVisibilityHelicopter} blueprint={entry[1]} onClick={() => setBlueprint(entry[1])} />;
                })}
              </div>
            </OlAccordion>
            <OlAccordion
              title={`Surfact to Air Missiles (SAM sites)`}
              open={openAccordion == Accordion.SAM}
              onClick={() => {
                setOpenAccordion(openAccordion === Accordion.SAM ? Accordion.NONE : Accordion.SAM);
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
                {Object.entries(filteredSAMs).map((entry) => {
                  return <OlUnitListEntry key={entry[0]} icon={olButtonsVisibilityGroundunitSam} blueprint={entry[1]} onClick={() => setBlueprint(entry[1])} />;
                })}
              </div>
            </OlAccordion>
            <OlAccordion
              title={`Anti Aircraft Artillery (AAA)`}
              open={openAccordion == Accordion.AAA}
              onClick={() => {
                setOpenAccordion(openAccordion === Accordion.AAA ? Accordion.NONE : Accordion.AAA);
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
                {Object.entries(filteredAAA).map((entry) => {
                  return <OlUnitListEntry key={entry[0]} icon={olButtonsVisibilityGroundunitSam} blueprint={entry[1]} onClick={() => setBlueprint(entry[1])} />;
                })}
              </div>
            </OlAccordion>
            <OlAccordion
              title={`Ground Units`}
              open={openAccordion == Accordion.GROUND_UNIT}
              onClick={() => {
                setOpenAccordion(openAccordion === Accordion.GROUND_UNIT ? Accordion.NONE : Accordion.GROUND_UNIT);
                setSelectedRole(null);
                setSelectedType(null);
              }}
            >
              <div className="mb-2 flex flex-wrap gap-1">
                {groundUnitDatabase
                  .getTypes()
                  .sort()
                  .filter((type) => {
                    return type !== "AAA" && type !== "SAM Site";
                  })
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
                {Object.entries(filteredGroundUnits).map((entry) => {
                  return <OlUnitListEntry key={entry[0]} icon={olButtonsVisibilityGroundunit} blueprint={entry[1]} onClick={() => setBlueprint(entry[1])} />;
                })}
              </div>
            </OlAccordion>
            <OlAccordion
              title={`Ships and submarines`}
              open={openAccordion == Accordion.NAVY_UNIT}
              onClick={() => {
                setOpenAccordion(openAccordion === Accordion.NAVY_UNIT ? Accordion.NONE : Accordion.NAVY_UNIT);
                setSelectedRole(null);
                setSelectedType(null);
              }}
            >
              <div className="mb-2 flex flex-wrap gap-1">
                {navyUnitDatabase
                  .getTypes()
                  .sort()
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
                {Object.entries(filteredNavyUnits).map((entry) => {
                  return <OlUnitListEntry key={entry[0]} icon={olButtonsVisibilityNavyunit} blueprint={entry[1]} onClick={() => setBlueprint(entry[1])} />;
                })}
              </div>
            </OlAccordion>
            <OlAccordion
              title="Effects (smokes, explosions etc)"
              open={openAccordion == Accordion.EFFECT}
              onClick={() => {
                setOpenAccordion(openAccordion === Accordion.EFFECT ? Accordion.NONE : Accordion.EFFECT);
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

        {!(blueprint === null) && <UnitSpawnMenu blueprint={blueprint} spawnAtLocation={true} />}
        {!(effect === null) && <EffectSpawnMenu effect={effect} />}
      </>
    </Menu>
  );
}

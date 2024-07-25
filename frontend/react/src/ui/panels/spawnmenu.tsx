import React, { useState } from "react";
import { Menu } from "./components/menu";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { OlSearchBar } from "../components/olsearchbar";
import { OlAccordion } from "../components/olaccordion";
import { getApp } from "../../olympusapp";
import { OlUnitEntryList } from "../components/olunitlistentry";
import { UnitSpawnMenu } from "./unitspawnmenu";
import { UnitBlueprint } from "../../interfaces";
import {
  olButtonsVisibilityAircraft,
  olButtonsVisibilityGroundunit,
  olButtonsVisibilityGroundunitSam,
  olButtonsVisibilityHelicopter,
  olButtonsVisibilityNavyunit,
} from "../components/olicons";
import { IDLE, SPAWN_UNIT } from "../../constants/constants";

library.add(faPlus);

function filterUnits(
  blueprints: { [key: string]: UnitBlueprint },
  filterString: string
) {
  var filteredUnits = {};
  if (blueprints) {
    Object.entries(blueprints).forEach(([key, value]) => {
      if (
        value.enabled &&
        (filterString === "" || value.label.includes(filterString))
      )
        filteredUnits[key] = value;
    });
  }
  return filteredUnits;
}

export function SpawnMenu(props: {
  open: boolean;
  onClose: () => void;
  children?: JSX.Element | JSX.Element[];
}) {
  var [blueprint, setBlueprint] = useState(null as null | UnitBlueprint);
  var [filterString, setFilterString] = useState("");

  /* Filter aircrafts, helicopters, and navyunits */
  const filteredAircraft = filterUnits(
    getApp()?.getAircraftDatabase()?.blueprints,
    filterString
  );
  const filteredHelicopters = filterUnits(
    getApp()?.getHelicopterDatabase()?.blueprints,
    filterString
  );
  const filteredNavyUnits = filterUnits(
    getApp()?.getNavyUnitDatabase()?.blueprints,
    filterString
  );

  /* Split ground units between air defence and all others */
  var filteredAirDefense = {};
  var filteredGroundUnits = {};
  Object.keys(getApp()?.getGroundUnitDatabase()?.blueprints ?? {}).forEach(
    (key) => {
      var blueprint = getApp()?.getGroundUnitDatabase()?.blueprints[key];
      var type = blueprint.label;
      if (/\bAAA|SAM\b/.test(type) || /\bmanpad|stinger\b/i.test(type)) {
        filteredAirDefense[key] = blueprint;
      } else {
        filteredGroundUnits[key] = blueprint;
      }
    }
  );
  filteredAirDefense = filterUnits(filteredAirDefense, filterString);
  filteredGroundUnits = filterUnits(filteredGroundUnits, filterString);

  if (!props.open) {
    if (getApp()?.getMap()?.getState() === SPAWN_UNIT)
      getApp().getMap().setState(IDLE);
    if (blueprint !== null)
      setBlueprint(null);
  }

  return (
    <Menu
      {...props}
      title="Spawn menu"
      showBackButton={blueprint !== null}
      canBeHidden={true}
      onBack={() => {
        getApp().getMap().setState(IDLE);
        setBlueprint(null);
      }}
    >
      <>
        {blueprint === null && (
          <div className="p-5">
            <OlSearchBar onChange={(ev) => setFilterString(ev.target.value)} />
            <OlAccordion title={`Aircraft`}>
              <div className={`
                flex max-h-80 flex-col gap-1 overflow-y-scroll no-scrollbar
              `}>
                {Object.keys(filteredAircraft).map((key) => {
                  const blueprint =
                    getApp().getAircraftDatabase().blueprints[key];
                  return (
                    <OlUnitEntryList
                      key={key}
                      icon={olButtonsVisibilityAircraft}
                      blueprint={blueprint}
                      onClick={() => setBlueprint(blueprint)}
                    />
                  );
                })}
              </div>
            </OlAccordion>
            <OlAccordion title={`Helicopters`}>
              <div className={`
                flex max-h-80 flex-col gap-1 overflow-y-scroll no-scrollbar
              `}>
                {Object.keys(filteredHelicopters).map((key) => {
                  const blueprint =
                    getApp().getHelicopterDatabase().blueprints[key];
                  return (
                    <OlUnitEntryList
                      key={key}
                      icon={olButtonsVisibilityHelicopter}
                      blueprint={blueprint}
                      onClick={() => setBlueprint(blueprint)}
                    />
                  );
                })}
              </div>
            </OlAccordion>
            <OlAccordion title={`SAM & AAA`}>
              <div className={`
                flex max-h-80 flex-col gap-1 overflow-y-scroll no-scrollbar
              `}>
                {Object.keys(filteredAirDefense).map((key) => {
                  const blueprint =
                    getApp().getGroundUnitDatabase().blueprints[key];
                  return (
                    <OlUnitEntryList
                      key={key}
                      icon={olButtonsVisibilityGroundunitSam}
                      blueprint={blueprint}
                      onClick={() => setBlueprint(blueprint)}
                    />
                  );
                })}
              </div>
            </OlAccordion>
            <OlAccordion title={`Ground Units`}>
              <div className={`
                flex max-h-80 flex-col gap-1 overflow-y-scroll no-scrollbar
              `}>
                {Object.keys(filteredGroundUnits).map((key) => {
                  const blueprint =
                    getApp().getGroundUnitDatabase().blueprints[key];
                  return (
                    <OlUnitEntryList
                      key={key}
                      icon={olButtonsVisibilityGroundunit}
                      blueprint={blueprint}
                      onClick={() => setBlueprint(blueprint)}
                    />
                  );
                })}
              </div>
            </OlAccordion>
            <OlAccordion title={`Ships and submarines`}>
              <div className={`
                flex max-h-80 flex-col gap-1 overflow-y-scroll no-scrollbar
              `}>
                {Object.keys(filteredNavyUnits).map((key) => {
                  const blueprint =
                    getApp().getNavyUnitDatabase().blueprints[key];
                  return (
                    <OlUnitEntryList
                      key={key}
                      icon={olButtonsVisibilityNavyunit}
                      blueprint={blueprint}
                      onClick={() => setBlueprint(blueprint)}
                    />
                  );
                })}
              </div>
            </OlAccordion>
            <OlAccordion title="Effects (smokes, explosions etc)"></OlAccordion>
          </div>
        )}

        {!(blueprint === null) && <UnitSpawnMenu blueprint={blueprint} />}
      </>
    </Menu>
  );
}

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
import { IDLE, SPAWN_EFFECT, SPAWN_UNIT } from "../../constants/constants";
import { getUnitsByLabel } from "../../other/utils";
import { faExplosion, faSmog } from "@fortawesome/free-solid-svg-icons";
import { OlEffectListEntry } from "../components/oleffectlistentry";
import { EffectSpawnMenu } from "./effectspawnmenu";

export function SpawnMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [blueprint, setBlueprint] = useState(null as null | UnitBlueprint);
  const [effect, setEffect] = useState(null as null | string);
  const [filterString, setFilterString] = useState("");

  const [filteredAircraft, filteredHelicopters, filteredAirDefense, filteredGroundUnits, filteredNavyUnits] = getUnitsByLabel(filterString);

  useEffect(() => {
    if (!props.open && getApp()) {
      if (getApp().getMap().getState() === SPAWN_UNIT) getApp().getMap().setState(IDLE);
      else if (getApp().getMap().getState() === SPAWN_EFFECT) getApp().getMap().setState(IDLE);

      if (blueprint !== null) setBlueprint(null);
      if (effect !== null) setEffect(null);
    }
  });

  return (
    <Menu
      {...props}
      title="Spawn menu"
      showBackButton={blueprint !== null || effect !== null}
      canBeHidden={true}
      onBack={() => {
        getApp().getMap().setState(IDLE);
        setBlueprint(null);
        setEffect(null);
      }}
    >
      <>
        {blueprint === null && effect === null && (
          <div className="p-5">
            <OlSearchBar onChange={(value) => setFilterString(value)} text={filterString} />
            <OlAccordion title={`Aircraft`}>
              <div
                className={`
                  flex max-h-80 flex-col gap-1 overflow-y-scroll no-scrollbar
                `}
              >
                {Object.entries(filteredAircraft).map((entry) => {
                  return <OlUnitListEntry key={entry[0]} icon={olButtonsVisibilityAircraft} blueprint={entry[1]} onClick={() => setBlueprint(entry[1])} />;
                })}
              </div>
            </OlAccordion>
            <OlAccordion title={`Helicopters`}>
              <div
                className={`
                  flex max-h-80 flex-col gap-1 overflow-y-scroll no-scrollbar
                `}
              >
                {Object.entries(filteredHelicopters).map((entry) => {
                  return <OlUnitListEntry key={entry[0]} icon={olButtonsVisibilityHelicopter} blueprint={entry[1]} onClick={() => setBlueprint(entry[1])} />;
                })}
              </div>
            </OlAccordion>
            <OlAccordion title={`SAM & AAA`}>
              <div
                className={`
                  flex max-h-80 flex-col gap-1 overflow-y-scroll no-scrollbar
                `}
              >
                {Object.entries(filteredAirDefense).map((entry) => {
                  return <OlUnitListEntry key={entry[0]} icon={olButtonsVisibilityGroundunitSam} blueprint={entry[1]} onClick={() => setBlueprint(entry[1])} />;
                })}
              </div>
            </OlAccordion>
            <OlAccordion title={`Ground Units`}>
              <div
                className={`
                  flex max-h-80 flex-col gap-1 overflow-y-scroll no-scrollbar
                `}
              >
                {Object.entries(filteredGroundUnits).map((entry) => {
                  return <OlUnitListEntry key={entry[0]} icon={olButtonsVisibilityGroundunit} blueprint={entry[1]} onClick={() => setBlueprint(entry[1])} />;
                })}
              </div>
            </OlAccordion>
            <OlAccordion title={`Ships and submarines`}>
              <div
                className={`
                  flex max-h-80 flex-col gap-1 overflow-y-scroll no-scrollbar
                `}
              >
                {Object.entries(filteredNavyUnits).map((entry) => {
                  return <OlUnitListEntry key={entry[0]} icon={olButtonsVisibilityNavyunit} blueprint={entry[1]} onClick={() => setBlueprint(entry[1])} />;
                })}
              </div>
            </OlAccordion>
            <OlAccordion title="Effects (smokes, explosions etc)">
              <div
                className={`
                  flex max-h-80 flex-col gap-1 overflow-y-scroll no-scrollbar
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

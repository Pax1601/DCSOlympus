import React, { useState } from "react";
import { Menu } from "./components/menu";
import { Coalition } from "../../types/types";
import { Airbase } from "../../mission/airbase";
import { FaArrowLeft, FaCompass } from "react-icons/fa6";
import { getUnitsByLabel } from "../../other/utils";
import { UnitBlueprint } from "../../interfaces";
import { OlSearchBar } from "../components/olsearchbar";
import { OlAccordion } from "../components/olaccordion";
import { OlUnitEntryList } from "../components/olunitlistentry";
import { olButtonsVisibilityAircraft, olButtonsVisibilityHelicopter } from "../components/olicons";
import { UnitSpawnMenu } from "./unitspawnmenu";

export function AirbaseMenu(props: { open: boolean; onClose: () => void; airbase: Airbase | null; children?: JSX.Element | JSX.Element[] }) {
  const [blueprint, setBlueprint] = useState(null as null | UnitBlueprint);
  const [filterString, setFilterString] = useState("");

  const [filteredAircraft, filteredHelicopters, _1, _2, _3] = getUnitsByLabel(filterString);

  return (
    <Menu title={props.airbase?.getName() ?? "No airbase selected"} open={props.open} onClose={props.onClose} showBackButton={false} canBeHidden={true}>
      <div
        className={`
          flex flex-col gap-2 font-normal text-gray-800
          dark:text-white
        `}
      >
        <div
          data-coalition={props.airbase?.getCoalition()}
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
            <span>{props.airbase?.getChartData().ICAO !== "" ? props.airbase?.getChartData().ICAO : "N/A"}</span>
          </div>
          <div className="flex w-full justify-between">
            <span className="text-gray-400">TACAN</span>
            <span>{props.airbase?.getChartData().TACAN !== "" ? props.airbase?.getChartData().TACAN : "None"}</span>
          </div>
          <div className="flex w-full justify-between">
            <span className="text-gray-400">Elevation</span>
            <span>{props.airbase?.getChartData().elevation !== "" ? props.airbase?.getChartData().elevation : "N/A"}ft</span>
          </div>

          <OlAccordion title={`Runways`} className="!p-0 !text-gray-400">
            <div className="flex flex-col gap-2">
              {props.airbase?.getChartData().runways.map((runway) => {
                return (
                  <>
                    {Object.keys(runway.headings[0]).map((runwayName) => {
                      return (
                        <div className="flex w-full justify-between">
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

        <div className="mt-5 flex gap-2 px-5 text-white bold">
          {blueprint && (
            <FaArrowLeft
              className={`
                my-auto h-8 w-8 cursor-pointer rounded-md p-2
                dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white
              `}
              onClick={() => setBlueprint(null)}
            />
          )}
          <span className="my-auto">Spawn units at airbase</span>
        </div>
        <>
          {blueprint === null && (
            <div className="p-5">
              <OlSearchBar onChange={(value) => setFilterString(value)} text={filterString} />
              <OlAccordion title={`Aircraft`}>
                <div
                  className={`
                    flex max-h-80 flex-col gap-1 overflow-y-scroll no-scrollbar
                  `}
                >
                  {Object.entries(filteredAircraft).map((entry) => {
                    return <OlUnitEntryList key={entry[0]} icon={olButtonsVisibilityAircraft} blueprint={entry[1]} onClick={() => setBlueprint(entry[1])} />;
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
                    return <OlUnitEntryList key={entry[0]} icon={olButtonsVisibilityHelicopter} blueprint={entry[1]} onClick={() => setBlueprint(entry[1])} />;
                  })}
                </div>
              </OlAccordion>
            </div>
          )}

          {!(blueprint === null) && (
            <UnitSpawnMenu
              blueprint={blueprint}
              spawnAtLocation={false}
              airbase={props.airbase}
              coalition={(props.airbase?.getCoalition() ?? "blue") as Coalition}
            />
          )}
        </>
      </div>
    </Menu>
  );
}

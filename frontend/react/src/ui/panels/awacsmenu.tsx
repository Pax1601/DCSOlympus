import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { OlToggle } from "../components/oltoggle";
import { MAP_OPTIONS_DEFAULTS } from "../../constants/constants";
import { AWACSReferenceChangedEvent as AWACSReferenceUnitChangedEvent, HotgroupsChangedEvent, MapOptionsChangedEvent } from "../../events";
import { getApp } from "../../olympusapp";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { Coalition } from "../../types/types";
import { FaQuestionCircle } from "react-icons/fa";
import { Unit } from "../../unit/unit";

export function AWACSMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [callsign, setCallsign] = useState("Magic");
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  const [coalition, setCoalition] = useState("blue" as Coalition);
  const [hotgroups, setHotgroups] = useState({} as { [key: number]: Unit[] });
  const [referenceUnit, setReferenceUnit] = useState(null as Unit | null);

  useEffect(() => {
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
    HotgroupsChangedEvent.on((hotgroups) => setHotgroups({ ...hotgroups }));
    AWACSReferenceUnitChangedEvent.on((unit) => setReferenceUnit(unit));
  }, []);

  const enemyGroups = Object.values(hotgroups).filter((hotgroup) => {
    return hotgroup.every((unit) => unit.getCoalition() !== coalition)
  })

  return (
    <Menu title={"AWACS Tools"} open={props.open} onClose={props.onClose} showBackButton={false} canBeHidden={true}>
      <div
        className={`
          flex flex-col gap-4 p-4 font-normal text-gray-800
          dark:text-white
        `}
      >
        <>
          <div className="flex content-center gap-4">
            <FaQuestionCircle
              className={`my-auto min-h-5 min-w-5 text-sm text-gray-500`}
            />
            <div className="flex flex-col gap-1 text-sm text-gray-500">
              <p>1 Use the coalition toggle to change your coalition as AWACS.</p>
              <p>2 Set a friendly unit as reference by right clicking on it and selecting "Set AWACS reference".</p>
              <p>3 Set enemy unit hotgroups to automatically create picture and tactical calls to read on radio for your CAP.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="my-auto min-w-32 text-nowrap">Callsign</span>
            <input
              className={`
                block h-10 w-full border-[2px] bg-gray-50 py-2.5 text-center
                text-sm text-gray-900
                dark:border-gray-700 dark:bg-olympus-600 dark:text-white
                dark:placeholder-gray-400 dark:focus:border-blue-700
                dark:focus:ring-blue-700
                focus:border-blue-700 focus:ring-blue-500
              `}
              value={callsign}
              onChange={(ev) => setCallsign(ev.target.value)}
            ></input>
            <OlCoalitionToggle
              onClick={() => {
                coalition === "blue" && setCoalition("neutral");
                coalition === "neutral" && setCoalition("red");
                coalition === "red" && setCoalition("blue");
              }}
              coalition={coalition}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <OlToggle
                onClick={() => {
                  getApp().getMap().setOption("showUnitBullseyes", !mapOptions.showUnitBullseyes);
                }}
                toggled={mapOptions.showUnitBullseyes}
              />{" "}
              Show units Bullseye position
            </div>
            <div className="flex gap-2">
              <OlToggle
                onClick={() => {
                  getApp().getMap().setOption("showUnitBRAA", !mapOptions.showUnitBRAA);
                }}
                toggled={mapOptions.showUnitBRAA}
              />
              Show units BRAA from reference unit
            </div>
          </div>
          <div className="mt-4">
          {
            referenceUnit ? <>
              {
                enemyGroups.length == 0 ? <>
                  No enemy or neutral hotgroup
                </>:<>

                </>
              }
            </>:<>No reference unit selected</>
          }
          </div>
        </>
      </div>
    </Menu>
  );
}

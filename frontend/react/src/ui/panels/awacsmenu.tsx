import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { OlToggle } from "../components/oltoggle";
import { MAP_OPTIONS_DEFAULTS } from "../../constants/constants";
import {
  AWACSReferenceChangedEvent as AWACSReferenceUnitChangedEvent,
  BullseyesDataChangedEvent,
  HotgroupsChangedEvent,
  MapOptionsChangedEvent,
  UnitUpdatedEvent,
} from "../../events";
import { getApp } from "../../olympusapp";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { FaQuestionCircle } from "react-icons/fa";
import { Unit } from "../../unit/unit";
import { Bullseye } from "../../mission/bullseye";

export function AWACSMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [callsign, setCallsign] = useState("Magic");
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  const [hotgroups, setHotgroups] = useState({} as { [key: number]: Unit[] });
  const [referenceUnit, setReferenceUnit] = useState(null as Unit | null);
  const [bullseyes, setBullseyes] = useState(null as null | { [name: string]: Bullseye });
  const [refreshTime, setRefreshTime] = useState(0);

  useEffect(() => {
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
    HotgroupsChangedEvent.on((hotgroups) => setHotgroups({ ...hotgroups }));
    AWACSReferenceUnitChangedEvent.on((unit) => setReferenceUnit(unit)); 
    BullseyesDataChangedEvent.on((bullseyes) => setBullseyes(bullseyes));
    UnitUpdatedEvent.on((unit) => setRefreshTime(Date.now()));
  }, []);

  return (
    <Menu title={"AWACS Tools"} open={props.open} onClose={props.onClose} showBackButton={false}>
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
              <p>2 Optionally, set a friendly unit as reference by left clicking and holding on it and selecting "Set AWACS reference" to create tactical calls.</p>
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
                mapOptions.AWACSCoalition === "blue" && getApp().getMap().setOption("AWACSCoalition", "neutral");
                mapOptions.AWACSCoalition === "neutral" && getApp().getMap().setOption("AWACSCoalition", "red");
                mapOptions.AWACSCoalition === "red" && getApp().getMap().setOption("AWACSCoalition","blue");
              }}
              coalition={mapOptions.AWACSCoalition}
            />
          </div>
          <div className="flex flex-col gap-2">
          <div className="flex gap-2">
              <OlToggle
                onClick={() => {
                  getApp().getMap().setOption("AWACSMode", !mapOptions.AWACSMode);
                }}
                toggled={mapOptions.AWACSMode}
              />{" "}
              Enable AWACS map mode
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {/*}
            {activeGroups.length == 0 ? (
              <>No hotgroups</>
            ) : (
              <>
                Callout: 
                {readout.map((line) => (
                  <span className="font-bold italic text-cyan-500">{line}</span>
                ))}
                <button onClick={() => getApp().getAudioManager().playText(readout.reduce((acc, line) => acc += " " + line, ""))}>Play</button>
              </>
            )}
              {*/}
          </div>
        </>
      </div>
    </Menu>
  );
}

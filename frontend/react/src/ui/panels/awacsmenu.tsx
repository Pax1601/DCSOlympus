import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { OlToggle } from "../components/oltoggle";
import { MAP_OPTIONS_DEFAULTS } from "../../constants/constants";
import {
  AWACSReferenceChangedEvent as AWACSReferenceUnitChangedEvent,
  BullseyesDataChanged,
  HotgroupsChangedEvent,
  MapOptionsChangedEvent,
} from "../../events";
import { getApp } from "../../olympusapp";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { Coalition } from "../../types/types";
import { FaQuestionCircle } from "react-icons/fa";
import { Unit } from "../../unit/unit";
import { Bullseye } from "../../mission/bullseye";
import { coalitionToEnum, computeBearingRangeString, mToFt, rad2deg } from "../../other/utils";

const trackStrings = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"]

export function AWACSMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [callsign, setCallsign] = useState("Magic");
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  const [coalition, setCoalition] = useState("blue" as Coalition);
  const [hotgroups, setHotgroups] = useState({} as { [key: number]: Unit[] });
  const [referenceUnit, setReferenceUnit] = useState(null as Unit | null);
  const [bullseyes, setBullseyes] = useState(null as null | { [name: string]: Bullseye });

  useEffect(() => {
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
    HotgroupsChangedEvent.on((hotgroups) => setHotgroups({ ...hotgroups }));
    AWACSReferenceUnitChangedEvent.on((unit) => setReferenceUnit(unit));
    BullseyesDataChanged.on((bullseyes) => setBullseyes(bullseyes));
  }, []);

  const activeGroups = Object.values(hotgroups).filter((hotgroup) => {
    return hotgroup.every((unit) => unit.getCoalition() !== coalition);
  });

  let readout: string[] = [];

  if (bullseyes) {
    if (referenceUnit) {
      readout.push(`$`);
    } else {
      readout.push(`${callsign}, ${activeGroups.length} group${activeGroups.length > 1 && "s"}`);
      readout.push(
        ...activeGroups.map((group, idx) => {
          let order = "th";
          if (idx == 0) order = "st";
          else if (idx == 1) order = "nd";
          else if (idx == 2) order = "rd";

          let trackDegs = rad2deg(group[0].getTrack())
          if (trackDegs < 0) trackDegs += 360
          let trackIndex = Math.round(trackDegs / 45)
          
          let groupLine = `${idx + 1}${order} group bullseye ${computeBearingRangeString(bullseyes[coalitionToEnum(coalition)].getLatLng(), group[0].getPosition()).replace("/", " ")}, ${ (mToFt(group[0].getPosition().alt ?? 0) / 1000).toFixed()} thousand, track ${trackStrings[trackIndex]}`;
          return groupLine;
        })
      );
      
    }
  }


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
              className={`
              my-auto min-h-5 min-w-5 text-sm text-gray-500
            `}
            />
            <div className="flex flex-col gap-1 text-sm text-gray-500">
              <p>1 Use the coalition toggle to change your coalition as AWACS.</p>
              <p>2 Set enemy unit hotgroups to automatically create picture calls to read on radio for your CAP.</p>
              <p>3 Optionally, set a friendly unit as reference by right clicking on it and selecting "Set AWACS reference" to create tactical calls.</p>
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
                  getApp().getMap().setOption("AWACSMode", !mapOptions.AWACSMode);
                }}
                toggled={mapOptions.AWACSMode}
              />{" "}
              Enable AWACS map mode
            </div>
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
          <div className="mt-4 flex flex-col gap-2">
            {activeGroups.length == 0 ? (
              <>No hotgroups</>
            ) : (
              <>
                Callout: 
                {readout.map((line) => (
                  <span className="font-bold italic text-cyan-500">{line}</span>
                ))}
              </>
            )}
          </div>
        </>
      </div>
    </Menu>
  );
}

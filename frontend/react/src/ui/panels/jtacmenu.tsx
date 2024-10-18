import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { getApp } from "../../olympusapp";
import { IDLE, SELECT_JTAC_ECHO, SELECT_JTAC_IP, SELECT_JTAC_TARGET } from "../../constants/constants";
import { LatLng } from "leaflet";
import { Unit } from "../../unit/unit";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { bearing, point } from "turf";
import { ConvertDDToDMS, latLngToMGRS, mToFt, zeroAppend } from "../../other/utils";
import { FaMousePointer } from "react-icons/fa";
import { OlLocation } from "../components/ollocation";
import { FaBullseye } from "react-icons/fa6";

export function JTACMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [referenceSystem, setReferenceSystem] = useState("LatLngDec");
  const [targetLocation, setTargetLocation] = useState(null as null | LatLng);
  const [targetUnit, setTargetUnit] = useState(null as null | Unit);
  const [IP, setIP] = useState(null as null | LatLng);
  const [ECHO, setECHO] = useState(null as null | LatLng);
  const [mapState, setMapState] = useState(IDLE);
  const [callsign, setCallsign] = useState("Eyeball");
  const [humanUnits, setHumanUnits] = useState([] as Unit[]);
  const [attacker, setAttacker] = useState(null as null | Unit);
  const [type, setType] = useState("Type 1");

  useEffect(() => {
    document.addEventListener("selectJTACTarget", (ev: CustomEventInit) => {
      setTargetLocation(null);
      setTargetUnit(null);

      if (ev.detail.location) setTargetLocation(ev.detail.location);
      if (ev.detail.unit) setTargetUnit(ev.detail.unit);
    });

    document.addEventListener("selectJTACECHO", (ev: CustomEventInit) => {
      setECHO(ev.detail);
    });

    document.addEventListener("selectJTACIP", (ev: CustomEventInit) => {
      setIP(ev.detail);
    });

    document.addEventListener("mapStateChanged", (ev: CustomEventInit) => {
      setMapState(ev.detail);
      if (ev.detail === SELECT_JTAC_TARGET) {
        setTargetLocation(null);
        setTargetUnit(null);
      }
    });
  }, []);

  useEffect(() => {
    if (getApp()) setHumanUnits(Object.values(getApp().getUnitsManager().getUnits()).filter((unit) => unit.getAlive()));
  }, [targetLocation, targetUnit]);

  let IPPosition = "";
  if (IP && ECHO) {
    let dist = Math.round(IP.distanceTo(ECHO) / 1852);
    let bear = bearing(point([ECHO.lng, ECHO.lat]), point([IP.lng, IP.lat]));
    IPPosition = ["A", "AB", "B", "BC", "C", "CD", "D", "DA"][Math.round((bear > 0 ? bear : bear + 360) / 45)] + String(dist);
  }

  let IPtoTargetBear = 0;
  let IPtoTargetDist = 0;

  if (IP) {
    let location = targetUnit ? targetUnit.getPosition() : targetLocation;
    if (location) {
      IPtoTargetDist = Math.round(IP.distanceTo(location) / 1852);
      IPtoTargetBear = bearing(point([IP.lng, IP.lat]), point([location.lng, location.lat]));
      if (IPtoTargetBear < 0) IPtoTargetBear += 360;
      IPtoTargetBear = Math.round(IPtoTargetBear);
    }
  }

  let targetAltitude = targetUnit?.getPosition().alt ?? 0;
  let targetPosition = (targetUnit ? targetUnit.getPosition() : targetLocation) ?? new LatLng(0, 0);

  return (
    <Menu title={"JTAC Tools"} open={props.open} onClose={props.onClose} showBackButton={false} canBeHidden={true}>
      <div
        className={`
          flex flex-col gap-2 p-4 font-normal text-gray-800
          dark:text-white
        `}
      >
        <>
          <div className="flex">
            <span className="my-auto min-w-32 text-nowrap">JTAC Callsign</span>
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
          </div>
          <div className="flex">
            <span
              className={`
                my-auto h-full min-w-10 text-nowrap p-2 text-center
              `}
            >
              BP
            </span>
            <OlLocation
              location={ECHO ?? new LatLng(0, 0)}
              className={`
                h-full w-full rounded-l-lg
                ${!ECHO ? "text-red-600" : ""}
              `}
              onClick={() => {
                if (referenceSystem === "MGRS") setReferenceSystem("LatLngDec");
                else if (referenceSystem === "LatLngDec") setReferenceSystem("LatLngDMS");
                else setReferenceSystem("MGRS");
              }}
              referenceSystem={referenceSystem}
            />
            <button
              type="button"
              onClick={() => {
                getApp().getMap().setState(SELECT_JTAC_ECHO);
              }}
              className={`
                rounded-r-md bg-blue-700 px-3 py-2.5 text-md font-medium
                text-white
                dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
                focus:outline-none focus:ring-4 focus:ring-blue-300
                hover:bg-blue-800
              `}
            >
              <FaMousePointer />
            </button>
          </div>
          <div className="flex">
            <span
              className={`
              my-auto h-full min-w-10 text-nowrap p-2 text-center
            `}
            >
              IP
            </span>
            <OlLocation
              location={IP ?? new LatLng(0, 0)}
              className={`
                h-full w-full rounded-l-lg
                ${!IP ? "text-red-600" : ""}
              `}
              onClick={() => {
                if (referenceSystem === "MGRS") setReferenceSystem("LatLngDec");
                else if (referenceSystem === "LatLngDec") setReferenceSystem("LatLngDMS");
                else setReferenceSystem("MGRS");
              }}
              referenceSystem={referenceSystem}
            />
            <button
              type="button"
              onClick={() => {
                getApp().getMap().setState(SELECT_JTAC_IP);
              }}
              className={`
                rounded-r-lg bg-blue-700 px-3 py-2.5 text-md font-medium
                text-white
                dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
                focus:outline-none focus:ring-4 focus:ring-blue-300
                hover:bg-blue-800
              `}
            >
              <FaMousePointer />
            </button>
          </div>
          <div className="flex">
            <span
              className={`
              my-auto h-full min-w-10 text-nowrap p-3 text-center
            `}
            >
              <FaBullseye />
            </span>
            <OlLocation
              location={(targetUnit ? targetUnit.getPosition() : targetLocation) ?? new LatLng(0, 0)}
              className={`
                h-full w-full rounded-l-lg
                ${!(targetUnit || targetLocation) ? "text-red-600" : ""}
              `}
              onClick={() => {
                if (referenceSystem === "MGRS") setReferenceSystem("LatLngDec");
                else if (referenceSystem === "LatLngDec") setReferenceSystem("LatLngDMS");
                else setReferenceSystem("MGRS");
              }}
              referenceSystem={referenceSystem}
            />
            <button
              type="button"
              onClick={() => {
                getApp().getMap().setState(SELECT_JTAC_TARGET);
              }}
              className={`
                rounded-r-lg bg-blue-700 px-3 py-2.5 text-md font-medium
                text-white
                dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
                focus:outline-none focus:ring-4 focus:ring-blue-300
                hover:bg-blue-800
              `}
            >
              <FaMousePointer />
            </button>
          </div>

          <div className="flex gap-2">
            <span className="my-auto min-w-32 text-nowrap">Attacker:</span>{" "}
            <OlDropdown
              label={attacker ? attacker.getUnitName() : "Select unit"}
              className={`w-full truncate`}
            >
              {humanUnits.map((unit, idx) => {
                return (
                  <OlDropdownItem
                    key={idx}
                    onClick={() => {
                      setAttacker(unit);
                    }}
                    className="truncate"
                  >
                    <span className="truncate">{unit.getUnitName()}</span>
                  </OlDropdownItem>
                );
              })}
            </OlDropdown>
          </div>
        </>
        {(targetLocation || targetUnit) && (
          <div className="flex flex-col gap-2">
            <span>9 Line</span>
            <div className="flex flex-col">
              <span className="italic">
                {attacker?.getUnitName()}, {callsign}.
              </span>
              <span className="italic">
                This will be a {type.toLowerCase()} attack, {targetLocation ? "bombs on coordinates" : "bombs on target"}.
              </span>
              {IP ? (
                <span className="italic">
                  <span className="font-bold text-purple-500">(1, 2, 3)</span> Entry keyhole {IPPosition}, heading {IPtoTargetBear}, {IPtoTargetDist} miles
                </span>
              ) : (
                <span className="italic">
                  <span className="font-bold text-purple-500">(1, 2, 3)</span> Not applicable
                </span>
              )}
              <span className="italic">
                <span className={`font-bold text-purple-500`}>(4)</span> Elevation {Math.round(mToFt(targetAltitude))}ft
              </span>
              <span className="italic">
                <span className="font-bold text-purple-500">(5)</span> Target is {targetUnit ? targetUnit.getType() : "insert description"}
              </span>
              <span className="italic">
                <span className="font-bold text-purple-500">(6)</span> Located{" "}
                {referenceSystem === "LatLngDMS" && (
                  <>
                    {(targetPosition.lat >= 0 ? "N" : "S") + ConvertDDToDMS(targetPosition.lat, false)}{" "}
                    {(targetPosition.lng >= 0 ? "E" : "W") + ConvertDDToDMS(targetPosition.lng, true)}
                  </>
                )}
                {referenceSystem === "LatLngDec" && (
                  <>
                    {(targetPosition.lat >= 0 ? "N" : "S") + zeroAppend(targetPosition.lat, 3, true, 6)}{" "}
                    {(targetPosition.lng >= 0 ? "E" : "W") + zeroAppend(targetPosition.lng, 3, true, 6)}
                  </>
                )}
                {referenceSystem === "MGRS" && (
                  <>
                    {latLngToMGRS(targetPosition.lat, targetPosition.lng, 6).string}
                  </>
                )}
              </span>
              <span className="italic">
                <span className="font-bold text-purple-500">(7)</span> Marked by XXX
              </span>
              <span className="italic">
                <span className="font-bold text-purple-500">(8)</span> Friendlies XXX
              </span>
            </div>
          </div>
        )}
      </div>
    </Menu>
  );
}

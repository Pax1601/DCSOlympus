import React, { useEffect, useState } from "react";
import { OlLocation } from "../components/ollocation";
import { LatLng } from "leaflet";
import { FaBullseye, FaChevronDown, FaChevronUp, FaJetFighter, FaMountain } from "react-icons/fa6";
import { BullseyesDataChanged, MouseMovedEvent, SelectedUnitsChangedEvent } from "../../events";
import { bearing, mToFt } from "../../other/utils";
import { Bullseye } from "../../mission/bullseye";
import { Unit } from "../../unit/unit";

export function CoordinatesPanel(props: {}) {
  const [open, setOpen] = useState(false);
  const [latlng, setLatlng] = useState(new LatLng(0, 0));
  const [elevation, setElevation] = useState(0);
  const [bullseyes, setBullseyes] = useState(null as null | { [name: string]: Bullseye });
  const [selectedUnits, setSelectedUnits] = useState([] as Unit[]);

  useEffect(() => {
    MouseMovedEvent.on((latlng, elevation) => {
      setLatlng(latlng);
      if (elevation) setElevation(elevation);
    });

    BullseyesDataChanged.on((bullseyes) => setBullseyes(bullseyes));

    SelectedUnitsChangedEvent.on((selectedUnits) => setSelectedUnits(selectedUnits));
  }, []);

  return (
    <div
      className={`
        absolute bottom-[20px] right-[310px] flex min-h-12 w-[380px] flex-col
        items-center justify-between gap-2 rounded-lg bg-gray-200 px-3 py-3
        text-sm backdrop-blur-lg backdrop-grayscale
        dark:bg-olympus-800/90 dark:text-gray-200
      `}
    >
      {" "}
      {open && (
        <>
          {bullseyes && (
            <div className="flex w-full items-center justify-start">
              <div
                className={`
                  flex min-w-64 max-w-64 items-center justify-between gap-2
                `}
              >
                <div className="flex justify-start gap-2">
                  <span
                    className={`
                      rounded-sm bg-blue-500 px-1 py-1 text-center font-bold
                      text-olympus-700
                    `}
                  >
                    <FaBullseye />
                  </span>{" "}
                  {bearing(bullseyes[2].getLatLng().lat, bullseyes[2].getLatLng().lng, latlng.lat, latlng.lng).toFixed()}° /{" "}
                  {(bullseyes[2].getLatLng().distanceTo(latlng) / 1852).toFixed(0)}
                </div>
                <div className="flex w-[50%] justify-start gap-2">
                  <span
                    className={`
                      rounded-sm bg-red-500 px-1 py-1 text-center font-bold
                      text-olympus-700
                    `}
                  >
                    <FaBullseye />
                  </span>
                  {bearing(bullseyes[1].getLatLng().lat, bullseyes[1].getLatLng().lng, latlng.lat, latlng.lng).toFixed()}° /{" "}
                  {(bullseyes[1].getLatLng().distanceTo(latlng) / 1852).toFixed(0)}
                </div>
              </div>
              {selectedUnits.length == 1 && (
                <div className="flex justify-start gap-2">
                  <span
                    className={`
                      rounded-sm bg-white px-1 py-1 text-center font-bold
                      text-olympus-700
                    `}
                  >
                    <FaJetFighter />
                  </span>
                  <div>
                    {" "}
                    {bearing(selectedUnits[0].getLatLng().lat, selectedUnits[0].getLatLng().lng, latlng.lat, latlng.lng).toFixed()}° /
                    {(selectedUnits[0].getLatLng().distanceTo(latlng) / 1852).toFixed(0)}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      <div className="flex w-full items-center justify-between">
        <OlLocation className="!min-w-64 !max-w-64 bg-transparent !p-0" location={latlng} />
        <span
          className={`
            mr-2 rounded-sm bg-white px-1 py-1 text-center font-bold
            text-olympus-700
          `}
        >
          <FaMountain />
        </span>
        <div className="min-w-12">{mToFt(elevation).toFixed()}ft</div>
        {open ? (
          <FaChevronDown className="w-10 cursor-pointer" onClick={() => setOpen(!open)} />
        ) : (
          <FaChevronUp className="w-10 cursor-pointer" onClick={() => setOpen(!open)} />
        )}
      </div>
    </div>
  );
}
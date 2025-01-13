import React, { useEffect, useState } from "react";
import { OlLocation } from "../components/ollocation";
import { LatLng } from "leaflet";
import { FaBullseye, FaChevronDown, FaChevronUp, FaJetFighter, FaMountain } from "react-icons/fa6";
import { BullseyesDataChangedEvent, MouseMovedEvent, SelectedUnitsChangedEvent, SelectionClearedEvent } from "../../events";
import { computeBearingRangeString, mToFt } from "../../other/utils";
import { Bullseye } from "../../mission/bullseye";
import { Unit } from "../../unit/unit";

export function CoordinatesPanel(props: {}) {
  const [latlng, setLatlng] = useState(new LatLng(0, 0));
  const [elevation, setElevation] = useState(0);
  const [bullseyes, setBullseyes] = useState(null as null | { [name: string]: Bullseye });
  const [selectedUnits, setSelectedUnits] = useState([] as Unit[]);

  useEffect(() => {
    MouseMovedEvent.on((latlng, elevation) => {
      setLatlng(latlng);
      if (elevation) setElevation(elevation);
    });

    BullseyesDataChangedEvent.on((bullseyes) => setBullseyes(bullseyes));
    SelectedUnitsChangedEvent.on((selectedUnits) => setSelectedUnits(selectedUnits));
    SelectionClearedEvent.on(() => setSelectedUnits([]))
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
      {bullseyes && (
        <div className="flex w-full items-center justify-start">
          <div
            className={`
              mr-[11px] flex min-w-64 max-w-64 items-center justify-between
              gap-2
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
              {computeBearingRangeString(bullseyes[2].getLatLng(), latlng)}
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
              {computeBearingRangeString(bullseyes[1].getLatLng(), latlng)}
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
              <div> {computeBearingRangeString(selectedUnits[0].getPosition(), latlng)}</div>
            </div>
          )}
        </div>
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
      </div>
    </div>
  );
}

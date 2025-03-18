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
  const [open, setOpen] = useState(true);

  useEffect(() => {
    MouseMovedEvent.on((latlng, elevation) => {
      setLatlng(latlng);
      if (elevation) setElevation(elevation);
    });

    BullseyesDataChangedEvent.on((bullseyes) => setBullseyes(bullseyes));
    SelectedUnitsChangedEvent.on((selectedUnits) => setSelectedUnits(selectedUnits));
    SelectionClearedEvent.on(() => setSelectedUnits([]));
  }, []);

  return (
    <div
      className={`
        flex w-full flex-col items-center justify-between gap-2 rounded-lg
        bg-gray-200 px-3 py-3 text-sm backdrop-blur-lg backdrop-grayscale
        dark:bg-olympus-800/90 dark:text-gray-200
      `}
      onClick={() => setOpen(!open)}
    >
      <div className="absolute right-[12px] top-[15px]">
        {open ? (
          <FaChevronDown className="cursor-pointer" />
        ) : (
          <FaChevronUp
            className={`cursor-pointer`}
          />
        )}
      </div>
      {open && bullseyes && (
        <div
          className={`
            flex w-full flex-col items-start justify-start gap-2
          `}
        >
          <div
            className={`
              flex flex min-w-64 max-w-64 items-start justify-between gap-2
            `}
          >
            {bullseyes[2] && (
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
            )}
            {bullseyes[1] && (
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
            )}
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

      <div
        className={`
        flex w-full items-center justify-between pointer-events-all
      `}
      >
        <OlLocation className="!min-w-64 !max-w-64 bg-transparent !p-0" location={latlng} />
      </div>

      {open && (
        <div className="flex w-full items-center justify-start">
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
      )}
    </div>
  );
}

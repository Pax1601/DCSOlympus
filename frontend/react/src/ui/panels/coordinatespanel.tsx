import React, { useEffect, useRef, useState } from "react";
import { OlLocation } from "../components/ollocation";
import { LatLng } from "leaflet";
import { FaBullseye, FaChevronDown, FaChevronUp, FaJetFighter, FaMountain, FaCopy, FaXmark } from "react-icons/fa6";
import { BullseyesDataChangedEvent, CoordinatesFreezeEvent, MouseMovedEvent, SelectedUnitsChangedEvent, SelectionClearedEvent } from "../../events";
import { computeBearingRangeString, ConvertDDToDMS, DDToDDM, latLngToMGRS, mToFt, zeroAppend } from "../../other/utils";
import { Bullseye } from "../../mission/bullseye";
import { Unit } from "../../unit/unit";
import { getApp } from "../../olympusapp";

export function CoordinatesPanel(props: {}) {
  const [latlng, setLatlng] = useState(new LatLng(0, 0));
  const [elevation, setElevation] = useState(0);
  const [bullseyes, setBullseyes] = useState(null as null | { [name: string]: Bullseye });
  const [selectedUnits, setSelectedUnits] = useState([] as Unit[]);
  const [open, setOpen] = useState(true);
  const [copyCoordsOpen, setCopyCoordsOpen] = useState(false);
  const [refSystem, setRefSystem] = useState("LatLngDec");
  const [copyableCoordinates, setCopyableCoordinates] = useState("To start, click any point on the map.");
  
  useEffect(() => {
    MouseMovedEvent.on((latlng, elevation) => {
      setLatlng(latlng);
      if (elevation) setElevation(elevation);
    });

    BullseyesDataChangedEvent.on((bullseyes) => setBullseyes(bullseyes));
    SelectedUnitsChangedEvent.on((selectedUnits) => setSelectedUnits(selectedUnits));
    SelectionClearedEvent.on(() => setSelectedUnits([]));
    CoordinatesFreezeEvent.on( () => {
      setCopyableCoordinates(getCopyableCoordinates());
    });
  }, [refSystem, latlng, elevation]);

  const getCopyableCoordinates = () => {
    let returnString = '';
    
    switch (refSystem) {
      case "LatLngDec":
        returnString = `${latlng.lat >= 0 ? "N" : "S"} ${zeroAppend(latlng.lat, 3, true, 6)}°, ${latlng.lng >= 0 ? "E" : "W"} ${zeroAppend(latlng.lng, 3, true, 6)}°,`
        break;
      case "LatLngDMS":
        returnString = `${latlng.lat >= 0 ? "N" : "S"} ${ConvertDDToDMS(latlng.lat, false)}, ${latlng.lng >= 0 ? "E" : "W"} ${ConvertDDToDMS(latlng.lng, false)},`
        break;
      case "LatLngDDM":
        returnString = `${latlng.lat >= 0 ? "N" : "S"} ${DDToDDM(latlng.lat)}, ${latlng.lng >= 0 ? "E" : "W"} ${DDToDDM(latlng.lng)}`;
        break;
      case "MGRS":
        returnString = latLngToMGRS(latlng.lat, latlng.lng, 6)?.groups.join(" ") || "Error";
        break;
    }

    returnString += ` Elevation: ${Math.round(elevation)}ft`;

    return returnString;
  };

  return (
    <div
      className={`
        flex w-full flex-col justify-between gap-2 rounded-lg bg-gray-200 px-3
        py-3 text-sm backdrop-blur-lg backdrop-grayscale
        dark:bg-olympus-800/90 dark:text-gray-200
      `}
    >
      <div className="absolute right-[12px] top-[15px]" onClick={() => setOpen(!open)}>
        {open ? (
          <FaChevronDown className="cursor-pointer" />
        ) : (
          <FaChevronUp
            className={`cursor-pointer`}
          />
        )}
      </div>
      {open && bullseyes && (
        <div className={`flex w-full flex-col items-start justify-start gap-2`}>
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
        className={`flex w-full items-center justify-between pointer-events-all`}
      >
        <OlLocation onRefSystemChange={(evt) => setRefSystem(evt)} className={`
          !min-w-64 !max-w-64 bg-transparent !p-0
        `} location={latlng} />
      </div>

      {open && [
        <div
          className={`
            flex w-full min-w-64 max-w-64 items-center justify-between
          `}
        >
          <div className="flex">
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

          <div
            className="ml-auto flex w-[50%]"
            onClick={async (evt) => {
              evt.stopPropagation();
              
              if (isSecureContext && navigator.clipboard) {
                try {
                  await navigator.clipboard.writeText(copyableCoordinates);
                  getApp().addInfoMessage(`Coordinates copied to clipboard: ${copyableCoordinates}`);
                } catch (err) {
                  setCopyCoordsOpen(true);
                  console.error('Failed to copy text: ', err);
                }
              } else {
                setCopyCoordsOpen(true);
              }
            }}
          >
            <span
              className={`
                mr-2 rounded-sm bg-white px-1 py-1 text-center font-bold
                text-olympus-700
              `}
            >
              <FaCopy />
            </span>
            <div className="min-w-12">Copy last click</div>
          </div>
        </div>,

        open && copyCoordsOpen && (
          <div
            className={`
              relative mt-2 flex w-full min-w-64 items-center justify-between
            `}
            onClick={(evt) => evt.stopPropagation()}
          >
            <textarea readOnly={true} className={`
              resize-none rounded-md border-2 border-gray-600 bg-olympus-600 p-2
              text-gray-200
            `} name="coordsTextArea" id="coordsTextArea" cols={25} rows={2} value={copyableCoordinates}></textarea>

            <div className="absolute right-[0] top-[0px] background-transparent" onClick={() => setCopyCoordsOpen(false)}>
              <FaXmark className="cursor-pointer" />
            </div>
          </div>
        ),
      ]}
    </div>
  );
}

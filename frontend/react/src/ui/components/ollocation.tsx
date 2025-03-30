import React, { useState } from "react";
import { LatLng } from "leaflet";
import { ConvertDDToDMS, DDToDDM, latLngToMGRS, latLngToUTM, zeroAppend } from "../../other/utils";

export function OlLocation(props: { location: LatLng; className?: string; referenceSystem?: string; onClick?: () => void; onRefSystemChange?: (refSystem: string) => any }) {
  const [referenceSystem, setReferenceSystem] = props.referenceSystem ? [props.referenceSystem, () => {}] : useState("LatLngDec");
  const MGRS = latLngToMGRS(props.location.lat, props.location.lng, 6);
  if (referenceSystem === "MGRS") {
    return (
      <div
        className={`
          ${props.className ?? ""}
          my-auto cursor-pointer bg-olympus-400 p-2 text-white
        `}
        onClick={
          props.onClick
            ? props.onClick
            : (ev) => {
                setReferenceSystem("LatLngDec");
                props.onRefSystemChange ? props.onRefSystemChange("LatLngDec") : null;
                ev.stopPropagation();
              }
        }
      >
        <span
          className={`
            mr-2 rounded-sm bg-white px-1 text-center font-bold text-olympus-700
          `}
        >
          MGRS
        </span>
        {MGRS ? MGRS.groups.join(" ") : "Error"}
      </div>
    );
  } else if (referenceSystem === "LatLngDec") {
    return (
      <div
        className={`
          ${props.className ?? ""}
          my-auto flex cursor-pointer justify-between gap-2 bg-olympus-400 p-2
          text-white
        `}
        onClick={
          props.onClick
            ? props.onClick
            : (ev) => {
                setReferenceSystem("LatLngDMS");
                props.onRefSystemChange ? props.onRefSystemChange("LatLngDMS") : null;
                ev.stopPropagation();
              }
        }
      >
        <div className="flex gap-2">
          <span
            className={`
              w-5 rounded-sm bg-white text-center font-bold text-olympus-700
            `}
          >
            {props.location.lat >= 0 ? "N" : "S"}
          </span>
          {zeroAppend(props.location.lat, 3, true, 6)}°
        </div>
        <div className="flex w-[50%] gap-2">
          <span
            className={`
              w-5 rounded-sm bg-white text-center font-bold text-olympus-700
            `}
          >
            {props.location.lng >= 0 ? "E" : "W"}
          </span>
          {zeroAppend(props.location.lng, 3, true, 6)}°
        </div>
      </div>
    );
  } else if (referenceSystem === "LatLngDMS") {
    return (
      <div
        className={`
          ${props.className ?? ""}
          my-auto flex cursor-pointer justify-between gap-2 bg-olympus-400 p-2
          text-white
        `}
        onClick={
          props.onClick
            ? props.onClick
            : (ev) => {
                setReferenceSystem("LatLngDDM");
                props.onRefSystemChange ? props.onRefSystemChange("LatLngDDM") : null;
                ev.stopPropagation();
              }
        }
      >
        <div className="flex gap-2">
          <span
            className={`
              w-5 rounded-sm bg-white text-center font-bold text-olympus-700
            `}
          >
            {props.location.lat >= 0 ? "N" : "S"}
          </span>
          {ConvertDDToDMS(props.location.lat, false)}
        </div>
        <div className="flex w-[50%] gap-2">
          <span
            className={`
              w-5 rounded-sm bg-white text-center font-bold text-olympus-700
            `}
          >
            {props.location.lng >= 0 ? "E" : "W"}
          </span>
          {ConvertDDToDMS(props.location.lng, false)}
        </div>
      </div>
    );
  } else if (referenceSystem === "LatLngDDM") {
    return (
      <div
        className={`
          ${props.className ?? ""}
          my-auto flex cursor-pointer justify-between gap-2 bg-olympus-400 p-2
          text-white
        `}
        onClick={
          props.onClick
            ? props.onClick
            : (ev) => {
                setReferenceSystem("MGRS");
                props.onRefSystemChange ? props.onRefSystemChange("MGRS") : null;
                ev.stopPropagation();
              }
        }
      >
        <div className="flex gap-2">
          <span
            className={`
              w-5 rounded-sm bg-white text-center font-bold text-olympus-700
            `}
          >
            {props.location.lat >= 0 ? "N" : "S"}
          </span>
          {DDToDDM(props.location.lat)}
        </div>
        <div className="flex w-[50%] gap-2">
          <span
            className={`
              w-5 rounded-sm bg-white text-center font-bold text-olympus-700
            `}
          >
            {props.location.lng >= 0 ? "E" : "W"}
          </span>
          {DDToDDM(props.location.lng)}
        </div>
      </div>
    );
  } else {
  }
}

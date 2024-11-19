import React, { useEffect, useState } from "react";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { getApp } from "../../olympusapp";
import { OlympusState, SpawnSubState } from "../../constants/constants";
import { OlStateButton } from "../components/olstatebutton";
import { faArrowLeft, faSmog } from "@fortawesome/free-solid-svg-icons";
import { LatLng } from "leaflet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function CompactEffectSpawnMenu(props: { effect: string; latlng: LatLng; onBack: () => void }) {
  const [explosionType, setExplosionType] = useState("High explosive");
  const [smokeColor, setSmokeColor] = useState("white");

  return (
    <div className="flex h-full flex-col gap-4">
      {props.effect === "explosion" && (
        <>
          <div className="flex">
            <FontAwesomeIcon
              onClick={props.onBack}
              icon={faArrowLeft}
              className={`
                my-auto mr-1 h-4 cursor-pointer rounded-md p-2
                dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white
              `}
            />
            <span className="my-auto text-white">Explosion type</span>
          </div>
          <OlDropdown label={explosionType} className="w-full">
            {["High explosive", "Napalm", "White phosphorous"].map((optionExplosionType) => {
              return (
                <OlDropdownItem
                  key={optionExplosionType}
                  onClick={() => {
                    setExplosionType(optionExplosionType);
                  }}
                >
                  {optionExplosionType}
                </OlDropdownItem>
              );
            })}
          </OlDropdown>
        </>
      )}
      {props.effect === "smoke" && (
        <>
          <div className="flex">
            <FontAwesomeIcon
              onClick={props.onBack}
              icon={faArrowLeft}
              className={`
                my-auto mr-1 h-4 cursor-pointer rounded-md p-2
                dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white
              `}
            />
            <span className="my-auto text-white">Smoke color</span>
          </div>
          <div className="flex w-full gap-2">
            {["white", "blue", "red", "green", "orange"].map((optionSmokeColor) => {
              return (
                <OlStateButton
                  checked={smokeColor === optionSmokeColor}
                  icon={faSmog}
                  onClick={() => {
                    setSmokeColor(optionSmokeColor);
                  }}
                  tooltip=""
                  buttonColor={optionSmokeColor}
                />
              );
            })}
          </div>
        </>
      )}
      <button
        type="button"
        className={`
          m-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white
          focus:outline-none focus:ring-4
        `}
        onClick={() => {
          if (props.effect === "explosion") {
            if (explosionType === "High explosive") getApp().getServerManager().spawnExplosion(50, "normal", props.latlng);
            else if (explosionType === "Napalm") getApp().getServerManager().spawnExplosion(50, "napalm", props.latlng);
            else if (explosionType === "White phosphorous") getApp().getServerManager().spawnExplosion(50, "phosphorous", props.latlng);
            getApp().getMap().addExplosionMarker(props.latlng);
          } else if (props.effect === "smoke") {
            getApp().getServerManager().spawnSmoke(smokeColor, props.latlng);
            getApp()
              .getMap()
              .addSmokeMarker(props.latlng, smokeColor ?? "white");
          }

          getApp().setState(OlympusState.IDLE);
        }}
      >
        Spawn
      </button>
    </div>
  );
}

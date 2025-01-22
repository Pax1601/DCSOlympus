import React, { useCallback, useEffect, useState } from "react";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { getApp } from "../../olympusapp";
import { NO_SUBSTATE, OlympusState, OlympusSubState, SpawnSubState } from "../../constants/constants";
import { OlStateButton } from "../components/olstatebutton";
import { faArrowLeft, faSmog } from "@fortawesome/free-solid-svg-icons";
import { LatLng } from "leaflet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppStateChangedEvent } from "../../events";

export function EffectSpawnMenu(props: { visible: boolean; compact: boolean; effect: string | null; latlng?: LatLng | null; onBack?: () => void }) {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE as OlympusSubState);
  const [explosionType, setExplosionType] = useState("High explosive");
  const [smokeColor, setSmokeColor] = useState("white");

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
  }, []);

  /* When the menu is opened show the effect preview on the map as a cursor */
  const updateEffectRequestTable = useCallback(() => {
    if (!props.compact) {
      if (props.effect !== null) {
        if (props.effect === "explosion")
          getApp()?.getMap()?.setEffectRequestTable({
            type: props.effect,
            explosionType,
          });
        else if (props.effect === "smoke")
          getApp()?.getMap()?.setEffectRequestTable({
            type: props.effect,
            smokeColor,
          });
        getApp().setState(OlympusState.SPAWN, SpawnSubState.SPAWN_EFFECT);
      } else {
        if (appState === OlympusState.SPAWN && appSubState === SpawnSubState.SPAWN_EFFECT) getApp().setState(OlympusState.IDLE);
      }
    }
  }, [props.visible, explosionType, smokeColor, props.effect]);
  useEffect(updateEffectRequestTable, [props.visible, explosionType, smokeColor]);

  return (
    <>
      {props.visible ? (
        <>
          <div className="flex h-full flex-col gap-4 p-4">
            {props.effect === "explosion" && (
              <>
                <div className="flex">
                  {props.compact && (
                    <FontAwesomeIcon
                      onClick={props.onBack}
                      icon={faArrowLeft}
                      className={`
                        my-auto mr-1 h-4 cursor-pointer rounded-md p-2
                        dark:text-gray-500 dark:hover:bg-gray-700
                        dark:hover:text-white
                      `}
                    />
                  )}
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
                  {props.compact && (
                    <FontAwesomeIcon
                      onClick={props.onBack}
                      icon={faArrowLeft}
                      className={`
                        my-auto mr-1 h-4 cursor-pointer rounded-md p-2
                        dark:text-gray-500 dark:hover:bg-gray-700
                        dark:hover:text-white
                      `}
                    />
                  )}
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
            {props.compact && (
              <button
                type="button"
                className={`
                  m-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium
                  text-white
                  focus:outline-none focus:ring-4
                `}
                onClick={() => {
                  if (props.latlng) {
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
                  }

                  getApp().setState(OlympusState.IDLE);
                }}
              >
                Spawn
              </button>
            )}
          </div>
        </>
      ) : (
        <></>
      )}
    </>
  );
}

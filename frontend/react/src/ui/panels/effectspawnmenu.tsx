import React, { useCallback, useEffect, useState } from "react";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { getApp } from "../../olympusapp";
import { colors, NO_SUBSTATE, OlympusState, OlympusSubState, SpawnSubState } from "../../constants/constants";
import { OlStateButton } from "../components/olstatebutton";
import { faArrowLeft, faSmog } from "@fortawesome/free-solid-svg-icons";
import { LatLng } from "leaflet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppStateChangedEvent } from "../../events";
import { FaQuestionCircle } from "react-icons/fa";

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
        else if (props.effect === "smoke") {
          let colorName = "white";
          if (smokeColor === colors.BLUE) colorName = "blue";
          else if (smokeColor === colors.RED) colorName = "red";
          else if (smokeColor === colors.GREEN) colorName = "green";
          else if (smokeColor === colors.ORANGE) colorName = "orange";
          getApp()?.getMap()?.setEffectRequestTable({
            type: props.effect,
            smokeColor: colorName,
          });
        }
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
                  {["High explosive", "Napalm", "White phosphorous", "Fire"].map((optionExplosionType) => {
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
                <div className="flex content-center gap-4 p-4">
                  <div className="mt-8 text-gray-400">
                    <FaQuestionCircle />
                  </div>
                  <div className="text-sm text-gray-400">
                    Click on the map to generate an explosion effect. The type of explosion will be the one selected above.
                    The possible explosion effects are:
                    <li>High explosive: a normal explosion, like the one from a conventional bomb;</li>
                    <li>Napalm: an explosion with a longer lasting fire effect;</li>
                    <li>White phosphorous: an explosion with multiple white flares ejecting from the blast;</li>
                    <li>Fire: a long lasting static fire.</li>
                  </div>
                </div>
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
                  {[colors.WHITE, colors.BLUE, colors.RED, colors.GREEN, colors.ORANGE].map((optionSmokeColor) => {
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

                <div className="flex content-center gap-4 p-4">
                  <div className="my-auto text-gray-400">
                    <FaQuestionCircle />
                  </div>
                  <div className="text-sm text-gray-400">
                    Click on the map to generate a colored smoke effect. The color of the smoke will be the one selected above.
                  </div>
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
                      else if (explosionType === "Fire") getApp().getServerManager().spawnExplosion(50, "fire", props.latlng);
                      getApp().getMap().addExplosionMarker(props.latlng);
                    } else if (props.effect === "smoke") {
                      /* Find the name of the color */
                      let colorName = "white";
                      if (smokeColor === colors.BLUE) colorName = "blue";
                      else if (smokeColor === colors.RED) colorName = "red";
                      else if (smokeColor === colors.GREEN) colorName = "green";
                      else if (smokeColor === colors.ORANGE) colorName = "orange";
                      getApp().getServerManager().spawnSmoke(colorName, props.latlng);
                      getApp()
                        .getMap()
                        .addSmokeMarker(props.latlng, smokeColor ?? colors.WHITE);
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

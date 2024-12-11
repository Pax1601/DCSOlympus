import React, { useEffect, useState } from "react";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { getApp } from "../../olympusapp";
import { OlympusState, SpawnSubState } from "../../constants/constants";
import { OlStateButton } from "../components/olstatebutton";
import { faSmog } from "@fortawesome/free-solid-svg-icons";

export function EffectSpawnMenu(props: { effect: string }) {
  const [explosionType, setExplosionType] = useState("High explosive");
  const [smokeColor, setSmokeColor] = useState("white");

  /* When the menu is opened show the unit preview on the map as a cursor */
  useEffect(() => {
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
      if (getApp().getState() === OlympusState.SPAWN && getApp().getSubState() === SpawnSubState.SPAWN_EFFECT) getApp().setState(OlympusState.IDLE);
    }
  });

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {props.effect === "explosion" && (
        <>
          <span className="text-white">Explosion type</span>
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
          <span className="text-white">Smoke color</span>
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
    </div>
  );
}

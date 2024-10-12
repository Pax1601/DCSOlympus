import React, { useEffect, useState } from "react";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { getApp } from "../../olympusapp";
import { IDLE, SPAWN_EFFECT } from "../../constants/constants";

export function EffectSpawnMenu(props: { effect: string }) {
  const [explosionType, setExplosionType] = useState("High explosive");

  /* When the menu is opened show the unit preview on the map as a cursor */
  useEffect(() => {
    if (props.effect !== null) {
      getApp()
        ?.getMap()
        ?.setState(SPAWN_EFFECT, {
          effectRequestTable: {
            type: props.effect,
          }
        });
    } else {
      if (getApp().getMap().getState() === SPAWN_EFFECT) getApp().getMap().setState(IDLE);
    }
    
  });

  return (
      <div className="flex h-full flex-col gap-4 p-4">
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
      </div>
  );
}

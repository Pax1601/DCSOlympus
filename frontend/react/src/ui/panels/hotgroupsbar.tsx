import React, { useEffect, useState } from "react";
import { AppStateChangedEvent, HotgroupsChangedEvent } from "../../events";
import { OlympusState } from "../../constants/constants";
import { OlStateButton } from "../components/olstatebutton";
import { getApp } from "../../olympusapp";
import { Unit } from "../../unit/unit";

export function HotGroupBar(props: {}) {
  const [hotgroups, setHotgroups] = useState({} as { [key: number]: Unit[] });

  useEffect(() => {
    HotgroupsChangedEvent.on((hotgroups) => setHotgroups({ ...hotgroups }));
  }, []);

  return (
    <div
      className={`
        absolute bottom-24 left-[50%] flex translate-x-[calc(-50%+2rem)] gap-2
      `}
    >
      {Object.entries(hotgroups).map(([hotgroup, units]) => {
        return (
          <div className="flex flex-col content-center gap-2">
            <div
              className={`
                mx-auto aspect-square rotate-45 rounded-sm bg-olympus-900
                text-center text-xs font-bold text-gray-200
              `}
            >
              <div className="relative -rotate-45">{hotgroup}</div>
            </div>

            <OlStateButton checked={false} onClick={() => {getApp().getUnitsManager().selectUnitsByHotgroup(parseInt(hotgroup))}} tooltip="Select units of this hotgroup" className={`
              min-h-12 min-w-12
            `}>
              <span
                className={`text-white`}
              >
                {units.filter((unit) => unit.getAlive()).length}
              </span>
            </OlStateButton>
          </div>
        );
      })}
    </div>
  );
}

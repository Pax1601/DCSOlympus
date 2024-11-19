import React, { useEffect, useState } from "react";
import { AppStateChangedEvent, ContextActionChangedEvent, HotgroupsChangedEvent, InfoPopupEvent } from "../../events";
import { OlympusState } from "../../constants/constants";
import { ContextAction } from "../../unit/contextaction";
import { OlStateButton } from "../components/olstatebutton";
import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../olympusapp";

export function HotGroupBar(props: {}) {
  const [hotgroups, setHotgroups] = useState({} as { [key: number]: number });
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [menuHidden, setMenuHidden] = useState(false);

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => setAppState(state));
    HotgroupsChangedEvent.on((hotgroups) => setHotgroups({ ...hotgroups }));
  }, []);

  return (
    <div
      data-menuhidden={menuHidden || appState === OlympusState.IDLE}
      className={`
        absolute bottom-16 left-[50%] flex gap-2
        data-[menuhidden='false']:translate-x-[calc(200px-50%+2rem)]
        data-[menuhidden='true']:translate-x-[calc(-50%+2rem)]
      `}
    >
      {Object.entries(hotgroups).map(([hotgroup, counter]) => {
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

            <OlStateButton checked={false} onClick={() => {getApp().getUnitsManager().selectUnitsByHotgroup(parseInt(hotgroup))}} tooltip="">
              <span
                className={`text-sm text-white`}
              >
                {counter}
              </span>
            </OlStateButton>
          </div>
        );
      })}
    </div>
  );
}

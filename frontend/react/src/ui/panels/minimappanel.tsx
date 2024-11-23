import React, { useState, useEffect, useContext } from "react";
import { zeroAppend } from "../../other/utils";
import { DateAndTime, ServerStatus } from "../../interfaces";
import { getApp } from "../../olympusapp";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { MapOptionsChangedEvent, ServerStatusUpdatedEvent } from "../../events";
import { MAP_OPTIONS_DEFAULTS } from "../../constants/constants";

export function MiniMapPanel(props: {}) {
  const [serverStatus, setServerStatus] = useState({} as ServerStatus);
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  const [showMissionTime, setShowMissionTime] = useState(false);

  useEffect(() => {
    ServerStatusUpdatedEvent.on((status) => setServerStatus(status));
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
  }, []);

  // A bit of a hack to set the rounded borders to the minimap
  useEffect(() => {
    let miniMap = document.querySelector(".leaflet-control-minimap");
    if (miniMap) {
      miniMap.classList.add("rounded-t-lg");
    }
  });

  // Compute the time string depending on mission or elapsed time
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (showMissionTime) {
    hours = serverStatus.missionTime.h;
    minutes = serverStatus.missionTime.m;
    seconds = serverStatus.missionTime.s;
  } else {
    hours = Math.floor(serverStatus.elapsedTime / 3600);
    minutes = Math.floor(serverStatus.elapsedTime / 60) % 60;
    seconds = Math.round(serverStatus.elapsedTime) % 60;
  }

  let timeString = `${zeroAppend(hours, 2)}:${zeroAppend(minutes, 2)}:${zeroAppend(seconds, 2)}`;

  // Choose frame rate string color
  let frameRateColor = "#8BFF63";
  if (serverStatus.frameRate < 30) frameRateColor = "#F05252";
  else if (serverStatus.frameRate >= 30 && serverStatus.frameRate < 60) frameRateColor = "#FF9900";

  // Choose load string color
  let loadColor = "#8BFF63";
  if (serverStatus.load > 1000) loadColor = "#F05252";
  else if (serverStatus.load >= 100 && serverStatus.load < 1000) loadColor = "#FF9900";

  return (
    <div
      className={`
        absolute right-[10px]
        ${mapOptions.showMinimap ? `bottom-[188px]` : `bottom-[20px]`}
        flex w-[288px] items-center justify-between
        ${mapOptions.showMinimap ? `rounded-t-lg` : `rounded-lg`}
        h-12 bg-gray-200 px-3 text-sm backdrop-blur-lg backdrop-grayscale
        dark:bg-olympus-800/90 dark:text-gray-200
      `}
    >
      {!serverStatus.connected ? (
        <div className={`flex animate-pulse items-center gap-2 font-semibold`}>
          <div className={`relative h-4 w-4 rounded-full bg-[#F05252]`}></div>
          Server disconnected
        </div>
      ) : serverStatus.paused ? (
        <div className={`flex animate-pulse items-center gap-2 font-semibold`}>
          <div className={`relative h-4 w-4 rounded-full bg-[#FF9900]`}></div>
          Server paused
        </div>
      ) : (
        <>
          <div className="flex gap-2 font-semibold">
            FPS:
            <span style={{ color: frameRateColor }} className={`font-semibold`}>
              {serverStatus.frameRate}
            </span>
          </div>
          <div className="flex gap-2 font-semibold">
            Load:
            <span style={{ color: loadColor }} className={`font-semibold`}>
              {serverStatus.load}
            </span>
          </div>
          <div className="flex cursor-pointer gap-2 font-semibold" onClick={() => setShowMissionTime(!showMissionTime)}>
            {showMissionTime ? "MT" : "ET"}: {timeString}
          </div>
          <div className={`relative h-4 w-4 rounded-full bg-[#8BFF63]`}></div>
        </>
      )}
      {mapOptions.showMinimap ? (
        <FaChevronDown className="cursor-pointer" onClick={() => getApp().getMap().setOption("showMinimap", false)} />
      ) : (
        <FaChevronUp className="cursor-pointer" onClick={() => getApp().getMap().setOption("showMinimap", true)} />
      )}
    </div>
  );
}

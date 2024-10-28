import React, { useState, useEffect, useContext } from "react";
import { zeroAppend } from "../../other/utils";
import { DateAndTime } from "../../interfaces";
import { getApp } from "../../olympusapp";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { StateContext } from "../../statecontext";

export function MiniMapPanel(props: {}) {
  const appState = useContext(StateContext)

  const [showMissionTime, setShowMissionTime] = useState(false);

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
    hours = appState.serverStatus.missionTime.h;
    minutes = appState.serverStatus.missionTime.m;
    seconds = appState.serverStatus.missionTime.s;
  } else {
    hours = Math.floor(appState.serverStatus.elapsedTime / 3600);
    minutes = Math.floor(appState.serverStatus.elapsedTime / 60) % 60;
    seconds = Math.round(appState.serverStatus.elapsedTime) % 60;
  }

  let timeString = `${zeroAppend(hours, 2)}:${zeroAppend(minutes, 2)}:${zeroAppend(seconds, 2)}`;

  // Choose frame rate string color
  let frameRateColor = "#8BFF63";
  if (appState.serverStatus.frameRate < 30) frameRateColor = "#F05252";
  else if (appState.serverStatus.frameRate >= 30 && appState.serverStatus.frameRate < 60) frameRateColor = "#FF9900";

  // Choose load string color
  let loadColor = "#8BFF63";
  if (appState.serverStatus.load > 1000) loadColor = "#F05252";
  else if (appState.serverStatus.load >= 100 && appState.serverStatus.load < 1000) loadColor = "#FF9900";

  return (
    <div
      onClick={() => setShowMissionTime(!showMissionTime)}
      className={`
        absolute right-[10px]
        ${appState.mapOptions.showMinimap ? `top-[232px]` : `top-[70px]`}
        flex w-[288px] items-center justify-between
        ${appState.mapOptions.showMinimap ? `rounded-b-lg` : `rounded-lg`}
        bg-gray-200 p-3 text-sm backdrop-blur-lg backdrop-grayscale
        dark:bg-olympus-800/90 dark:text-gray-200
      `}
    >
      {!appState.serverStatus.connected ? (
        <div className={`flex animate-pulse items-center gap-2 font-semibold`}>
          <div className={`relative h-4 w-4 rounded-full bg-[#F05252]`}></div>
          Server disconnected
        </div>
      ) : appState.serverStatus.paused ? (
        <div className={`flex animate-pulse items-center gap-2 font-semibold`}>
          <div className={`relative h-4 w-4 rounded-full bg-[#FF9900]`}></div>
          Server paused
        </div>
      ) : (
        <>
          <div className="flex gap-2 font-semibold">
            FPS:
            <span style={{ color: frameRateColor }} className={`font-semibold`}>
              {appState.serverStatus.frameRate}
            </span>
          </div>
          <div className="flex gap-2 font-semibold">
            Load:
            <span style={{ color: loadColor }} className={`font-semibold`}>
              {appState.serverStatus.load}
            </span>
          </div>
          <div className="flex gap-2 font-semibold">
            {showMissionTime ? "MT" : "ET"}: {timeString}
          </div>
          <div className={`relative h-4 w-4 rounded-full bg-[#8BFF63]`}></div>
        </>
      )}
      {appState.mapOptions.showMinimap ? (
        <FaChevronUp
          onClick={() => {
            getApp().getMap().setOption("showMinimap", false);
          }}
        ></FaChevronUp>
      ) : (
        <FaChevronDown
          onClick={() => {
            getApp().getMap().setOption("showMinimap", true);
          }}
        ></FaChevronDown>
      )}
    </div>
  );
}

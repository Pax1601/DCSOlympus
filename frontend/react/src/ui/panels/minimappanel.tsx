import React, { useState, useEffect, useContext } from "react";
import { zeroAppend } from "../../other/utils";
import { DateAndTime, ServerStatus } from "../../interfaces";
import { getApp } from "../../olympusapp";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { MapOptionsChangedEvent, ServerStatusUpdatedEvent } from "../../events";
import { colors, MAP_OPTIONS_DEFAULTS } from "../../constants/constants";
import { CoordinatesPanel } from "./coordinatespanel";
import { RadiosSummaryPanel } from "./radiossummarypanel";

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
      miniMap.classList.add("rounded-b-lg");
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

  let loadColor = colors.OLYMPUS_GREEN;
  if (serverStatus.load > 1000) loadColor = colors.OLYMPUS_RED;
  else if (serverStatus.load >= 100 && serverStatus.load < 1000) loadColor = colors.OLYMPUS_ORANGE;

  let frameRateColor = colors.OLYMPUS_GREEN;
  if (serverStatus.frameRate < 30) frameRateColor = colors.OLYMPUS_RED;
  else if (serverStatus.frameRate >= 30 && serverStatus.frameRate < 60) frameRateColor = colors.OLYMPUS_ORANGE;

  return (
    <div
      className={`
        absolute right-[10px]
        ${mapOptions.showMinimap ? `bottom-[188px]` : `bottom-[20px]`}
        flex w-[288px] cursor-pointer flex-col items-center justify-between
        gap-2 text-sm
      `}
      
    >
      <RadiosSummaryPanel />
      <CoordinatesPanel />
      <div className={`
        flex h-12 w-full items-center justify-between gap-2 px-3
        backdrop-blur-lg backdrop-grayscale
        dark:bg-olympus-800/90 dark:text-gray-200
        ${mapOptions.showMinimap ? `rounded-t-lg` : `rounded-lg`}
      `}
      onClick={(ev) => {
        getApp().getMap().setOption("showMinimap", !mapOptions.showMinimap);
      }}>
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
            <div className="flex w-16 gap-1 font-semibold">
              FPS:
              <span style={{ color: frameRateColor }} className={`font-semibold`}>
                {serverStatus.frameRate}
              </span>
            </div>
            <div className="flex gap-1 font-semibold">
              Load:
              <span style={{ color: loadColor }} className={`font-semibold`}>
                {serverStatus.load}
              </span>
            </div>
            <div
              className="ml-auto flex w-24 cursor-pointer gap-2 font-semibold"
              onClick={(ev) => {
                setShowMissionTime(!showMissionTime);
                ev.stopPropagation();
              }}
            >
              {showMissionTime ? "MT" : "ET"}: {timeString}
            </div>
          </>
        )}
        {mapOptions.showMinimap ? (
          <FaChevronDown className="cursor-pointer" />
        ) : (
          <FaChevronUp
            className={`cursor-pointer`}
          />
        )}
      </div>
    </div>
  );
}

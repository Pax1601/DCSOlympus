import React, { useState, useEffect } from "react";
import { zeroAppend } from "../../other/utils";
import { DateAndTime } from "../../interfaces";
import { getApp } from "../../olympusapp";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";

export function MiniMapPanel(props: {}) {
  const [frameRate, setFrameRate] = useState(0);
  const [load, setLoad] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [missionTime, setMissionTime] = useState({
    h: 0,
    m: 0,
    s: 0,
  } as DateAndTime["time"]);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showMissionTime, setShowMissionTime] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);

  useEffect(() => {
    document.addEventListener("serverStatusUpdated", (ev) => {
      const detail = (ev as CustomEvent).detail;
      setFrameRate(detail.frameRate);
      setLoad(detail.load);
      setElapsedTime(detail.elapsedTime);
      setMissionTime(detail.missionTime);
      setConnected(detail.connected);
      setPaused(detail.paused);
    });
  }, []);

  // A bit of a hack to set the rounded borders to the minimap
  useEffect(() => {
    let miniMap = document.querySelector(".leaflet-control-minimap");
    if (miniMap) {
      miniMap.classList.add("rounded-t-lg");
    }
  });

  document.addEventListener("mapOptionsChanged", (event) => {
    setShowMinimap(getApp().getMap().getOptions().showMinimap);
  });

  // Compute the time string depending on mission or elapsed time
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (showMissionTime) {
    hours = missionTime.h;
    minutes = missionTime.m;
    seconds = missionTime.s;
  } else {
    hours = Math.floor(elapsedTime / 3600);
    minutes = Math.floor(elapsedTime / 60) % 60;
    seconds = Math.round(elapsedTime) % 60;
  }

  let timeString = `${zeroAppend(hours, 2)}:${zeroAppend(minutes, 2)}:${zeroAppend(seconds, 2)}`;

  // Choose frame rate string color
  let frameRateColor = "#8BFF63";
  if (frameRate < 30) frameRateColor = "#F05252";
  else if (frameRate >= 30 && frameRate < 60) frameRateColor = "#FF9900";

  // Choose load string color
  let loadColor = "#8BFF63";
  if (load > 1000) loadColor = "#F05252";
  else if (load >= 100 && load < 1000) loadColor = "#FF9900";

  return (
    <div
      onClick={() => setShowMissionTime(!showMissionTime)}
      className={`
        absolute right-[10px]
        ${showMinimap ? `top-[232px]` : `top-[70px]`}
        flex w-[288px] items-center justify-between
        ${showMinimap ? `rounded-b-lg` : `rounded-lg`}
        bg-gray-200 p-3 text-sm backdrop-blur-lg backdrop-grayscale
        dark:bg-olympus-800/90 dark:text-gray-200
      `}
    >
      {!connected ? (
        <div className={`flex animate-pulse items-center gap-2 font-semibold`}>
          <div className={`relative h-4 w-4 rounded-full bg-[#F05252]`}></div>
          Server disconnected
        </div>
      ) : paused ? (
        <div className={`flex animate-pulse items-center gap-2 font-semibold`}>
          <div className={`relative h-4 w-4 rounded-full bg-[#FF9900]`}></div>
          Server paused
        </div>
      ) : (
        <>
          <div className="flex gap-2 font-semibold">
            FPS:
            <span style={{ color: frameRateColor }} className={`font-semibold`}>
              {frameRate}
            </span>
          </div>
          <div className="flex gap-2 font-semibold">
            Load:
            <span style={{ color: loadColor }} className={`font-semibold`}>
              {load}
            </span>
          </div>
          <div className="flex gap-2 font-semibold">
            {showMissionTime ? "MT" : "ET"}: {timeString}
          </div>
          <div className={`relative h-4 w-4 rounded-full bg-[#8BFF63]`}></div>
        </>
      )}
      {showMinimap ? (
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
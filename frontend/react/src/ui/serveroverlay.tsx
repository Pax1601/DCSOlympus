import React, { useEffect, useState } from "react";
import { ServerStatusUpdatedEvent } from "../events";
import { ServerStatus } from "../interfaces";
import { FaCheck, FaXmark } from "react-icons/fa6";
import { zeroAppend } from "../other/utils";
import { colors } from "../constants/constants";

export function ServerOverlay() {
  const [serverStatus, setServerStatus] = useState({} as ServerStatus);

  useEffect(() => {
    ServerStatusUpdatedEvent.on((status) => setServerStatus(status));
  }, []);

  let loadColor = colors.OLYMPUS_GREEN;
  if (serverStatus.load > 1000) loadColor = colors.OLYMPUS_RED;
  else if (serverStatus.load >= 100 && serverStatus.load < 1000) loadColor = colors.OLYMPUS_ORANGE;

  let frameRateColor = colors.OLYMPUS_GREEN;
  if (serverStatus.frameRate < 30) frameRateColor = colors.OLYMPUS_RED;
  else if (serverStatus.frameRate >= 30 && serverStatus.frameRate < 60) frameRateColor = colors.OLYMPUS_ORANGE;

  const MThours = serverStatus.missionTime? serverStatus.missionTime.h: 0;
  const MTminutes = serverStatus.missionTime? serverStatus.missionTime.m: 0;
  const MTseconds = serverStatus.missionTime? serverStatus.missionTime.s: 0;

  const EThours = Math.floor((serverStatus.elapsedTime ?? 0) / 3600);
  const ETminutes = Math.floor((serverStatus.elapsedTime ?? 0) / 60) % 60;
  const ETseconds = Math.round(serverStatus.elapsedTime ?? 0) % 60;

  let MTtimeString = `${zeroAppend(MThours, 2)}:${zeroAppend(MTminutes, 2)}:${zeroAppend(MTseconds, 2)}`;
  let ETtimeString = `${zeroAppend(EThours, 2)}:${zeroAppend(ETminutes, 2)}:${zeroAppend(ETseconds, 2)}`;

  return (
    <div
      className={`
        absolute left-0 top-0 z-50 h-full w-full flex-col bg-olympus-900 p-5
      `}
    >
      <div className="flex-col content-center">
        <h2 className="mb-10 text-3xl font-bold text-white">DCS Olympus server</h2>
        <div className="flex flex-col">
          <div className="flex gap-5 text-white">
            <div className="w-64">Connected to DCS:</div>
            <div>{serverStatus.connected? <FaCheck className={`
              text-xl text-green-500
            `}/> : <FaXmark className={`text-xl text-red-500`}/>}</div>
          </div>
          <div className="flex gap-5 text-white">
            <div className="w-64">Server load:</div>
            <div style={{color: loadColor}}>{serverStatus.load}</div>
          </div>
          <div className="flex gap-5 text-white">
            <div className="w-64">Server framerate:</div>
            <div style={{color: frameRateColor}}>{serverStatus.frameRate} fps</div>
          </div>
          <div className="flex gap-5 text-white">
            <div className="w-64">Elapsed time:</div>
            <div>{ETtimeString}</div>
          </div>
          <div className="flex gap-5 text-white">
            <div className="w-64">Mission local time:</div>
            <div>{MTtimeString}</div>
          </div>
        </div>
        
      </div>
      <img src="./images/olympus-500x500.png" className={`
        absolute right-4 top-4 ml-auto flex h-24
      `}></img>
    </div>
  );
}

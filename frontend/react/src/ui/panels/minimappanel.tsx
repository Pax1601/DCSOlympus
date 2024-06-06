import React, { useState, useEffect } from "react";
import { zeroAppend } from "../../other/utils";
import { DateAndTime } from "../../interfaces";

export function MiniMapPanel(props: {

}) {
    var [frameRate, setFrameRate] = useState(0);
    var [load, setLoad] = useState(0);
    var [elapsedTime, setElapsedTime] = useState(0);
    var [missionTime, setMissionTime] = useState({ h: 0, m: 0, s: 0 } as DateAndTime["time"]);
    var [connected, setConnected] = useState(false);
    var [paused, setPaused] = useState(false);
    var [showMissionTime, setShowMissionTime] = useState(false);

    document.addEventListener("serverStatusUpdated", (ev) => {
        setFrameRate(ev.detail.frameRate);
        setLoad(ev.detail.load);
        setElapsedTime(ev.detail.elapsedTime);
        setMissionTime(ev.detail.missionTime);
        setConnected(ev.detail.connected);
        setPaused(ev.detail.paused);
    })

    // A bit of a hack to set the rounded borders to the minimap
    useEffect(() => {
        let miniMap = document.querySelector(".leaflet-control-minimap");
        if (miniMap) {
            miniMap.classList.add("rounded-t-lg")
        }
    })

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
        minutes = Math.floor((elapsedTime / 60)) % 60;
        seconds = Math.round(elapsedTime) % 60;
    }

    let timeString = `${zeroAppend(hours, 2)}:${zeroAppend(minutes, 2)}:${zeroAppend(seconds, 2)}`

    // Choose frame rate string color
    let frameRateColor = "#8BFF63";
    if (frameRate < 30)
        frameRateColor = "#F05252";
    else if (frameRate >= 30 && frameRate < 60)
        frameRateColor = "#FF9900"

    // Choose load string color
    let loadColor = "#8BFF63";
    if (load > 1000)
        loadColor = "#F05252";
    else if (load >= 100 && load < 1000)
        loadColor = "#FF9900"

    return <div onClick={() => setShowMissionTime(!showMissionTime)} className="absolute w-[288px] top-[233px] right-[10px] z-ui-0 text-sm dark:text-gray-200 bg-gray-200 dark:bg-olympus-800/90 backdrop-blur-lg backdrop-grayscale flex items-center justify-between p-3 rounded-b-lg">
        {
            !connected ?
                <div className="font-semibold animate-pulse flex items-center gap-2"><div className="bg-[#F05252] relative w-4 h-4 rounded-full"></div>Server disconnected</div> :
                paused ?
                    <div className="font-semibold animate-pulse flex items-center gap-2"><div className="bg-[#FF9900] relative w-4 h-4 rounded-full"></div>Server paused</div> :
                    <>
                        <div className="font-semibold">FPS: <span style={{ 'color': frameRateColor }} className="font-semibold">{frameRate}</span> </div>
                        <div className="font-semibold">Load: <span style={{ 'color': loadColor }} className="font-semibold">{load}</span>  </div>
                        <div className="font-semibold">{showMissionTime ? "MT" : "ET"}:  {timeString} </div>
                        <div className="bg-[#8BFF63] relative w-4 h-4 rounded-full"></div>
                    </>
        }

    </div>
}
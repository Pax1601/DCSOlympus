import React, { useEffect, useState } from "react";
import { ServerStatusUpdatedEvent } from "../events";
import { ServerStatus } from "../interfaces";
import { FaCheck, FaXmark } from "react-icons/fa6";
import { zeroAppend } from "../other/utils";
import { colors } from "../constants/constants";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, LinearScale, Title, CategoryScale, Legend, PointElement } from "chart.js";

Chart.register(LineElement, LinearScale, Title, CategoryScale, Legend, PointElement);

export function ServerOverlay() {
  const [serverStatus, setServerStatus] = useState({} as ServerStatus);
  const [loadData, setLoadData] = useState<number[]>([]);
  const [frameRateData, setFrameRateData] = useState<number[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);

  useEffect(() => {
    ServerStatusUpdatedEvent.on((status) => {
      setServerStatus(status);
      setLoadData((prevData) => [...prevData, status.load].slice(-300));
      setFrameRateData((prevData) => [...prevData, status.frameRate].slice(-300));
      setTimeLabels((prevLabels) => [...prevLabels, new Date().toLocaleTimeString()].slice(-300));
    });
  }, []);

  let loadColor = colors.OLYMPUS_GREEN;
  if (serverStatus.load > 1000) loadColor = colors.OLYMPUS_RED;
  else if (serverStatus.load >= 100 && serverStatus.load < 1000) loadColor = colors.OLYMPUS_ORANGE;

  let frameRateColor = colors.OLYMPUS_GREEN;
  if (serverStatus.frameRate < 30) frameRateColor = colors.OLYMPUS_RED;
  else if (serverStatus.frameRate >= 30 && serverStatus.frameRate < 60) frameRateColor = colors.OLYMPUS_ORANGE;

  const MThours = serverStatus.missionTime ? serverStatus.missionTime.h : 0;
  const MTminutes = serverStatus.missionTime ? serverStatus.missionTime.m : 0;
  const MTseconds = serverStatus.missionTime ? serverStatus.missionTime.s : 0;

  const EThours = Math.floor((serverStatus.elapsedTime ?? 0) / 3600);
  const ETminutes = Math.floor((serverStatus.elapsedTime ?? 0) / 60) % 60;
  const ETseconds = Math.round(serverStatus.elapsedTime ?? 0) % 60;

  let MTtimeString = `${zeroAppend(MThours, 2)}:${zeroAppend(MTminutes, 2)}:${zeroAppend(MTseconds, 2)}`;
  let ETtimeString = `${zeroAppend(EThours, 2)}:${zeroAppend(ETminutes, 2)}:${zeroAppend(ETseconds, 2)}`;

  const missionTime = new Date();
  missionTime.setHours(MThours);
  missionTime.setMinutes(MTminutes);
  missionTime.setSeconds(MTseconds);

  const data = {
    labels: timeLabels,
    datasets: [
      {
        label: "Server Load",
        data: loadData,
        borderColor: colors.LIGHT_BLUE,
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        yAxisID: "y-load", // Specify the y-axis for load
      },
      {
        label: "Server Framerate",
        data: frameRateData,
        borderColor: colors.WHITE,
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        yAxisID: "y-framerate", // Specify the y-axis for framerate
      },
    ],
  };

  const options = {
    animation: false,
    responsive: true,
    scales: {
      x: {
        type: "category",
        labels: timeLabels,
      },
      "y-framerate": {
        type: "linear",
        position: "left",
        beginAtZero: true,
        max: 120, // Max value for framerate
      },
      "y-load": {
        type: "linear",
        position: "right",
        beginAtZero: true,
        max: 2000, // Max value for load
        grid: {
          drawOnChartArea: false, // Only want the grid lines for one axis to show up
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
  };

  return (
    <div
      className={`
        absolute left-0 top-0 z-50 flex h-full w-full flex-col bg-black
        bg-opacity-80 p-5 backdrop-blur-sm animate-fadeIn
      `}
    >
      <div
        className={`
          m-auto flex w-3/4 max-w-4xl flex-col items-center rounded-lg bg-white
          bg-opacity-10 p-5 shadow-lg animate-slideIn
        `}
      >
        <h2 className="mb-5 text-4xl font-bold text-white drop-shadow-lg">DCS Olympus Server</h2>
        <div className="flex w-full gap-12">
          <div className="flex w-72 flex-col gap-4 text-lg text-white">
            <div className="flex justify-between">
              <div className="font-semibold">Connected to DCS:</div>
              <div>{serverStatus.connected ? <FaCheck className={`
                text-2xl text-green-500
              `} /> : <FaXmark className={`text-2xl text-red-500`} />}</div>
            </div>
            <div className="flex justify-between">
              <div className="font-semibold">Elapsed time:</div>
              <div>{ETtimeString}</div>
            </div>
            <div className="flex justify-between">
              <div className="font-semibold">Mission local time:</div>
              <div>{MTtimeString}</div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-5 text-white">
            <div className="flex flex-col items-center">
              <div className="mb-2 font-semibold">Load</div>
              <div className="h-24 w-24">
                <CircularProgressbar
                  value={serverStatus.load}
                  maxValue={2000}
                  text={`${serverStatus.load}`}
                  styles={buildStyles({
                    textColor: loadColor,
                    pathColor: loadColor,
                    trailColor: "rgba(255, 255, 255, 0.2)",
                  })}
                />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2 font-semibold">Framerate</div>
              <div className="h-24 w-24">
                <CircularProgressbar
                  value={serverStatus.frameRate}
                  maxValue={120}
                  text={`${serverStatus.frameRate} fps`}
                  styles={buildStyles({
                    textColor: frameRateColor,
                    pathColor: frameRateColor,
                    trailColor: "rgba(255, 255, 255, 0.2)",
                  })}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 w-full flex-1">
          {/* @ts-ignore */}
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

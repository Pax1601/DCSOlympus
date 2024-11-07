import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { OlCheckbox } from "../components/olcheckbox";
import { OlRangeSlider } from "../components/olrangeslider";
import { OlNumberInput } from "../components/olnumberinput";
import { MapOptions } from "../../types/types";
import { getApp } from "../../olympusapp";
import { CommandModeOptions, ServerStatus } from "../../interfaces";
import { CommandModeOptionsChangedEvent, ServerStatusUpdatedEvent } from "../../events";
import { BLUE_COMMANDER, COMMAND_MODE_OPTIONS_DEFAULTS, ERAS, GAME_MASTER, RED_COMMANDER } from "../../constants/constants";

export function GameMasterMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [commandModeOptions, setCommandModeOptions] = useState(COMMAND_MODE_OPTIONS_DEFAULTS);
  const [currentSetupTime, setCurrentSetupTime] = useState(300);
  const [serverStatus, setServerStatus] = useState({} as ServerStatus);

  useEffect(() => {
    ServerStatusUpdatedEvent.on((status) => setServerStatus(status));
    CommandModeOptionsChangedEvent.on((commandModeOptions) => {
      setCommandModeOptions(commandModeOptions);
      setCurrentSetupTime(commandModeOptions.setupTime);
    });
  }, []);

  return (
    <Menu title="Game Master options" open={props.open} showBackButton={false} onClose={props.onClose}>
      <div
        className={`
          flex flex-col gap-2 p-5 font-normal text-gray-800
          dark:text-white
        `}
      >
        You are operating as:
        {commandModeOptions.commandMode === GAME_MASTER && (
          <div
            className={`
              w-full rounded-md bg-olympus-400 p-2 text-center font-bold
            `}
          >
            GAME MASTER
          </div>
        )}
        {commandModeOptions.commandMode === BLUE_COMMANDER && <div className={`
          w-full rounded-md bg-blue-600 p-2 text-center font-bold
        `}>BLUE COMMANDER</div>}
        {commandModeOptions.commandMode === RED_COMMANDER && <div className={`
          w-full rounded-md bg-red-700 p-2 text-center font-bold
        `}>RED COMMANDER</div>}
        {serverStatus.elapsedTime > currentSetupTime && (
          <div
            className={`
              w-full rounded-md bg-orange-600 p-2 text-center font-bold
            `}
          >
            Setup time has ended
          </div>
        )}
        {serverStatus.elapsedTime <= currentSetupTime && (
          <div
            className={`
              w-full rounded-md bg-green-700 p-2 text-center font-bold
            `}
          >
            SETUP ends in {(currentSetupTime - serverStatus.elapsedTime)?.toFixed()} seconds
          </div>
        )}
        <span className="mt-5">Options: </span>
        <div className="flex flex-col gap-2">
          <div
            className={`
              group flex flex-row rounded-md justify-content cursor-pointer
              gap-4 p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => {
              if (commandModeOptions.commandMode !== GAME_MASTER) return;
              const newCommandModeOptions = { ...commandModeOptions };
              newCommandModeOptions.restrictSpawns = !commandModeOptions.restrictSpawns;
              setCommandModeOptions(newCommandModeOptions);
            }}
          >
            <OlCheckbox checked={commandModeOptions.restrictSpawns} onChange={() => {}} disabled={commandModeOptions.commandMode !== GAME_MASTER} />
            <span
              data-disabled={!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER}
              className={`data-[disabled='true']:text-gray-400`}
            >
              Restrict unit spanws
            </span>
          </div>
          <div
            className={`
              group flex flex-row rounded-md justify-content cursor-pointer
              gap-4 p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => {
              if (!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER) return;
              const newCommandModeOptions = { ...commandModeOptions };
              newCommandModeOptions.restrictToCoalition = !commandModeOptions.restrictToCoalition;
              setCommandModeOptions(newCommandModeOptions);
            }}
          >
            <OlCheckbox
              checked={commandModeOptions.restrictToCoalition}
              onChange={() => {}}
              disabled={!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER}
            />
            <span
              data-disabled={!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER}
              className={`data-[disabled='true']:text-gray-400`}
            >
              Restrict spawns to coalition
            </span>
          </div>
          {ERAS.sort((a, b) => (a.chronologicalOrder > b.chronologicalOrder ? 1 : -1)).map((era) => {
            return (
              <div
                className={`
                  group flex flex-row rounded-md justify-content cursor-pointer
                  gap-4 p-2
                  dark:hover:bg-olympus-400
                `}
                onClick={() => {
                  if (!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER) return;
                  const newCommandModeOptions = { ...commandModeOptions };
                  if (commandModeOptions.eras.includes(era.name)) newCommandModeOptions.eras.splice(newCommandModeOptions.eras.indexOf(era.name));
                  else newCommandModeOptions.eras.push(era.name);
                  setCommandModeOptions(newCommandModeOptions);
                }}
              >
                <OlCheckbox
                  checked={commandModeOptions.eras.includes(era.name)}
                  onChange={() => {}}
                  disabled={!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER}
                />
                <span
                  data-disabled={!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER}
                  className={`data-[disabled='true']:text-gray-400`}
                >
                  Allow {era.name} units
                </span>
              </div>
            );
          })}

          <div
            className={`
              group flex flex-row rounded-md justify-content gap-4
              bg-blue-600/40 px-4 py-2
            `}
          >
            <span
              data-disabled={!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER}
              className={`
                my-auto mr-auto
                data-[disabled='true']:text-gray-400
              `}
            >
              Blue spawn points
            </span>
            <OlNumberInput
              min={0}
              max={1e6}
              value={commandModeOptions.spawnPoints.blue}
              onChange={(e) => {
                if (!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER) return;
                const newCommandModeOptions = { ...commandModeOptions };
                newCommandModeOptions.spawnPoints.blue = parseInt(e.target.value);
                setCommandModeOptions(newCommandModeOptions);
              }}
              onIncrease={() => {
                if (!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER) return;
                const newCommandModeOptions = { ...commandModeOptions };
                newCommandModeOptions.spawnPoints.blue = Math.min(newCommandModeOptions.spawnPoints.blue + 10, 1000000);
                setCommandModeOptions(newCommandModeOptions);
              }}
              onDecrease={() => {
                if (!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER) return;
                const newCommandModeOptions = { ...commandModeOptions };
                newCommandModeOptions.spawnPoints.blue = Math.max(newCommandModeOptions.spawnPoints.blue - 10, 0);
                setCommandModeOptions(newCommandModeOptions);
              }}
            ></OlNumberInput>
          </div>
          <div
            className={`
              group flex flex-row rounded-md justify-content gap-4 bg-red-600/40
              px-4 py-2
            `}
          >
            <span
              data-disabled={!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER}
              className={`
                my-auto mr-auto
                data-[disabled='true']:text-gray-400
              `}
            >
              Red spawn points
            </span>
            <OlNumberInput
              min={0}
              max={1e6}
              value={commandModeOptions.spawnPoints.red}
              onChange={(e) => {
                if (!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER) return;
                const newCommandModeOptions = { ...commandModeOptions };
                newCommandModeOptions.spawnPoints.red = parseInt(e.target.value);
                setCommandModeOptions(newCommandModeOptions);
              }}
              onIncrease={() => {
                if (!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER) return;
                const newCommandModeOptions = { ...commandModeOptions };
                newCommandModeOptions.spawnPoints.red = Math.min(newCommandModeOptions.spawnPoints.red + 15, 6000);
                setCommandModeOptions(newCommandModeOptions);
              }}
              onDecrease={() => {
                if (!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER) return;
                const newCommandModeOptions = { ...commandModeOptions };
                newCommandModeOptions.spawnPoints.red = Math.max(newCommandModeOptions.spawnPoints.red - 15, 0);
                setCommandModeOptions(newCommandModeOptions);
              }}
            ></OlNumberInput>
          </div>
          <div
            className={`
              group flex flex-row rounded-md justify-content gap-4 px-4 py-2
            `}
          >
            <span
              data-disabled={!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER}
              className={`
                my-auto mr-auto
                data-[disabled='true']:text-gray-400
              `}
            >
              Setup time (seconds)
            </span>
            <OlNumberInput
              min={0}
              max={6000}
              value={commandModeOptions.setupTime}
              onChange={(e) => {
                if (!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER) return;
                const newCommandModeOptions = { ...commandModeOptions };
                newCommandModeOptions.setupTime = parseInt(e.target.value);
                setCommandModeOptions(newCommandModeOptions);
              }}
              onIncrease={() => {
                if (!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER) return;
                const newCommandModeOptions = { ...commandModeOptions };
                newCommandModeOptions.setupTime = Math.min(newCommandModeOptions.setupTime + 10, 6000);
                setCommandModeOptions(newCommandModeOptions);
              }}
              onDecrease={() => {
                if (!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER) return;
                const newCommandModeOptions = { ...commandModeOptions };
                newCommandModeOptions.setupTime = Math.max(newCommandModeOptions.setupTime - 10, 0);
                setCommandModeOptions(newCommandModeOptions);
              }}
            ></OlNumberInput>
          </div>
          <div
            className={`
              group flex flex-row rounded-md justify-content gap-4 px-4 py-2
            `}
          >
            <span className="mr-auto">Elapsed time (seconds)</span>{" "}
            <span
              className={`w-32 text-center`}
            >
              {serverStatus.elapsedTime?.toFixed()}
            </span>
          </div>
          {commandModeOptions.commandMode === GAME_MASTER && (
            <button
              type="button"
              onClick={() => {
                if (commandModeOptions.commandMode !== GAME_MASTER) return;
                getApp().getServerManager().setCommandModeOptions(commandModeOptions);
              }}
              className={`
                w-full rounded-lg bg-blue-700 px-5 py-2.5 text-md font-medium
                text-white
                dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
                focus:outline-none focus:ring-4 focus:ring-blue-300
                hover:bg-blue-800
              `}
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </Menu>
  );
}

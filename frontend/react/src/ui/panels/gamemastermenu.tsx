import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { OlCheckbox } from "../components/olcheckbox";
import { OlNumberInput } from "../components/olnumberinput";
import { getApp } from "../../olympusapp";
import { ServerStatus } from "../../interfaces";
import { CommandModeOptionsChangedEvent, ServerStatusUpdatedEvent } from "../../events";
import { BLUE_COMMANDER, COMMAND_MODE_OPTIONS_DEFAULTS, ERAS_ORDER, GAME_MASTER, RED_COMMANDER } from "../../constants/constants";
import { secondsToTimeString } from "../../other/utils";
import { FaQuestionCircle } from "react-icons/fa";
import { FaMinus, FaPlus } from "react-icons/fa6";

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
    <Menu title="Game Master options" open={props.open} showBackButton={false} onClose={props.onClose} wiki={() => {
      return (
        <div
          className={`
            h-full flex-col overflow-auto p-4 text-gray-400 no-scrollbar flex
            gap-2
          `}
        >
          <h2 className="mb-4 font-bold">Game Master menu</h2>
          <div>
            The Game Master menu allows the Game Master to set up the game session for the Real Time Strategy game mode of DCS Olympus. 
          </div>
          <div>
            In this mode, commanders can play against eachother in a real-time strategy game, where they can spawn a limited amount of units. Each commander can only control units belonging to their coalition. Moreover, they can only see enemy units if detected, so proper placement of radars is crucial.
          </div>
          <div>
            The Game Master can set up the game session by restricting the unit spawns, setting the setup time, and restricting the eras of the units that can be spawned. Moreover, the Game Master can set the amount of spawn points available for each coalition.
          </div>
          <div>
            During the setup time, commanders can prepare the battlefield. As long as they have sufficient spawn points, they can place units anywhere on the map. After the setup time ends, the game starts and the restrictions are enforced.
          </div>
          <div>
            When restrictions are enforced, commanders will no longer be able to spawn ground units, and air units can only be spawned from airfields.
          </div>
          <div>
            There are multiple additional modes of play. You can disable the spawn restrictions to allow commanders to spawn units freely, but can only see detected units, or you can set the spawn points to 0 to disable unit spawns entirely and force commanders to only use the units they have at the start of the game or that you provide.
          </div>
        </div>
      );
    }}>
      <div
        className={`
          flex flex-col gap-2 p-5 font-normal text-gray-800
          dark:text-white
        `}
      >
        {commandModeOptions.restrictSpawns ? (
          <>
            <div className="mb-4 flex content-center gap-4">
              <div className="my-auto text-gray-400">
                <FaQuestionCircle />
              </div>
              <div className="text-sm text-gray-400">
                Unit spawns are restricted. During the SETUP phase, commanders can spawn units according to the settings below. After the SETUP phase ends,
                ground/navy units and air spawns are disabled, and commanders can spawn aircraft/helicopters only from airfields.
              </div>
            </div>
            <div className="flex">
              {commandModeOptions.commandMode === GAME_MASTER && (
                <button
                  className={`
                    h-10 rounded-s-lg bg-gray-100 p-3
                    dark:bg-gray-700 dark:hover:bg-gray-600
                    dark:focus:ring-blue-700
                    focus:outline-none focus:ring-2 focus:ring-gray-100
                    hover:bg-gray-200
                  `}
                  onClick={() => {
                    const newCommandModeOptions = { ...commandModeOptions };
                    newCommandModeOptions.setupTime = Math.max(serverStatus.elapsedTime, newCommandModeOptions.setupTime - 60);
                    if (commandModeOptions.commandMode !== GAME_MASTER) return;
                    setCommandModeOptions(newCommandModeOptions);
                    setCurrentSetupTime(newCommandModeOptions.setupTime);
                    getApp().getServerManager().setCommandModeOptions(newCommandModeOptions);
                  }}
                >
                  <FaMinus className="my-auto" />
                </button>
              )}
              <div className={`
                relative z-[-1] flex h-10 w-[360px] bg-olympus-600
              `}>
                <div
                  className={`
                    absolute my-auto w-full text-center before
                    before:absolute before:left-0 before:z-[-1] before:h-10
                    before:w-full before:bg-olympus-400 before:content-['']
                  `}
                  style={{ width: `${Math.min(100, 100 - ((currentSetupTime - serverStatus.elapsedTime) / currentSetupTime) * 100)}%` }}
                ></div>
                {currentSetupTime - serverStatus.elapsedTime > 0 ? (
                  <div className="mx-auto my-auto">SETUP ends in {secondsToTimeString(currentSetupTime - serverStatus.elapsedTime)}</div>
                ) : (
                  <div className="mx-auto my-auto animate-pulse">SETUP ended, restrictions active</div>
                )}
              </div>
              {commandModeOptions.commandMode === GAME_MASTER && (
                <button
                  className={`
                    h-10 rounded-e-lg bg-gray-100 p-3
                    dark:bg-gray-700 dark:hover:bg-gray-600
                    dark:focus:ring-blue-700
                    focus:outline-none focus:ring-2 focus:ring-gray-100
                    hover:bg-gray-200
                  `}
                  onClick={() => {
                    const newCommandModeOptions = { ...commandModeOptions };
                    newCommandModeOptions.setupTime = Math.max(serverStatus.elapsedTime + 60, newCommandModeOptions.setupTime + 60);
                    if (commandModeOptions.commandMode !== GAME_MASTER) return;
                    setCommandModeOptions(newCommandModeOptions);
                    setCurrentSetupTime(newCommandModeOptions.setupTime);
                    getApp().getServerManager().setCommandModeOptions(newCommandModeOptions);
                  }}
                >
                  <FaPlus className="my-auto" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex content-center gap-4">
            <div className="my-auto text-gray-400">
              <FaQuestionCircle />
            </div>
            <div className="text-sm text-gray-400">
              Unit spawns are NOT restricted, therefore no setup time is enforced and commanders can spawn units as desired. Only unit detection is enforced.
            </div>
          </div>
        )}
        <span className="mt-5">Options: </span>
        <div className="flex flex-col gap-3">
          <div
            className={`
              group flex flex-row rounded-md justify-content cursor-pointer
              gap-4 px-2
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
              Restrict unit spawns
            </span>
          </div>
          <div
            className={`
              group flex flex-row rounded-md justify-content cursor-pointer
              gap-4 px-2
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
          {Object.keys(ERAS_ORDER)
            .filter((item) => {
              return isNaN(Number(item));
            })
            .map((era) => {
              return (
                <div
                  key={era}
                  className={`
                    group flex flex-row rounded-md justify-content
                    cursor-pointer gap-4 px-2
                    dark:hover:bg-olympus-400
                  `}
                  onClick={() => {
                    if (!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER) return;
                    const newCommandModeOptions = { ...commandModeOptions };
                    if (commandModeOptions.eras.includes(era)) newCommandModeOptions.eras.splice(newCommandModeOptions.eras.indexOf(era));
                    else newCommandModeOptions.eras.push(era);
                    setCommandModeOptions(newCommandModeOptions);
                  }}
                >
                  <OlCheckbox
                    checked={commandModeOptions.eras.includes(era)}
                    onChange={() => {}}
                    disabled={!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER}
                  />
                  <span
                    data-disabled={!commandModeOptions.restrictSpawns || commandModeOptions.commandMode !== GAME_MASTER}
                    className={`data-[disabled='true']:text-gray-400`}
                  >
                    Allow {era} units
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

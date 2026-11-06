import { useState } from "react";
import { ServerStatus } from "../../interfaces";
import { getApp } from "../../olympusapp";

type PanicButtonProps = {
  serverStatus: ServerStatus;
};

export function PanicButton({ serverStatus }: PanicButtonProps) {
  const [isDispatchingUnloadCommands, setIsDispatchingUnloadCommands] = useState(false);

  const clickHandler = () => {
    setIsDispatchingUnloadCommands(true);
    getApp().getServerManager().unloadAllCommands();

    setTimeout(() => {
      setIsDispatchingUnloadCommands(false);
    }, 2000); // Reset the state after 2 seconds
  };

  return (
    <div
      className={`
        absolute bottom-[20px] right-[308px] flex items-center justify-between
        text-sm
      `}
    >
      {serverStatus.connected ? (
        <button
          className={`
            min-h-12 rounded-md px-2 font-semibold backdrop-blur-lg
            backdrop-grayscale
            dark:hover:bg-olympus-400 dark:hover:text-gray-200
            ${
              isDispatchingUnloadCommands
                ? `
                  bg-slate-400
                  dark:hover:bg-olympus-400
                `
                : `dark:bg-olympus-800/90 dark:text-gray-200`
            }
          `}
          onClick={clickHandler}
          disabled={isDispatchingUnloadCommands}
        >
          {isDispatchingUnloadCommands ? "Unloading..." : "Unload"}
        </button>
      ) : null}
    </div>
  );
}

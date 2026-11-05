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
    getApp().getServerManager().unloadAllCommands(() => {
      console.log('unloadAllCommands called successfully');
    });

    setIsDispatchingUnloadCommands(false);
  };

  return (
    <div
      className={`
        absolute bottom-[20px] right-[308px] flex items-center justify-between
        text-sm
      `}
    >
      {serverStatus.connected && serverStatus.load > 500 ? (
        <button
          className={`
            min-h-12 rounded-md bg-red-700 px-2 font-semibold text-white
            ${isDispatchingUnloadCommands ? "bg-slate-400" : `
              bg-red-700
              hover:bg-red-500
            `}
          `}
          onClick={clickHandler}
          disabled={isDispatchingUnloadCommands}
        >
          {isDispatchingUnloadCommands ? "Standby..." : "Panic"}
        </button>
      ) : null}
    </div>
  );
}

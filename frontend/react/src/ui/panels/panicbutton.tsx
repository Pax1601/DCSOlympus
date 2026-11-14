import { useState } from "react";
import { ServerStatus } from "../../interfaces";
import { getApp } from "../../olympusapp";

type PanicButtonProps = {
  serverStatus: ServerStatus;
};

export function PanicButton({ serverStatus }: PanicButtonProps) {
  const softPanicClickHandler = () => {
    getApp().getServerManager().softPanic();
  };

  const hardPanicClickHandler = () => {
    getApp().getServerManager().hardPanic();
  };

  return (
    <div
      className={`
        absolute bottom-[20px] right-[308px] flex flex-row items-center
        justify-between gap-2 text-sm
      `}
    >
      {serverStatus.connected
        ? [
            /* Soft Panic Button */
            <button
              className={`
                min-h-12 rounded-md px-2 font-semibold
                dark:bg-olympus-600 dark:text-gray-200 dark:hover:bg-olympus-400
                dark:hover:text-gray-200
              `}
              onClick={softPanicClickHandler}
            >
              Unload
            </button>,

            /* Hard Panic Button */
            <button
              className={`
                min-h-12 rounded-md px-2 font-semibold
                dark:bg-red-400 dark:text-gray-950 dark:hover:bg-red-300
                dark:hover:text-gray-800
              `}
              onClick={hardPanicClickHandler}
            >
              Hard Panic
            </button>,
          ]
        : null}
    </div>
  );
}

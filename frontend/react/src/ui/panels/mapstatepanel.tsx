import React, { useState } from "react";
import { FaHandPointer } from "react-icons/fa6";
import { IDLE, SPAWN_UNIT } from "../../constants/constants";

export function MapStatePanel(props: {}) {
  const [mapState, setMapState] = useState(IDLE);

  document.addEventListener("mapStateChanged", (ev) => {
    setMapState((ev as CustomEvent).detail);
  });

  return (
    <div
      className={`
        absolute bottom-6 right-[10px] w-[288px] z-ui-5 flex items-center
        justify-between rounded-lg bg-gray-200 p-3 text-sm backdrop-blur-lg
        backdrop-grayscale
        dark:bg-olympus-800/90 dark:text-gray-200
      `}
    >
      <div className={`flex w-full items-center gap-2 font-semibold`}>
        {mapState === IDLE && "IDLE"}
        {mapState === SPAWN_UNIT && (
          <div className={`flex w-full items-center`}>
            <FaHandPointer className="mr-2 text-sm text-white" />
            <div
              className={`
                w-full animate-pulse border-l-[1px] px-2 text-center
                dark:text-white
              `}
            >
              Click on the map to spawn
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

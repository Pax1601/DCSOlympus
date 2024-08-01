import React, { useState } from "react";
import { getApp } from "../../olympusapp";
export function ControlsPanel(props: {}) {
  const [controls, setControls] = useState(
    [] as { actions: string[]; text: string }[]
  );
  document.addEventListener("mapStateChanged", (ev) => {
    setControls(getApp().getMap().getCurrentControls());
  });

  return (
    <div
      className={`
        absolute bottom-[20px] right-[10px] w-[288px] z-ui-0 flex flex-col
        items-center justify-between gap-1 p-3 text-sm
      `}
    >
      {controls.map((control) => {
        return (
          <div
            className={`
              flex w-full justify-between gap-2 rounded-full px-2 py-1
              backdrop-blur-lg
              dark:bg-olympus-800/90 dark:text-gray-200
            `}
          >
            <div className="my-auto">{control.text}</div>
            <div className="flex gap-1">
              {control.actions.map((action, idx) => {
                return (
                  <>
                    <div
                      className={`
                        rounded-full bg-olympus-500 px-1 py-0.5 text-sm
                        font-bold text-white
                      `}
                    >
                      {action}
                    </div>
                    {idx !== control.actions.length - 1 && <div>+</div>}
                  </>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import React, { useState } from "react";
import { Unit } from "../../unit/unit";
import { ContextActionSet } from "../../unit/contextactionset";
import { OlStateButton } from "../components/olstatebutton";
import { getApp } from "../../olympusapp";
import { ContextAction } from "../../unit/contextaction";
import { CONTEXT_ACTION } from "../../constants/constants";
import { FaInfoCircle } from "react-icons/fa";

export function UnitMouseControlBar(props: {}) {
  var [open, setOpen] = useState(false);
  var [selectedUnits, setSelectedUnits] = useState([] as Unit[]);
  var [contextActionsSet, setContextActionsSet] = useState(
    new ContextActionSet()
  );
  var [activeContextAction, setActiveContextAction] = useState(
    null as null | ContextAction
  );

  /* When a unit is selected, open the menu */
  document.addEventListener("unitsSelection", (ev: CustomEventInit) => {
    setOpen(true);
    setSelectedUnits(ev.detail as Unit[]);

    updateData();
  });

  /* When a unit is deselected, refresh the view */
  document.addEventListener("unitDeselection", (ev: CustomEventInit) => {
    /* TODO add delay to avoid doing it too many times */
    updateData();
  });

  /* When all units are deselected clean the view */
  document.addEventListener("clearSelection", () => {
    setOpen(false);
    setSelectedUnits([]);
    updateData();
  });

  /* Deselect the context action when exiting state */
  document.addEventListener("mapStateChanged", (ev) => {
    setOpen((ev as CustomEvent).detail === CONTEXT_ACTION);
  });

  /* Update the current values of the shown data */
  function updateData() {
    var newContextActionSet = new ContextActionSet();

    getApp()
      .getUnitsManager()
      .getSelectedUnits()
      .forEach((unit: Unit) => {
        unit.appendContextActions(newContextActionSet);
      });

    setContextActionsSet(newContextActionSet);
    setActiveContextAction(null);
  }

  return (
    <>
      {" "}
      {open && (
        <>
          <div
            className={`
              absolute left-[50%] top-16 flex translate-x-[calc(-50%+2rem)]
              gap-2 rounded-md bg-gray-200 p-2 z-ui-2
              dark:bg-olympus-900
            `}
          >
            {Object.values(contextActionsSet.getContextActions()).map(
              (contextAction) => {
                return (
                  <OlStateButton
                    checked={contextAction === activeContextAction}
                    icon={contextAction.getIcon()}
                    tooltip={contextAction.getLabel()}
                    onClick={() => {
                      if (contextAction.getOptions().executeImmediately) {
                        setActiveContextAction(null);
                        contextAction.executeCallback(null, null);
                      } else {
                        if (activeContextAction != contextAction) {
                          setActiveContextAction(contextAction);
                          getApp().getMap().setState(CONTEXT_ACTION, {
                            contextAction: contextAction,
                          });
                        } else {
                          setActiveContextAction(null);
                          getApp()
                            .getMap()
                            .setState(CONTEXT_ACTION, { contextAction: null });
                        }
                      }
                    }}
                  />
                );
              }
            )}
          </div>
          {activeContextAction && (
            <div
              className={`
                absolute left-[50%] top-32 flex translate-x-[calc(-50%+2rem)]
                items-center gap-2 rounded-md bg-gray-200 p-4 z-ui-1
                min-w-[300px]
                dark:bg-olympus-800
              `}
            >
              <FaInfoCircle className={`
                mr-2 hidden min-w-8 text-sm text-blue-500
                md:block
              `} />
              <div
                className={`
                  px-2
                  dark:text-gray-400
                  md:border-l-[1px] md:px-5
                `}
              >
                {activeContextAction.getDescription()}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

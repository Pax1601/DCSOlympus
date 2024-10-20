import React, { useEffect, useRef, useState } from "react";
import { Unit } from "../../unit/unit";
import { ContextActionSet } from "../../unit/contextactionset";
import { OlStateButton } from "../components/olstatebutton";
import { getApp } from "../../olympusapp";
import { ContextAction } from "../../unit/contextaction";
import { CONTEXT_ACTION, CONTEXT_ACTION_COLORS } from "../../constants/constants";
import { FaInfoCircle } from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

export function UnitMouseControlBar(props: {}) {
  const [open, setOpen] = useState(false);
  const [contextActionsSet, setContextActionsSet] = useState(new ContextActionSet());
  const [activeContextAction, setActiveContextAction] = useState(null as null | ContextAction);
  const [scrolledLeft, setScrolledLeft] = useState(true);
  const [scrolledRight, setScrolledRight] = useState(false);

  /* Initialize the "scroll" position of the element */
  var scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) onScroll(scrollRef.current);
  });

  useEffect(() => {
    /* When a unit is selected, open the menu */
    document.addEventListener("unitsSelection", (ev: CustomEventInit) => {
      setOpen(true);
      updateData();
      setActiveContextAction(null);
    });

    /* When a unit is deselected, refresh the view */
    document.addEventListener("unitDeselection", (ev: CustomEventInit) => {
      window.setTimeout(() => updateData(), 200);
    });

    /* When all units are deselected clean the view */
    document.addEventListener("clearSelection", () => {
      setOpen(false);
      updateData();
    });

    /* Deselect the context action when exiting state */
    document.addEventListener("mapStateChanged", (ev) => {
      setOpen((ev as CustomEvent).detail === CONTEXT_ACTION);
    });
  }, []);

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
    return newContextActionSet;
  }

  function onScroll(el) {
    const sl = el.scrollLeft;
    const sr = el.scrollWidth - el.scrollLeft - el.clientWidth;

    sl < 1 && !scrolledLeft && setScrolledLeft(true);
    sl > 1 && scrolledLeft && setScrolledLeft(false);

    sr < 1 && !scrolledRight && setScrolledRight(true);
    sr > 1 && scrolledRight && setScrolledRight(false);
  }

  let reorderedActions: ContextAction[] = [];
  CONTEXT_ACTION_COLORS.forEach((color) => {
    Object.values(contextActionsSet.getContextActions()).forEach((contextAction: ContextAction) => {
      if (color === null && contextAction.getOptions().buttonColor === undefined) reorderedActions.push(contextAction);
      else if (color === contextAction.getOptions().buttonColor) reorderedActions.push(contextAction);
    });
  });

  return (
    <>
      {open && Object.keys(contextActionsSet.getContextActions()).length > 0 && (
        <>
          <div
            className={`
              absolute left-[50%] top-16 flex max-w-[80%]
              translate-x-[calc(-50%+2rem)] gap-2 rounded-md bg-gray-200
              dark:bg-olympus-900
            `}
          >
            {!scrolledLeft && (
              <FaChevronLeft
                className={`
                  absolute left-0 h-full w-6 rounded-lg px-2 py-3.5
                  text-gray-200
                  dark:bg-olympus-900
                `}
              />
            )}
            <div className="flex gap-2 overflow-x-auto no-scrollbar p-2" onScroll={(ev) => onScroll(ev.target)} ref={scrollRef}>
              {reorderedActions.map((contextAction: ContextAction) => {
                return (
                  <OlStateButton
                    key={contextAction.getId()}
                    checked={contextAction === activeContextAction}
                    icon={contextAction.getIcon()}
                    tooltip={contextAction.getLabel()}
                    className={
                      contextAction.getOptions().buttonColor
                        ? `
                          border-2
                          border-${contextAction.getOptions().buttonColor}-500
                        `
                        : ""
                    }
                    onClick={() => {
                      if (contextAction.getOptions().executeImmediately) {
                        setActiveContextAction(null);
                        contextAction.executeCallback(null, null);
                      } else {
                        if (activeContextAction !== contextAction) {
                          setActiveContextAction(contextAction);
                          getApp().getMap().setState(CONTEXT_ACTION, {
                            contextAction: contextAction,
                            defaultContextAction: contextActionsSet.getDefaultContextAction(),
                          });
                        } else {
                          setActiveContextAction(null);
                          getApp().getMap().setState(CONTEXT_ACTION, {
                            contextAction: null,
                            defaultContextAction: contextActionsSet.getDefaultContextAction(),
                          });
                        }
                      }
                    }}
                  />
                );
              })}
            </div>
            {!scrolledRight && (
              <FaChevronRight
                className={`
                  absolute right-0 h-full w-6 rounded-lg px-2 py-3.5
                  text-gray-200
                  dark:bg-olympus-900
                `}
              />
            )}
          </div>
          {activeContextAction && (
            <div
              className={`
                absolute left-[50%] top-32 flex min-w-[300px]
                translate-x-[calc(-50%+2rem)] items-center gap-2 rounded-md
                bg-gray-200 p-4
                dark:bg-olympus-800
              `}
            >
              <FaInfoCircle
                className={`
                  mr-2 hidden min-w-8 text-sm text-blue-500
                  md:block
                `}
              />
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

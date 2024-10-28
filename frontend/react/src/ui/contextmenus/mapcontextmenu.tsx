import React, { useEffect, useRef, useState } from "react";
import { Unit } from "../../unit/unit";
import { ContextActionSet } from "../../unit/contextactionset";
import { getApp } from "../../olympusapp";
import { ContextAction } from "../../unit/contextaction";
import { CONTEXT_ACTION_COLORS } from "../../constants/constants";
import { OlDropdownItem } from "../components/oldropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LatLng } from "leaflet";
import { SelectionClearedEvent } from "../../events";

export function MapContextMenu(props: {}) {
  const [open, setOpen] = useState(false);
  const [contextActionsSet, setContextActionsSet] = useState(new ContextActionSet());
  const [activeContextAction, setActiveContextAction] = useState(null as null | ContextAction);
  const [xPosition, setXPosition] = useState(0);
  const [yPosition, setYPosition] = useState(0);
  const [latLng, setLatLng] = useState(null as null | LatLng);
  const [unit, setUnit] = useState(null as null | Unit);

  var contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      const content = contentRef.current as HTMLDivElement;

      content.style.left = `${xPosition}px`;
      content.style.top = `${yPosition}px`;

      let newXPosition = xPosition;
      let newYposition = yPosition;

      let [cxr, cyb] = [content.getBoundingClientRect().x + content.clientWidth, content.getBoundingClientRect().y + content.clientHeight];

      /* Try and move the content so it is inside the screen */
      if (cxr > window.innerWidth) newXPosition -= cxr - window.innerWidth;
      if (cyb > window.innerHeight) newYposition -= cyb - window.innerHeight;

      content.style.left = `${newXPosition}px`;
      content.style.top = `${newYposition}px`;
    }
  });

  useEffect(() => {
    document.addEventListener("showMapContextMenu", (ev: CustomEventInit) => {
      setOpen(true);

      updateData();

      setXPosition(ev.detail.originalEvent.clientX);
      setYPosition(ev.detail.originalEvent.clientY);
      setLatLng(ev.detail.latlng);
      setUnit(null);
    });

    document.addEventListener("showUnitContextMenu", (ev: CustomEventInit) => {
      setOpen(true);

      updateData();

      setXPosition(ev.detail.originalEvent.clientX);
      setYPosition(ev.detail.originalEvent.clientY);
      setLatLng(null);
      setUnit(ev.detail.sourceTarget);
    });

    document.addEventListener("hideMapContextMenu", (ev: CustomEventInit) => {
      setOpen(false);
    });

    document.addEventListener("hideUnitContextMenu", (ev: CustomEventInit) => {
      setOpen(false);
    });

    SelectionClearedEvent.on(() => {
      setOpen(false);
    });
  }, []);

  /* Update the current values of the shown data */
  function updateData() {
    var newContextActionSet = new ContextActionSet();

    getApp()
      .getUnitsManager()
      .getSelectedUnits()
      .filter((unit) => !unit.getHuman())
      .forEach((unit: Unit) => {
        unit.appendContextActions(newContextActionSet);
      });

    setContextActionsSet(newContextActionSet);
    return newContextActionSet;
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
      {open && (
        <>
          <div
            ref={contentRef}
            className={`
              absolute flex min-w-80 gap-2 rounded-md bg-olympus-600
            `}
          >
            <div
              className={`
                flex w-full flex-col gap-2 overflow-x-auto no-scrollbar p-2
              `}
            >
              {Object.values(contextActionsSet.getContextActions(latLng ? "position" : "unit")).map((contextAction) => {
                const colorString = contextAction.getOptions().buttonColor
                  ? `
                  border-2
                  border-${contextAction.getOptions().buttonColor}-500
                `
                  : "";
                return (
                  <OlDropdownItem
                    className={`
                      flex w-full content-center gap-2 text-white
                      ${colorString}
                    `}
                    onClick={() => {
                      if (contextAction.getOptions().executeImmediately) {
                        contextAction.executeCallback(null, null);
                      } else {
                        if (latLng !== null) {
                          contextAction.executeCallback(null, latLng);
                          setOpen(false);
                        } else if (unit !== null) {
                          contextAction.executeCallback(unit, null);
                          setOpen(false);
                        }
                      }
                    }}
                  >
                    <FontAwesomeIcon className="my-auto" icon={contextAction.getIcon()} />
                    <div>{contextAction.getLabel()}</div>
                  </OlDropdownItem>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

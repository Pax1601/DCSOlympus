import React, { useEffect, useRef, useState } from "react";
import { Unit } from "../../unit/unit";
import { ContextAction } from "../../unit/contextaction";
import { CONTEXT_ACTION_COLORS, NO_SUBSTATE, OlympusState, OlympusSubState, UnitControlSubState } from "../../constants/constants";
import { OlDropdownItem } from "../components/oldropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LatLng } from "leaflet";
import { AppStateChangedEvent, ContextActionChangedEvent, ContextActionSetChangedEvent, SelectionClearedEvent } from "../../events";
import { ContextActionSet } from "../../unit/contextactionset";

export function MapContextMenu(props: {}) {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE as OlympusSubState);
  const [contextActionSet, setContextActionsSet] = useState(null as ContextActionSet | null);
  const [xPosition, setXPosition] = useState(0);
  const [yPosition, setYPosition] = useState(0);
  const [latLng, setLatLng] = useState(null as null | LatLng);
  const [unit, setUnit] = useState(null as null | Unit);

  var contentRef = useRef(null);

  // TODO show at correct position

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
    ContextActionSetChangedEvent.on((contextActionSet) => setContextActionsSet(contextActionSet));
  }, []);

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

  let reorderedActions: ContextAction[] = [];
  CONTEXT_ACTION_COLORS.forEach((color) => {
    if (contextActionSet)
      Object.values(contextActionSet.getContextActions()).forEach((contextAction: ContextAction) => {
        if (color === null && contextAction.getOptions().buttonColor === undefined) reorderedActions.push(contextAction);
        else if (color === contextAction.getOptions().buttonColor) reorderedActions.push(contextAction);
      });
  });

  return (
    <>
      {appState === OlympusState.UNIT_CONTROL && appSubState === UnitControlSubState.UNIT_CONTEXT_MENU && (
        <>
          <div
            ref={contentRef}
            className={`absolute flex min-w-80 gap-2 rounded-md bg-olympus-600`}
          >
            <div
              className={`
                flex w-full flex-col gap-2 overflow-x-auto no-scrollbar p-2
              `}
            >
              {contextActionSet &&
                Object.values(contextActionSet.getContextActions(latLng ? "position" : "unit")).map((contextActionIt) => {
                  const colorString = contextActionIt.getOptions().buttonColor
                    ? `
                  border-2
                  border-${contextActionIt.getOptions().buttonColor}-500
                `
                : "";
                return (
                  <OlDropdownItem
                    className={`
                      flex w-full content-center gap-2 text-white
                      ${colorString}
                    `}
                    onClick={() => {
                      if (contextActionIt.getOptions().executeImmediately) {
                        contextActionIt.executeCallback(null, null);
                      } else {
                        if (latLng !== null) {
                          contextActionIt.executeCallback(null, latLng);
                        } else if (unit !== null) {
                          contextActionIt.executeCallback(unit, null);
                        }
                      }
                        
                    }}
                    >
                      <FontAwesomeIcon className="my-auto" icon={contextActionIt.getIcon()} />
                      <div>{contextActionIt.getLabel()}</div>
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

import React, { useEffect, useRef, useState } from "react";
import { Unit } from "../../unit/unit";
import { ContextAction } from "../../unit/contextaction";
import { CONTEXT_ACTION_COLORS, ContextActionTarget, NO_SUBSTATE, OlympusState, OlympusSubState, UnitControlSubState } from "../../constants/constants";
import { OlDropdownItem } from "../components/oldropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LatLng } from "leaflet";
import {
  AppStateChangedEvent,
  ContextActionChangedEvent,
  ContextActionSetChangedEvent,
  MapContextMenuRequestEvent,
  SelectionClearedEvent,
  UnitContextMenuRequestEvent,
} from "../../events";
import { ContextActionSet } from "../../unit/contextactionset";
import { getApp } from "../../olympusapp";

export function MapContextMenu(props: {}) {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE as OlympusSubState);
  const [contextActionSet, setcontextActionSet] = useState(null as ContextActionSet | null);
  const [xPosition, setXPosition] = useState(0);
  const [yPosition, setYPosition] = useState(0);
  const [latLng, setLatLng] = useState(null as null | LatLng);
  const [unit, setUnit] = useState(null as null | Unit);

  var contentRef = useRef(null);

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
    ContextActionSetChangedEvent.on((contextActionSet) => setcontextActionSet(contextActionSet));
    MapContextMenuRequestEvent.on((latlng) => {
      setLatLng(latlng);
      const containerPoint = getApp().getMap().latLngToContainerPoint(latlng);
      setXPosition(getApp().getMap().getContainer().offsetLeft + containerPoint.x);
      setYPosition(getApp().getMap().getContainer().offsetTop + containerPoint.y);
    });
    UnitContextMenuRequestEvent.on((unit) => {
      setUnit(unit);
      const containerPoint = getApp().getMap().latLngToContainerPoint(unit.getPosition());
      setXPosition(getApp().getMap().getContainer().offsetLeft + containerPoint.x);
      setYPosition(getApp().getMap().getContainer().offsetTop + containerPoint.y);
    });
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

  let reorderedActions: ContextAction[] = contextActionSet
    ? Object.values(
        contextActionSet.getContextActions(appSubState === UnitControlSubState.MAP_CONTEXT_MENU ? ContextActionTarget.POINT : ContextActionTarget.UNIT)
      ).sort((a: ContextAction, b: ContextAction) => (a.getOptions().type < b.getOptions().type ? -1 : 1))
    : [];

  return (
    <>
      {appState === OlympusState.UNIT_CONTROL &&
        (appSubState === UnitControlSubState.MAP_CONTEXT_MENU || appSubState === UnitControlSubState.UNIT_CONTEXT_MENU) && (
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
                {contextActionSet &&
                  reorderedActions.map((contextActionIt) => {
                    const colorString = `
                  border-2
                  border-${CONTEXT_ACTION_COLORS[contextActionIt.getOptions().type]}-500
                `;

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
                            if (appSubState === UnitControlSubState.MAP_CONTEXT_MENU) {
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

import React, { useEffect, useRef, useState } from "react";
import { NO_SUBSTATE, OlympusState, OlympusSubState } from "../../constants/constants";
import { OlDropdownItem } from "../components/oldropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LatLng } from "leaflet";
import { AppStateChangedEvent, StarredSpawnContextMenuRequestEvent, StarredSpawnsChangedEvent } from "../../events";
import { getApp } from "../../olympusapp";
import { SpawnRequestTable } from "../../interfaces";
import { faStar } from "@fortawesome/free-solid-svg-icons";

export function StarredSpawnContextMenu(props: {}) {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE as OlympusSubState);
  const [xPosition, setXPosition] = useState(0);
  const [yPosition, setYPosition] = useState(0);
  const [latlng, setLatLng] = useState(null as null | LatLng);
  const [starredSpawns, setStarredSpawns] = useState({} as { [key: string]: SpawnRequestTable });

  var contentRef = useRef(null);

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
    StarredSpawnsChangedEvent.on((starredSpawns) => setStarredSpawns({ ...starredSpawns }));
    StarredSpawnContextMenuRequestEvent.on((latlng) => {
      setLatLng(latlng);
      const containerPoint = getApp().getMap().latLngToContainerPoint(latlng);
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

  return (
    <>
      {appState === OlympusState.STARRED_SPAWN && (
        <>
          <div
            ref={contentRef}
            className={`
              absolute flex min-w-80 max-w-80 gap-2 rounded-md bg-olympus-600
            `}
          >
            <div
              className={`
                flex w-full flex-col gap-2 overflow-y-auto no-scrollbar p-2
              `}
            >
              {Object.values(starredSpawns).length > 0? Object.values(starredSpawns).map((spawnRequestTable) => {
                return (
                  <OlDropdownItem
                    className={`
                      flex w-full content-center gap-2 text-sm text-white
                    `}
                    onClick={() => {
                      if (latlng) {
                        spawnRequestTable.unit.location = latlng;
                        getApp().getUnitsManager().spawnUnits(spawnRequestTable.category, [spawnRequestTable.unit], spawnRequestTable.coalition, false);
                        getApp().setState(OlympusState.IDLE)
                      }
                    }}
                  >
                    <FontAwesomeIcon
                      data-coalition={spawnRequestTable.coalition}
                      className={`
                        my-auto
                        data-[coalition='blue']:text-blue-500
                        data-[coalition='neutral']:text-gay-500
                        data-[coalition='red']:text-red-500
                      `}
                      icon={faStar}
                    />
                    <div>
                      {getApp().getUnitsManager().getDatabase().getByName(spawnRequestTable.unit.unitType)?.label} ({spawnRequestTable.quickAccessName})
                    </div>
                  </OlDropdownItem>
                );
              }): 
              <div className="p-2 text-sm text-white">No starred spawns, use the spawn menu to create a quick access spawn</div>}
            </div>
          </div>
        </>
      )}
    </>
  );
}

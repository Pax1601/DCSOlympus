import React, { useCallback, useEffect, useRef, useState } from "react";
import { getApp } from "../../olympusapp";
import { NO_SUBSTATE, OlympusState, OlympusSubState, shapeNameToType, SpawnSubState, staticObjectsShapes } from "../../constants/constants";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { LatLng } from "leaflet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppStateChangedEvent, SpawnHeadingChangedEvent } from "../../events";
import { FaQuestionCircle } from "react-icons/fa";
import { Coalition } from "../../types/types";
import { StaticRequestTable } from "../../interfaces";
import { OlExpandingTooltip } from "../components/olexpandingtooltip";
import { deg2rad, normalizeAngle } from "../../other/utils";
import { OlNumberInput } from "../components/olnumberinput";
import { OlToggle } from "../components/oltoggle";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";

export function StaticsSpawnMenu(props: {
  visible: boolean;
  compact: boolean;
  staticObject: string | null;
  latlng?: LatLng | null;
  coalition?: Coalition;
  onBack?: () => void;
}) {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE as OlympusSubState);
  const [canCargo, setCanCargo] = useState(false);
  const [linkOffset, setLinkOffset] = useState(false);
  const [dead, setDead] = useState(false);
  const [mass, setMass] = useState(1000);
  const [spawnCoalition, setSpawnCoalition] = useState("blue" as Coalition);

  /* Heading compass */
  const [compassAngle, setCompassAngle] = useState(0);
  const compassRef = useRef<HTMLImageElement>(null);

  /* Effect to update the coalition if it is forced externally */
  useEffect(() => {
    if (props.coalition) setSpawnCoalition(props.coalition);
  }, [props.coalition]);

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
  }, []);

  const updateSpawnRequestTableHeading = useCallback(() => {
    getApp()?.getMap().setSpawnHeading(compassAngle);
  }, [compassAngle]);
  useEffect(updateSpawnRequestTableHeading, [compassAngle]);

  useEffect(() => {
    SpawnHeadingChangedEvent.on((heading) => {
      setCompassAngle(heading);
    });
  }, []);

  useEffect(() => {
    setCompassAngle(getApp()?.getMap().getSpawnHeading() ?? 0);
  }, [appState]);

  /* When the menu is opened show the effect preview on the map as a cursor */
  const updateStaticRequestTable = useCallback(() => {
    if (!props.compact) {
      if (props.staticObject !== null) {
        const shapeName = staticObjectsShapes[props.staticObject as keyof typeof staticObjectsShapes] ?? "";
        const type = shapeNameToType[shapeName as keyof typeof shapeNameToType] ?? shapeName;
        getApp()
          ?.getMap()
          ?.setStaticRequestTable({
            type: type,
            shapeName: shapeName,
            coalition: spawnCoalition,
            heading: deg2rad(compassAngle),
            canCargo: canCargo,
            linkOffset: linkOffset,
            dead: dead,
            mass: mass,
          });
        getApp().setState(OlympusState.SPAWN, SpawnSubState.SPAWN_STATIC);
      } else {
        if (appState === OlympusState.SPAWN && appSubState === SpawnSubState.SPAWN_STATIC) getApp().setState(OlympusState.IDLE);
      }
    }
  }, [props.visible, props.staticObject, spawnCoalition, compassAngle, canCargo, linkOffset, dead, mass]);
  useEffect(updateStaticRequestTable, [props.visible, props.staticObject, spawnCoalition, compassAngle, canCargo, linkOffset, dead, mass]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const onMouseMove = (e: MouseEvent) => {
      if (compassRef.current) {
        const rect = compassRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        setCompassAngle(Math.round(normalizeAngle(angle + 90)));
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <>
      {props.visible ? (
        <>
          <div className="flex h-full flex-col gap-4 p-4">
            <>
              <div className="flex">
                {props.compact && (
                  <FontAwesomeIcon
                    onClick={props.onBack}
                    icon={faArrowLeft}
                    className={`
                      my-auto mr-1 h-4 cursor-pointer rounded-md p-2
                      dark:text-gray-500 dark:hover:bg-gray-700
                      dark:hover:text-white
                    `}
                  />
                )}
                <span className="my-auto text-white">{props.staticObject}</span>
              </div>

              {!props.coalition && (
                <div className="flex content-center justify-between">
                  <div className={`my-auto mr-2 text-gray-400`}>Coalition</div>
                  <OlCoalitionToggle
                    coalition={spawnCoalition}
                    onClick={() => {
                      spawnCoalition === "blue" && setSpawnCoalition("neutral");
                      spawnCoalition === "neutral" && setSpawnCoalition("red");
                      spawnCoalition === "red" && setSpawnCoalition("blue");
                    }}
                    tooltip={() => (
                      <OlExpandingTooltip
                        title="Unit coalition"
                        content="Toggle between blue, neutral and red coalitions. Neutral coalition must be used to employ scenic functions like miss on purpose."
                      />
                    )}
                    tooltipRelativeToParent={true}
                  />
                </div>
              )}

              <div className={`flex content-center justify-between`}>
                <span
                  className={`
                    my-auto font-normal
                    dark:text-gray-400
                  `}
                >
                  Is destroyed on spawn
                </span>
                <OlToggle
                  toggled={dead}
                  onClick={() => {
                    setDead(!dead);
                  }}
                  tooltip={() => (
                    <OlExpandingTooltip
                      title="Mark as destroyed"
                      content="This option allows you to mark the static object as destroyed. This can be useful for simulating damage or destruction in the scenario."
                    />
                  )}
                  tooltipRelativeToParent={true}
                />
              </div>

              {staticObjectsShapes[props.staticObject as keyof typeof staticObjectsShapes]?.endsWith("_cargo") && (
                <div className={`flex content-center justify-between`}>
                  <span
                    className={`
                      my-auto font-normal
                      dark:text-gray-400
                    `}
                  >
                    Can be sling loaded
                  </span>
                  <OlToggle
                    toggled={canCargo}
                    onClick={() => {
                      setCanCargo(!canCargo);
                    }}
                    tooltip={() => (
                      <OlExpandingTooltip
                        title="Enable sling loading"
                        content="This option allows you to make the static object able to be sling loaded by helicopters. Not all statics can be sling loaded in DCS."
                      />
                    )}
                    tooltipRelativeToParent={true}
                  />
                </div>
              )}
              {canCargo && (
                <div className={`flex content-center`}>
                  <span
                    className={`
                      my-auto mr-auto font-normal
                      dark:text-gray-400
                    `}
                  >
                    Mass
                  </span>
                  <OlNumberInput
                    value={mass}
                    onChange={(el) => {
                      const value = Number(el.currentTarget.value);
                      if (!isNaN(value)) {
                        if (value < 0) setMass(0);
                        else if (value > 10000) setMass(10000);
                        else setMass(value);
                      }
                    }}
                    onIncrease={() => setMass(Math.min(mass + 5, 10000))}
                    onDecrease={() => setMass(Math.max(mass - 5, 0))}
                    min={0}
                    max={10000}
                    tooltip={() => (
                      <OlExpandingTooltip
                        title="Mass of the static object"
                        content="This option allows you to set the mass of the static object. This can affect the physics and interactions of the object in the scenario."
                      />
                    )}
                    tooltipRelativeToParent={true}
                  />
                  <span className={`my-auto ml-2 text-sm text-gray-400`}>kg</span>
                </div>
              )}
              <div className="my-5 flex justify-between gap-4">
                <div className="my-auto flex flex-col gap-2">
                  <span className="text-white">Static heading</span>
                  <div className={`flex gap-1 text-sm text-gray-400`}>
                    <FaQuestionCircle className={`my-auto`} /> <div className={`
                      my-auto
                    `}>Drag to change</div>
                  </div>
                </div>

                <div className={`relative mr-3 h-[60px] w-[60px]`}>
                  <img className="absolute" ref={compassRef} onMouseDown={handleMouseDown} src={"/images/others/arrow_background.png"}></img>
                  <img
                    className="absolute left-0"
                    ref={compassRef}
                    onMouseDown={handleMouseDown}
                    src={"/images/others/arrow.png"}
                    style={{
                      width: "60px",
                      height: "60px",
                      transform: `rotate(${compassAngle}deg)`,
                      cursor: "pointer",
                    }}
                  ></img>
                </div>
              </div>

              {!props.compact && (
                <div className="flex content-center gap-4 p-4">
                  <div className="mt-8 text-gray-400">
                    <FaQuestionCircle />
                  </div>
                  <div className="text-sm text-gray-400">
                    Click on the map to spawn the selected static object. The static will be spawned with the heading selected above. Keep in mind statics are
                    updated at a slow rate, so it may take a bit for the static to appear.
                  </div>
                </div>
              )}
            </>

            {props.compact && (
              <button
                type="button"
                className={`
                  m-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium
                  text-white
                  focus:outline-none focus:ring-4
                `}
                onClick={() => {
                  const shapeName = staticObjectsShapes[props.staticObject as keyof typeof staticObjectsShapes] ?? "";
                  const type = shapeNameToType[shapeName as keyof typeof shapeNameToType] ?? shapeName;
                  if (props.latlng) {
                    getApp()
                      .getServerManager()
                      .spawnStatic(
                        props.latlng,
                        {
                          type: type,
                          shapeName: shapeName,
                          coalition: props.coalition,
                          heading: deg2rad(compassAngle),
                          canCargo: canCargo,
                          linkOffset: true,
                          dead: dead,
                          mass: mass,
                        } as StaticRequestTable,
                        false,
                        (commandHash: string) => {
                          if (props.latlng) getApp().getMap()?.addTemporaryStaticMarker(props.latlng, commandHash);
                          getApp().getServerManager()?.requestStaticsRefresh();
                        },
                      );
                  }
                  getApp().setState(OlympusState.IDLE);
                }}
              >
                Spawn
              </button>
            )}
          </div>
        </>
      ) : (
        <></>
      )}
    </>
  );
}

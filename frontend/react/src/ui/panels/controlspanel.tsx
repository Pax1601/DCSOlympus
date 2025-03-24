import React, { useCallback, useEffect, useState } from "react";
import { faFighterJet, faHandPointer, faJetFighter, faMap, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DrawSubState, MAP_OPTIONS_DEFAULTS, NO_SUBSTATE, OlympusState, OlympusSubState, SpawnSubState } from "../../constants/constants";
import { AppStateChangedEvent, ContextActionSetChangedEvent, MapOptionsChangedEvent, ShortcutsChangedEvent } from "../../events";
import { ContextActionSet } from "../../unit/contextactionset";
import { MapToolBar } from "./maptoolbar";
import { CoordinatesPanel } from "./coordinatespanel";

export function ControlsPanel(props: {}) {
  const [controls, setControls] = useState(
    null as
      | {
          actions: (string | number | IconDefinition)[];
          target?: IconDefinition;
          text: string;
        }[]
      | null
  );
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE as OlympusSubState);
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  const [shortcuts, setShortcuts] = useState({});
  const [contextActionSet, setContextActionSet] = useState(null as null | ContextActionSet);

  // TODO change constant references of "Shift with actual keybind"

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
    ShortcutsChangedEvent.on((shortcuts) => setShortcuts(shortcuts));
    ContextActionSetChangedEvent.on((contextActionSet) => setContextActionSet(contextActionSet));
  }, []);

  const callback = useCallback(() => {
    const touch = matchMedia("(hover: none)").matches;
    let controls: {
      actions: (string | number | IconDefinition)[];
      target?: IconDefinition;
      text: string;
    }[] = [];

    const baseControls = [
      {
        actions: [touch ? faHandPointer : "LMB"],
        text: "Select unit",
      },
      {
        actions: ["Shift", "LMB", "Drag"],
        text: "Box selection",
      },
      {
        actions: [touch ? faHandPointer : "LMB", "Drag"],
        text: "Move map",
      },
    ];

    if (appState === OlympusState.IDLE) {
      controls = baseControls;
      controls.push({
        actions: touch ? [faHandPointer, "Hold"] : ["RMB"],
        text: "Quick spawn menu",
      });
    } else if (appState === OlympusState.SPAWN_CONTEXT) {
      controls = baseControls;
      controls.push(
        {
          actions: [touch ? faHandPointer : "LMB"],
          text: "Close context menu",
        },
        {
          actions: touch ? [faHandPointer, "Hold"] : ["RMB"],
          text: "Move context menu",
        }
      );
    } else if (appState === OlympusState.UNIT_CONTROL) {
      controls.unshift({
        actions: ["RMB"],
        text: "Move",
      });
      controls.push({
        actions: ["RMB", "Hold"],
        target: faMap,
        text: "Show point actions",
      });
      controls.push({
        actions: ["RMB", "Hold"],
        target: faFighterJet,
        text: "Show unit actions",
      });
      //controls.push({
      //  actions: shortcuts["toggleRelativePositions"]?.toActions(),
      //  text: "Activate group movement",
      //});
      //controls.push({
      //  actions: [...shortcuts["toggleRelativePositions"]?.toActions(), "Wheel"],
      //  text: "Rotate formation",
      //});
    } else if (appState === OlympusState.SPAWN) {
      controls = [
        {
          actions: [touch ? faHandPointer : "LMB"],
          text: appSubState === SpawnSubState.NO_SUBSTATE ? "Close spawn menu" : "Return to spawn menu",
        },
        {
          actions: touch ? [faHandPointer, "Drag"] : ["Shift", "LMB", "Drag"],
          text: "Box selection",
        },
        {
          actions: [touch ? faHandPointer : "LMB", "Drag"],
          text: "Move map location",
        },
      ];
      if (appSubState === SpawnSubState.SPAWN_UNIT) {
        controls.unshift({
          actions: [touch ? faHandPointer : "LMB"],
          text: "Spawn unit",
        });
      } else if (appSubState === SpawnSubState.SPAWN_EFFECT) {
        controls.unshift({
          actions: [touch ? faHandPointer : "LMB"],
          text: "Spawn effect",
        });
      }
    } else if (appState === OlympusState.DRAW) {
      controls = [
        {
          actions: [touch ? faHandPointer : "LMB", "Drag"],
          text: "Move map location",
        },
      ];

      if (appSubState === DrawSubState.NO_SUBSTATE) {
        controls.unshift({
          actions: [touch ? faHandPointer : "LMB"],
          text: "Close draw menu",
        });
        controls.unshift({
          actions: [touch ? faHandPointer : "LMB"],
          text: "Select drawing",
        });
      }

      if (appSubState === DrawSubState.DRAW_CIRCLE) {
        controls.unshift({
          actions: [touch ? faHandPointer : "LMB"],
          text: "Add new circle",
        });
        controls.unshift({
          actions: [touch ? faHandPointer : "LMB", "Drag"],
          text: "Drag circle",
        });
      }

      if (appSubState === DrawSubState.DRAW_POLYGON) {
        controls.unshift({
          actions: [touch ? faHandPointer : "LMB"],
          text: "Add point to polygon",
        });
        controls.unshift({
          actions: [touch ? faHandPointer : "LMB", "Drag"],
          text: "Drag polygon",
        });
      }

      if (appSubState === DrawSubState.EDIT) {
        controls.unshift({
          actions: [touch ? faHandPointer : "LMB"],
          text: "Add/drag point",
        });
        controls.unshift({
          actions: [touch ? faHandPointer : "LMB", "Drag"],
          text: "Drag drawing",
        });
      }

      if (appSubState !== DrawSubState.NO_SUBSTATE) {
        controls.push({
          actions: [touch ? faHandPointer : "LMB"],
          text: "Deselect drawing",
        });
      }
    } else {
      controls = baseControls;
      controls.push({
        actions: ["LMB"],
        text: "Return to idle state",
      });
    }

    setControls(controls);
  }, [appState, appSubState, mapOptions]);

  useEffect(callback, [appState, appSubState, mapOptions]);

  return (
    <div
      className={`
        absolute right-[0px] top-16
        ${mapOptions.showMinimap ? `bottom-[233px]` : `bottom-[65px]`}
        pointer-events-none flex w-[288px] flex-col items-center justify-between
        gap-1 p-3 text-sm
      `}
    >
      <MapToolBar />
      {/*controls?.map((control) => {
        return (
          <div
            key={control.text}
            className={`
              flex w-full justify-between gap-2 rounded-full py-1 pl-4 pr-1
              backdrop-blur-lg
              dark:bg-olympus-800/90 dark:text-gray-200
            `}
          >
            <div className="my-auto overflow-hidden text-nowrap">{control.text}</div>
            <div
              className={`
                ml-auto flex gap-1 rounded-full bg-olympus-500 px-2 py-0.5
                text-sm font-bold text-white
              `}
            >
              {control.actions.map((action, idx) => {
                return (
                  <div key={idx} className="flex gap-1">
                    <div>
                      {typeof action === "string" || typeof action === "number" ? action : <FontAwesomeIcon icon={action} className={`
                        my-auto ml-auto
                      `} />}
                    </div>
                    {idx < control.actions.length - 1 && typeof control.actions[idx + 1] === "string" && <div>+</div>}
                    {idx < control.actions.length - 1 && typeof control.actions[idx + 1] === "number" && <div>x</div>}
                  </div>
                );
              })}
              {control.target && (
                <>
                  <div>+</div>
                  <div>
                    <FontAwesomeIcon icon={control.target} />
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })*/}
    </div>
  );
}

import React, { useCallback, useEffect, useState } from "react";
import { faHandPointer, faJetFighter, faMap, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ContextActionTarget, MAP_OPTIONS_DEFAULTS, NO_SUBSTATE, OlympusState, OlympusSubState, SpawnSubState } from "../../constants/constants";
import { AppStateChangedEvent, MapOptionsChangedEvent } from "../../events";
import { getApp } from "../../olympusapp";
import { ContextAction } from "../../unit/contextaction";

export function ControlsPanel(props: {}) {
  const [controls, setControls] = useState(
    null as
      | {
          actions: (string | number | IconDefinition)[];
          target: IconDefinition | null;
          text: string;
        }[]
      | null
  );
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE as OlympusSubState);
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
  }, []);

  const callback = useCallback(() => {
    const touch = matchMedia("(hover: none)").matches;
    let controls: {
      actions: (string | number | IconDefinition)[];
      target: IconDefinition | null;
      text: string;
    }[] = [];

    if (appState === OlympusState.IDLE) {
      controls = [
        {
          actions: [touch ? faHandPointer : "LMB"],
          target: faJetFighter,
          text: "Select unit",
        },
        {
          actions: touch ? [faHandPointer, "Hold"] : ["RMB"],
          target: faMap,
          text: "Quick spawn menu",
        },
        {
          actions: touch ? [faHandPointer, "Drag"] : ["Shift", "LMB", "Drag"],
          target: faMap,
          text: "Box selection",
        },
        {
          actions: [touch ? faHandPointer : "LMB", "Drag"],
          target: faMap,
          text: "Move map location",
        },
      ];
    } else if (appState === OlympusState.SPAWN_CONTEXT) {
      controls = [
        {
          actions: [touch ? faHandPointer : "LMB"],
          target: faJetFighter,
          text: "Close context menu",
        },
        {
          actions: touch ? [faHandPointer, "Hold"] : ["RMB"],
          target: faMap,
          text: "Move context menu",
        },
        {
          actions: touch ? [faHandPointer, "Drag"] : ["Shift", "LMB", "Drag"],
          target: faMap,
          text: "Box selection",
        },
        {
          actions: [touch ? faHandPointer : "LMB", "Drag"],
          target: faMap,
          text: "Move map location",
        },
      ];
    } else if (appState === OlympusState.UNIT_CONTROL) {
      if (!mapOptions.tabletMode) {
        controls = Object.values(getApp().getMap().getContextActionSet()?.getContextActions() ?? {})
          .sort((a: ContextAction, b: ContextAction) => (a.getLabel() > b.getLabel() ? 1 : -1))
          .filter((contextAction: ContextAction) => contextAction.getOptions().code)
          .map((contextAction: ContextAction) => {
            let actions: (string | IconDefinition)[] = [];
            contextAction.getOptions().shiftKey && actions.push("Shift");
            contextAction.getOptions().altKey && actions.push("Alt");
            contextAction.getOptions().ctrlKey && actions.push("Ctrl");
            actions.push(
              (contextAction.getOptions().code as string)
                .replace("Key", "")
                .replace("ControlLeft", "Ctrl LH")
                .replace("AltLeft", "Alt LH")
                .replace("ShiftLeft", "Shift LH")
                .replace("ControlRight", "Ctrl RH")
                .replace("AltRight", "Alt RH")
                .replace("ShiftRight", "Shift RH")
            );
            contextAction.getTarget() !== ContextActionTarget.NONE && actions.push(touch ? faHandPointer : "LMB");
            return {
              actions: actions,
              target:
                contextAction.getTarget() === ContextActionTarget.NONE ? null : contextAction.getTarget() === ContextActionTarget.POINT ? faMap : faJetFighter,
              text: contextAction.getLabel(),
            };
          });
      }
    } else if (appState === OlympusState.SPAWN) {
      controls = [
        {
          actions: [touch ? faHandPointer : "LMB", 2],
          target: faMap,
          text: appSubState === SpawnSubState.NO_SUBSTATE ? "Close spawn menu" : "Return to spawn menu",
        },
        {
          actions: touch ? [faHandPointer, "Drag"] : ["Shift", "LMB", "Drag"],
          target: faMap,
          text: "Box selection",
        },
        {
          actions: [touch ? faHandPointer : "LMB", "Drag"],
          target: faMap,
          text: "Move map location",
        },
      ];
      if (appSubState === SpawnSubState.SPAWN_UNIT) {
        controls.unshift({
          actions: [touch ? faHandPointer : "LMB"],
          target: faMap,
          text: "Spawn unit",
        });
      } else if (appSubState === SpawnSubState.SPAWN_EFFECT) {
        controls.unshift({
          actions: [touch ? faHandPointer : "LMB"],
          target: faMap,
          text: "Spawn effect",
        });
      }
    }

    setControls(controls);
  }, [appState, appSubState, mapOptions]);

  useEffect(callback, [appState, appSubState, mapOptions]);

  return (
    <div
      className={`
        absolute right-[0px]
        ${mapOptions.showMinimap ? `bottom-[233px]` : `bottom-[65px]`}
        flex w-[310px] flex-col items-center justify-between gap-1 p-3 text-sm
      `}
    >
      {controls?.map((control) => {
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
                      {typeof action === "string" || typeof action === "number" ? (
                        action
                      ) : (
                        <FontAwesomeIcon
                          icon={action}
                          className={`my-auto ml-auto`}
                        />
                      )}
                    </div>
                    {idx < control.actions.length - 1 && typeof control.actions[idx + 1] === "string" && <div>+</div>}
                    {idx < control.actions.length - 1 && typeof control.actions[idx + 1] === "number" && <div>x</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

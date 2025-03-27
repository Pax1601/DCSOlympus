import React, { useEffect, useRef, useState } from "react";
import { ContextActionSet } from "../../unit/contextactionset";
import { OlStateButton } from "../components/olstatebutton";
import { getApp } from "../../olympusapp";
import { ContextAction, ContextActionOptions } from "../../unit/contextaction";
import { CONTEXT_ACTION_COLORS, ContextActionTarget, MAP_OPTIONS_DEFAULTS } from "../../constants/constants";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { OlympusState } from "../../constants/constants";
import {
  AppStateChangedEvent,
  ContextActionChangedEvent,
  ContextActionSetChangedEvent,
  CopiedUnitsEvents,
  MapOptionsChangedEvent,
  PasteEnabledChangedEvent,
  SelectedUnitsChangedEvent,
  SelectionClearedEvent,
  SelectionEnabledChangedEvent,
  ShortcutsChangedEvent,
} from "../../events";
import { faCopy, faEraser, faMinus, faObjectGroup, faPaste, faPlus, faTape } from "@fortawesome/free-solid-svg-icons";
import { Shortcut } from "../../shortcut/shortcut";
import { ShortcutOptions, UnitData } from "../../interfaces";
import { Unit } from "../../unit/unit";

export function MapToolBar(props: {}) {
  const [appState, setAppState] = useState(OlympusState.IDLE);
  const [contextActionSet, setcontextActionSet] = useState(null as ContextActionSet | null);
  const [contextAction, setContextAction] = useState(null as ContextAction | null);
  const [scrolledTop, setScrolledTop] = useState(true);
  const [scrolledBottom, setScrolledBottom] = useState(false);
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  const [selectionEnabled, setSelectionEnabled] = useState(false);
  const [pasteEnabled, setPasteEnabled] = useState(false);
  const [controller, setController] = useState(new AbortController());
  const [shortcuts, setShortcuts] = useState(
    {} as {
      [key: string]: Shortcut;
    }
  );
  const [selectedUnits, setSelectedUnits] = useState([] as Unit[]);
  const [copiedUnitsData, setCopiedUnitsData] = useState([] as UnitData[]);

  /* Initialize the "scroll" position of the element */
  var scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) onScroll(scrollRef.current);
  });

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => setAppState(state));
    ContextActionSetChangedEvent.on((contextActionSet) => setcontextActionSet(contextActionSet));
    ContextActionChangedEvent.on((contextAction) => setContextAction(contextAction));
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions(mapOptions));
    SelectionEnabledChangedEvent.on((selectionEnabled) => setSelectionEnabled(selectionEnabled));
    PasteEnabledChangedEvent.on((pasteEnabled) => setPasteEnabled(pasteEnabled));
    ShortcutsChangedEvent.on((shortcuts) => setShortcuts({ ...shortcuts }));
    SelectedUnitsChangedEvent.on((selectedUnits) => setSelectedUnits(selectedUnits));
    SelectionClearedEvent.on(() => setSelectedUnits([]));
    CopiedUnitsEvents.on((unitsData) => setCopiedUnitsData(unitsData));
  }, []);

  function onScroll(el) {
    const sl = el.scrollTop;
    const sr = el.scrollHeight - el.scrollTop - el.clientHeight;

    sl < 1 && !scrolledTop && setScrolledTop(true);
    sl > 1 && scrolledTop && setScrolledTop(false);

    sr < 1 && !scrolledBottom && setScrolledBottom(true);
    sr > 1 && scrolledBottom && setScrolledBottom(false);
  }

  function shortcutCombination(options: ShortcutOptions | ContextActionOptions) {
    if (options === undefined) return <></>;
    return (
      <>
        {options.ctrlKey && (
          <kbd
            className={`
              my-auto text-nowrap rounded-lg border border-gray-200 bg-gray-100
              px-2 py-1 text-xs font-semibold text-gray-800
              dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
            `}
          >
            Ctrl
          </kbd>
        )}
        {options.altKey && (
          <kbd
            className={`
              my-auto text-nowrap rounded-lg border border-gray-200 bg-gray-100
              px-2 py-1 text-xs font-semibold text-gray-800
              dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
            `}
          >
            Alt
          </kbd>
        )}
        {options.shiftKey && (
          <kbd
            className={`
              my-auto text-nowrap rounded-lg border border-gray-200 bg-gray-100
              px-2 py-1 text-xs font-semibold text-gray-800
              dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
            `}
          >
            Shift
          </kbd>
        )}

        {options.code && (
          <kbd
            className={`
              my-auto text-nowrap rounded-lg border border-gray-200 bg-gray-100
              px-2 py-1 text-xs font-semibold text-gray-800
              dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
            `}
          >
            {options.code?.replace("Key", "")}
          </kbd>
        )}
      </>
    );
  }

  let reorderedActions: ContextAction[] = contextActionSet
    ? Object.values(contextActionSet.getContextActions()).sort((a: ContextAction, b: ContextAction) => (a.getOptions().type < b.getOptions().type ? -1 : 1))
    : [];

  return (
    <>
      <>
        <div
          className={`
            relative top-0 mb-auto ml-auto flex max-h-[calc(100%-200px)] gap-2
            rounded-md bg-olympus-900
          `}
        >
          {!scrolledTop && (
            <FaChevronUp
              className={`
                absolute top-0 h-6 w-full rounded-lg bg-red-500 px-3.5 py-1
                text-gray-200
                dark:bg-olympus-900
              `}
            />
          )}
          <div
            className={`
              pointer-events-auto flex flex-col gap-2 overflow-y-auto
              no-scrollbar p-2
            `}
            onScroll={(ev) => onScroll(ev.target)}
            ref={scrollRef}
          >
            <>
              <div className="flex flex-col gap-1">
                <OlStateButton
                  key={"select"}
                  checked={false}
                  icon={faPlus}
                  tooltip={() => <div>Zoom map in</div>}
                  tooltipPosition="side"
                  onClick={() => {
                    getApp().getMap().zoomIn();
                  }}
                />
                <OlStateButton
                  key={"select"}
                  checked={false}
                  icon={faMinus}
                  tooltip={() => <div>Zoom map out</div>}
                  tooltipPosition="side"
                  onClick={() => {
                    getApp().getMap().zoomOut();
                  }}
                />
                <OlStateButton
                  key={"select"}
                  checked={selectionEnabled}
                  icon={faObjectGroup}
                  tooltip={() => (
                    <div>
                      <div className="flex content-center gap-2">
                        {shortcutCombination(shortcuts["toggleSelectionEnabled"]?.getOptions())}
                        <div className="my-auto">Box selection</div>
                      </div>
                    </div>
                  )}
                  tooltipPosition="side"
                  onClick={() => {
                    getApp().getMap().setSelectionEnabled(!selectionEnabled);
                    if (!selectionEnabled) {
                      window.addEventListener(
                        "mouseup",
                        () => {
                          getApp().getMap().setSelectionEnabled(false);
                        },
                        { once: true, signal: controller.signal }
                      );
                    } else {
                      controller.abort();
                    }
                  }}
                />
              </div>
              {selectedUnits.length > 0 && (
                <div className="flex flex-col gap-1">
                  <OlStateButton
                    key={"copy"}
                    checked={false}
                    icon={faCopy}
                    tooltip={() => (
                      <div className="flex content-center gap-2">
                        {shortcutCombination(shortcuts["copyUnits"]?.getOptions())}
                        <div className="my-auto">Copy selected units</div>
                      </div>
                    )}
                    tooltipPosition="side"
                    onClick={() => {
                      getApp().getUnitsManager().copy(selectedUnits);
                    }}
                  />
                </div>
              )}
              {copiedUnitsData.length > 0 && (
                <div className="flex flex-col gap-1">
                  <OlStateButton
                    key={"paste"}
                    checked={pasteEnabled}
                    icon={faPaste}
                    tooltip={() => (
                      <div className="flex content-center gap-2">
                        {shortcutCombination(shortcuts["pasteUnits"]?.getOptions())}
                        <div className="my-auto">Paste copied units</div>
                      </div>
                    )}
                    tooltipPosition="side"
                    onClick={() => {
                      getApp().getMap().setPasteEnabled(!pasteEnabled);
                    }}
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <OlStateButton
                  key={"measure"}
                  checked={appState === OlympusState.MEASURE}
                  icon={faTape}
                  tooltip={() => (
                    <div className="flex content-center gap-2">
                      {shortcutCombination(shortcuts["measure"]?.getOptions())}
                      <div className="my-auto">Enter measure mode</div>
                    </div>
                  )}
                  tooltipPosition="side"
                  onClick={() => {
                    getApp().setState(appState === OlympusState.MEASURE ? OlympusState.IDLE : OlympusState.MEASURE);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <OlStateButton
                  key={"clearMeasures"}
                  checked={false}
                  icon={faEraser}
                  tooltip={() => (
                    <div className="flex content-center gap-2">
                      {shortcutCombination(shortcuts["clearMeasures"]?.getOptions())}
                      <div className="my-auto">Clear all measures</div>
                    </div>
                  )}
                  tooltipPosition="side"
                  onClick={() => {
                    getApp().getMap().clearMeasures();
                  }}
                />
              </div>
            </>

            {reorderedActions.map((contextActionIt: ContextAction) => {
              return (
                <div className="flex flex-col gap-1">
                  <OlStateButton
                    key={contextActionIt.getId()}
                    checked={contextActionIt === contextAction}
                    icon={contextActionIt.getIcon()}
                    tooltip={() => (
                      <div
                        className="overflow-hidden"
                        style={{ animationName: "tooltipFadeInHeight", animationDuration: "1s", animationFillMode: "forwards", height: "26px" }}
                      >
                        <div className="mb-4 flex h-6 content-center gap-2">
                          {shortcutCombination(contextActionIt.getOptions())}
                          <div className="my-auto">{contextActionIt.getLabel()}</div>
                        </div>
                        <div
                          className={"max-w-[200px] text-wrap"}
                          style={{ animationName: "tooltipFadeInWidth", animationDuration: "1s", animationFillMode: "forwards", width: "1px" }}
                        >
                          {contextActionIt.getDescription()}
                        </div>
                      </div>
                    )}
                    tooltipPosition="side"
                    buttonColor={CONTEXT_ACTION_COLORS[contextActionIt.getOptions().type ?? 0]}
                    onClick={() => {
                      if (contextActionIt.getTarget() === ContextActionTarget.NONE) contextActionIt.executeCallback(null, null);
                      else contextActionIt !== contextAction ? getApp().getMap().setContextAction(contextActionIt) : getApp().getMap().setContextAction(null);
                    }}
                  />
                </div>
              );
            })}
          </div>
          {!scrolledBottom && (
            <FaChevronDown
              className={`
                absolute bottom-0 h-6 w-full rounded-lg px-3.5 py-1
                text-gray-200
                dark:bg-olympus-900
              `}
            />
          )}
        </div>
      </>

      {/*}
      {contextAction && (
        <div
          className={`
            absolute left-[50%] top-16 flex translate-x-[calc(-50%+2rem)]
            items-center gap-2 rounded-md bg-gray-200 p-4
            dark:bg-olympus-800
          `}
        >
          <FontAwesomeIcon
            icon={contextAction.getIcon()}
            className={`
              mr-2 hidden text-xl text-blue-500
              md:block
            `}
          />
          <div className={`text-gray-200`}>{contextAction.getDescription()}</div>
        </div>
      )}
        {*/}
    </>
  );
}

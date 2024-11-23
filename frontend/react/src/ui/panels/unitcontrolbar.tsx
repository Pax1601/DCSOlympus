import React, { useEffect, useRef, useState } from "react";
import { ContextActionSet } from "../../unit/contextactionset";
import { OlStateButton } from "../components/olstatebutton";
import { getApp } from "../../olympusapp";
import { ContextAction } from "../../unit/contextaction";
import { CONTEXT_ACTION_COLORS, ContextActionTarget, MAP_OPTIONS_DEFAULTS } from "../../constants/constants";
import { FaChevronDown,FaChevronUp } from "react-icons/fa6";
import { OlympusState } from "../../constants/constants";
import { AppStateChangedEvent, ContextActionChangedEvent, ContextActionSetChangedEvent, MapOptionsChangedEvent } from "../../events";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function UnitControlBar(props: {}) {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [contextActionSet, setcontextActionSet] = useState(null as ContextActionSet | null);
  const [contextAction, setContextAction] = useState(null as ContextAction | null);
  const [scrolledTop, setScrolledTop] = useState(true);
  const [scrolledBottom, setScrolledBottom] = useState(false);
  const [menuHidden, setMenuHidden] = useState(false);
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);

  /* Initialize the "scroll" position of the element */
  var scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) onScroll(scrollRef.current);
  });

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => setAppState(state));
    ContextActionSetChangedEvent.on((contextActionSet) => setcontextActionSet(contextActionSet));
    ContextActionChangedEvent.on((contextAction) => setContextAction(contextAction));
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
  }, []);

  function onScroll(el) {
    const sl = el.scrollTop;
    const sr = el.scrollHeight - el.scrollTop - el.clientHeight;

    sl < 1 && !scrolledTop && setScrolledTop(true);
    sl > 1 && scrolledTop && setScrolledTop(false);

    sr < 1 && !scrolledBottom && setScrolledBottom(true);
    sr > 1 && scrolledBottom && setScrolledBottom(false);
  }

  let reorderedActions: ContextAction[] = contextActionSet
    ? Object.values(contextActionSet.getContextActions()).sort((a: ContextAction, b: ContextAction) => (a.getOptions().type < b.getOptions().type ? -1 : 1))
    : [];

  return (
    <>
      {appState === OlympusState.UNIT_CONTROL && contextActionSet && Object.keys(contextActionSet.getContextActions()).length > 0 && (
        <>
          {mapOptions.tabletMode && (
            <>
              <div
                data-menuhidden={menuHidden}
                className={`
                  absolute right-2 top-16 flex max-h-[80%] gap-2 rounded-md
                  bg-gray-200
                  dark:bg-olympus-900
                `}
              >
                {!scrolledTop && (
                  <FaChevronUp
                    className={`
                      absolute top-0 h-6 w-full rounded-lg px-2 py-3.5
                      text-gray-200
                      dark:bg-olympus-900
                    `}
                  />
                )}
                <div className={`
                  flex flex-col gap-2 overflow-y-auto no-scrollbar p-2
                `} onScroll={(ev) => onScroll(ev.target)} ref={scrollRef}>
                  {reorderedActions.map((contextActionIt: ContextAction) => {
                    return (
                      <div className="flex flex-col gap-1">
                        <OlStateButton
                          key={contextActionIt.getId()}
                          checked={contextActionIt === contextAction}
                          icon={contextActionIt.getIcon()}
                          tooltip={contextActionIt.getLabel()}
                          buttonColor={CONTEXT_ACTION_COLORS[contextActionIt.getOptions().type ?? 0]}
                          onClick={() => {
                            if (contextActionIt.getTarget() === ContextActionTarget.NONE) {
                              contextActionIt.executeCallback(null, null);
                            } else {
                              contextActionIt !== contextAction
                                ? getApp().getMap().setContextAction(contextActionIt)
                                : getApp().getMap().setContextAction(null);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                {!scrolledBottom && (
                  <FaChevronDown
                    className={`
                      absolute bottom-0 h-6 w-full rounded-lg px-2 py-3.5
                      text-gray-200
                      dark:bg-olympus-900
                    `}
                  />
                )}
              </div>
            </>
          )}

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
              <div
                className={`text-gray-200`}
              >
                {contextAction.getDescription()}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

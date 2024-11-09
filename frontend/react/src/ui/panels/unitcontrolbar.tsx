import React, { useEffect, useRef, useState } from "react";
import { ContextActionSet } from "../../unit/contextactionset";
import { OlStateButton } from "../components/olstatebutton";
import { getApp } from "../../olympusapp";
import { ContextAction } from "../../unit/contextaction";
import { CONTEXT_ACTION_COLORS } from "../../constants/constants";
import { FaInfoCircle } from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { OlympusState } from "../../constants/constants";
import { AppStateChangedEvent, ContextActionChangedEvent, ContextActionSetChangedEvent } from "../../events";

export function UnitControlBar(props: {}) {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [contextActionSet, setcontextActionSet] = useState(null as ContextActionSet | null);
  const [contextAction, setContextAction] = useState(null as ContextAction | null);
  const [scrolledLeft, setScrolledLeft] = useState(true);
  const [scrolledRight, setScrolledRight] = useState(false);

  /* Initialize the "scroll" position of the element */
  var scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) onScroll(scrollRef.current);
  });

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => setAppState(state));
    ContextActionSetChangedEvent.on((contextActionSet) => setcontextActionSet(contextActionSet));
    ContextActionChangedEvent.on((contextAction) => setContextAction(contextAction));
  }, []);

  function onScroll(el) {
    const sl = el.scrollLeft;
    const sr = el.scrollWidth - el.scrollLeft - el.clientWidth;

    sl < 1 && !scrolledLeft && setScrolledLeft(true);
    sl > 1 && scrolledLeft && setScrolledLeft(false);

    sr < 1 && !scrolledRight && setScrolledRight(true);
    sr > 1 && scrolledRight && setScrolledRight(false);
  }

  let reorderedActions: ContextAction[] = contextActionSet
    ? Object.values(contextActionSet.getContextActions()).sort((a: ContextAction, b: ContextAction) => (a.getOptions().type < b.getOptions().type ? -1 : 1))
    : [];

  return (
    <>
      {appState === OlympusState.UNIT_CONTROL && contextActionSet && Object.keys(contextActionSet.getContextActions()).length > 0 && (
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
                        if (contextActionIt.getOptions().executeImmediately) {
                          contextActionIt.executeCallback(null, null);
                        } else {
                          contextActionIt !== contextAction ? getApp().getMap().setContextAction(contextActionIt) : getApp().getMap().setContextAction(null);
                        }
                      }}
                    />
                    <div
                      className={`
                        rounded-sm bg-gray-400 text-center text-xs font-bold
                        text-olympus-800
                      `}
                    >
                      {(contextActionIt.getOptions().hotkey ?? "").replace("Key", "")}
                    </div>
                  </div>
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
          {/*}
          {contextAction && (
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
                {contextAction.getDescription()}
              </div>
            </div>
          )}
            {*/}
        </>
      )}
    </>
  );
}

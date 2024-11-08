import React, { useEffect, useState } from "react";
import { AppStateChangedEvent, ContextActionChangedEvent, InfoPopupEvent } from "../../events";
import { OlympusState } from "../../constants/constants";
import { ContextAction } from "../../unit/contextaction";

export function InfoBar(props: {}) {
  const [messages, setMessages] = useState([] as string[]);
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [contextAction, setContextAction] = useState(null as ContextAction | null);

  useEffect(() => {
    InfoPopupEvent.on((messages) => setMessages([...messages]));
    AppStateChangedEvent.on((state, subState) => setAppState(state));
    ContextActionChangedEvent.on((contextAction) => setContextAction(contextAction));
  }, []);

  let topString = "";
  if (appState === OlympusState.UNIT_CONTROL) {
    if (contextAction === null) {
      topString = "top-32";
    } else {
      topString = "top-48";
    }
  } else {
    topString = "top-16";
  }

  return (
    <div
      className={`
        absolute left-[50%]
        ${topString}
        flex w-[400px] max-w-[80%] translate-x-[calc(-50%+2rem)]
      `}
    >
      {messages.map((message, idx) => {
        return (
          <div
            className={`
              absolute left-0 w-full gap-2 rounded-md bg-olympus-800/90 px-4
              py-2 text-center text-sm text-white backdrop-blur-lg
              backdrop-grayscale
            `}
            style={{ top: `${idx * 20}px` }}
          >
            {message}
          </div>
        );
      })}
    </div>
  );
}

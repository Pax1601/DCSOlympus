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

  return (
    <div className={`absolute left-[50%] top-16`}>
      {messages.slice(Math.max(0, messages.length - 4), Math.max(0, messages.length)).map((message, idx) => {
        return (
          <div
            key={idx}
            className={`
              absolute w-fit translate-x-[-50%] gap-2 text-nowrap rounded-full
              bg-olympus-800/90 px-4 py-2 text-center text-sm text-white
              shadow-md backdrop-blur-lg backdrop-grayscale
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

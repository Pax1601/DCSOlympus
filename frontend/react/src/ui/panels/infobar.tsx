import React, { useEffect, useState } from "react";
import { InfoPopupEvent } from "../../events";


export function InfoBar(props: {}) {
  const [messages, setMessages] = useState([] as string[]);

  useEffect(() => {
    InfoPopupEvent.on((messages) => setMessages([...messages]));
  }, []);

  return (
    <div className={`absolute left-[50%] top-16`}>
      {messages.slice(Math.max(0, messages.length - 4), Math.max(0, messages.length)).map((message, idx) => {
        return (
          <div
            key={idx}
            className={`
              absolute w-[250px] translate-x-[-50%] gap-2 rounded-full
              bg-olympus-800/90 px-4 py-2 text-center text-sm text-white
              shadow-md backdrop-blur-lg backdrop-grayscale
              sm:w-fit sm:text-nowrap
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

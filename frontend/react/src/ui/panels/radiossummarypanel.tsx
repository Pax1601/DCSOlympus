import React, { useEffect, useState } from "react";
import { AudioSinksChangedEvent } from "../../events";
import { AudioSink } from "../../audio/audiosink";
import { RadioSink } from "../../audio/radiosink";
import { FaJetFighter, FaRadio } from "react-icons/fa6";
import { OlStateButton } from "../components/olstatebutton";
import { UnitSink } from "../../audio/unitsink";

export function RadiosSummaryPanel(props: {}) {
  const [audioSinks, setAudioSinks] = useState([] as AudioSink[]);

  useEffect(() => {
    AudioSinksChangedEvent.on((audioSinks) => setAudioSinks(audioSinks));
  }, []);

  return (
    <>
      {audioSinks.length > 0 && (
        <div
          className={`
            absolute bottom-[20px] right-[700px] flex w-fit flex-col
            items-center justify-between gap-2 rounded-lg bg-gray-200 p-3
            text-sm backdrop-blur-lg backdrop-grayscale
            dark:bg-olympus-800/90 dark:text-gray-200
          `}
        >
          <div className="flex w-full items-center justify-between gap-2">
            <FaRadio className="text-xl" />
            {audioSinks
              .filter((audioSinks) => audioSinks instanceof RadioSink)
              .map((radioSink, idx) => {
                return (
                  <OlStateButton
                    checked={radioSink.getReceiving()}
                    onClick={() => {}}
                    onMouseDown={() => {
                      radioSink.setPtt(true);
                    }}
                    onMouseUp={() => {
                      radioSink.setPtt(false);
                    }}
                    tooltip="Click to talk, lights up when receiving"
                  >
                    <span className={`font-bold text-gray-200`}>{idx + 1}</span>
                  </OlStateButton>
                );
              })}

            <FaJetFighter className="text-xl" />
            {audioSinks
              .filter((audioSinks) => audioSinks instanceof UnitSink)
              .map((radioSink, idx) => {
                return (
                  <OlStateButton
                    checked={false}
                    onClick={() => {}}
                    onMouseDown={() => {
                      radioSink.setPtt(true);
                    }}
                    onMouseUp={() => {
                      radioSink.setPtt(false);
                    }}
                    tooltip="Click to talk"
                  >
                    <span className={`font-bold text-gray-200`}>{idx + 1}</span>
                  </OlStateButton>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
}

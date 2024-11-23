import React, { useEffect, useState } from "react";
import { AudioSinksChangedEvent } from "../../events";
import { AudioSink } from "../../audio/audiosink";
import { RadioSink } from "../../audio/radiosink";
import { FaJetFighter, FaRadio, FaVolumeHigh } from "react-icons/fa6";
import { OlStateButton } from "../components/olstatebutton";
import { UnitSink } from "../../audio/unitsink";

export function RadiosSummaryPanel(props: {}) {
  const [audioSinks, setAudioSinks] = useState([] as AudioSink[]);

  useEffect(() => {
    AudioSinksChangedEvent.on((audioSinks) => setAudioSinks([...audioSinks]));
  }, []);

  return (
    <>
      {audioSinks.length > 0 && (
        <div
          className={`
            absolute bottom-[20px] right-[700px] flex w-fit flex-col
            items-center justify-between gap-2 rounded-lg bg-transparent text-sm
            text-gray-200
          `}
        >
          <div className="flex w-full items-center justify-between gap-2">
            
            {audioSinks.filter((audioSinks) => audioSinks instanceof RadioSink).length > 0 &&
              audioSinks
                .filter((audioSinks) => audioSinks instanceof RadioSink)
                .map((radioSink, idx) => {
                  return (
                    <OlStateButton
                      key={idx}
                      checked={radioSink.getPtt()}
                      onClick={() => {}}
                      onMouseDown={() => {
                        radioSink.setPtt(true);
                      }}
                      onMouseUp={() => {
                        radioSink.setPtt(false);
                      }}
                      tooltip="Click to talk, lights up when receiving"
                      buttonColor={radioSink.getReceiving() ? "white" : null}
                      className="min-h-12 min-w-12"
                    >
                      <span className={`text-gray-200`}><FaRadio className={`
                        -translate-x-2 translate-y-1
                      `} /> <div className="translate-x-2 font-bold">{idx + 1}</div></span>
                    </OlStateButton>
                  );
                })}
            {audioSinks.filter((audioSinks) => audioSinks instanceof UnitSink).length > 0 &&
              audioSinks
                .filter((audioSinks) => audioSinks instanceof UnitSink)
                .map((unitSink, idx) => {
                  return (
                    <OlStateButton
                      key={idx}
                      checked={unitSink.getPtt()}
                      onClick={() => {}}
                      onMouseDown={() => {
                        unitSink.setPtt(true);
                      }}
                      onMouseUp={() => {
                        unitSink.setPtt(false);
                      }}
                      tooltip="Click to talk"
                      className="min-h-12 min-w-12"
                    >
                      <span className={`text-gray-200`}><FaVolumeHigh className={`
                        -translate-x-2 translate-y-1
                      `} /> <div className="translate-x-2 font-bold">{idx + 1}</div></span>
                    </OlStateButton>
                  );
                })}
          </div>
        </div>
      )}
    </>
  );
}

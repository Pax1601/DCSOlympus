import React, { useEffect, useRef, useState } from "react";
import { Menu } from "./components/menu";
import { getApp } from "../../olympusapp";
import { FaPlus, FaPlusCircle, FaQuestionCircle } from "react-icons/fa";
import { AudioSourcePanel } from "./components/sourcepanel";
import { AudioSource } from "../../audio/audiosource";
import { RadioSinkPanel } from "./components/radiosinkpanel";
import { AudioSink } from "../../audio/audiosink";
import { RadioSink } from "../../audio/radiosink";
import { UnitSinkPanel } from "./components/unitsinkpanel";
import { UnitSink } from "../../audio/unitsink";
import { FaMinus, FaVolumeHigh } from "react-icons/fa6";
import { getRandomColor } from "../../other/utils";
import {
  AudioManagerCoalitionChangedEvent,
  AudioManagerDevicesChangedEvent,
  AudioManagerInputChangedEvent,
  AudioManagerOutputChangedEvent,
  AudioManagerStateChangedEvent,
  AudioSinksChangedEvent,
  AudioSourcesChangedEvent,
  CommandModeOptionsChangedEvent,
  ShortcutsChangedEvent,
} from "../../events";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { Coalition } from "../../types/types";
import { GAME_MASTER, NONE } from "../../constants/constants";

export function AudioMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [devices, setDevices] = useState([] as MediaDeviceInfo[]);
  const [sinks, setSinks] = useState([] as AudioSink[]);
  const [sources, setSources] = useState([] as AudioSource[]);
  const [audioManagerEnabled, setAudioManagerEnabled] = useState(false);
  const [activeSource, setActiveSource] = useState(null as AudioSource | null);
  const [count, setCount] = useState(0);
  const [shortcuts, setShortcuts] = useState({});
  const [input, setInput] = useState(undefined as undefined | MediaDeviceInfo);
  const [output, setOutput] = useState(undefined as undefined | MediaDeviceInfo);
  const [coalition, setCoalition] = useState("blue" as Coalition);
  const [commandMode, setCommandMode] = useState(NONE as string);

  /* Preallocate 128 references for the source and sink panels. If the number of references changes, React will give an error */
  const sourceRefs = Array(128)
    .fill(null)
    .map(() => {
      return useRef(null);
    });

  const sinkRefs = Array(128)
    .fill(null)
    .map(() => {
      return useRef(null);
    });

  useEffect(() => {
    /* Force a rerender */
    AudioSinksChangedEvent.on(() => {
      setSinks(
        getApp()
          ?.getAudioManager()
          .getSinks()
          .filter((sink) => sink instanceof AudioSink)
          .map((radio) => radio)
      );
    });

    /* Force a rerender */
    AudioSourcesChangedEvent.on(() => {
      setSources(
        getApp()
          ?.getAudioManager()
          .getSources()
          .map((source) => source)
      );
    });

    AudioManagerStateChangedEvent.on(() => {
      setAudioManagerEnabled(getApp().getAudioManager().isRunning());
    });

    ShortcutsChangedEvent.on((shortcuts) => setShortcuts(shortcuts));

    AudioManagerDevicesChangedEvent.on((devices) => setDevices([...devices]));
    AudioManagerInputChangedEvent.on((input) => setInput(input));
    AudioManagerOutputChangedEvent.on((output) => setOutput(output));
    AudioManagerCoalitionChangedEvent.on((coalition) => setCoalition(coalition));
    CommandModeOptionsChangedEvent.on((options) => setCommandMode(options.commandMode));
  }, []);

  /* When the sinks or sources change, use the count state to force a rerender to update the connection lines */
  useEffect(() => {
    setCount(count + 1);
  }, [sinks, sources]);

  /* List all the connections between the sinks and the sources */
  const connections = [] as any[];
  const lineCounters = [] as number[];
  const lineColors = [] as string[];
  let counter = 0;
  sources.forEach((source, idx) => {
    counter++;
    const color = getRandomColor(counter);
    source.getConnectedTo().forEach((sink) => {
      if (sinks.indexOf(sink as AudioSink) !== undefined) {
        connections.push([sourceRefs[idx], sinkRefs[sinks.indexOf(sink as AudioSink)]]);
        lineCounters.push(counter);
        lineColors.push(color);
      }
    });
  });

  /* Compute the line distance to fit in the available space */
  const defaultLineDistance = 8;
  const paddingRight = Math.min(lineCounters[lineCounters.length - 1] * defaultLineDistance + 40, 96);
  const lineDistance = (paddingRight - 40) / lineCounters[lineCounters.length - 1];

  return (
    <Menu title="Audio menu" open={props.open} showBackButton={false} onClose={props.onClose}>
      <div className="p-4 text-sm text-gray-400">
        The audio menu allows you to add and manage audio sources, connect them to unit loudspeakers and radios, and to tune radio frequencies.
      </div>

      <>
        {!audioManagerEnabled && (
          <div className="mx-6 flex rounded-lg bg-olympus-400 p-4 text-sm">
            <div>
              <FaQuestionCircle className="my-4 ml-2 mr-6 text-gray-400" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-gray-100">
                To enable the audio menu, first start the audio backend with the{" "}
                <span
                  className={`
                    mx-1 mt-[-7px] inline-block translate-y-2 rounded-full
                    border-[1px] border-white p-1
                  `}
                >
                  <FaVolumeHigh />
                </span>{" "}
                button on the navigation header.
              </div>
            </div>
          </div>
        )}
      </>

      <div className="flex flex-col gap-3">
        <div
          className={`
            flex flex-col gap-2 px-5 font-normal text-gray-800
            dark:text-white
          `}
          style={{ paddingRight: `${paddingRight}px` }}
        >
          {audioManagerEnabled && (
            <>
              {commandMode === GAME_MASTER && (
                <div className="flex justify-between">
                  <div>Radio coalition </div>
                  <OlCoalitionToggle
                    coalition={coalition}
                    onClick={() => {
                      let newCoalition = "";
                      if (coalition === "blue") newCoalition = "neutral";
                      else if (coalition === "neutral") newCoalition = "red";
                      else if (coalition === "red") newCoalition = "blue";
                      getApp()
                        .getAudioManager()
                        .setCoalition(newCoalition as Coalition);
                    }}
                  />
                </div>
              )}

              <span>Input</span>

              <OlDropdown label={input ? input.label : "Default"}>
                {devices
                  .filter((device) => device.kind === "audioinput")
                  .map((device, idx) => {
                    return (
                      <OlDropdownItem onClick={() => getApp().getAudioManager().setInput(device)}>
                        <div className="w-full truncate">{device.label}</div>
                      </OlDropdownItem>
                    );
                  })}
              </OlDropdown>
            </>
          )}
          {audioManagerEnabled && (
            <>
              {" "}
              <span>Output</span>
              <OlDropdown label={output ? output.label : "Default"}>
                {devices
                  .filter((device) => device.kind === "audiooutput")
                  .map((device, idx) => {
                    return (
                      <OlDropdownItem onClick={() => getApp().getAudioManager().setOutput(device)}>
                        <div className="w-full truncate">{device.label}</div>
                      </OlDropdownItem>
                    );
                  })}
              </OlDropdown>
            </>
          )}
          {audioManagerEnabled && <span>Audio sources</span>}
          <>
            {sources.map((source, idx) => {
              return (
                <AudioSourcePanel
                  key={idx}
                  source={source}
                  ref={sourceRefs[idx]}
                  onExpanded={() => {
                    setCount(count + 1);
                  }}
                />
              );
            })}
          </>
          {audioManagerEnabled && (
            <button
              type="button"
              className={`
                mb-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium
                text-white
                dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
                focus:outline-none focus:ring-4 focus:ring-blue-300
                hover:bg-blue-800
              `}
              onClick={() => getApp().getAudioManager().addFileSource()}
            >
              Add audio source
            </button>
          )}
        </div>
        <div
          className={`
            flex flex-col gap-2 px-5 font-normal text-gray-800
            dark:text-white
          `}
          style={{ paddingRight: `${paddingRight}px` }}
        >
          {audioManagerEnabled && <span>Radios</span>}
          {sinks.map((sink, idx) => {
            if (sink instanceof RadioSink)
              return (
                <RadioSinkPanel
                  shortcutKeys={shortcuts[`PTT${idx}Active`].toActions()}
                  key={sink.getName()}
                  radio={sink}
                  onExpanded={() => {
                    setCount(count + 1);
                  }}
                  ref={sinkRefs[idx]}
                ></RadioSinkPanel>
              );
          })}
          {audioManagerEnabled && sinks.filter((sink) => sink instanceof RadioSink).length < 10 && (
            <button
              type="button"
              className={`
                mb-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium
                text-white
                dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
                focus:outline-none focus:ring-4 focus:ring-blue-300
                hover:bg-blue-800
              `}
              onClick={() => getApp().getAudioManager().addRadio()}
            >
              Add radio
            </button>
          )}
        </div>
        <div
          className={`
            flex flex-col gap-2 px-5 font-normal text-gray-800
            dark:text-white
          `}
          style={{ paddingRight: `${paddingRight}px` }}
        >
          {audioManagerEnabled && sinks.find((sink) => sink instanceof UnitSink) && <span>Unit loudspeakers</span>}
          {sinks.map((sink, idx) => {
            if (sink instanceof UnitSink)
              return (
                <UnitSinkPanel
                  shortcutKeys={shortcuts[`PTT${idx}Active`].toActions()}
                  key={sink.getName()}
                  sink={sink}
                  ref={sinkRefs[idx]}
                  onExpanded={() => {
                    setCount(count + 1);
                  }}
                ></UnitSinkPanel>
              );
          })}
        </div>
        <div>
          {connections
            .filter((connection) => connection && connection[0].current && connection[1].current)
            .map((connection, idx) => {
              const start = connection[0].current;
              const end = connection[1].current;
              if (start && end) {
                const startRect = {
                  top: (start as HTMLDivElement).offsetTop,
                  bottom: (start as HTMLDivElement).offsetTop + (start as HTMLDivElement).clientHeight,
                  height: (start as HTMLDivElement).clientHeight,
                  right: (start as HTMLDivElement).offsetLeft + (start as HTMLDivElement).clientWidth,
                };

                const endRect = {
                  top: (end as HTMLDivElement).offsetTop,
                  bottom: (end as HTMLDivElement).offsetTop + (end as HTMLDivElement).clientHeight,
                  height: (end as HTMLDivElement).clientHeight,
                  right: (end as HTMLDivElement).offsetLeft + (end as HTMLDivElement).clientWidth,
                };
                return (
                  <div
                    key={idx}
                    className={`
                      absolute rounded-br-md rounded-tr-md border-2 border-l-0
                    `}
                    style={{
                      top: `${(startRect.bottom + startRect.top) / 2}px`,
                      left: `${startRect.right}px`,
                      height: `${endRect.top - startRect.top + (endRect.height - startRect.height) / 2}px`,
                      width: `${(lineCounters[idx] - 1) * lineDistance + 30}px`,
                      borderColor: lineColors[idx],
                    }}
                  />
                );
              }
            })
            .reverse()}
        </div>
        <div>
          {sourceRefs.map((sourceRef, idx) => {
            const div = sourceRef.current;
            if (div) {
              const divRect = {
                top: (div as HTMLDivElement).offsetTop,
                bottom: (div as HTMLDivElement).offsetTop + (div as HTMLDivElement).clientHeight,
                height: (div as HTMLDivElement).clientHeight,
                right: (div as HTMLDivElement).offsetLeft + (div as HTMLDivElement).clientWidth,
              };
              return (
                <div
                  key={idx}
                  data-active={activeSource === sources[idx]}
                  className={`
                    absolute translate-y-[-50%] cursor-pointer rounded-full
                    bg-blue-600 p-1 text-xs text-white
                    data-[active='true']:bg-white
                    data-[active='true']:text-blue-600
                    hover:bg-blue-800
                  `}
                  style={{
                    top: `${(divRect.bottom + divRect.top) / 2}px`,
                    left: `${divRect.right - 10}px`,
                  }}
                  onClick={() => {
                    activeSource !== sources[idx] ? setActiveSource(sources[idx]) : setActiveSource(null);
                  }}
                >
                  <FaPlus></FaPlus>
                </div>
              );
            }
          })}
          {activeSource &&
            sinkRefs.map((sinkRef, idx) => {
              const div = sinkRef.current;
              if (div) {
                const divRect = {
                  top: (div as HTMLDivElement).offsetTop,
                  bottom: (div as HTMLDivElement).offsetTop + (div as HTMLDivElement).clientHeight,
                  height: (div as HTMLDivElement).clientHeight,
                  right: (div as HTMLDivElement).offsetLeft + (div as HTMLDivElement).clientWidth,
                };
                return (
                  <div
                    key={idx}
                    className={`
                      absolute translate-y-[-50%] cursor-pointer rounded-full
                      bg-blue-600 p-1 text-xs text-white
                      hover:bg-blue-800
                    `}
                    style={{
                      top: `${(divRect.bottom + divRect.top) / 2}px`,
                      left: `${divRect.right - 10}px`,
                    }}
                    onClick={() => {
                      if (activeSource.getConnectedTo().includes(sinks[idx])) activeSource.disconnect(sinks[idx]);
                      else activeSource.connect(sinks[idx]);
                    }}
                  >
                    {" "}
                    {activeSource.getConnectedTo().includes(sinks[idx]) ? <FaMinus></FaMinus> : <FaPlus></FaPlus>}
                  </div>
                );
              }
            })}
        </div>
      </div>
    </Menu>
  );
}

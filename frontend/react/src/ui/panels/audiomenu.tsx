import React, { useEffect, useRef, useState } from "react";
import { Menu } from "./components/menu";
import { getApp } from "../../olympusapp";
import { FaExclamation, FaExclamationCircle, FaPlus, FaQuestionCircle } from "react-icons/fa";
import { AudioSourcePanel } from "./components/sourcepanel";
import { AudioSource } from "../../audio/audiosource";
import { RadioSinkPanel } from "./components/radiosinkpanel";
import { AudioSink } from "../../audio/audiosink";
import { RadioSink } from "../../audio/radiosink";
import { UnitSinkPanel } from "./components/unitsinkpanel";
import { UnitSink } from "../../audio/unitsink";
import { FaMinus, FaPerson, FaVolumeHigh } from "react-icons/fa6";
import { enumToCoalition, getRandomColor, zeroAppend } from "../../other/utils";
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
  SRSClientsChangedEvent,
} from "../../events";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { Coalition, SRSClientData } from "../../types/types";
import { AudioManagerState, GAME_MASTER, NONE } from "../../constants/constants";

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
  const [clientsData, setClientsData] = useState([] as SRSClientData[]);
  const [connectedClientsOpen, setConnectedClientsOpen] = useState(false);

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
      setAudioManagerEnabled(getApp().getAudioManager().isRunning() === AudioManagerState.RUNNING);
    });

    ShortcutsChangedEvent.on((shortcuts) => setShortcuts(shortcuts));

    AudioManagerDevicesChangedEvent.on((devices) => setDevices([...devices]));
    AudioManagerInputChangedEvent.on((input) => setInput(input));
    AudioManagerOutputChangedEvent.on((output) => setOutput(output));
    AudioManagerCoalitionChangedEvent.on((coalition) => setCoalition(coalition));
    CommandModeOptionsChangedEvent.on((options) => setCommandMode(options.commandMode));
    SRSClientsChangedEvent.on((clientsData) => setClientsData(clientsData));
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
    <Menu
      title="Audio menu"
      open={props.open}
      showBackButton={false}
      onClose={props.onClose}
      wiki={() => {
        return (
          <div
            className={`
              h-full flex-col overflow-auto p-4 text-gray-400 no-scrollbar flex
              gap-2
            `}
          >
            <h2 className="mb-4 font-bold">Audio menu</h2>
            <div>
              The audio menu allows you to add and manage audio sources, connect them to unit loudspeakers and radios, and to tune radio frequencies using the
              SRS integration. In other words, it allows you to communicate over SRS without the need of using the SRS client.
            </div>
            <div>
              Because of the limitations of the browser, you need to enable the audio backend by clicking on the volume icon in the navigation header. Moreover,
              you need to allow the browser to access your microphone and speakers. It may take a couple of seconds for the audio backend to start.
            </div>
            <div className="text-red-500">For security reasons, the audio backend will only work if the page is served over HTTPS.</div>
            <h2 className="my-4 font-bold">Managing the audio backend</h2>
            <div>
              You can select the input and output devices for the audio backend. The input device is the microphone that will be used to transmit your voice.
              The output device is the speaker that will be used to play the audio from the other players.
            </div>
            <div>
              You can also select the radio coalition. This will determine the default coalition for the radios you create. If you are in command mode, you can
              change the radio coalition by clicking on the coalition toggle button. This will have no effect if radio coalition enforcing is not enabled in the
              SRS server.
            </div>
            <h2 className="my-4 font-bold">Creating audio sources</h2>
            <div>
              You can add audio sources by clicking on the "Add audio source" button. By default, a microphone and a text to speech source are created, but you
              can add file sources as well, which allow to play audio files such as music, prerecorded messages, or background noise, such as gunfire or engine
              sounds.
            </div>
            <div>
              The text to speech generation works using the Google Cloud speech API and by default it works in English. For it to work, a valid Google Cloud API
              key must be installed on the Olympus backend server machine. See the backend documentation for more information. {/* TODO: put link here */}
            </div>
            <div>
              Text to speech and file sources can be set to operate in loop mode, which will make them repeat the audio indefinitely. This is useful for
              background noise or music. Moreover, you can set the volume of the audio sources.
            </div>
            <h2 className="my-4 font-bold">Creating radios and loudspeakers</h2>
            <div>
              By default, two radios are created, but you can add more by clicking on the "Add radio" button. Radios can be tuned to different frequencies, and
              they can be set to operate in AM or FM mode. You can also set the volume of the radios, and change the balance between the left and right
              channels.
            </div>
            <div>When a new radio is created, it will NOT be in "listen" mode, so you will need to click on the "Tune to radio" button to start listening.</div>
            <div>
              You have three options to transmit on the radio:
              <div>
                <li>
                  By clicking on the "Talk on frequency" button on the radio panel. This will enable continuous transmission and will remain "on" until clicked
                  again.
                </li>
                <li>By clicking on the "Push to talk" button located over the mouse coordinates panel, on the bottom right corner of the map.</li>
                <li>By using the "Push to talk" keyboard shortcuts, which can be edited in the options menu.</li>
              </div>
            </div>
            <div>
              Loudspeakers can be used to simulate environmental sounds, like 5MC calls on the carrier, or sirens. To create a loudspeaker, click on the unit
              that should broadcast the sound, and then click on the "Loudspeakers" button. PTT buttons for loudspeakers operate in the same way as radios.
            </div>
            <div className="text-red-500">
              The loudspeakers system uses the SRS integration, so it will only work if other players' SRS clients are running and connected to the same server
              as Olympus. Moreover, the loudspeaker system operates using the INTERCOM radio in SRS, and for the time being it will only work for those radios
              that have the INTERCOM radio enabled (i.e. usually multicrew aircraft).
            </div>
            <h2 className="my-4 font-bold">Connecting sources and radios/loudspeakers</h2>
            <div>
              Each source can be connected to one or more radios or loudspeakers. To connect a source to a radio or loudspeaker, click on the "+" button on the
              right of the source panel, then click on the equivalent button on the desired radio/loudspeaker. To disconnect a source from a radio or
              loudspeaker, click on the "-" button next to the radio/loudspeaker.
            </div>
            <div>
              The connection lines will show the connections between the sources and the radios/loudspeakers. The color of the line is randomly generated and
              will be different for each source.
            </div>
            <div>
              By connecting multiple sources to the same radio/loudspeaker, you can create complex audio setups, like playing background music while
              transmitting on the radio.
            </div>
          </div>
        );
      }}
    >
      <div className="flex content-center gap-4 p-4">
        <div className="my-auto text-gray-400">
          <FaQuestionCircle />
        </div>
        <div className="text-sm text-gray-400">
          The audio menu allows you to add and manage audio sources, connect them to unit loudspeakers and radios, and to tune radio frequencies.
        </div>
      </div>

      <>
        {!audioManagerEnabled && (
          <div className="mx-4 flex gap-4 rounded-lg bg-olympus-400 p-4 text-sm">
            <div className="my-auto animate-bounce text-xl">
              <FaExclamationCircle className="text-gray-400" />
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
      <>
        {audioManagerEnabled && (
          <>
            <div className={`mb-4 flex flex-col content-center bg-olympus-500`}>
              <div
                className={`
                  flex cursor-pointer content-center gap-2 px-5 py-2
                  text-gray-200
                  hover:underline hover:underline-offset-4
                  hover:underline-gray-700
                `}
                onClick={() => setConnectedClientsOpen(!connectedClientsOpen)}
              >
                Connected clients <FaPerson className="my-auto ml-auto" /> <div className={``}>{clientsData.length}</div>
                <svg
                  data-open={connectedClientsOpen}
                  className={`
                    my-auto h-3 w-3 shrink-0 -rotate-180 transition-transform
                    dark:text-olympus-50
                    data-[open='false']:-rotate-90
                  `}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
                </svg>
              </div>

              {connectedClientsOpen && (
                <div className={`flex flex-col text-gray-200`}>
                  {clientsData.map((clientData, idx) => {
                    return (
                      <div
                        data-coalition={enumToCoalition(clientData.coalition)}
                        key={idx}
                        className={`
                          flex gap-2 border-l-4 px-4 py-2
                          data-[coalition='blue']:border-blue-500
                          data-[coalition='neutral']:border-gray-500
                          data-[coalition='red']:border-red-500
                        `}
                      >
                        <div className="text-gray-400">{clientData.name}</div>
                        <div
                          className={`
                            ml-auto cursor-pointer gap-2 rounded-md
                            bg-olympus-600 px-3 py-1 text-sm
                            hover:bg-olympus-400
                          `}
                          onClick={() => getApp().getAudioManager().tuneNewRadio(clientData.radios[0].frequency, clientData.radios[0].modulation)}
                        >
                          {`${zeroAppend(clientData.radios[0].frequency / 1e6, 3, true, 3)} ${clientData.radios[0].modulation ? "FM" : "AM"}`}{" "}
                        </div>
                        <div
                          className={`
                            cursor-pointer gap-2 rounded-md bg-olympus-600 px-3
                            py-1 text-sm
                            hover:bg-olympus-400
                          `}
                          onClick={() => getApp().getAudioManager().tuneNewRadio(clientData.radios[1].frequency, clientData.radios[1].modulation)}
                        >
                          {`${zeroAppend(clientData.radios[1].frequency / 1e6, 3, true, 3)} ${clientData.radios[1].modulation ? "FM" : "AM"}`}{" "}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="my-4 flex flex-col gap-2 px-5 text-gray-200">
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
                        <div className="w-full truncate text-left">{device.label}</div>
                      </OlDropdownItem>
                    );
                  })}
              </OlDropdown>

              <span>Output</span>
              <OlDropdown label={output ? output.label : "Default"}>
                {devices
                  .filter((device) => device.kind === "audiooutput")
                  .map((device, idx) => {
                    return (
                      <OlDropdownItem onClick={() => getApp().getAudioManager().setOutput(device)}>
                        <div className="w-full truncate text-left">{device.label}</div>
                      </OlDropdownItem>
                    );
                  })}
              </OlDropdown>
            </div>
          </>
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
                  shortcutKeys={shortcuts[`PTT${idx}Active`]?.toActions() ?? []}
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
                  shortcutKeys={shortcuts[`PTT${idx}Active`]?.toActions() ?? []}
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

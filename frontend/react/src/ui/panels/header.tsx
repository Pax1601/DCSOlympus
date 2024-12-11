import React, { useEffect, useRef, useState } from "react";
import { OlRoundStateButton, OlStateButton, OlLockStateButton } from "../components/olstatebutton";
import { faSkull, faCamera, faFlag, faLink, faUnlink, faBars, faVolumeHigh } from "@fortawesome/free-solid-svg-icons";
import { OlDropdownItem, OlDropdown } from "../components/oldropdown";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { getApp, IP } from "../../olympusapp";
import {
  olButtonsVisibilityAirbase,
  olButtonsVisibilityAircraft,
  olButtonsVisibilityDcs,
  olButtonsVisibilityGroundunit,
  olButtonsVisibilityGroundunitSam,
  olButtonsVisibilityHelicopter,
  olButtonsVisibilityHuman,
  olButtonsVisibilityNavyunit,
  olButtonsVisibilityOlympus,
} from "../components/olicons";
import { FaChevronLeft, FaChevronRight, FaComputer, FaTabletScreenButton } from "react-icons/fa6";
import { CommandModeOptionsChangedEvent, ConfigLoadedEvent, HiddenTypesChangedEvent, MapOptionsChangedEvent, MapSourceChangedEvent } from "../../events";
import { BLUE_COMMANDER, COMMAND_MODE_OPTIONS_DEFAULTS, MAP_HIDDEN_TYPES_DEFAULTS, MAP_OPTIONS_DEFAULTS } from "../../constants/constants";
import { OlympusConfig } from "../../interfaces";

export function Header() {
  const [mapHiddenTypes, setMapHiddenTypes] = useState(MAP_HIDDEN_TYPES_DEFAULTS);
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  const [mapSource, setMapSource] = useState("");
  const [mapSources, setMapSources] = useState([] as string[]);
  const [scrolledLeft, setScrolledLeft] = useState(true);
  const [scrolledRight, setScrolledRight] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [commandModeOptions, setCommandModeOptions] = useState(COMMAND_MODE_OPTIONS_DEFAULTS);

  useEffect(() => {
    HiddenTypesChangedEvent.on((hiddenTypes) => setMapHiddenTypes({ ...hiddenTypes }));
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
    MapSourceChangedEvent.on((source) => setMapSource(source));
    ConfigLoadedEvent.on((config: OlympusConfig) => {
      var sources = Object.keys(getApp().getMap().getMirrors()).concat(getApp().getMap().getLayers());
      setMapSources(sources);
    });
    CommandModeOptionsChangedEvent.on((commandModeOptions) => {
      setCommandModeOptions(commandModeOptions);
    });
  }, []);

  /* Initialize the "scroll" position of the element */
  var scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) onScroll(scrollRef.current);
  });

  function onScroll(el) {
    const sl = el.scrollLeft;
    const sr = el.scrollWidth - el.scrollLeft - el.clientWidth;

    sl < 1 && !scrolledLeft && setScrolledLeft(true);
    sl > 1 && scrolledLeft && setScrolledLeft(false);

    sr < 1 && !scrolledRight && setScrolledRight(true);
    sr > 1 && scrolledRight && setScrolledRight(false);
  }

  return (
    <nav
      className={`
        z-10 flex w-full gap-4 border-gray-200 bg-gray-300 px-3 drop-shadow-md
        align-center
        dark:border-gray-800 dark:bg-olympus-900
      `}
    >
      <img src="./images/icon.png" className={`my-auto h-10 w-10 rounded-md p-0`}></img>
      {!scrolledLeft && (
        <FaChevronLeft
          className={`
            absolute left-14 h-full w-6 rounded-lg px-2 py-3.5 text-gray-200
            dark:bg-olympus-900
          `}
        />
      )}
      <div
        className={`
          my-2 flex w-full items-center gap-3 overflow-x-scroll no-scrollbar
        `}
        onScroll={(ev) => onScroll(ev.target)}
        ref={scrollRef}
      >
        <div
          className={`
            mr-auto hidden flex-none flex-row items-center justify-start gap-6
            lg:flex
          `}
        >
          <div className="flex flex-col items-start">
            <div
              className={`
                pt-1 text-xs text-gray-800
                dark:text-gray-400
              `}
            >
              Connected to
            </div>
            <div
              className={`
                flex items-center justify-center gap-2 text-sm font-extrabold
                text-gray-800
                dark:text-gray-200
              `}
            >
              {IP}
            </div>
          </div>
        </div>
        {commandModeOptions.commandMode === BLUE_COMMANDER && (
          <div className={`flex h-full rounded-md bg-blue-600 px-4 text-white`}>
            <span className="my-auto font-bold">BLUE Commander ({commandModeOptions.spawnPoints.blue} points)</span>
          </div>
        )}
        <div
        className="cursor-pointer rounded-full bg-blue-500 px-4 py-2 text-white"
          onClick={() => {
            getApp().getMap().setOption("tabletMode", !mapOptions.tabletMode);
          }}
        >
          {mapOptions.tabletMode ? <FaTabletScreenButton /> : <FaComputer />}
        </div>
        <div className={`flex h-fit flex-row items-center justify-start gap-1`}>
          <OlLockStateButton
            checked={!mapOptions.protectDCSUnits}
            onClick={() => {
              getApp().getMap().setOption("protectDCSUnits", !mapOptions.protectDCSUnits);
            }}
            tooltip="Lock/unlock protected units (from scripted mission)"
          />
          <OlRoundStateButton
            checked={audioEnabled}
            onClick={() => {
              audioEnabled ? getApp().getAudioManager().stop() : getApp().getAudioManager().start();
              setAudioEnabled(!audioEnabled);
            }}
            tooltip="Enable/disable audio and radio backend"
            icon={faVolumeHigh}
          />
        </div>
        <div className={`h-8 w-0 border-l-[2px] border-gray-700`}></div>
        <div className={`flex h-fit flex-row items-center justify-start gap-1`}>
          {Object.entries({
            human: olButtonsVisibilityHuman,
            olympus: olButtonsVisibilityOlympus,
            dcs: olButtonsVisibilityDcs,
          }).map((entry) => {
            return (
              <OlRoundStateButton
                key={entry[0]}
                onClick={() => {
                  getApp().getMap().setHiddenType(entry[0], !mapHiddenTypes[entry[0]]);
                }}
                checked={!mapHiddenTypes[entry[0]]}
                icon={entry[1]}
                tooltip={"Hide/show " + entry[0] + " units"}
              />
            );
          })}
        </div>
        <div className={`h-8 w-0 border-l-[2px] border-gray-700`}></div>
        <div className={`flex h-fit flex-row items-center justify-start gap-1`}>
          <OlRoundStateButton
            onClick={() => getApp().getMap().setHiddenType("blue", !mapHiddenTypes["blue"])}
            checked={!mapHiddenTypes["blue"]}
            icon={faFlag}
            className={"!text-blue-500"}
            tooltip={"Hide/show blue units"}
          />
          <OlRoundStateButton
            onClick={() => getApp().getMap().setHiddenType("red", !mapHiddenTypes["red"])}
            checked={!mapHiddenTypes["red"]}
            icon={faFlag}
            className={"!text-red-500"}
            tooltip={"Hide/show red units"}
          />
          <OlRoundStateButton
            onClick={() => getApp().getMap().setHiddenType("neutral", !mapHiddenTypes["neutral"])}
            checked={!mapHiddenTypes["neutral"]}
            icon={faFlag}
            className={"!text-gray-500"}
            tooltip={"Hide/show neutral units"}
          />
        </div>
        <div className={`h-8 w-0 border-l-[2px] border-gray-700`}></div>
        <div className={`flex h-fit flex-row items-center justify-start gap-1`}>
          {Object.entries({
            aircraft: olButtonsVisibilityAircraft,
            helicopter: olButtonsVisibilityHelicopter,
            "groundunit-sam": olButtonsVisibilityGroundunitSam,
            groundunit: olButtonsVisibilityGroundunit,
            navyunit: olButtonsVisibilityNavyunit,
            airbase: olButtonsVisibilityAirbase,
            dead: faSkull,
          }).map((entry) => {
            return (
              <OlRoundStateButton
                key={entry[0]}
                onClick={() => {
                  getApp().getMap().setHiddenType(entry[0], !mapHiddenTypes[entry[0]]);
                }}
                checked={!mapHiddenTypes[entry[0]]}
                icon={entry[1]}
                tooltip={"Hide/show " + entry[0] + " units"}
              />
            );
          })}
        </div>

        <OlLabelToggle
          toggled={mapOptions.cameraPluginMode === "map"}
          leftLabel={"Live"}
          rightLabel={"Map"}
          onClick={() => {
            getApp()
              .getMap()
              .setOption("cameraPluginMode", mapOptions.cameraPluginMode === "live" ? "map" : "live");
          }}
        />
        <OlStateButton
          checked={mapOptions.cameraPluginEnabled}
          icon={faCamera}
          onClick={() => {
            getApp().getMap().setOption("cameraPluginEnabled", !mapOptions.cameraPluginEnabled);
          }}
          tooltip="Activate/deactivate camera plugin"
        />
        <OlDropdown label={mapSource} className="w-60">
          {mapSources.map((source) => {
            return (
              <OlDropdownItem key={source} onClick={() => getApp().getMap().setLayerName(source)}>
                <div className="truncate">{source}</div>
              </OlDropdownItem>
            );
          })}
        </OlDropdown>
      </div>
      {!scrolledRight && (
        <FaChevronRight
          className={`
            absolute right-0 h-full w-6 rounded-lg px-2 py-3.5 text-gray-200
            dark:bg-olympus-900
          `}
        />
      )}
    </nav>
  );
}

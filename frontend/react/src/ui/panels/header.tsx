import React, { useEffect, useRef, useState } from "react";
import { OlRoundStateButton, OlStateButton, OlLockStateButton } from "../components/olstatebutton";
import {
  faSkull,
  faCamera,
  faFlag,
  faVolumeHigh,
  faDownload,
  faUpload,
  faDrawPolygon,
  faCircle,
  faTriangleExclamation,
  faWifi,
  faHourglass,
  faInfo,
} from "@fortawesome/free-solid-svg-icons";
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
import { FaChevronLeft, FaChevronRight, FaFloppyDisk } from "react-icons/fa6";
import {
  CommandModeOptionsChangedEvent,
  ConfigLoadedEvent,
  HiddenTypesChangedEvent,
  MapOptionsChangedEvent,
  MapSourceChangedEvent,
  SessionDataChangedEvent,
  SessionDataSavedEvent,
} from "../../events";
import {
  BLUE_COMMANDER,
  COMMAND_MODE_OPTIONS_DEFAULTS,
  ImportExportSubstate,
  MAP_HIDDEN_TYPES_DEFAULTS,
  MAP_OPTIONS_DEFAULTS,
  OlympusState,
  RED_COMMANDER,
} from "../../constants/constants";
import { OlympusConfig } from "../../interfaces";
import { FaCheck, FaQuestionCircle, FaSave, FaSpinner } from "react-icons/fa";
import { OlExpandingTooltip } from "../components/olexpandingtooltip";

export function Header() {
  const [mapHiddenTypes, setMapHiddenTypes] = useState(MAP_HIDDEN_TYPES_DEFAULTS);
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  const [mapSource, setMapSource] = useState("");
  const [mapSources, setMapSources] = useState([] as string[]);
  const [scrolledLeft, setScrolledLeft] = useState(true);
  const [scrolledRight, setScrolledRight] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [commandModeOptions, setCommandModeOptions] = useState(COMMAND_MODE_OPTIONS_DEFAULTS);
  const [savingSessionData, setSavingSessionData] = useState(false);

  useEffect(() => {
    HiddenTypesChangedEvent.on((hiddenTypes) => setMapHiddenTypes({ ...hiddenTypes }));
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
    MapSourceChangedEvent.on((source) => setMapSource(source));
    ConfigLoadedEvent.on((config: OlympusConfig) => {
      // Timeout needed to make sure the map configuration has updated
      window.setTimeout(() => {
        var sources = Object.keys(getApp().getMap().getMirrors()).concat(getApp().getMap().getLayers());
        setMapSources(sources);
      }, 200);
    });
    CommandModeOptionsChangedEvent.on((commandModeOptions) => {
      setCommandModeOptions(commandModeOptions);
    });
    SessionDataChangedEvent.on(() => setSavingSessionData(true));
    SessionDataSavedEvent.on(() => setSavingSessionData(false));
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
    <div
      className={`
        z-10 flex w-full gap-4 border-gray-200 bg-gray-300 px-3 align-center
        dark:border-gray-800 dark:bg-olympus-900
      `}
    >
      <img src="images/icon.png" className={`my-auto h-10 w-10 rounded-md p-0`}></img>
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
            mr-auto hidden flex-none flex-row items-center justify-start gap-2
            lg:flex
          `}
        >
          <div className="mr-2 flex flex-col items-start">
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
          <OlStateButton
            icon={faDownload}
            onClick={() => {
              getApp().setState(OlympusState.IMPORT_EXPORT, ImportExportSubstate.EXPORT);
            }}
            checked={false}
            tooltip={() => (
              <OlExpandingTooltip
                title="Export scenario from file"
                content="Selectively export the current scenario to a file. This file can be shared with other users or imported later. Currently, only ground and naval units can be exported."
              />
            )}
            tooltipRelativeToParent={true}
          />
          <OlStateButton
            icon={faUpload}
            onClick={() => {
              getApp().setState(OlympusState.IMPORT_EXPORT, ImportExportSubstate.IMPORT);
            }}
            checked={false}
            tooltip={() => (
              <OlExpandingTooltip
                title="Import scenario from file"
                content="Import a scenario from a previously exported file. This will add the imported units to the current scenario, so make sure to delete any unwanted units before importing."
              />
            )}
          />
          {savingSessionData ? (
            <div className="text-white">
              <FaSpinner className={`animate-spin text-2xl`} />
            </div>
          ) : (
            <div className={`relative text-white`}>
              <FaFloppyDisk className={`absolute -top-3 text-2xl`} />
              <FaCheck
                className={`
                  absolute left-[9px] top-[-6px] text-2xl text-olympus-900
                `}
              />
              <FaCheck className={`absolute left-3 top-0 text-green-500`} />
            </div>
          )}
        </div>

        {commandModeOptions.commandMode === BLUE_COMMANDER && (
          <div className={`flex h-full rounded-md bg-blue-600 px-4 text-white`}>
            <span className="my-auto font-bold">BLUE Commander ({commandModeOptions.spawnPoints.blue} points)</span>
          </div>
        )}
        {commandModeOptions.commandMode === RED_COMMANDER && (
          <div className={`flex h-full rounded-md bg-red-600 px-4 text-white`}>
            <span className="my-auto font-bold">BLUE Commander ({commandModeOptions.spawnPoints.blue} points)</span>
          </div>
        )}
        <div className={`flex h-fit flex-row items-center justify-start gap-1`}>
          <OlLockStateButton
            checked={!mapOptions.protectDCSUnits}
            onClick={() => {
              getApp().getMap().setOption("protectDCSUnits", !mapOptions.protectDCSUnits);
            }}
            tooltip={() => (
              <OlExpandingTooltip
                title="Lock/unlock protected units"
                content={<><p>By default, Mission Editor units are protected from being commanded or deleted. This option allows you to unlock them, so they can be commanded or deleted like any other unit. </p>
                  <p>If units are protected, you will still be able to control them, but a prompt will be shown to require your confirmation. </p>
                  <p>Once a unit has been commanded, it will be unlocked and will become an Olympus unit, completely abandoning its previuos mission. </p></>}
              />
            )}
          />
          <OlRoundStateButton
            checked={audioEnabled}
            onClick={() => {
              audioEnabled ? getApp().getAudioManager().stop() : getApp().getAudioManager().start();
              setAudioEnabled(!audioEnabled);
            }}
            tooltip={() => (
              <OlExpandingTooltip
                title="Enable/disable audio"
                content={<><p>If this option is enabled, you will be able to access the radio and audio features of DCS Olympus. </p>
                  <p>For this to work, a SRS Server need to be installed and running on the same machine on which the DCS Olympus server is running.</p>
                  <p>For security reasons, this feature will only work if a secure connection (i.e., using https) is established with the server. It is also suggested to use Google Chrome for optimal compatibility. </p></>}
              />
            )}
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
        <div className={`h-8 w-0 border-l-[2px] border-gray-700`}></div>
        <div className={`flex h-fit flex-row items-center justify-start gap-1`}>
          <OlRoundStateButton
            icon={faDrawPolygon}
            checked={mapOptions.showMissionDrawings}
            onClick={() => {
              getApp().getMap().setOption("showMissionDrawings", !mapOptions.showMissionDrawings);
            }}
            tooltip={() => (
              <OlExpandingTooltip
                title="Hide/Show mission drawings"
                content="To filter the visibile drawings and change their opacity, use the drawings menu on the left sidebar."
              />
            )}
          />
          <OlRoundStateButton
            onClick={() => getApp().getMap().setOption("showUnitsEngagementRings", !mapOptions.showUnitsEngagementRings)}
            checked={mapOptions.showUnitsEngagementRings}
            icon={faTriangleExclamation}
            className={""}
            tooltip={"Hide/show units engagement rings"}
          />
          <OlRoundStateButton
            onClick={() => getApp().getMap().setOption("showUnitsAcquisitionRings", !mapOptions.showUnitsAcquisitionRings)}
            checked={mapOptions.showUnitsAcquisitionRings}
            icon={faWifi}
            className={""}
            tooltip={"Hide/show units acquisition rings"}
          />
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
          tooltip={() => (
            <OlExpandingTooltip
              title="Switch between live and map camera"
              content="When the camera plugin is enabled, you can switch between the live camera view and the map view. These are equivalent to the F9 and F10 views in DCS."
            />
          )}
        />
        <OlStateButton
          checked={mapOptions.cameraPluginEnabled}
          icon={faCamera}
          onClick={() => {
            getApp().getMap().setOption("cameraPluginEnabled", !mapOptions.cameraPluginEnabled);
          }}
          tooltip={() => (
            <OlExpandingTooltip
              title="Activate/deactivate camera plugin"
              content="The camera plugin allows to tie the position of the map to the position of the camera in DCS. This is useful to check exactly how things look from the players perspective. Check the in-game wiki for more information." //TODO add link to wiki
            />
          )}
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
        <FaQuestionCircle
          onClick={() => getApp().setState(OlympusState.TRAINING)}
          className={`cursor-pointer text-2xl text-white`}
        />
      </div>
      {!scrolledRight && (
        <FaChevronRight
          className={`
            absolute right-0 h-full w-6 rounded-lg px-2 py-3.5 text-gray-200
            dark:bg-olympus-900
          `}
        />
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { OlRoundStateButton, OlStateButton, OlLockStateButton } from "../components/olstatebutton";
import { faSkull, faCamera, faFlag, faVolumeHigh, faDrawPolygon, faTriangleExclamation, faWifi, faObjectGroup } from "@fortawesome/free-solid-svg-icons";
import { OlDropdownItem, OlDropdown } from "../components/oldropdown";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { getApp, IP, VERSION } from "../../olympusapp";
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
import { BLUE_COMMANDER, COMMAND_MODE_OPTIONS_DEFAULTS, MAP_HIDDEN_TYPES_DEFAULTS, MAP_OPTIONS_DEFAULTS, RED_COMMANDER } from "../../constants/constants";
import { OlympusConfig } from "../../interfaces";
import { FaCheck, FaSpinner } from "react-icons/fa";
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
  const [latestVersion, setLatestVersion] = useState("");
  const [isLatestVersion, setIsLatestVersion] = useState(false);
  const [isBetaVersion, setIsBetaVersion] = useState(false);
  const [isDevVersion, setIsDevVersion] = useState(false);

  useEffect(() => {
    HiddenTypesChangedEvent.on((hiddenTypes) => setMapHiddenTypes({ ...hiddenTypes }));
    MapOptionsChangedEvent.on((mapOptions) => {
      setMapOptions({ ...mapOptions });
    });
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

    /* Check if we are running the latest version */
    const request = new Request("https://raw.githubusercontent.com/Pax1601/DCSOlympus/main/version.json");
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw new Error("Error connecting to Github to retrieve latest version");
        }
      })
      .then((res) => {
        setLatestVersion(res["version"]);

        if (VERSION === "{{OLYMPUS_VERSION_NUMBER}}") {
          console.log("OLYMPUS_VERSION_NUMBER is not set. Skipping version check.");
          setIsDevVersion(true);
        } else {
          setIsDevVersion(false);

          /* Check if the new version is newer than the current one */
          /* Extract the version numbers */
          const currentVersion = VERSION.replace("v", "").split(".");
          const newVersion = res["version"].replace("v", "").split(".");

          setIsBetaVersion(true);
          setIsLatestVersion(true);

          /* Compare the version numbers */
          for (var i = 0; i < currentVersion.length; i++) {
            if (parseInt(newVersion[i]) > parseInt(currentVersion[i])) {
              setIsLatestVersion(false);
            }
          }

          /* Check if this is a beta version checking if this version is newer */
          for (var i = 0; i < currentVersion.length; i++) {
            if (parseInt(newVersion[i]) < parseInt(currentVersion[i])) {
              setIsBetaVersion(false);
            }
          }
        }
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
    <div
      className={`
        relative z-10 flex w-full gap-4 border-gray-200 bg-gray-300 px-3
        align-center
        dark:border-gray-800 dark:bg-olympus-900
      `}
      onWheel={(e) => {
        if (scrollRef.current) {
          if (e.deltaY > 0) (scrollRef.current as HTMLElement).scrollLeft += 100;
          else (scrollRef.current as HTMLElement).scrollLeft -= 100;
        }
      }}
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
          <div className="w-8">
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
          {isDevVersion ? (
            <div className={`text-gray-400`}>Development build</div>
          ) : (
            <>
              <div>
                {!isLatestVersion && (
                  <div className={`animate-pulse text-gray-400`}>
                    <span className={`font-bold`}>New version available:</span> {latestVersion}
                  </div>
                )}
              </div>
              <div>{!isBetaVersion && <div className={`text-gray-400`}>beta version</div>}</div>
            </>
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
                content={
                  <>
                    <p>
                      By default, Mission Editor units are protected from being commanded or deleted. This option allows you to unlock them, so they can be
                      commanded or deleted like any other unit.{" "}
                    </p>
                    <p>If units are protected, you will still be able to control them, but a prompt will be shown to require your confirmation. </p>
                    <p>Once a unit has been commanded, it will be unlocked and will become an Olympus unit, completely abandoning its previuos mission. </p>
                  </>
                }
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
                content={
                  <>
                    <p>If this option is enabled, you will be able to access the radio and audio features of DCS Olympus. </p>
                    <p>For this to work, a SRS Server need to be installed and running on the same machine on which the DCS Olympus server is running.</p>
                    <p>
                      For security reasons, this feature will only work if a secure connection (i.e., using https) is established with the server. It is also
                      suggested to use Google Chrome for optimal compatibility.{" "}
                    </p>
                  </>
                }
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
          <OlRoundStateButton
            onClick={() => getApp().getMap().setOption("clusterGroundUnits", !mapOptions.clusterGroundUnits)}
            checked={mapOptions.clusterGroundUnits}
            icon={faObjectGroup}
            className={""}
            tooltip={"Enable/disable ground unit clustering"}
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

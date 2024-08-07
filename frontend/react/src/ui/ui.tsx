import React, { useEffect, useState } from "react";
import "./ui.css";

import { EventsProvider } from "../eventscontext";
import { StateProvider } from "../statecontext";

import { Header } from "./panels/header";
import { SpawnMenu } from "./panels/spawnmenu";
import { UnitControlMenu } from "./panels/unitcontrolmenu";
import { MainMenu } from "./panels/mainmenu";
import { SideBar } from "./panels/sidebar";
import { Options } from "./panels/options";
import { MapHiddenTypes, MapOptions } from "../types/types";
import { BLUE_COMMANDER, GAME_MASTER, IDLE, MAP_HIDDEN_TYPES_DEFAULTS, MAP_OPTIONS_DEFAULTS, RED_COMMANDER } from "../constants/constants";
import { getApp, setupApp } from "../olympusapp";
import { LoginModal } from "./modals/login";
import { sha256 } from "js-sha256";
import { MiniMapPanel } from "./panels/minimappanel";
import { UnitMouseControlBar } from "./panels/unitmousecontrolbar";
import { DrawingMenu } from "./panels/drawingmenu";
import { ControlsPanel } from "./panels/controls";

export type OlympusState = {
  mainMenuVisible: boolean;
  spawnMenuVisible: boolean;
  unitControlMenuVisible: boolean;
  measureMenuVisible: boolean;
  drawingMenuVisible: boolean;
  optionsMenuVisible: boolean;
  mapHiddenTypes: MapHiddenTypes;
  mapOptions: MapOptions;
};

export function UI() {
  const [loginModalVisible, setLoginModalVisible] = useState(true);
  const [mainMenuVisible, setMainMenuVisible] = useState(false);
  const [spawnMenuVisible, setSpawnMenuVisible] = useState(false);
  const [unitControlMenuVisible, setUnitControlMenuVisible] = useState(false);
  const [measureMenuVisible, setMeasureMenuVisible] = useState(false);
  const [drawingMenuVisible, setDrawingMenuVisible] = useState(false);
  const [optionsMenuVisible, setOptionsMenuVisible] = useState(false);
  const [mapHiddenTypes, setMapHiddenTypes] = useState(MAP_HIDDEN_TYPES_DEFAULTS);
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [commandMode, setCommandMode] = useState(null as null | string);
  const [mapSources, setMapSources] = useState([] as string[]);
  const [activeMapSource, setActiveMapSource] = useState("");
  const [mapBoxSelection, setMapBoxSelection] = useState(false);
  const [mapState, setMapState] = useState(IDLE);

  document.addEventListener("hiddenTypesChanged", (ev) => {
    setMapHiddenTypes({ ...getApp().getMap().getHiddenTypes() });
  });

  document.addEventListener("mapOptionsChanged", (ev) => {
    setMapOptions({ ...getApp().getMap().getOptions() });
  });

  document.addEventListener("mapStateChanged", (ev) => {
    if ((ev as CustomEvent).detail === IDLE && mapState !== IDLE) hideAllMenus();

    setMapState(String((ev as CustomEvent).detail));
  });

  document.addEventListener("mapSourceChanged", (ev) => {
    var source = (ev as CustomEvent).detail;
    if (source !== activeMapSource) setActiveMapSource(source);
  });

  document.addEventListener("configLoaded", (ev) => {
    let config = getApp().getConfig();
    var sources = Object.keys(config.mapMirrors).concat(Object.keys(config.mapLayers));
    setMapSources(sources);
    setActiveMapSource(sources[0]);
  });

  document.addEventListener("mapForceBoxSelect", (ev) => {
    setMapBoxSelection(true);
  });

  document.addEventListener("mapSelectionEnd", (ev) => {
    setMapBoxSelection(false);
  });

  function hideAllMenus() {
    setMainMenuVisible(false);
    setSpawnMenuVisible(false);
    setUnitControlMenuVisible(false);
    setMeasureMenuVisible(false);
    setDrawingMenuVisible(false);
    setOptionsMenuVisible(false);
  }

  function checkPassword(password: string) {
    setCheckingPassword(true);
    var hash = sha256.create();
    getApp().getServerManager().setPassword(hash.update(password).hex());
    getApp()
      .getServerManager()
      .getMission(
        (response) => {
          const commandMode = response.mission.commandModeOptions.commandMode;
          try {
            [GAME_MASTER, BLUE_COMMANDER, RED_COMMANDER].includes(commandMode) ? setCommandMode(commandMode) : setLoginError(true);
          } catch {
            setLoginError(true);
          }
          setCheckingPassword(false);
        },
        () => {
          setLoginError(true);
          setCheckingPassword(false);
        }
      );
  }

  function connect(username: string) {
    getApp().getServerManager().setUsername(username);
    getApp().getServerManager().startUpdate();
    setLoginModalVisible(false);
  }

  /* Temporary during devel */
  //useEffect(() => {
  //	window.setTimeout(() => {
  //		checkPassword("admin");
  //		connect("devel");
  //	}, 1000)
  //}, [])

  return (
    <div
      className={`
        absolute left-0 top-0 h-screen w-screen overflow-hidden font-sans
      `}
      onLoad={setupApp}
    >
      <StateProvider
        value={{
          mainMenuVisible: mainMenuVisible,
          spawnMenuVisible: spawnMenuVisible,
          unitControlMenuVisible: unitControlMenuVisible,
          measureMenuVisible: measureMenuVisible,
          drawingMenuVisible: drawingMenuVisible,
          optionsMenuVisible: optionsMenuVisible,
          mapOptions: mapOptions,
          mapHiddenTypes: mapHiddenTypes,
          mapSources: mapSources,
          activeMapSource: activeMapSource,
          mapBoxSelection: mapBoxSelection,
        }}
      >
        <EventsProvider
          value={{
            setMainMenuVisible: setMainMenuVisible,
            setSpawnMenuVisible: setSpawnMenuVisible,
            setUnitControlMenuVisible: setUnitControlMenuVisible,
            setDrawingMenuVisible: setDrawingMenuVisible,
            setMeasureMenuVisible: setMeasureMenuVisible,
            setOptionsMenuVisible: setOptionsMenuVisible,
            toggleMainMenuVisible: () => {
              hideAllMenus();
              setMainMenuVisible(!mainMenuVisible);
            },
            toggleSpawnMenuVisible: () => {
              hideAllMenus();
              setSpawnMenuVisible(!spawnMenuVisible);
            },
            toggleUnitControlMenuVisible: () => {
              hideAllMenus();
              setUnitControlMenuVisible(!unitControlMenuVisible);
            },
            toggleMeasureMenuVisible: () => {
              hideAllMenus();
              setMeasureMenuVisible(!measureMenuVisible);
            },
            toggleDrawingMenuVisible: () => {
              hideAllMenus();
              setDrawingMenuVisible(!drawingMenuVisible);
            },
            toggleOptionsMenuVisible: () => {
              hideAllMenus();
              setOptionsMenuVisible(!optionsMenuVisible);
            },
          }}
        >
          <div
            className={`
            absolute left-0 top-0 flex h-full w-full flex-col
          `}
          >
            <Header />
            <div className="flex justify-reverse h-full">
              {loginModalVisible && (
                <>
                  <div
                    className={`
                      fixed left-0 top-0 z-30 h-full w-full bg-[#111111]/95
                    `}
                  ></div>
                  <LoginModal
                    onLogin={(password) => {
                      checkPassword(password);
                    }}
                    onContinue={(username) => {
                      connect(username);
                    }}
                    onBack={() => {
                      setCommandMode(null);
                    }}
                    checkingPassword={checkingPassword}
                    loginError={loginError}
                    commandMode={commandMode}
                  />
                </>
              )}
              <div id="map-container" className="z-0 h-full w-screen" />
              <MainMenu open={mainMenuVisible} onClose={() => setMainMenuVisible(false)} />
              <SpawnMenu open={spawnMenuVisible} onClose={() => setSpawnMenuVisible(false)} />
              <Options open={optionsMenuVisible} onClose={() => setOptionsMenuVisible(false)} options={mapOptions} />
              <MiniMapPanel />
              <ControlsPanel />
              <UnitControlMenu open={unitControlMenuVisible} onClose={() => setUnitControlMenuVisible(false)} />
              <DrawingMenu open={drawingMenuVisible} onClose={() => setDrawingMenuVisible(false)} />

              <UnitMouseControlBar />
              <SideBar />
            </div>
          </div>
        </EventsProvider>
      </StateProvider>
    </div>
  );
}

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
import {
  BLUE_COMMANDER,
  GAME_MASTER,
  IDLE,
  MAP_HIDDEN_TYPES_DEFAULTS,
  MAP_OPTIONS_DEFAULTS,
  RED_COMMANDER,
} from "../constants/constants";
import { getApp, setupApp } from "../olympusapp";
import { LoginModal } from "./modals/login";
import { sha256 } from "js-sha256";
import { MiniMapPanel } from "./panels/minimappanel";
import { UnitMouseControlBar } from "./panels/unitmousecontrolbar";
import { MapStatePanel } from "./panels/mapstatepanel";

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
  var [loginModalVisible, setLoginModalVisible] = useState(true);
  var [mainMenuVisible, setMainMenuVisible] = useState(false);
  var [spawnMenuVisible, setSpawnMenuVisible] = useState(false);
  var [unitControlMenuVisible, setUnitControlMenuVisible] = useState(false);
  var [measureMenuVisible, setMeasureMenuVisible] = useState(false);
  var [drawingMenuVisible, setDrawingMenuVisible] = useState(false);
  var [optionsMenuVisible, setOptionsMenuVisible] = useState(false);
  var [mapHiddenTypes, setMapHiddenTypes] = useState(MAP_HIDDEN_TYPES_DEFAULTS);
  var [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  var [checkingPassword, setCheckingPassword] = useState(false);
  var [loginError, setLoginError] = useState(false);
  var [commandMode, setCommandMode] = useState(null as null | string);
  var [mapSources, setMapSources] = useState([] as string[]);
  var [activeMapSource, setActiveMapSource] = useState("");

  document.addEventListener("hiddenTypesChanged", (ev) => {
    setMapHiddenTypes({ ...getApp().getMap().getHiddenTypes() });
  });

  document.addEventListener("mapOptionsChanged", (ev) => {
    setMapOptions({ ...getApp().getMap().getOptions() });
  });

  document.addEventListener("mapStateChanged", (ev) => {
    if ((ev as CustomEvent).detail == IDLE) {
      hideAllMenus();
    }
  });

  document.addEventListener("mapSourceChanged", (ev) => {
    var source = (ev as CustomEvent).detail;
    if (source !== activeMapSource) setActiveMapSource(source);
  });

  document.addEventListener("configLoaded", (ev) => {
    let config = getApp().getConfig();
    var sources = Object.keys(config.mapMirrors).concat(
      Object.keys(config.mapLayers)
    );
    setMapSources(sources);
    setActiveMapSource(sources[0]);
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
            [GAME_MASTER, BLUE_COMMANDER, RED_COMMANDER].includes(commandMode)
              ? setCommandMode(commandMode)
              : setLoginError(true);
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
          <div className="absolute left-0 top-0 flex h-full w-full flex-col">
            <Header />
            <div className="flex h-full">
              {loginModalVisible && (
                <>
                  <div
                    className={`
                      fixed left-0 top-0 h-full w-full z-ui-5 bg-[#111111]/95
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
              <SideBar />
              <MainMenu
                open={mainMenuVisible}
                onClose={() => setMainMenuVisible(false)}
              />
              <SpawnMenu
                open={spawnMenuVisible}
                onClose={() => setSpawnMenuVisible(false)}
              />
              <Options
                open={optionsMenuVisible}
                onClose={() => setOptionsMenuVisible(false)}
                options={mapOptions}
              />
              <MiniMapPanel />
              <UnitControlMenu open={unitControlMenuVisible} />
              <div id="map-container" className="h-full w-screen" />
              <UnitMouseControlBar />
              <MapStatePanel />
            </div>
          </div>
        </EventsProvider>
      </StateProvider>
    </div>
  );
}

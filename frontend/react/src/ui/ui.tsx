import React, { useEffect, useState } from "react";
import "./ui.css";

import { EventsProvider } from "../eventscontext";
import { StateProvider } from "../statecontext";

import { Header } from "./panels/header";
import { SpawnMenu } from "./panels/spawnmenu";
import { UnitControlMenu } from "./panels/unitcontrolmenu";
import { MainMenu } from "./panels/mainmenu";
import { SideBar } from "./panels/sidebar";
import { OptionsMenu } from "./panels/optionsmenu";
import { MapHiddenTypes, MapOptions } from "../types/types";
import { BLUE_COMMANDER, CONTEXT_ACTION, GAME_MASTER, IDLE, MAP_HIDDEN_TYPES_DEFAULTS, MAP_OPTIONS_DEFAULTS, RED_COMMANDER } from "../constants/constants";
import { getApp, setupApp } from "../olympusapp";
import { LoginModal } from "./modals/login";
import { sha256 } from "js-sha256";
import { MiniMapPanel } from "./panels/minimappanel";
import { UnitMouseControlBar } from "./panels/unitmousecontrolbar";
import { DrawingMenu } from "./panels/drawingmenu";
import { ControlsPanel } from "./panels/controlspanel";
import { MapContextMenu } from "./contextmenus/mapcontextmenu";
import { AirbaseMenu } from "./panels/airbasemenu";
import { Airbase } from "../mission/airbase";
import { RadioMenu } from "./panels/radiomenu";
import { AudioMenu } from "./panels/audiomenu";
import { FormationMenu } from "./panels/formationmenu";
import { Unit } from "../unit/unit";
import { ProtectionPrompt } from "./modals/protectionprompt";
import { UnitExplosionMenu } from "./panels/unitexplosionmenu";

export type OlympusUIState = {
  mainMenuVisible: boolean;
  spawnMenuVisible: boolean;
  unitControlMenuVisible: boolean;
  measureMenuVisible: boolean;
  drawingMenuVisible: boolean;
  optionsMenuVisible: boolean;
  airbaseMenuVisible: boolean;
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
  const [radioMenuVisible, setRadioMenuVisible] = useState(false);
  const [audioMenuVisible, setAudioMenuVisible] = useState(false);
  const [optionsMenuVisible, setOptionsMenuVisible] = useState(false);
  const [airbaseMenuVisible, setAirbaseMenuVisible] = useState(false);
  const [formationMenuVisible, setFormationMenuVisible] = useState(false);
  const [unitExplosionMenuVisible, setUnitExplosionMenuVisible] = useState(false);
  const [mapHiddenTypes, setMapHiddenTypes] = useState(MAP_HIDDEN_TYPES_DEFAULTS);
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [commandMode, setCommandMode] = useState(null as null | string);
  const [mapSources, setMapSources] = useState([] as string[]);
  const [activeMapSource, setActiveMapSource] = useState("");
  const [mapState, setMapState] = useState(IDLE);
  const [airbase, setAirbase] = useState(null as null | Airbase);
  const [formationLeader, setFormationLeader] = useState(null as null | Unit);
  const [formationWingmen, setFormationWingmen] = useState(null as null | Unit[]);
  const [protectionPromptVisible, setProtectionPromptVisible] = useState(false);
  const [protectionCallback, setProtectionCallback] = useState(null as any);
  const [protectionUnits, setProtectionUnits] = useState([] as Unit[]);
  const [unitExplosionUnits, setUnitExplosionUnits] = useState([] as Unit[]);

  useEffect(() => {
    document.addEventListener("hiddenTypesChanged", (ev) => {
      setMapHiddenTypes({ ...getApp().getMap().getHiddenTypes() });
    });

    document.addEventListener("mapOptionsChanged", (ev) => {
      setMapOptions({ ...getApp().getMap().getOptions() });
    });

    document.addEventListener("mapStateChanged", (ev) => {
      //if ((ev as CustomEvent).detail === IDLE) hideAllMenus();
      /*else*/ if ((ev as CustomEvent).detail === CONTEXT_ACTION && window.innerWidth > 1000) setUnitControlMenuVisible(true);
      setMapState(String((ev as CustomEvent).detail));
    });

    document.addEventListener("hideAllMenus", (ev) => {
      hideAllMenus();
    });

    document.addEventListener("mapSourceChanged", (ev) => {
      var source = (ev as CustomEvent).detail;
      setActiveMapSource(source);
    });

    document.addEventListener("configLoaded", (ev) => {
      let config = getApp().getConfig();
      var sources = Object.keys(config.mapMirrors).concat(Object.keys(config.mapLayers));
      setMapSources(sources);
      setActiveMapSource(sources[0]);
    });

    document.addEventListener("airbaseClick", (ev) => {
      hideAllMenus();
      getApp().getMap().setState(IDLE);
      setAirbase((ev as CustomEvent).detail);
      setAirbaseMenuVisible(true);
    });

    document.addEventListener("showFormationMenu", (ev) => {
      setFormationMenuVisible(true);
      setFormationLeader((ev as CustomEvent).detail.leader);
      setFormationWingmen((ev as CustomEvent).detail.wingmen);
    });

    document.addEventListener("showProtectionPrompt", (ev: CustomEventInit) => {
      setProtectionPromptVisible(true);
      setProtectionCallback(() => {return ev.detail.callback});
      setProtectionUnits(ev.detail.units);
    });

    document.addEventListener("showUnitExplosionMenu", (ev) => {
      setUnitExplosionMenuVisible(true);
      setUnitExplosionUnits((ev as CustomEvent).detail.units);
    })
  }, []);

  function hideAllMenus() {
    setMainMenuVisible(false);
    setSpawnMenuVisible(false);
    setUnitControlMenuVisible(false);
    setMeasureMenuVisible(false);
    setDrawingMenuVisible(false);
    setOptionsMenuVisible(false);
    setAirbaseMenuVisible(false);
    setRadioMenuVisible(false);
    setAudioMenuVisible(false);
    setFormationMenuVisible(false);
    setUnitExplosionMenuVisible(false);
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

  return (
    <div
      className={`
        absolute left-0 top-0 flex h-screen w-screen flex-col overflow-hidden
        font-sans
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
          airbaseMenuVisible: airbaseMenuVisible,
          radioMenuVisible: radioMenuVisible,
          audioMenuVisible: audioMenuVisible,
          mapOptions: mapOptions,
          mapHiddenTypes: mapHiddenTypes,
          mapSources: mapSources,
          activeMapSource: activeMapSource,
          mapState: mapState,
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
            setAirbaseMenuVisible: setAirbaseMenuVisible,
            setRadioMenuVisible: setRadioMenuVisible,
            setAudioMenuVisible: setAudioMenuVisible,
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
            toggleAirbaseMenuVisible: () => {
              hideAllMenus();
              setAirbaseMenuVisible(!airbaseMenuVisible);
            },
            toggleRadioMenuVisible: () => {
              hideAllMenus();
              setRadioMenuVisible(!radioMenuVisible);
            },
            toggleAudioMenuVisible: () => {
              hideAllMenus();
              setAudioMenuVisible(!audioMenuVisible);
            },
          }}
        >
          <Header />
          <div className="flex h-full w-full flex-row-reverse">
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
            {protectionPromptVisible && (
              <>
                <div
                  className={`
                    fixed left-0 top-0 z-30 h-full w-full bg-[#111111]/95
                  `}
                ></div>
                <ProtectionPrompt
                  onContinue={(units) => {
                    protectionCallback(units);
                    setProtectionPromptVisible(false);
                  }}
                  onBack={() => {
                    setProtectionPromptVisible(false);
                  }}
                  units={protectionUnits}
                />
              </>
            )}
            <div id="map-container" className="z-0 h-full w-screen" />
            <MainMenu open={mainMenuVisible} onClose={() => setMainMenuVisible(false)} />
            <SpawnMenu open={spawnMenuVisible} onClose={() => setSpawnMenuVisible(false)} />
            <OptionsMenu open={optionsMenuVisible} onClose={() => setOptionsMenuVisible(false)} options={mapOptions} />
            <UnitControlMenu open={unitControlMenuVisible} onClose={() => setUnitControlMenuVisible(false)} />
            <DrawingMenu open={drawingMenuVisible} onClose={() => setDrawingMenuVisible(false)} />
            <AirbaseMenu open={airbaseMenuVisible} onClose={() => setAirbaseMenuVisible(false)} airbase={airbase} />
            <RadioMenu open={radioMenuVisible} onClose={() => setRadioMenuVisible(false)} />
            <AudioMenu open={audioMenuVisible} onClose={() => setAudioMenuVisible(false)} />
            <FormationMenu open={formationMenuVisible} leader={formationLeader} wingmen={formationWingmen} onClose={() => setFormationMenuVisible(false)} />
            <UnitExplosionMenu open={unitExplosionMenuVisible} units={unitExplosionUnits} onClose={() => setUnitExplosionMenuVisible(false)} />

            <MiniMapPanel />
            <ControlsPanel />
            <UnitMouseControlBar />
            <MapContextMenu />
            <SideBar />
          </div>
        </EventsProvider>
      </StateProvider>
    </div>
  );
}

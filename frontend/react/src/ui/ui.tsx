import React, { useEffect, useState } from "react";
import "./ui.css";

import { StateProvider } from "../statecontext";

import { Header } from "./panels/header";
import { SpawnMenu } from "./panels/spawnmenu";
import { UnitControlMenu } from "./panels/unitcontrolmenu";
import { MainMenu } from "./panels/mainmenu";
import { SideBar } from "./panels/sidebar";
import { OptionsMenu } from "./panels/optionsmenu";
import { MapHiddenTypes, MapOptions } from "../types/types";
import {
  BLUE_COMMANDER,
  GAME_MASTER,
  MAP_HIDDEN_TYPES_DEFAULTS,
  MAP_OPTIONS_DEFAULTS,
  NO_SUBSTATE,
  OlympusEvent,
  OlympusState,
  OlympusSubState,
  RED_COMMANDER,
  UnitControlSubState,
} from "../constants/constants";
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
import { AudioMenu } from "./panels/audiomenu";
import { FormationMenu } from "./panels/formationmenu";
import { Unit } from "../unit/unit";
import { ProtectionPrompt } from "./modals/protectionprompt";
import { UnitExplosionMenu } from "./panels/unitexplosionmenu";
import { JTACMenu } from "./panels/jtacmenu";
import {
  AppStateChangedEvent,
  AudioManagerStateChangedEvent,
  AudioSinksChangedEvent,
  AudioSourcesChangedEvent,
  ConfigLoadedEvent,
  ContextActionChangedEvent,
  ContextActionSetChangedEvent,
  HiddenTypesChangedEvent,
  MapOptionsChangedEvent,
  MapSourceChangedEvent,
  SelectedUnitsChangedEvent,
  ServerStatusUpdatedEvent,
  UnitSelectedEvent,
} from "../events";
import { ServerStatus } from "../interfaces";
import { AudioSource } from "../audio/audiosource";
import { AudioSink } from "../audio/audiosink";
import { ContextAction } from "../unit/contextaction";
import { ContextActionSet } from "../unit/contextactionset";

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
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE as OlympusSubState);
  const [mapHiddenTypes, setMapHiddenTypes] = useState(MAP_HIDDEN_TYPES_DEFAULTS);
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  const [mapSources, setMapSources] = useState([] as string[]);
  const [activeMapSource, setActiveMapSource] = useState("");
  const [selectedUnits, setSelectedUnits] = useState([] as Unit[]);
  const [audioSources, setAudioSources] = useState([] as AudioSource[]);
  const [audioSinks, setAudioSinks] = useState([] as AudioSink[]);
  const [audioManagerState, setAudioManagerState] = useState(false);
  const [serverStatus, setServerStatus] = useState({} as ServerStatus);
  const [contextActionSet, setContextActionSet] = useState(null as ContextActionSet | null);
  const [contextAction, setContextAction] = useState(null as ContextAction | null);

  const [checkingPassword, setCheckingPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [commandMode, setCommandMode] = useState(null as null | string);

  const [airbase, setAirbase] = useState(null as null | Airbase);

  const [formationLeader, setFormationLeader] = useState(null as null | Unit);
  const [formationWingmen, setFormationWingmen] = useState(null as null | Unit[]);

  const [unitExplosionUnits, setUnitExplosionUnits] = useState([] as Unit[]);

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
    ConfigLoadedEvent.on(() => {
      let config = getApp().getConfig();
      var sources = Object.keys(config.mapMirrors).concat(Object.keys(config.mapLayers));
      setMapSources(sources);
      setActiveMapSource(sources[0]);
    });
    HiddenTypesChangedEvent.on((hiddenTypes) => setMapHiddenTypes({ ...hiddenTypes }));
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
    MapSourceChangedEvent.on((source) => setActiveMapSource(source));
    SelectedUnitsChangedEvent.on((units) => setSelectedUnits(units));
    AudioSourcesChangedEvent.on((sources) => setAudioSources(sources));
    AudioSinksChangedEvent.on((sinks) => setAudioSinks(sinks));
    AudioManagerStateChangedEvent.on((state) => setAudioManagerState(state));
    ServerStatusUpdatedEvent.on((status) => setServerStatus(status));
    ContextActionSetChangedEvent.on((contextActionSet) => setContextActionSet(contextActionSet));
    ContextActionChangedEvent.on((contextAction) => setContextAction(contextAction));
  }, []);

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
    getApp().setState(OlympusState.IDLE);
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
          appState,
          appSubState,
          mapOptions,
          mapHiddenTypes,
          mapSources,
          activeMapSource,
          selectedUnits,
          audioSources,
          audioSinks,
          audioManagerState,
          serverStatus,
          contextActionSet,
          contextAction,
        }}
      >
        <Header />
        <div className="flex h-full w-full flex-row-reverse">
          {appState === OlympusState.LOGIN && (
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
          {appState === OlympusState.UNIT_CONTROL && appSubState == UnitControlSubState.PROTECTION && (
            <>
              <div
                className={`
                  fixed left-0 top-0 z-30 h-full w-full bg-[#111111]/95
                `}
              ></div>
              <ProtectionPrompt
                onContinue={() => {
                  getApp().getUnitsManager().executeProtectionCallback()
                }}
                onBack={() => {
                  getApp().setState(OlympusState.UNIT_CONTROL)
                }}
              />
            </>
          )}
          <div id="map-container" className="z-0 h-full w-screen" />
          <MainMenu open={appState === OlympusState.MAIN_MENU} onClose={() => getApp().setState(OlympusState.IDLE)} />
          <SpawnMenu open={appState === OlympusState.SPAWN} onClose={() => getApp().setState(OlympusState.IDLE)} />
          <OptionsMenu open={appState === OlympusState.OPTIONS} onClose={() => getApp().setState(OlympusState.IDLE)} options={mapOptions} />

          <UnitControlMenu
            open={appState === OlympusState.UNIT_CONTROL && appSubState !== UnitControlSubState.FORMATION}
            onClose={() => getApp().setState(OlympusState.IDLE)}
          />
          <FormationMenu
            open={appState === OlympusState.UNIT_CONTROL && appSubState === UnitControlSubState.FORMATION}
            leader={formationLeader}
            wingmen={formationWingmen}
            onClose={() => getApp().setState(OlympusState.IDLE)}
          />

          <DrawingMenu open={appState === OlympusState.DRAW} onClose={() => getApp().setState(OlympusState.IDLE)} />
          <AirbaseMenu open={appState === OlympusState.AIRBASE} onClose={() => getApp().setState(OlympusState.IDLE)} airbase={airbase} />
          <AudioMenu open={appState === OlympusState.AUDIO} onClose={() => getApp().setState(OlympusState.IDLE)} />

          {/* TODO} <UnitExplosionMenu open={appState === OlympusState.MAIN_MENU} units={unitExplosionUnits} onClose={() => getApp().setState(OlympusState.IDLE)} /> {*/}
          <JTACMenu open={appState === OlympusState.JTAC} onClose={() => getApp().setState(OlympusState.IDLE)} />

          <MiniMapPanel />
          <ControlsPanel />
          <UnitMouseControlBar />
          <MapContextMenu />
          <SideBar />
        </div>
      </StateProvider>
    </div>
  );
}

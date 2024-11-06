import React, { useEffect, useState } from "react";
import "./ui.css";

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
  MAP_OPTIONS_DEFAULTS,
  NO_SUBSTATE,
  OlympusState,
  OlympusSubState,
  RED_COMMANDER,
  UnitControlSubState,
} from "../constants/constants";
import { getApp, setupApp } from "../olympusapp";
import { LoginModal } from "./modals/login";
import { sha256 } from "js-sha256";
import { MiniMapPanel } from "./panels/minimappanel";
import { UnitControlBar } from "./panels/unitcontrolbar";
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
  MapOptionsChangedEvent
} from "../events";

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
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);

  const [checkingPassword, setCheckingPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [commandMode, setCommandMode] = useState(null as null | string);

  const [airbase, setAirbase] = useState(null as null | Airbase);

  const [formationLeader, setFormationLeader] = useState(null as null | Unit);
  const [formationWingmen, setFormationWingmen] = useState(null as null | Unit[]);
  const [protectionPromptVisible, setProtectionPromptVisible] = useState(false);
  const [protectionCallback, setProtectionCallback] = useState(null as any);
  const [protectionUnits, setProtectionUnits] = useState([] as Unit[]);

  const [unitExplosionUnits, setUnitExplosionUnits] = useState([] as Unit[]);

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));

    document.addEventListener("showProtectionPrompt", (ev: CustomEventInit) => {
      setProtectionPromptVisible(true);
      setProtectionCallback(() => {
        return ev.detail.callback;
      });
      setProtectionUnits(ev.detail.units);
    });
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
      <Header />
      <div className="flex h-full w-full flex-row-reverse">
        {appState === OlympusState.LOGIN && (
          <>
            <div
              className={`fixed left-0 top-0 z-30 h-full w-full bg-[#111111]/95`}
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
              className={`fixed left-0 top-0 z-30 h-full w-full bg-[#111111]/95`}
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
        <MainMenu open={appState === OlympusState.MAIN_MENU} onClose={() => getApp().setState(OlympusState.IDLE)} />
        <SpawnMenu open={appState === OlympusState.SPAWN} onClose={() => getApp().setState(OlympusState.IDLE)} />
        <OptionsMenu open={appState === OlympusState.OPTIONS} onClose={() => getApp().setState(OlympusState.IDLE)} options={mapOptions} /* TODO remove *//>

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
        <AirbaseMenu open={appState === OlympusState.AIRBASE} onClose={() => getApp().setState(OlympusState.IDLE)} airbase={airbase} /* TODO remove */ />
        <AudioMenu open={appState === OlympusState.AUDIO} onClose={() => getApp().setState(OlympusState.IDLE)} />

        {/* TODO} <UnitExplosionMenu open={appState === OlympusState.MAIN_MENU} units={unitExplosionUnits} onClose={() => getApp().setState(OlympusState.IDLE)} /> {*/}
        <JTACMenu open={appState === OlympusState.JTAC} onClose={() => getApp().setState(OlympusState.IDLE)} />

        <MiniMapPanel />
        <ControlsPanel />
        <UnitControlBar />
        <MapContextMenu />
        <SideBar />
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import "./ui.css";

import { Header } from "./panels/header";
import { SpawnMenu } from "./panels/spawnmenu";
import { UnitControlMenu } from "./panels/unitcontrolmenu";
import { MainMenu } from "./panels/mainmenu";
import { SideBar } from "./panels/sidebar";
import { OptionsMenu } from "./panels/optionsmenu";
import { NO_SUBSTATE, OlympusState, OlympusSubState, OptionsSubstate, UnitControlSubState } from "../constants/constants";
import { getApp, setupApp } from "../olympusapp";
import { LoginModal } from "./modals/loginmodal";

import { MiniMapPanel } from "./panels/minimappanel";
import { DrawingMenu } from "./panels/drawingmenu";
import { ControlsPanel } from "./panels/controlspanel";
import { MapContextMenu } from "./contextmenus/mapcontextmenu";
import { AirbaseMenu } from "./panels/airbasemenu";
import { AudioMenu } from "./panels/audiomenu";
import { FormationMenu } from "./panels/formationmenu";
import { ProtectionPromptModal } from "./modals/protectionpromptmodal";
import { KeybindModal } from "./modals/keybindmodal";
import { UnitExplosionMenu } from "./panels/unitexplosionmenu";
import { AppStateChangedEvent, ServerStatusUpdatedEvent } from "../events";
import { GameMasterMenu } from "./panels/gamemastermenu";
import { InfoBar } from "./panels/infobar";
import { HotGroupBar } from "./panels/hotgroupsbar";
import { SpawnContextMenu } from "./contextmenus/spawncontextmenu";
import { CoordinatesPanel } from "./panels/coordinatespanel";
import { RadiosSummaryPanel } from "./panels/radiossummarypanel";
import { ServerOverlay } from "./serveroverlay";
import { ImportExportModal } from "./modals/importexportmodal";
import { WarningModal } from "./modals/warningmodal";
import { TrainingModal } from "./modals/trainingmodal";
import { AdminModal } from "./modals/adminmodal";

export function UI() {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE as OlympusSubState);
  const [serverConnected, setServerConnected] = useState(false as boolean);
  const [connectedOnce, setConnectedOnce] = useState(false);

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
    ServerStatusUpdatedEvent.on((status) => {
      // If we connected at least once, record it
      if (status.connected) setConnectedOnce(true);
      setServerConnected(status.connected);
    });
  }, []);

  useEffect(() => {
    setupApp();
  });

  return (
    <div
      className={`
        absolute left-0 top-0 flex h-screen w-screen flex-col overflow-hidden
        font-sans
      `}
    >
      {appState !== OlympusState.SERVER && <Header />}
      <div className="flex h-full w-full flex-row-reverse">
        {appState === OlympusState.SERVER && <ServerOverlay />}

        {appState !== OlympusState.SERVER && (
          <>
            <LoginModal open={appState === OlympusState.LOGIN} />
            <ProtectionPromptModal open={appState === OlympusState.UNIT_CONTROL && appSubState == UnitControlSubState.PROTECTION} />
            <KeybindModal open={appState === OlympusState.OPTIONS && appSubState === OptionsSubstate.KEYBIND} />
            <ImportExportModal open={appState === OlympusState.IMPORT_EXPORT} />
            <WarningModal open={appState === OlympusState.WARNING} />
            <TrainingModal open={appState === OlympusState.TRAINING} />
            <AdminModal open={appState === OlympusState.ADMIN} />
          </>
        )}

        <div id="map-container" className="z-0 h-full w-screen" />

        {appState !== OlympusState.SERVER && (
          <>
            <MainMenu open={appState === OlympusState.MAIN_MENU} onClose={() => getApp().setState(OlympusState.IDLE)} />
            <SpawnMenu open={appState === OlympusState.SPAWN} onClose={() => getApp().setState(OlympusState.IDLE)} />
            <OptionsMenu open={appState === OlympusState.OPTIONS} onClose={() => getApp().setState(OlympusState.IDLE)} />
            <UnitControlMenu
              open={
                appState === OlympusState.UNIT_CONTROL &&
                ![UnitControlSubState.FORMATION, UnitControlSubState.UNIT_EXPLOSION_MENU].includes(appSubState as UnitControlSubState)
              }
              onClose={() => getApp().setState(OlympusState.IDLE)}
            />
            <FormationMenu
              open={appState === OlympusState.UNIT_CONTROL && appSubState === UnitControlSubState.FORMATION}
              onClose={() => getApp().setState(OlympusState.IDLE)}
            />
            <DrawingMenu open={appState === OlympusState.DRAW} onClose={() => getApp().setState(OlympusState.IDLE)} />
            <AirbaseMenu open={appState === OlympusState.AIRBASE} onClose={() => getApp().setState(OlympusState.IDLE)} />
            <AudioMenu open={appState === OlympusState.AUDIO} onClose={() => getApp().setState(OlympusState.IDLE)} />
            <GameMasterMenu open={appState === OlympusState.GAME_MASTER} onClose={() => getApp().setState(OlympusState.IDLE)} />
            <UnitExplosionMenu
              open={appState === OlympusState.UNIT_CONTROL && appSubState === UnitControlSubState.UNIT_EXPLOSION_MENU}
              onClose={() => {}}
            />
            {/*}<JTACMenu open={appState === OlympusState.JTAC} onClose={() => getApp().setState(OlympusState.IDLE)} />
        <AWACSMenu open={appState === OlympusState.AWACS} onClose={() => getApp().setState(OlympusState.IDLE)} />{*/}

            <MiniMapPanel />
            <ControlsPanel />

            <SideBar />
            <InfoBar />
            <HotGroupBar />

            <MapContextMenu />
            <SpawnContextMenu />
          </>
        )}
      </div>

      {!serverConnected && appState !== OlympusState.LOGIN && (
        <div
          className={`
            absolute left-0 top-0 z-50 flex h-screen w-screen items-center
            justify-center bg-gray-900 bg-opacity-80 text-center text-white
            backdrop-blur-sm
          `}
        >
          <div
            className={`
              flex w-[400px] flex-col items-center justify-center gap-4
            `}
          >
            <div className="bouncing-ball">
              <img src="images/olympus-500x500.png" alt="Olympus Logo" className={`
                ball-logo
              `} />
            </div>
            {!connectedOnce && <div>Establishing connection</div>}
            {connectedOnce && <div>Connection lost</div>}
            {!connectedOnce && <div className="text-gray-400">Trying to connect to the server, please wait...</div>}
            {connectedOnce && (
              <div className="text-gray-400">
                Try reloading this page. However, this usually means that you internet connection is down, or that the server is offline, paused, or loading a
                new mission.
              </div>
            )}
          </div>
        </div>
      )}

      {appState === OlympusState.NOT_INITIALIZED && (
        <div
          className={`
            absolute left-0 top-0 z-50 flex h-screen w-screen items-center
            justify-center bg-gray-900 text-white
          `}
        >
          Loading...
        </div>
      )}
    </div>
  );
}

import React from "react";
import { OlStateButton } from "../components/olstatebutton";
import { faGamepad, faRuler, faPencil, faEllipsisV, faCog, faQuestionCircle, faPlusSquare, faMagnifyingGlass, faRadio, faVolumeHigh, faJ } from "@fortawesome/free-solid-svg-icons";
import { EventsConsumer } from "../../eventscontext";
import { StateConsumer } from "../../statecontext";
import { CONTEXT_ACTION, IDLE } from "../../constants/constants";

export function SideBar() {
  return (
    <StateConsumer>
      {(appState) => (
        <EventsConsumer>
          {(events) => (
            <nav
              className={`
                z-20 flex h-full flex-col bg-gray-300
                dark:bg-olympus-900
              `}
            >
              <div
                className={`
                  w-16 flex-1 flex-wrap items-center justify-center p-4
                `}
              >
                <div
                  className={`
                  flex flex-col items-center justify-center gap-2.5
                `}
                >
                  <OlStateButton
                    onClick={events.toggleMainMenuVisible}
                    checked={appState.mainMenuVisible}
                    icon={faEllipsisV}
                    tooltip="Hide/show main menu"
                  ></OlStateButton>
                  <OlStateButton
                    onClick={events.toggleSpawnMenuVisible}
                    checked={appState.spawnMenuVisible}
                    icon={faPlusSquare}
                    tooltip="Hide/show unit spawn menu"
                  ></OlStateButton>
                  <OlStateButton
                    onClick={events.toggleUnitControlMenuVisible}
                    checked={appState.unitControlMenuVisible}
                    icon={appState.mapState !== CONTEXT_ACTION? faMagnifyingGlass: faGamepad}
                    tooltip="Hide/show selection tool and unit control menu"
                  ></OlStateButton>
                  <OlStateButton onClick={events.toggleMeasureMenuVisible} checked={appState.measureMenuVisible} icon={faRuler} tooltip="NOT IMPLEMENTED"></OlStateButton>
                  <OlStateButton
                    onClick={events.toggleDrawingMenuVisible}
                    checked={appState.drawingMenuVisible}
                    icon={faPencil}
                    tooltip="Hide/show drawing menu"
                  ></OlStateButton>
                  <OlStateButton
                    onClick={events.toggleAudioMenuVisible}
                    checked={appState.audioMenuVisible}
                    icon={faVolumeHigh}
                    tooltip="Hide/show audio menu"
                  ></OlStateButton>
                  <OlStateButton
                    onClick={events.toggleJTACMenuVisible}
                    checked={appState.JTACMenuVisible}
                    icon={faJ}
                    tooltip="Hide/show JTAC menu"
                  ></OlStateButton>
                </div>
              </div>
              <div className="flex w-16 flex-wrap content-end justify-center p-4">
                <div
                  className={`
                  flex flex-col items-center justify-center gap-2.5
                `}
                >
                  <OlStateButton
                    onClick={() => window.open("https://github.com/Pax1601/DCSOlympus/wiki")}
                    checked={false}
                    icon={faQuestionCircle}
                    tooltip="Open user guide on separate window"
                  ></OlStateButton>
                  <OlStateButton
                    onClick={events.toggleOptionsMenuVisible}
                    checked={appState.optionsMenuVisible}
                    icon={faCog}
                    tooltip="Hide/show settings menu"
                  ></OlStateButton>
                </div>
              </div>
            </nav>
          )}
        </EventsConsumer>
      )}
    </StateConsumer>
  );
}

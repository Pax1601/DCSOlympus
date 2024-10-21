import React from "react";
import { OlStateButton } from "../components/olstatebutton";
import {
  faGamepad,
  faRuler,
  faPencil,
  faEllipsisV,
  faCog,
  faQuestionCircle,
  faPlusSquare,
  faMagnifyingGlass,
  faVolumeHigh,
  faJ,
} from "@fortawesome/free-solid-svg-icons";
import { StateConsumer } from "../../statecontext";
import { getApp } from "../../olympusapp";
import { OlympusState } from "../../constants/constants";

export function SideBar() {
  return (
    <StateConsumer>
      {(appState) => (
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
                onClick={() => {getApp().setState(appState.appState !== OlympusState.MAIN_MENU? OlympusState.MAIN_MENU: OlympusState.IDLE)}}
                checked={appState.appState === OlympusState.MAIN_MENU}
                icon={faEllipsisV}
                tooltip="Hide/show main menu"
              ></OlStateButton>
              <OlStateButton
                onClick={() => {getApp().setState(appState.appState !== OlympusState.SPAWN? OlympusState.SPAWN: OlympusState.IDLE)}}
                checked={appState.appState === OlympusState.SPAWN}
                icon={faPlusSquare}
                tooltip="Hide/show unit spawn menu"
              ></OlStateButton>
              <OlStateButton
                onClick={() => {getApp().setState(appState.appState !== OlympusState.UNIT_CONTROL? OlympusState.UNIT_CONTROL: OlympusState.IDLE)}}
                checked={appState.appState === OlympusState.UNIT_CONTROL}
                icon={faGamepad}
                tooltip="Hide/show selection tool and unit control menu"
              ></OlStateButton>
              <OlStateButton
                onClick={() => {getApp().setState(appState.appState !== OlympusState.DRAW? OlympusState.DRAW: OlympusState.IDLE)}}
                checked={appState.appState === OlympusState.DRAW}
                icon={faPencil}
                tooltip="Hide/show drawing menu"
              ></OlStateButton>
              <OlStateButton
                onClick={() => {getApp().setState(appState.appState !== OlympusState.AUDIO? OlympusState.AUDIO: OlympusState.IDLE)}}
                checked={appState.appState === OlympusState.AUDIO}
                icon={faVolumeHigh}
                tooltip="Hide/show audio menu"
              ></OlStateButton>
              <OlStateButton 
              onClick={() => {getApp().setState(appState.appState !== OlympusState.JTAC? OlympusState.JTAC: OlympusState.IDLE)}}
              checked={appState.appState === OlympusState.JTAC}
              icon={faJ} tooltip="Hide/show JTAC menu"></OlStateButton>
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
                onClick={() => {getApp().setState(appState.appState !== OlympusState.OPTIONS? OlympusState.OPTIONS: OlympusState.IDLE)}}
                checked={appState.appState === OlympusState.OPTIONS}
                icon={faCog}
                tooltip="Hide/show settings menu"
              ></OlStateButton>
            </div>
          </div>
        </nav>
      )}
    </StateConsumer>
  );
}

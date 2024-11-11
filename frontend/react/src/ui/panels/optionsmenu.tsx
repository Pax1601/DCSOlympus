import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { OlCheckbox } from "../components/olcheckbox";
import { OlRangeSlider } from "../components/olrangeslider";
import { OlNumberInput } from "../components/olnumberinput";
import { getApp } from "../../olympusapp";
import { MAP_OPTIONS_DEFAULTS, OlympusState, OptionsSubstate } from "../../constants/constants";
import { BindShortcutRequestEvent, MapOptionsChangedEvent, ShortcutsChangedEvent } from "../../events";
import { OlAccordion } from "../components/olaccordion";
import { Shortcut } from "../../shortcut/shortcut";
import { OlSearchBar } from "../components/olsearchbar";

const enum Accordion {
  NONE,
  BINDINGS,
  MAP_OPTIONS,
  CAMERA_PLUGIN,
}

export function OptionsMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  const [shortcuts, setShortcuts] = useState({} as { [key: string]: Shortcut });
  const [openAccordion, setOpenAccordion] = useState(Accordion.NONE);
  const [filterString, setFilterString] = useState("");

  useEffect(() => {
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
    ShortcutsChangedEvent.on((shortcuts) => setShortcuts({ ...shortcuts }));
  }, []);

  return (
    <Menu title="User preferences" open={props.open} showBackButton={false} onClose={props.onClose}>
      <div
        className={`
          flex flex-col gap-2 p-5 font-normal text-gray-800
          dark:text-white
        `}
      >
        <OlAccordion
          onClick={() => 
            setOpenAccordion(openAccordion === Accordion.NONE ? Accordion.BINDINGS: Accordion.NONE )
          }
          open={openAccordion === Accordion.BINDINGS}
          title="Key bindings"
        >
          <OlSearchBar onChange={(value) => setFilterString(value)} text={filterString} />
          <div
            className={`
              flex max-h-[450px] flex-col gap-1 overflow-y-scroll no-scrollbar
            `}
          >
            {Object.entries(shortcuts)
              .filter(([id, shortcut]) => shortcut.getOptions().label.toLowerCase().indexOf(filterString.toLowerCase()) >= 0)
              .map(([id, shortcut]) => {
                return (
                  <div
                    className={`
                      group relative mr-2 flex cursor-pointer select-none
                      items-center justify-between rounded-sm px-2 py-2 text-sm
                      dark:text-gray-300 dark:hover:bg-olympus-500
                    `}
                    onClick={() => {
                      getApp().setState(OlympusState.OPTIONS, OptionsSubstate.KEYBIND);
                      BindShortcutRequestEvent.dispatch(shortcut);
                    }}
                  >
                    <span>{shortcut.getOptions().label}</span>
                    <span>
                      {shortcut.getOptions().altKey ? "Alt + " : ""}
                      {shortcut.getOptions().ctrlKey ? "Ctrl + " : ""}
                      {shortcut.getOptions().shiftKey ? "Shift + " : ""}
                      {shortcut.getOptions().code}
                    </span>
                  </div>
                );
              })}
          </div>
        </OlAccordion>

        <OlAccordion onClick={() => setOpenAccordion(openAccordion === Accordion.NONE ? Accordion.MAP_OPTIONS: Accordion.NONE )} open={openAccordion === Accordion.MAP_OPTIONS} title="Map options">
          <div
            className={`
              group flex flex-row rounded-md justify-content cursor-pointer
              gap-4 p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("showUnitLabels", !mapOptions.showUnitLabels)}
          >
            <OlCheckbox checked={mapOptions.showUnitLabels} onChange={() => {}}></OlCheckbox>
            <span>Show Unit Labels</span>
          </div>
          <div
            className={`
              group flex flex-row rounded-md justify-content cursor-pointer
              gap-4 p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("showUnitsEngagementRings", !mapOptions.showUnitsEngagementRings)}
          >
            <OlCheckbox checked={mapOptions.showUnitsEngagementRings} onChange={() => {}}></OlCheckbox>
            <span>Show Threat Rings</span>
          </div>
          <div
            className={`
              group flex flex-row rounded-md justify-content cursor-pointer
              gap-4 p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("showUnitsAcquisitionRings", !mapOptions.showUnitsAcquisitionRings)}
          >
            <OlCheckbox checked={mapOptions.showUnitsAcquisitionRings} onChange={() => {}}></OlCheckbox>
            <span>Show Detection rings</span>
          </div>
          <div
            className={`
              group flex flex-row rounded-md justify-content cursor-pointer
              gap-4 p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("showUnitTargets", !mapOptions.showUnitTargets)}
          >
            <OlCheckbox checked={mapOptions.showUnitTargets} onChange={() => {}}></OlCheckbox>
            <span>Show Detection lines</span>
          </div>
          <div
            className={`
              group flex flex-row gap-4 rounded-md justify-content
              cursor-pointer p-2 text-sm
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("hideUnitsShortRangeRings", !mapOptions.hideUnitsShortRangeRings)}
          >
            <OlCheckbox checked={mapOptions.hideUnitsShortRangeRings} onChange={() => {}}></OlCheckbox>
            <span>Hide Short range Rings</span>
          </div>
          <div
            className={`
              group flex flex-row gap-4 rounded-md justify-content
              cursor-pointer p-2 text-sm
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("keepRelativePositions", !mapOptions.keepRelativePositions)}
          >
            <OlCheckbox checked={mapOptions.keepRelativePositions} onChange={() => {}}></OlCheckbox>
            <span>Keep units relative positions</span>
          </div>
          <div
            className={`
              group flex flex-row gap-4 rounded-md justify-content
              cursor-pointer p-2 text-sm
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("hideGroupMembers", !mapOptions.hideGroupMembers)}
          >
            <OlCheckbox checked={mapOptions.hideGroupMembers} onChange={() => {}}></OlCheckbox>
            <span>Hide Group members</span>
          </div>
          <div
            className={`
              group flex flex-row gap-4 rounded-md justify-content
              cursor-pointer p-2 text-sm
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("showMinimap", !mapOptions.showMinimap)}
          >
            <OlCheckbox checked={mapOptions.showMinimap} onChange={() => {}}></OlCheckbox>
            <span>Show minimap</span>
          </div>
        </OlAccordion>

        <OlAccordion onClick={() => setOpenAccordion(openAccordion === Accordion.NONE ? Accordion.CAMERA_PLUGIN: Accordion.NONE )} open={openAccordion === Accordion.CAMERA_PLUGIN} title="Camera plugin options">
          <hr
            className={`
              m-2 my-1 w-auto border-[1px] bg-gray-700
              dark:border-olympus-500
            `}
          ></hr>
          <div
            className={`
              flex flex-col content-center items-start justify-between gap-2 p-2
            `}
          >
            <div className="flex flex-col">
              <span
                className={`
                  font-normal
                  dark:text-white
                `}
              >
                DCS Camera Zoom Scaling
              </span>
            </div>
            <OlRangeSlider
              onChange={(ev) => getApp().getMap().setOption("cameraPluginRatio", parseInt(ev.target.value))}
              value={mapOptions.cameraPluginRatio}
              min={0}
              max={100}
              step={1}
            />
          </div>
          <div
            className={`
              flex flex-col content-center items-start justify-between gap-2 p-2
            `}
          >
            <span
              className={`
                font-normal
                dark:text-white
              `}
            >
              DCS Camera Port
            </span>
            <div className="flex">
              <OlNumberInput
                value={mapOptions.cameraPluginPort}
                min={0}
                max={9999}
                onDecrease={() =>
                  getApp()
                    .getMap()
                    .setOption("cameraPluginPort", mapOptions.cameraPluginPort - 1)
                }
                onIncrease={() =>
                  getApp()
                    .getMap()
                    .setOption("cameraPluginPort", mapOptions.cameraPluginPort + 1)
                }
                onChange={(ev) => getApp().getMap().setOption("cameraPluginPort", ev.target.value)}
              />
            </div>
          </div>
        </OlAccordion>
      </div>
    </Menu>
  );
}

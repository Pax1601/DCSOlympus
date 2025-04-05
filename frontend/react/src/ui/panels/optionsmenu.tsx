import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { OlCheckbox } from "../components/olcheckbox";
import { OlRangeSlider } from "../components/olrangeslider";
import { OlNumberInput } from "../components/olnumberinput";
import { getApp } from "../../olympusapp";
import { COMMAND_MODE_OPTIONS_DEFAULTS, GAME_MASTER, MAP_OPTIONS_DEFAULTS, OlympusState, OptionsSubstate } from "../../constants/constants";
import { BindShortcutRequestEvent, CommandModeOptionsChangedEvent, MapOptionsChangedEvent, ShortcutsChangedEvent } from "../../events";
import { OlAccordion } from "../components/olaccordion";
import { Shortcut } from "../../shortcut/shortcut";
import { OlSearchBar } from "../components/olsearchbar";
import { FaXmark } from "react-icons/fa6";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { FaCog, FaQuestionCircle } from "react-icons/fa";
import { sha256 } from "js-sha256";

const enum Accordion {
  NONE,
  BINDINGS,
  MAP_OPTIONS,
  CAMERA_PLUGIN,
  ADMIN,
}

export function OptionsMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
  const [shortcuts, setShortcuts] = useState({} as { [key: string]: Shortcut });
  const [openAccordion, setOpenAccordion] = useState(Accordion.NONE);
  const [filterString, setFilterString] = useState("");
  const [admin, setAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [commandModeOptions, setCommandModeOptions] = useState(COMMAND_MODE_OPTIONS_DEFAULTS);

  const checkPassword = (password: string) => {
    var hash = sha256.create();

    const requestOptions: RequestInit = {
      method: "GET", // Specify the request method
      headers: {
        Authorization: "Basic " + btoa(`Admin:${hash.update(password).hex()}`),
      }, // Specify the content type
    };

    fetch(`./admin/config`, requestOptions).then((response) => {
      if (response.status === 200) {
        console.log(`Admin password correct`);
        getApp().setAdminPassword(password);
        getApp().setState(OlympusState.ADMIN);
        return response.json();
      } else {
        getApp().addInfoMessage(`Admin password incorrect!`);
        throw new Error("Admin password incorrect");
      }
    });
  };

  useEffect(() => {
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
    ShortcutsChangedEvent.on((shortcuts) => setShortcuts({ ...shortcuts }));

    CommandModeOptionsChangedEvent.on((commandModeOptions) => {
      setCommandModeOptions(commandModeOptions);
    });
  }, []);

  return (
    <Menu title="User preferences" open={props.open} showBackButton={false} onClose={props.onClose} wikiDisabled={true}>
      <div
        className={`
          flex h-full flex-col justify-end gap-2 p-5 font-normal text-gray-800
          dark:text-white
        `}
      >
        <OlAccordion
          onClick={() => setOpenAccordion(openAccordion !== Accordion.BINDINGS ? Accordion.BINDINGS : Accordion.NONE)}
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
                    key={id}
                    className={`
                      group relative mr-2 flex cursor-pointer select-none
                      items-center justify-between rounded-sm px-2 py-2
                      dark:text-gray-300 dark:hover:bg-olympus-500
                    `}
                    onClick={() => {
                      getApp().setState(OlympusState.OPTIONS, OptionsSubstate.KEYBIND);
                      BindShortcutRequestEvent.dispatch(shortcut);
                    }}
                  >
                    <span>{shortcut.getOptions().label}</span>
                    <span className="flex gap-1">
                      {shortcut.getOptions().ctrlKey && "Ctrl + "}
                      {shortcut.getOptions().altKey && "Alt + "}
                      {shortcut.getOptions().shiftKey && "Shift + "}
                      {shortcut.getOptions().code}
                    </span>
                  </div>
                );
              })}
          </div>
        </OlAccordion>

        <OlAccordion
          onClick={() => setOpenAccordion(openAccordion !== Accordion.MAP_OPTIONS ? Accordion.MAP_OPTIONS : Accordion.NONE)}
          open={openAccordion === Accordion.MAP_OPTIONS}
          title="Map options"
        >
          <div
            className={`
              group flex cursor-pointer flex-row content-center justify-start
              gap-4 rounded-md p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("showUnitLabels", !mapOptions.showUnitLabels)}
          >
            <OlCheckbox checked={mapOptions.showUnitLabels} onChange={() => {}}></OlCheckbox>
            <span className="my-auto">Show unit labels</span>
          </div>
          <div
            className={`
              group flex cursor-pointer flex-row content-center justify-start
              gap-4 rounded-md p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("showUnitCallsigns", !mapOptions.showUnitCallsigns)}
          >
            <OlCheckbox checked={mapOptions.showUnitCallsigns} onChange={() => {}}></OlCheckbox>
            <span className="my-auto">Show unit Mission Editor callsigns</span>
          </div>
          <div
            className={`
              group flex cursor-pointer flex-row content-center justify-start
              gap-4 rounded-md p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("showUnitsEngagementRings", !mapOptions.showUnitsEngagementRings)}
          >
            <OlCheckbox checked={mapOptions.showUnitsEngagementRings} onChange={() => {}}></OlCheckbox>
            <span className="my-auto">Show threat rings</span>
          </div>
          <div
            className={`
              group flex cursor-pointer flex-row content-center justify-start
              gap-4 rounded-md p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("showUnitsAcquisitionRings", !mapOptions.showUnitsAcquisitionRings)}
          >
            <OlCheckbox checked={mapOptions.showUnitsAcquisitionRings} onChange={() => {}}></OlCheckbox>
            <span className="my-auto">Show detection rings</span>
          </div>
          <div
            className={`
              group flex cursor-pointer flex-row content-center justify-start
              gap-4 rounded-md p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("showUnitContacts", !mapOptions.showUnitContacts)}
          >
            <OlCheckbox checked={mapOptions.showUnitContacts} onChange={() => {}}></OlCheckbox>
            <span className="my-auto">Show detection lines</span>
          </div>
          <div
            className={`
              group flex cursor-pointer flex-row content-center justify-start
              gap-4 rounded-md p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("showUnitTargets", !mapOptions.showUnitTargets)}
          >
            <OlCheckbox checked={mapOptions.showUnitTargets} onChange={() => {}}></OlCheckbox>
            <span className="my-auto">Show unit targets</span>
          </div>
          <div
            className={`
              group flex cursor-pointer flex-row content-center justify-start
              gap-4 rounded-md p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("hideUnitsShortRangeRings", !mapOptions.hideUnitsShortRangeRings)}
          >
            <OlCheckbox checked={mapOptions.hideUnitsShortRangeRings} onChange={() => {}}></OlCheckbox>
            <span className="my-auto">Hide short range rings</span>
          </div>

          <div
            className={`
              group flex cursor-pointer flex-row content-center justify-start
              gap-4 rounded-md p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("hideGroupMembers", !mapOptions.hideGroupMembers)}
          >
            <OlCheckbox checked={mapOptions.hideGroupMembers} onChange={() => {}}></OlCheckbox>
            <span className="my-auto">Hide group members</span>
          </div>
          <div
            className={`
              group flex cursor-pointer flex-row content-center justify-start
              gap-4 rounded-md p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("showMinimap", !mapOptions.showMinimap)}
          >
            <OlCheckbox checked={mapOptions.showMinimap} onChange={() => {}}></OlCheckbox>
            <span className="my-auto">Show minimap</span>
          </div>
          <div
            className={`
              group flex cursor-pointer flex-row content-center justify-start
              gap-4 rounded-md p-2
              dark:hover:bg-olympus-400
            `}
            onClick={() => getApp().getMap().setOption("showRacetracks", !mapOptions.showRacetracks)}
          >
            <OlCheckbox checked={mapOptions.showRacetracks} onChange={() => {}}></OlCheckbox>
            <span className="my-auto">Show racetracks</span>
          </div>
          <>
            {commandModeOptions.commandMode === GAME_MASTER && (
              <div
                className={`
                  group flex cursor-pointer flex-row content-center
                  justify-start gap-4 rounded-md p-2
                  dark:hover:bg-olympus-400
                `}
                onClick={() => {
                  mapOptions.AWACSCoalition === "blue" && getApp().getMap().setOption("AWACSCoalition", "neutral");
                  mapOptions.AWACSCoalition === "neutral" && getApp().getMap().setOption("AWACSCoalition", "red");
                  mapOptions.AWACSCoalition === "red" && getApp().getMap().setOption("AWACSCoalition", "blue");
                }}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex content-center gap-4">
                    <OlCoalitionToggle
                      onClick={() => {
                        mapOptions.AWACSCoalition === "blue" && getApp().getMap().setOption("AWACSCoalition", "neutral");
                        mapOptions.AWACSCoalition === "neutral" && getApp().getMap().setOption("AWACSCoalition", "red");
                        mapOptions.AWACSCoalition === "red" && getApp().getMap().setOption("AWACSCoalition", "blue");
                      }}
                      coalition={mapOptions.AWACSCoalition}
                    />
                    <span className="my-auto">Coalition of unit bullseye info</span>
                  </div>
                  <div className="flex gap-1 text-sm text-gray-400">
                    <FaQuestionCircle className={`my-auto w-8`} />{" "}
                    <div className={`my-auto ml-2`}>Change the coalition of the bullseye to use to provide bullseye information in the unit tooltip.</div>
                  </div>
                </div>
              </div>
            )}
          </>
        </OlAccordion>

        <OlAccordion
          onClick={() => setOpenAccordion(openAccordion !== Accordion.CAMERA_PLUGIN ? Accordion.CAMERA_PLUGIN : Accordion.NONE)}
          open={openAccordion === Accordion.CAMERA_PLUGIN}
          title="Camera plugin options"
        >
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

        <button
          type="button"
          onClick={() => getApp().resetProfile()}
          className={`
            flex w-full content-center items-center justify-center gap-2
            rounded-sm border-[1px] bg-blue-700 px-5 py-2.5 text-sm font-medium
            text-white
            dark:border-red-600 dark:bg-gray-800 dark:text-gray-400
            dark:hover:bg-gray-700 dark:focus:ring-blue-800
            focus:outline-none focus:ring-4 focus:ring-blue-300
            hover:bg-blue-800
          `}
        >
          Reset all settings
          <FaXmark />
        </button>

        <div className="mt-auto flex flex-col gap-2 p-2">
          <div className="flex content-center justify-between gap-4">
            <label
              className={`
                text-gray-800 text-md my-auto text-nowrap
                dark:text-white
              `}
            >
              Admin password
            </label>
            <input
              type="password"
              onChange={(ev) => {
                setPassword(ev.currentTarget.value);
              }}
              className={`
                max-w-44 rounded-lg border border-gray-300 bg-gray-50 p-2.5
                text-sm text-gray-900
                dark:border-gray-600 dark:bg-gray-700 dark:text-white
                dark:placeholder-gray-400 dark:focus:border-blue-500
                dark:focus:ring-blue-500
                focus:border-blue-500 focus:ring-blue-500
              `}
              placeholder="Enter password"
              required
            />
          </div>
          <button
            type="button"
            onClick={() => checkPassword(password)}
            className={`
              flex content-center items-center justify-center gap-2 rounded-sm
              border-[1px] bg-blue-700 px-5 py-2.5 text-sm font-medium
              text-white
              dark:border-white dark:bg-gray-800 dark:text-gray-400
              dark:hover:bg-gray-700 dark:focus:ring-blue-800
              focus:outline-none focus:ring-4 focus:ring-blue-300
              hover:bg-blue-800
            `}
          >
            Open advanced settings menu
            <FaCog />
          </button>
        </div>
      </div>
    </Menu>
  );
}

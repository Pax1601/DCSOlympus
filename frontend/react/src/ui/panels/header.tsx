import React, { useEffect, useRef, useState } from "react";
import {
  OlRoundStateButton,
  OlStateButton,
  OlLockStateButton,
} from "../components/olstatebutton";
import {
  faSkull,
  faCamera,
  faFlag,
  faLink,
  faUnlink,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EventsConsumer } from "../../eventscontext";
import { StateConsumer } from "../../statecontext";
import { OlDropdownItem, OlDropdown } from "../components/oldropdown";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { getApp, IP, connectedToServer } from "../../olympusapp";
import {
  olButtonsVisibilityAirbase,
  olButtonsVisibilityAircraft,
  olButtonsVisibilityDcs,
  olButtonsVisibilityGroundunit,
  olButtonsVisibilityGroundunitSam,
  olButtonsVisibilityHelicopter,
  olButtonsVisibilityHuman,
  olButtonsVisibilityNavyunit,
  olButtonsVisibilityOlympus,
} from "../components/olicons";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

export function Header() {
  const [scrolledLeft, setScrolledLeft] = useState(true);
  const [scrolledRight, setScrolledRight] = useState(false);

   /* Initialize the "scroll" position of the element */
   var scrollRef = useRef(null);
   useEffect(() => {
     if (scrollRef.current) {
       onScroll(scrollRef.current);
     }
   });

  function onScroll(el) {
    const sl = el.scrollLeft;
    const sr =
      el.scrollWidth - el.scrollLeft - el.clientWidth;

    sl < 1 && !scrolledLeft && setScrolledLeft(true);
    sl > 1 && scrolledLeft && setScrolledLeft(false);

    sr < 1 && !scrolledRight && setScrolledRight(true);
    sr > 1 && scrolledRight && setScrolledRight(false);
  }

  return (
    <StateConsumer>
      {(appState) => (
        <EventsConsumer>
          {() => (
            <nav
              className={`
                flex w-full gap-4 border-gray-200 bg-gray-300 px-3
                drop-shadow-md z-ui-4 align-center
                dark:border-gray-800 dark:bg-olympus-900
              `}
            >
              <img
                src="vite/images/icon.png"
                className="my-auto h-10 w-10 rounded-md p-0"
              ></img>
              {!scrolledLeft && (
                <FaChevronLeft
                  className={`
                    absolute left-14 h-full w-6 rounded-lg px-2 py-3.5
                    text-gray-200 z-ui-1
                    dark:bg-olympus-900
                  `}
                />
              )}
              <div
                className={`
                  my-2 flex w-full items-center gap-3 overflow-x-scroll
                  no-scrollbar
                `}
                onScroll={(ev) => onScroll(ev.target)}
                ref={scrollRef}
              >
                <div
                  className={`
                    mr-auto hidden flex-none flex-row items-center justify-start
                    gap-6
                    lg:flex
                  `}
                >
                  <div className="flex flex-col items-start">
                    <div
                      className={`
                        pt-1 text-xs text-gray-800
                        dark:text-gray-400
                      `}
                    >
                      Connected to
                    </div>
                    <div
                      className={`
                        flex items-center justify-center gap-2 text-sm
                        font-extrabold text-gray-800
                        dark:text-gray-200
                      `}
                    >
                      {IP}{" "}
                      <FontAwesomeIcon
                        icon={connectedToServer ? faLink : faUnlink}
                        data-connected={connectedToServer}
                        className={`
                          py-auto text-green-400
                          dark:text-red-500
                          data-[connected='true']:dark:text-green-400
                        `}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <OlLockStateButton
                    checked={false}
                    onClick={() => {}}
                    tooltip="Lock/unlock protected units (from scripted mission)"
                  />
                </div>
                <div className={`h-8 w-0 border-l-[2px] border-gray-700`}></div>
                <div
                  className={`
                    flex h-fit flex-row items-center justify-start gap-1
                  `}
                >
                  {Object.entries({
                    human: olButtonsVisibilityHuman,
                    olympus: olButtonsVisibilityOlympus,
                    dcs: olButtonsVisibilityDcs,
                  }).map((entry) => {
                    return (
                      <OlRoundStateButton
                        key={entry[0]}
                        onClick={() => {
                          getApp()
                            .getMap()
                            .setHiddenType(
                              entry[0],
                              !appState.mapHiddenTypes[entry[0]]
                            );
                        }}
                        checked={!appState.mapHiddenTypes[entry[0]]}
                        icon={entry[1]}
                        tooltip={"Hide/show " + entry[0] + " units"}
                      />
                    );
                  })}
                </div>
                <div className={`h-8 w-0 border-l-[2px] border-gray-700`}></div>
                <div
                  className={`
                    flex h-fit flex-row items-center justify-start gap-1
                  `}
                >
                  <OlRoundStateButton
                    onClick={() =>
                      getApp()
                        .getMap()
                        .setHiddenType("blue", !appState.mapHiddenTypes["blue"])
                    }
                    checked={!appState.mapHiddenTypes["blue"]}
                    icon={faFlag}
                    className={"!text-blue-500"}
                    tooltip={"Hide/show blue units"}
                  />
                  <OlRoundStateButton
                    onClick={() =>
                      getApp()
                        .getMap()
                        .setHiddenType("red", !appState.mapHiddenTypes["red"])
                    }
                    checked={!appState.mapHiddenTypes["red"]}
                    icon={faFlag}
                    className={"!text-red-500"}
                    tooltip={"Hide/show red units"}
                  />
                  <OlRoundStateButton
                    onClick={() =>
                      getApp()
                        .getMap()
                        .setHiddenType(
                          "neutral",
                          !appState.mapHiddenTypes["neutral"]
                        )
                    }
                    checked={!appState.mapHiddenTypes["neutral"]}
                    icon={faFlag}
                    className={"!text-gray-500"}
                    tooltip={"Hide/show neutral units"}
                  />
                </div>
                <div className={`h-8 w-0 border-l-[2px] border-gray-700`}></div>
                <div
                  className={`
                    flex h-fit flex-row items-center justify-start gap-1
                  `}
                >
                  {Object.entries({
                    aircraft: olButtonsVisibilityAircraft,
                    helicopter: olButtonsVisibilityHelicopter,
                    "groundunit-sam": olButtonsVisibilityGroundunitSam,
                    groundunit: olButtonsVisibilityGroundunit,
                    navyunit: olButtonsVisibilityNavyunit,
                    airbase: olButtonsVisibilityAirbase,
                    dead: faSkull,
                  }).map((entry) => {
                    return (
                      <OlRoundStateButton
                        key={entry[0]}
                        onClick={() => {
                          getApp()
                            .getMap()
                            .setHiddenType(
                              entry[0],
                              !appState.mapHiddenTypes[entry[0]]
                            );
                        }}
                        checked={!appState.mapHiddenTypes[entry[0]]}
                        icon={entry[1]}
                        tooltip={"Hide/show " + entry[0] + " units"}
                      />
                    );
                  })}
                </div>

                <OlLabelToggle
                  toggled={false}
                  leftLabel={"Live"}
                  rightLabel={"Map"}
                  onClick={() => {}}
                ></OlLabelToggle>
                <OlStateButton
                  checked={false}
                  icon={faCamera}
                  onClick={() => {}}
                  tooltip="Activate/deactivate camera plugin"
                />
                <OlDropdown label={appState.activeMapSource} className="w-40">
                  {appState.mapSources.map((source) => {
                    return (
                      <OlDropdownItem
                        key={source}
                        className="w-52"
                        onClick={() => getApp().getMap().setLayerName(source)}
                      >
                        {source}
                      </OlDropdownItem>
                    );
                  })}
                </OlDropdown>
              </div>
              {!scrolledRight && (
              <FaChevronRight
                className={`
                  absolute right-0 h-full w-6 rounded-lg px-2 py-3.5
                  text-gray-200 z-ui-1
                  dark:bg-olympus-900
                `}
              />
            )}
            </nav>
          )}
        </EventsConsumer>
      )}
    </StateConsumer>
  );
}

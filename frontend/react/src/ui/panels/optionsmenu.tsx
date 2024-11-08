import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { OlCheckbox } from "../components/olcheckbox";
import { OlRangeSlider } from "../components/olrangeslider";
import { OlNumberInput } from "../components/olnumberinput";
import { getApp } from "../../olympusapp";
import { MAP_OPTIONS_DEFAULTS } from "../../constants/constants";
import { MapOptionsChangedEvent } from "../../events";

export function OptionsMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);

  useEffect(() => {
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
  }, []);

  return (
    <Menu title="User preferences" open={props.open} showBackButton={false} onClose={props.onClose}>
      <div
        className={`
          flex flex-col gap-2 p-5 font-normal text-gray-800
          dark:text-white
        `}
      >
        <div
          className={`
            group flex flex-row rounded-md justify-content cursor-pointer gap-4
            p-2
            dark:hover:bg-olympus-400
          `}
          onClick={() => {
            getApp().getMap().setOption("showUnitLabels", !mapOptions.showUnitLabels);
          }}
        >
          <OlCheckbox checked={mapOptions.showUnitLabels} onChange={() => {}}></OlCheckbox>
          <span>Show Unit Labels</span>
          <kbd
            className={`
              ml-auto rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5
              text-xs font-semibold text-gray-800
              dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
            `}
          >
            L
          </kbd>
        </div>
        <div
          className={`
            group flex flex-row rounded-md justify-content cursor-pointer gap-4
            p-2
            dark:hover:bg-olympus-400
          `}
          onClick={() => {
            getApp().getMap().setOption("showUnitsEngagementRings", !mapOptions.showUnitsEngagementRings);
          }}
        >
          <OlCheckbox checked={mapOptions.showUnitsEngagementRings} onChange={() => {}}></OlCheckbox>
          <span>Show Threat Rings</span>
          <kbd
            className={`
              ml-auto rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5
              text-xs font-semibold text-gray-800
              dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
            `}
          >
            Q
          </kbd>
        </div>
        <div
          className={`
            group flex flex-row rounded-md justify-content cursor-pointer gap-4
            p-2
            dark:hover:bg-olympus-400
          `}
          onClick={() => {
            getApp().getMap().setOption("showUnitsAcquisitionRings", !mapOptions.showUnitsAcquisitionRings);
          }}
        >
          <OlCheckbox checked={mapOptions.showUnitsAcquisitionRings} onChange={() => {}}></OlCheckbox>
          <span>Show Detection rings</span>
          <kbd
            className={`
              ml-auto rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5
              text-xs font-semibold text-gray-800
              dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
            `}
          >
            E
          </kbd>
        </div>
        <div
          className={`
            group flex flex-row rounded-md justify-content cursor-pointer gap-4
            p-2
            dark:hover:bg-olympus-400
          `}
          onClick={() => {
            getApp().getMap().setOption("showUnitTargets", !mapOptions.showUnitTargets);
          }}
        >
          <OlCheckbox checked={mapOptions.showUnitTargets} onChange={() => {}}></OlCheckbox>
          <span>Show Detection lines</span>
          <kbd
            className={`
              ml-auto rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5
              text-xs font-semibold text-gray-800
              dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
            `}
          >
            F
          </kbd>
        </div>
        <div
          className={`
            group flex flex-row rounded-md justify-content cursor-pointer gap-4
            p-2
            dark:hover:bg-olympus-400
          `}
          onClick={() => {
            getApp().getMap().setOption("hideUnitsShortRangeRings", !mapOptions.hideUnitsShortRangeRings);
          }}
        >
          <OlCheckbox checked={mapOptions.hideUnitsShortRangeRings} onChange={() => {}}></OlCheckbox>
          <span>Hide Short range Rings</span>
          <kbd
            className={`
              ml-auto rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5
              text-xs font-semibold text-gray-800
              dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
            `}
          >
            R
          </kbd>
        </div>
        <div
          className={`
            group flex flex-row rounded-md justify-content cursor-pointer gap-4
            p-2
            dark:hover:bg-olympus-400
          `}
          onClick={() => {
            getApp().getMap().setOption("keepRelativePositions", !mapOptions.keepRelativePositions);
          }}
        >
          <OlCheckbox checked={mapOptions.keepRelativePositions} onChange={() => {}}></OlCheckbox>
          <span>Keep units relative positions</span>
          <kbd
            className={`
              ml-auto rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5
              text-xs font-semibold text-gray-800
              dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
            `}
          >
            P
          </kbd>
        </div>
        <div
          className={`
            group flex flex-row rounded-md justify-content cursor-pointer gap-4
            p-2
            dark:hover:bg-olympus-400
          `}
          onClick={() => {
            getApp().getMap().setOption("hideGroupMembers", !mapOptions.hideGroupMembers);
          }}
        >
          <OlCheckbox checked={mapOptions.hideGroupMembers} onChange={() => {}}></OlCheckbox>
          <span>Hide Group members</span>
          <kbd
            className={`
              ml-auto rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5
              text-xs font-semibold text-gray-800
              dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
            `}
          >
            G
          </kbd>
        </div>
        <div
          className={`
            group flex flex-row rounded-md justify-content cursor-pointer gap-4
            p-2
            dark:hover:bg-olympus-400
          `}
          onClick={() => {
            getApp().getMap().setOption("showMinimap", !mapOptions.showMinimap);
          }}
        >
          <OlCheckbox checked={mapOptions.showMinimap} onChange={() => {}}></OlCheckbox>
          <span>Show minimap</span>
          <kbd
            className={`
              ml-auto rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5
              text-xs font-semibold text-gray-800
              dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
            `}
          >
            ?
          </kbd>
        </div>

        {/*
            <hr className="w-auto m-2 my-1 bg-gray-700 border-[1px] dark:border-olympus-500"></hr>
            <div className="flex flex-col content-center items-start justify-between p-2 gap-2">
                <div className="flex flex-col">
                    <span className="font-normal dark:text-white">DCS Camera Zoom Scaling</span>
                    <span className="dark:text-blue-500 font-bold"> x5
                    </span>
                </div>
                <OlRangeSlider
                    onChange={() => { }}
                    value={5}
                    min={1}
                    max={10}
                    step={2}
                />
            </div>
            <div className="flex flex-col content-center items-start justify-between p-2 gap-2">
                <span className="font-normal dark:text-white">DCS Camera Port</span>
                <div className="flex">
                    <OlNumberInput
                        value={3004}
                        min={0}
                        max={9999}
                        onDecrease={() => { }}
                        onIncrease={() => { }}
                        onChange={(ev) => { }}
                    />
                </div>
            </div> */}
      </div>
    </Menu>
  );
}

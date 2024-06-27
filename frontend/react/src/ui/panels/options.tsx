import React from "react";
import { Menu } from "./components/menu";
import { OlCheckbox } from "../components/olcheckbox";
import { OlRangeSlider } from "../components/olrangeslider";
import { OlNumberInput } from "../components/olnumberinput";
import { MapOptions } from "../../types/types";
import { getApp } from "../../olympusapp";

export function Options(props: {
    open: boolean,
    onClose: () => void,
    options: MapOptions,
    children?: JSX.Element | JSX.Element[],
}) {
    return <Menu
        title="User preferences"
        open={props.open}
        showBackButton={false}
        onClose={props.onClose}
    >
        <div className="flex flex-col p-5 gap-2 font-normal text-gray-800 dark:text-white ">
            <div
                className="group flex flex-row rounded-md justify-content gap-4 p-2 dark:hover:bg-olympus-400 cursor-pointer"
                onClick={() => { getApp().getMap().setOption("showUnitLabels", !props.options.showUnitLabels) }}
            >
                <OlCheckbox checked={props.options.showUnitLabels} onChange={() => { }}></OlCheckbox>
                <span>Show Unit Labels</span>
                <kbd className="ml-auto px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">L</kbd>
            </div>
            <div
                className="group flex flex-row rounded-md justify-content gap-4 p-2 dark:hover:bg-olympus-400 cursor-pointer"
                onClick={() => { getApp().getMap().setOption("showUnitsEngagementRings", !props.options.showUnitsEngagementRings) }}
            >
                <OlCheckbox checked={props.options.showUnitsEngagementRings} onChange={() => { }}></OlCheckbox>
                <span>Show Threat Rings</span>
                <kbd className="ml-auto px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Q</kbd>
            </div>
            <div
                className="group flex flex-row rounded-md justify-content gap-4 p-2 dark:hover:bg-olympus-400 cursor-pointer"
                onClick={() => { getApp().getMap().setOption("showUnitsAcquisitionRings", !props.options.showUnitsAcquisitionRings) }}
            >
                <OlCheckbox checked={props.options.showUnitsAcquisitionRings} onChange={() => { }}></OlCheckbox>
                <span>Show Detection rings</span>
                <kbd className="ml-auto px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">E</kbd>
            </div>
            <div
                className="group flex flex-row rounded-md justify-content gap-4 p-2 dark:hover:bg-olympus-400 cursor-pointer"
                onClick={() => { getApp().getMap().setOption("showUnitTargets", !props.options.showUnitTargets) }}
            >
                <OlCheckbox checked={props.options.showUnitTargets} onChange={() => { }}></OlCheckbox>
                <span>Show Detection lines</span>
                <kbd className="ml-auto px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">F</kbd>
            </div>
            <div
                className="group flex flex-row rounded-md justify-content gap-4 p-2 dark:hover:bg-olympus-400 cursor-pointer"
                onClick={() => { getApp().getMap().setOption("hideUnitsShortRangeRings", !props.options.hideUnitsShortRangeRings) }}
            >
                <OlCheckbox checked={props.options.hideUnitsShortRangeRings} onChange={() => { }}></OlCheckbox>
                <span>Hide Short range Rings</span>
                <kbd className="ml-auto px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">R</kbd>
            </div>
            <div
                className="group flex flex-row rounded-md justify-content gap-4 p-2 dark:hover:bg-olympus-400 cursor-pointer"
                onClick={() => { getApp().getMap().setOption("hideGroupMembers", !props.options.hideGroupMembers) }}
            >
                <OlCheckbox checked={props.options.hideGroupMembers} onChange={() => { }}></OlCheckbox>
                <span>Hide Group members</span>
                <kbd className="ml-auto px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">G</kbd>
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
}
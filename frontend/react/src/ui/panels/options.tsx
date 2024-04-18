import React from "react";
import { Menu } from "./components/menu";
import { faArrowRightLong, faCheckCircle, faDatabase, faExternalLink, faExternalLinkAlt, faFile, faFileAlt, faFileExport, faFileImport, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { OlCheckbox } from "../components/olcheckbox";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { OlRangeSlider } from "../components/olrangeslider";
import { OlNumberInput } from "../components/olnumberinput";

export function Options(props: {
    open: boolean,
    onClose: () => void,
    children?: JSX.Element | JSX.Element[],
}) {
    return <Menu
        title="User preferences"
        open={props.open}
        showBackButton={false}
        onClose={props.onClose}
    >
        <div className="flex flex-col p-5 gap-2 font-normal text-gray-900 text-gray-800 dark:text-white ">
            <div className="group flex flex-row rounded-md justify-content gap-4 p-2 dark:hover:bg-olympus-400 cursor-pointer">
                <OlCheckbox checked={true} onChange={() => { }}></OlCheckbox>
                <span>Toggle Unit Labels</span>
            </div>
            <div className="group flex flex-row rounded-md justify-content gap-4 p-2 dark:hover:bg-olympus-400 cursor-pointer">
                <OlCheckbox checked={true} onChange={() => { }}></OlCheckbox>
                <span>Toggle Threat Rings</span>
            </div>
            <div className="group flex flex-row rounded-md justify-content gap-4 p-2 dark:hover:bg-olympus-400 cursor-pointer">
                <OlCheckbox checked={true} onChange={() => { }}></OlCheckbox>
                <span>Toggle Detection rings</span>
            </div>
            <div className="group flex flex-row rounded-md justify-content gap-4 p-2 dark:hover:bg-olympus-400 cursor-pointer">
                <OlCheckbox checked={true} onChange={() => { }}></OlCheckbox>
                <span>Toggle Detection lines</span>
            </div>
            <div className="group flex flex-row rounded-md justify-content gap-4 p-2 dark:hover:bg-olympus-400 cursor-pointer">
                <OlCheckbox checked={true} onChange={() => { }}></OlCheckbox>
                <span>Toggle Radar lines</span>
            </div>
            <div className="group flex flex-row rounded-md justify-content gap-4 p-2 dark:hover:bg-olympus-400 cursor-pointer">
                <OlCheckbox checked={true} onChange={() => { }}></OlCheckbox>
                <span>Toggle Something Else</span>
            </div>
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
            </div>
        </div>
    </Menu>
}
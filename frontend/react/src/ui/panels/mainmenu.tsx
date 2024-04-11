import React from "react";
import { Menu } from "./components/menu";
import { faCheckCircle, faDatabase, faFileAlt, faFileExport, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { VERSION } from "../../olympusapp";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

export function MainMenu(props) {
    return <Menu {...props} title="DCS Olympus">
        <div className="flex flex-col p-5 gap-2 text-md font-normal font text-gray-900 dark:text-white">
            <div className="flex gap-3 p-1 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-white/10 rounded-sm content-center text-green-700 dark:text-[#8BFF63]"><FontAwesomeIcon icon={faCheckCircle} className="my-auto" />Version {VERSION}</div>
            <div className="flex gap-3 p-1 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-white/10 rounded-sm content-center"><FontAwesomeIcon icon={faGithub} className="my-auto w-4 text-gray-800 dark:text-[#435367]" />Overview</div>
            <div className="flex gap-3 p-1 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-white/10 rounded-sm content-center"><FontAwesomeIcon icon={faFileAlt} className="my-auto w-4  text-gray-800 dark:text-[#435367]" />User guide</div>
            <div className="flex gap-3 p-1 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-white/10 rounded-sm content-center"><FontAwesomeIcon icon={faDatabase} className="my-auto w-4 text-gray-800 dark:text-[#435367]" />Database Manager</div>
            <div className="flex gap-3 p-1 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-white/10 rounded-sm content-center"><FontAwesomeIcon icon={faFileExport} className="my-auto w-4 text-gray-800 dark:text-[#435367]" />Export to file</div>
            <div className="flex gap-3 p-1 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-white/10 rounded-sm content-center"><FontAwesomeIcon icon={faFileImport} className="my-auto w-4 text-gray-800 dark:text-[#435367]" />Import from file</div>
        </div>
    </Menu>
}
import React from "react";
import { Menu } from "./components/menu";
import { faCheckCircle, faDatabase, faFileAlt, faFileExport, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { VERSION } from "../../olympusapp";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

export function MainMenu(props) {
    return <Menu {...props} title="DCS Olympus">
        <div className="flex flex-col gap-2 text-md font-normal font text-white">
            <div className="flex gap-3 p-1 cursor-pointer select-none dark:hover:bg-white/10 rounded-sm content-center text-[#8BFF63]"><FontAwesomeIcon icon={faCheckCircle} className="my-auto" />Version {VERSION}</div>
            <div className="flex gap-3 p-1 cursor-pointer select-none dark:hover:bg-white/10 rounded-sm content-center"><FontAwesomeIcon icon={faGithub} className="my-auto text-gray-400" />Overview</div>
            <div className="flex gap-3 p-1 cursor-pointer select-none dark:hover:bg-white/10 rounded-sm content-center"><FontAwesomeIcon icon={faFileAlt} className="my-auto text-gray-400" />User guide</div>
            <div className="flex gap-3 p-1 cursor-pointer select-none dark:hover:bg-white/10 rounded-sm content-center"><FontAwesomeIcon icon={faDatabase} className="my-auto text-gray-400" />Database Manager</div>
            <div className="flex gap-3 p-1 cursor-pointer select-none dark:hover:bg-white/10 rounded-sm content-center"><FontAwesomeIcon icon={faFileExport} className="my-auto text-gray-400" />Export to file</div>
            <div className="flex gap-3 p-1 cursor-pointer select-none dark:hover:bg-white/10 rounded-sm content-center"><FontAwesomeIcon icon={faFileImport} className="my-auto text-gray-400" />Import from file</div>
        </div>
    </Menu>
}
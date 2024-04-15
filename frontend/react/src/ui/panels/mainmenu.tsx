import React from "react";
import { Menu } from "./components/menu";
import { faArrowRightLong, faCheckCircle, faDatabase, faExternalLink, faExternalLinkAlt, faFile, faFileAlt, faFileExport, faFileImport, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { VERSION } from "../../olympusapp";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

export function MainMenu(props: {
    open: boolean,
    onClose: () => void,
    children?: JSX.Element | JSX.Element[],
}) {
    return <Menu
        title="Main Menu"
        open={props.open}
        showBackButton={false}
        onClose={props.onClose}
    >
        <div className="flex flex-col p-5 gap-1 font-normal text-gray-900 dark:text-white">
            <div className="p-2 mb-1">
                <div className="flex gap-2 mb-2 select-none rounded-sm content-center text-green-700 dark:text-green-400 font-bold text-lg"><FontAwesomeIcon icon={faCheckCircle} className="my-auto" />Olympus Version {VERSION}</div>
                <div className="text-gray-400 text-sm">You can use the Olympus Manager to update port, passwords or other settings.</div>
            </div>
            
            <div className="group flex gap-3 p-2 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-olympus-500 rounded-md content-center">{/*<FontAwesomeIcon icon={faGithub} className="my-auto w-4 text-gray-800 dark:text-gray-500" />*/}View GitHub Repo <FontAwesomeIcon icon={faExternalLinkAlt} className="my-auto w-4 text-gray-800 dark:text-gray-500 text-sm" /><div className="flex items-center ml-auto"><FontAwesomeIcon icon={faArrowRightLong} className="my-auto px-2 text-gray-800 dark:text-olympus-50 text-right group-hover:translate-x-2 transition-transform" /></div></div>
            <div className="group flex gap-3 p-2 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-olympus-500 rounded-md content-center">{/*<FontAwesomeIcon icon={faFile} className="my-auto w-4  text-gray-800 dark:text-gray-500" />*/}View User Guide <FontAwesomeIcon icon={faExternalLinkAlt} className="my-auto w-4 text-gray-800 dark:text-gray-500 text-sm" /><div className="flex items-center ml-auto"><FontAwesomeIcon icon={faArrowRightLong} className="my-auto px-2 text-gray-800 dark:text-olympus-50 text-right group-hover:translate-x-2 transition-transform" /></div></div>
            <hr className="w-auto m-2 my-1 bg-gray-700 border-[1px] dark:border-olympus-500"></hr>
            <div className="group flex gap-3 p-2 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-olympus-500 rounded-md content-center">{/*<FontAwesomeIcon icon={faDatabase} className="my-auto w-4 text-gray-800 dark:text-gray-500" />*/}Open Olympus Manager<div className="flex items-center ml-auto"><FontAwesomeIcon icon={faArrowRightLong} className="my-auto px-2 text-gray-800 dark:text-olympus-50 text-right group-hover:translate-x-2 transition-transform" /></div></div>
            <div className="group flex gap-3 p-2 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-olympus-500 rounded-md content-center">{/*<FontAwesomeIcon icon={faDatabase} className="my-auto w-4 text-gray-800 dark:text-gray-500" />*/}Database Manager<div className="flex items-center ml-auto"><FontAwesomeIcon icon={faArrowRightLong} className="my-auto px-2 text-gray-800 dark:text-olympus-50 text-right group-hover:translate-x-2 transition-transform" /></div></div>
            <div className="group flex gap-3 p-2 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-olympus-500 rounded-md content-center">{/*<FontAwesomeIcon icon={faFileExport} className="my-auto w-4 text-gray-800 dark:text-gray-500" />*/}Export to file<div className="flex items-center ml-auto"><FontAwesomeIcon icon={faArrowRightLong} className="my-auto px-2 text-gray-800 dark:text-olympus-50 text-right group-hover:translate-x-2 transition-transform" /></div></div>
            <div className="group flex gap-3 p-2 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-olympus-500 rounded-md content-center">{/*<FontAwesomeIcon icon={faFileImport} className="my-auto w-4 text-gray-800 dark:text-gray-500" />*/}Import from file<div className="flex items-center ml-auto"><FontAwesomeIcon icon={faArrowRightLong} className="my-auto px-2 text-gray-800 dark:text-olympus-50 text-right group-hover:translate-x-2 transition-transform" /></div></div>
            <hr className="w-auto m-2 my-1 bg-gray-700 border-[1px] dark:border-olympus-500"></hr>
            <div className="group flex gap-3 p-2 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-olympus-500 rounded-md content-center">{/*<FontAwesomeIcon icon={faTimesCircle} className="my-auto w-4 text-gray-800 dark:text-gray-500" />*/}Close Olympus<div className="flex items-center ml-auto"><FontAwesomeIcon icon={faArrowRightLong} className="my-auto px-2 text-gray-800 dark:text-olympus-50 text-right group-hover:translate-x-2 transition-transform" /></div></div>
        </div>
    </Menu>
}
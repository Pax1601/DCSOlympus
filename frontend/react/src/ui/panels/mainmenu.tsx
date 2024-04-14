import React from "react";
import { Menu } from "./components/menu";
import { faArrowRightLong, faCheckCircle, faDatabase, faFileAlt, faFileExport, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { VERSION } from "../../olympusapp";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

export function MainMenu(props: {
    open: boolean,
    onClose: () => void,
    children?: JSX.Element | JSX.Element[],
}) {
    return <Menu
        title="DCS Olympus Menu"
        open={props.open}
        showBackButton={false}
        onClose={props.onClose}
    >
        <div className="flex flex-col p-5 gap-1 text-md font-normal font text-gray-900 dark:text-white">
            <div className="flex gap-3 p-2 select-none rounded-sm content-center text-green-700 dark:text-green-400 font-bold"><FontAwesomeIcon icon={faCheckCircle} className="my-auto" />Version {VERSION}</div>
            <div className="flex gap-3 p-2 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-gray-700 rounded-sm content-center">{/*<FontAwesomeIcon icon={faGithub} className="my-auto w-4 text-gray-800 dark:text-[#435367]" />*/}View on GitHub<div className="flex items-center ml-auto"><FontAwesomeIcon icon={faArrowRightLong} className="my-auto w-4 text-gray-800 dark:text-olympus-50 text-right" /></div></div>
            <div className="flex gap-3 p-2 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-white/10 rounded-sm content-center">{/*<FontAwesomeIcon icon={faFileAlt} className="my-auto w-4  text-gray-800 dark:text-[#435367]" />*/}View User Guide<div className="flex items-center ml-auto"><FontAwesomeIcon icon={faArrowRightLong} className="my-auto w-4 text-gray-800 dark:text-olympus-50 text-right" /></div></div>
            <div className="flex gap-3 p-2 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-white/10 rounded-sm content-center">{/*<FontAwesomeIcon icon={faDatabase} className="my-auto w-4 text-gray-800 dark:text-[#435367]" />*/}Database Manager<div className="flex items-center ml-auto"><FontAwesomeIcon icon={faArrowRightLong} className="my-auto w-4 text-gray-800 dark:text-olympus-50 text-right" /></div></div>
            <div className="flex gap-3 p-2 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-white/10 rounded-sm content-center">{/*<FontAwesomeIcon icon={faFileExport} className="my-auto w-4 text-gray-800 dark:text-[#435367]" />*/}Export to file<div className="flex items-center ml-auto"><FontAwesomeIcon icon={faArrowRightLong} className="my-auto w-4 text-gray-800 dark:text-olympus-50 text-right" /></div></div>
            <div className="flex gap-3 p-2 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-white/10 rounded-sm content-center">{/*<FontAwesomeIcon icon={faFileImport} className="my-auto w-4 text-gray-800 dark:text-[#435367]" />*/}Import from file<div className="flex items-center ml-auto"><FontAwesomeIcon icon={faArrowRightLong} className="my-auto w-4 text-gray-800 dark:text-olympus-50 text-right" /></div></div>
            <div className="flex gap-3 p-2 cursor-pointer select-none hover:bg-gray-900/10 dark:hover:bg-white/10 rounded-sm content-center">{/*<FontAwesomeIcon icon={faFileImport} className="my-auto w-4 text-gray-800 dark:text-[#435367]" />*/}Close Olympus<div className="flex items-center ml-auto"><FontAwesomeIcon icon={faArrowRightLong} className="my-auto w-4 text-gray-800 dark:text-olympus-50 text-right" /></div></div>
        </div>
    </Menu>
}
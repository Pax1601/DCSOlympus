import { faArrowLeft, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

export function Menu(props: {
	title: string,
	open: boolean,
	onClose: () => void,
	onBack?: () => void,
	showBackButton?: boolean,
	children?: JSX.Element | JSX.Element[],
}) {
	return <div data-open={props.open} className="w-[430px] absolute top-[62px] left-16 z-ui-0 h-screen overflow-y-auto transition-transform data-[open='false']:-translate-x-full bg-gray-200 dark:bg-olympus-700/95 backdrop-blur-lg" tabIndex={-1}>
		<h5 className="w-full inline-flex items-center py-3 pb-2 px-5 shadow-lg font-semibold text-gray-800 dark:text-gray-400">
			{props.showBackButton && <FontAwesomeIcon onClick={props.onBack ?? (() => { })} icon={faArrowLeft} className="mr-1 cursor-pointer p-2 rounded-md dark:hover:bg-gray-700  dark:text-gray-500 dark:hover:text-white"/>} {props.title}
			<FontAwesomeIcon onClick={props.onClose} icon={faClose} className="flex text-lg items-center cursor-pointer justify-center ml-auto p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-white dark:text-gray-500 "/>
		</h5>
		{props.children}
	</div>
}
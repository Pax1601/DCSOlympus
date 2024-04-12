import React from "react";

export function OlToggle(props: {
	toggled: boolean | undefined,
	onClick: () => void
}) {
	return <div className="inline-flex items-center cursor-pointer" onClick={props.onClick}>
		<button className="sr-only peer" />
		<div data-flash={props.toggled === undefined} data-toggled={props.toggled ?? false} className={"relative w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 " +
		"dark:peer-focus:ring-blue-800 rounded-full peer " + 
		" after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 " +
		"after:w-6 after:transition-all dark:border-gray-600 " +
		"data-[toggled='true']:after:translate-x-full rtl:data-[toggled='true']:after:-translate-x-full data-[toggled='true']:after:border-white " + 
		"data-[toggled='false']:bg-gray-500 dark:data-[toggled='true']:bg-blue-500 data-[flash='true']:after:animate-pulse"}></div>
	</div>
}
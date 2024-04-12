import React from "react";
import { Coalition } from "../../types/types";

export function OlCoalitionToggle(props: {
	coalition: Coalition | undefined,
	onClick: () => void
}) {
	return <div className="inline-flex items-center cursor-pointer" onClick={props.onClick}>
		<button className="sr-only peer" />
		<div data-flash={props.coalition === undefined} data-coalition={props.coalition ?? 'blue'} className={"relative w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 " +
		"dark:peer-focus:ring-blue-800 rounded-full peer " + 
		" after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 " +
		"after:w-6 after:transition-all dark:border-gray-600 " +
		"data-[coalition='neutral']:after:translate-x-[50%] rtl:data-[coalition='neutral']:after:-translate-x-[50%] data-[coalition='neutral']:after:border-white " + 
		"data-[coalition='red']:after:translate-x-full rtl:data-[coalition='red']:after:-translate-x-full data-[coalition='red']:after:border-white " + 
		" data-[coalition='blue']:bg-blue-600 data-[coalition='neutral']:bg-gray-400 data-[coalition='red']:bg-red-500"}>
		</div>
		<span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300 data-[flash='true']:after:animate-pulse">
			{props.coalition? `Coalition (${props.coalition[0].toLocaleUpperCase() + props.coalition.substring(1)})`: "Different values"}
		</span>
	</div>
}
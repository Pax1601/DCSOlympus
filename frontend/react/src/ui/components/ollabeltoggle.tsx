import React from "react";

export function OlLabelToggle(props: {
    toggled: boolean | undefined,
    leftLabel: string,
    rightLabel: string,
    onClick: () => void
}) {
    return <button onClick={props.onClick} className="border dark:border-gray-600 relative text-sm flex flex-row flex-none my-auto contents-center justify-between w-[120px] h-10 border dark:border-transparent dark:bg-gray-700 rounded-md py-[5px] px-1 select-none cursor-pointer focus:ring-2 focus:outline-none focus:ring-blue-300 dark:hover:bg-gray-600 dark:focus:ring-blue-800">
        <span data-flash={props.toggled === undefined} data-toggled={props.toggled ?? false} className="data-[flash='true']:animate-pulse absolute my-auto h-[28px] w-[54px] bg-blue-500 rounded-md data-[toggled='true']:translate-x-14 transition-transform"></span>
        <span data-active={!(props.toggled ?? false)} className="my-auto dark:data-[active='true']:text-white font-normal dark:data-[active='false']:text-gray-400 dark:data-[active='false']:text-gray-400 pl-3 z-ui-2 transition-colors">{props.leftLabel}</span>
        <span data-active={props.toggled ?? false} className="my-auto dark:data-[active='true']:text-white font-normal dark:data-[active='false']:text-gray-400 pr-3.5 z-ui-2 transition-colors">{props.rightLabel}</span>
    </button>
}
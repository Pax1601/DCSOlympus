import React, { useState } from "react";

export function OlLabelToggle(props) {
    var [toggled, setToggled] = useState(false);

    return <button onClick={() => {setToggled(!toggled)}} className=" relative flex flex-row flex-none my-auto contents-center justify-between w-32 h-10 border-[1px] dark:border-transparent dark:bg-[#2A3949] rounded-lg py-[5px] px-1 select-none cursor-pointer focus:ring-2 focus:outline-none focus:ring-blue-300 dark:hover:bg-gray-800 dark:focus:ring-blue-800">
        <span data-toggled={toggled} className="absolute my-auto h-[28px] w-[54px] bg-blue-500 rounded-md data-[toggled='true']:translate-x-16 transition-transform"></span>
        <span data-active={!toggled} className="my-auto dark:data-[active='true']:text-white font-normal dark:data-[active='false']:text-gray-400 pl-3 z-ui-2 transition-colors">{props.leftLabel}</span>
        <span data-active={toggled} className="my-auto dark:data-[active='true']:text-white font-normal dark:data-[active='false']:text-gray-400 pr-3 z-ui-2 transition-colors">{props.rightLabel}</span>
    </button>
}
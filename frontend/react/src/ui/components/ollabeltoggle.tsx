import React, { useState } from "react";

export function OlLabelToggle(props) {
    var [toggled, setToggled] = useState(false);

    return <div onClick={() => {setToggled(!toggled)}} className="relative flex flex-row contents-center justify-between w-32 h-10 dark:bg-gray-700 rounded-md py-1 px-1 select-none cursor-pointer">
        <span data-toggled={toggled} className="absolute my-auto h-8 w-14 bg-blue-500 rounded-md data-[toggled='true']:translate-x-16 transition-transform"></span>
        <span data-active={!toggled} className="my-auto  dark:data-[active='true']:text-white dark:data-[active='false']:text-gray-400 text-thin pl-3 z-ui-2 transition-colors">MSL</span>
        <span data-active={toggled} className="my-auto dark:data-[active='true']:text-white  dark:data-[active='false']:text-gray-400 text-thin pr-3 z-ui-2 transition-colors">AGL</span>
    </div>
}
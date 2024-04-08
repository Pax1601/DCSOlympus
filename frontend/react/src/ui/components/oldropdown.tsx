
import React, { useId, useState } from "react";
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

library.add(faChevronDown, faChevronUp);

export function OlDropdown(props) {
    var [value, setValue] = useState(props.items[0] ?? "N/A" )
    const buttonId = useId();
    const dropdownId = useId()
    
    return <div>
        <button id={buttonId} data-dropdown-toggle={dropdownId} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center border-[1px] dark:border-gray-600 dark:text-gray-400 dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-blue-800" type="button"><FontAwesomeIcon icon={props.leftIcon} className="mr-3" />{value}<svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
        </svg>
        </button>

        <div id={dropdownId} className="z-ui hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
            <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby={buttonId}>
                {props.items.map((item) => {
                    return <li>
                        <a href="#" onClick={() => setValue(item)} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{item}</a>
                    </li>
                })}
            </ul>
        </div>
    </div>
}

import React, { useId, useState, useEffect, useRef } from "react";
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

library.add(faChevronDown, faChevronUp);

export function OlTextDropdown(props) {
    var [value, setValue] = useState(props.items[0] ?? "N/A")
    const buttonId = useId();
    const dropdownId = useId()

    return <div>
        <button id={buttonId} data-dropdown-toggle={dropdownId} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center border-[1px] dark:border-gray-600 dark:text-gray-400 dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-blue-800" type="button"><FontAwesomeIcon icon={props.leftIcon} className="mr-3" />{value}<svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
        </svg>
        </button>

        <div id={dropdownId} className="z-ui-2 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
            <div className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby={buttonId}>
                {props.items.map((item) => {
                    return <OlDropdownItem onClick={() => setValue(item)}>
                        {item}
                    </OlDropdownItem>
                })}
            </div>
        </div>
    </div>
}

export function OlElementDropdown(props) {
    var [open, setOpen] = useState(false);
    var contentRef = useRef(null);
    var buttonRef = useRef(null);

    function setPosition(content: HTMLDivElement, button: HTMLButtonElement) {
        content.style.left = `0px`;
        content.style.top = `0px`;

        var [cxl, cyt, cxr, cyb, cw, ch] = [content.getBoundingClientRect().x, content.getBoundingClientRect().y, content.getBoundingClientRect().x + content.clientWidth, content.getBoundingClientRect().y + content.clientHeight, content.clientWidth, content.clientHeight];
        var [bxl, byt, bxr, byb, bbw, bh] = [button.getBoundingClientRect().x, button.getBoundingClientRect().y, button.getBoundingClientRect().x + button.clientWidth, button.getBoundingClientRect().y + button.clientHeight, button.clientWidth, button.clientHeight];
        
        var cxc = (cxl + cxr) / 2;
        var bxc = (bxl + bxr) / 2;
        
        var offsetX = bxc - cxc;
        var offsetY = byb - cyt;

        cxl += offsetX;
        cxr += offsetX;

        if (cxl < 0)
            offsetX -= cxl;
        if (cxr > window.innerWidth)
            offsetX -= (cxr - window.innerWidth) 

        content.style.left = `${offsetX}px`
        content.style.top = `${offsetY + 5}px`
    }

    useEffect(() => {
        if (contentRef.current && buttonRef.current) {
            const content = contentRef.current as HTMLDivElement;
            const button = buttonRef.current as HTMLButtonElement;

            setPosition(content, button);
        }
    })
    
    return <div className="relative">
        <button ref={buttonRef} onClick={() => {setOpen(!open)}} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center border-[1px] dark:border-gray-600 dark:text-gray-400 dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-blue-800" type="button"><FontAwesomeIcon icon={props.leftIcon} className="mr-3" />{props.label}<svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
        </svg>
        </button>

        <div ref={contentRef} data-open={open} className="absolute z-ui-2 w-fit data-[open='false']:hidden bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700">
            <div className="py-2 text-sm text-gray-700 dark:text-gray-200 w-fit">
                {props.children}
            </div>
        </div>
    </div>
}

export function OlDropdownItem(props) {
    return <div onClick={props.onClick ?? (() => { })} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white flex flex-row content-center gap-2">
        {props.children}
    </div>
}
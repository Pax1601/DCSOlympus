
import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function OlDropdown(props) {
    var [open, setOpen] = useState(false);
    var contentRef = useRef(null);
    var buttonRef = useRef(null);

    function setPosition(content: HTMLDivElement, button: HTMLButtonElement) {
        /* Reset the position of the content */
        content.style.left = "0px";
        content.style.top = "0px";
        content.style.height = "";

        /* Get the position and size of the button and the content elements */
        var [cxl, cyt, cxr, cyb, cw, ch] = [content.getBoundingClientRect().x, content.getBoundingClientRect().y, content.getBoundingClientRect().x + content.clientWidth, content.getBoundingClientRect().y + content.clientHeight, content.clientWidth, content.clientHeight];
        var [bxl, byt, bxr, byb, bbw, bh] = [button.getBoundingClientRect().x, button.getBoundingClientRect().y, button.getBoundingClientRect().x + button.clientWidth, button.getBoundingClientRect().y + button.clientHeight, button.clientWidth, button.clientHeight];

        /* Limit the maximum height */
        if (ch > 400) {
            ch = 400;
            content.style.height = `${ch}px`;
        }

        /* Compute the horizontal position of the center of the button and the content */
        var cxc = (cxl + cxr) / 2;
        var bxc = (bxl + bxr) / 2;

        /* Compute the x and y offsets needed to align the button and element horizontally, and to put the content below the button */
        var offsetX = bxc - cxc;
        var offsetY = byb - cyt + 8;

        /* Compute the new position of the left and right margins of the content */
        cxl += offsetX;
        cxr += offsetX;
        cyb += offsetY;

        /* Try and move the content so it is inside the screen */
        if (cxl < 0)
            offsetX -= cxl;
        if (cxr > window.innerWidth)
            offsetX -= (cxr - window.innerWidth)
        if (cyb > window.innerHeight)
            offsetY = -ch - 8;

        /* Apply the offset */
        content.style.left = `${offsetX}px`
        content.style.top = `${offsetY}px`
    }

    useEffect(() => {
        if (contentRef.current && buttonRef.current) {
            const content = contentRef.current as HTMLDivElement;
            const button = buttonRef.current as HTMLButtonElement;

            setPosition(content, button);

            /* Register click events to automatically close the dropdown when clicked anywhere outside of it */
            document.addEventListener('click', function (event) {
                const target = event.target;
                if (target && /*!content.contains(target as HTMLElement) &&*/ !button.contains(target as HTMLElement)) {
                    setOpen(false);
                }
            });
        }
    })

    return <div className={(props.className ?? "") + " relative"}>
        <button ref={buttonRef} onClick={() => { setOpen(!open) }} className={"w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center justify-between border-[1px] dark:border-gray-600 dark:text-gray-100 dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-blue-800"} type="button">
            {props.leftIcon && <FontAwesomeIcon icon={props.leftIcon} className="mr-3" />}
            <span className="text-nowrap text-ellipsis overflow-hidden">
                {props.label}
            </span>
            <svg className="flex-none w-2.5 h-2.5 ms-3 data-[open='true']:-scale-y-100 transition-transform ml-auto" data-open={open} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
            </svg>
        </button>

        <div ref={contentRef} data-open={open} className="absolute z-ui-2 w-full p-2 data-[open='false']:hidden bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 overflow-y-scroll">
            <div className="text-sm text-gray-700 dark:text-gray-200 w-full h-fit">
                {props.children}
            </div>
        </div>
    </div>
}

/* Conveniency Component for dropdown elements */
export function OlDropdownItem(props) {
    return <button onClick={props.onClick ?? (() => { })} className={(props.className ?? "") + " px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white flex flex-row content-center rounded-md select-none cursor-pointer"}>
        {props.children}
    </button>
}
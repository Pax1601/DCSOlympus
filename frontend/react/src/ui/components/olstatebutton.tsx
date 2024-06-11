import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faExternalLink, faLock, faLockOpen, faUnlock, faUnlockAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useRef, useState } from "react"
import { OlTooltip } from "./oltooltip";

export function OlStateButton(props: {
    className?: string,
    checked: boolean,
    icon: IconProp,
    tooltip: string,
    onClick: () => void
}) {
    var [hover, setHover] = useState(false);
    var buttonRef = useRef(null);

    const className = (props.className ?? '') + ` h-[40px] w-[40px] flex-none font-medium rounded-md text-lg dark:bg-olympus-600 dark:hover:bg-olympus-300 dark:data-[checked='true']:bg-blue-500 dark:data-[checked='true']:text-white dark:text-gray-300 dark:border-gray-600 `;

    return <><button ref={buttonRef} onClick={props.onClick} data-checked={props.checked} type="button" className={className} onMouseEnter={() => { setHover(true) }} onMouseLeave={() => { setHover(false) }}>
        <FontAwesomeIcon icon={props.icon} />
    </button>
        {hover && <OlTooltip buttonRef={buttonRef} content={props.tooltip} />}
    </>
}

export function OlRoundStateButton(props: {
    className?: string,
    checked: boolean,
    icon: IconProp,
    tooltip: string,
    onClick: () => void
}) {
    var [hover, setHover] = useState(false);
    var buttonRef = useRef(null);

    const className = (props.className ?? '') + ` h-8 w-8 flex-none m-auto border-2 border-gray-900 font-medium rounded-full text-sm dark:bg-[transparent] dark:data-[checked='true']:bg-white dark:text-gray-400 dark:data-[checked='true']:text-gray-900 dark:data-[checked='true']:border-white dark:border-gray-400 dark:data-[checked='true']:hover:bg-gray-200 dark:data-[checked='true']:hover:border-gray-200 dark:hover:bg-gray-800`;

    return <><button ref={buttonRef} onClick={props.onClick} data-checked={props.checked} type="button" className={className} onMouseEnter={() => { setHover(true) }} onMouseLeave={() => { setHover(false) }}>
        <FontAwesomeIcon className="pt-[3px]" icon={props.icon} />
    </button>
    { hover && <OlTooltip buttonRef={buttonRef} content={props.tooltip} /> }
    </>
}

export function OlLockStateButton(props: {
    className?: string,
    checked: boolean,
    tooltip: string,
    onClick: () => void
}) {
    var [hover, setHover] = useState(false);
    var buttonRef = useRef(null);

    const className = (props.className ?? '') + ` h-8 w-8 flex-none m-auto border-gray-900 font-medium rounded-full text-sm dark:bg-red-500 dark:data-[checked='true']:bg-green-500 dark:text-olympus-900 dark:data-[checked='true']:text-green-900 dark:data-[checked='true']:hover:bg-green-400 dark:hover:bg-red-400`;

    return <><button ref={buttonRef} onClick={props.onClick} data-checked={props.checked} type="button" className={className} onMouseEnter={() => { setHover(true) }} onMouseLeave={() => { setHover(false) }}>
        <FontAwesomeIcon className="pt-[3px]" icon={props.checked == true ? faUnlockAlt : faLock} />
    </button>
    { hover && <OlTooltip buttonRef={buttonRef} content={props.tooltip} /> }
    </>
}
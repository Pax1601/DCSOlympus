import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faLock, faLockOpen, faUnlock, faUnlockAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React from "react"

export function OlStateButton(props: {
    className?: string,
    checked: boolean,
    icon: IconProp,
    onClick: () => void
}) {
    const className = (props.className ?? '') + ` h-[40px] w-[40px] flex-none font-medium rounded-md text-md dark:bg-gray-700 dark:hover:bg-gray-600 dark:data-[checked='true']:bg-blue-500 dark:text-white dark:border-gray-600 `;

    return <button onClick={props.onClick} data-checked={props.checked} type="button" className={className}>
        <FontAwesomeIcon icon={props.icon} />
    </button>
}

export function OlRoundStateButton(props: {
    className?: string,
    checked: boolean,
    icon: IconProp,
    onClick: () => void
}) {
    const className = (props.className ?? '') + ` h-8 w-8 flex-none m-auto border-2 border-gray-900 font-medium rounded-full text-sm dark:bg-[transparent] dark:data-[checked='true']:bg-white dark:text-gray-400 dark:data-[checked='true']:text-gray-900 dark:data-[checked='true']:border-white dark:border-gray-400 dark:data-[checked='true']:hover:bg-gray-200 dark:data-[checked='true']:hover:border-gray-200 dark:hover:bg-gray-800`;

    return <button onClick={props.onClick} data-checked={props.checked} type="button" className={className}>
        <FontAwesomeIcon className="pt-[3px]" icon={props.icon} />
    </button>
}

export function OlLockStateButton(props: {
    className?: string,
    checked: boolean,
    onClick: () => void
}) {
    const className = (props.className ?? '') + ` h-8 w-8 flex-none m-auto border-gray-900 font-medium rounded-full text-sm dark:bg-red-500 dark:data-[checked='true']:bg-green-500 dark:text-olympus-900 dark:data-[checked='true']:text-green-900 dark:data-[checked='true']:hover:bg-green-400 dark:hover:bg-red-400`;

    return <button onClick={props.onClick} data-checked={props.checked} type="button" className={className}>
        <FontAwesomeIcon className="pt-[3px]" icon={props.checked==true ? faUnlockAlt:faLock} />
    </button>
}
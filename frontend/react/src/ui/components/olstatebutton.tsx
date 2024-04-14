import { IconProp } from "@fortawesome/fontawesome-svg-core";
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
    const className = (props.className ?? '') + ` h-8 w-8 flex-none m-auto border border-gray-900 font-medium rounded-full text-sm dark:bg-[transparent] dark:data-[checked='true']:bg-white dark:text-white dark:data-[checked='true']:text-gray-900 dark:border-gray-600 `;

    return <button onClick={props.onClick} data-checked={props.checked} type="button" className={className}>
        <FontAwesomeIcon icon={props.icon} />
    </button>
}
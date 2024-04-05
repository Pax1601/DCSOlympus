import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React from "react"

export function OlStateButton(props) {
    return <button {...props} type="button" className="h-[40px] w-[40px] m-auto text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">
        <FontAwesomeIcon icon={props.icon} />
    </button>
}
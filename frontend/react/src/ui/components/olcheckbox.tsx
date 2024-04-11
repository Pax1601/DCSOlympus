import React, { ChangeEvent } from "react";

export function OlCheckbox(props: {
    checked: boolean,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
}) {
    return <input onChange={props.onChange}
        type="checkbox"
        checked={props.checked}
        value=""
        className="w-4 h-4 my-auto text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
    />
}
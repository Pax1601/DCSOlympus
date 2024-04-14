import React, {ChangeEvent, useEffect, useId} from "react";

export function OlNumberInput(props: {
    value: number,
    min: number,
    max: number,
    onDecrease: () => void,
    onIncrease: () => void,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
}) {
    return <div className="w-fit">
        <div className="relative flex items-center max-w-[8rem]">
            <button type="button" onClick={props.onDecrease} className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-10 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none">
                <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16"/>
                </svg>
            </button>
            <input type="text" onChange={props.onChange} min={props.min} max={props.max} className="bg-gray-50 border border-gray-300 h-10 text-center text-gray-900 text-sm font-bold focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" value={props.value} />
            <button type="button" onClick={props.onIncrease}  className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-10 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none">
                <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16"/>
                </svg>
            </button>
        </div>
    </div>
}
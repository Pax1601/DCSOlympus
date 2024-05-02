import React from "react";
import { faSkull, faCamera, faFlag, faLink, faUnlink, faAngleDoubleRight, faExclamationCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Error message callout, only to be used for error messages
export function ErrorCallout(props: {
    title?: string,
    description?: string
}) {
    return <div className="flex flex-row gap-2 w-fit bg-gray-300 dark:bg-gray-800 p-4 rounded-md border-[1px] border-red-800 text-red-700 dark:text-red-500 w-full">
        {props.title && (<FontAwesomeIcon className="mt-1" icon={faExclamationCircle}></FontAwesomeIcon>)}
        <div className="flex flex-col font-bold text-pretty content-center items-start gap-2">
            {props.title}
            <div className="flex text-xs font-medium whitespace-pre-line">
                {props.description}
            </div>
        </div>
    </div>
}

// General information callout for something that is just nice to know
export function InfoCallout(props: {
    title?: string,
    description?: string
}) {
    return <div className="flex flex-row gap-2 w-fit bg-gray-300 dark:bg-gray-800 p-4 rounded-md border-[1px] border-blue-800 text-blue-400 dark:text-blue-400 w-full">
        {props.title && (<FontAwesomeIcon className="mt-1" icon={faInfoCircle}></FontAwesomeIcon>)}
        <div className="flex flex-col font-medium text-pretty content-center items-start gap-2">
            {props.title}
            {props.description && (<div className="flex text-xs font-medium whitespace-pre-line">
                {props.description}
            </div>)}
        </div>
    </div>
}

// Used for the "You are playing as BLUE/RED Commander" callouts, only on the login page. Accepted values for coalition are 'blue' and 'red'.
export function CommandCallout(props: {
    coalition?: string,
}) {
    return <div className="flex flex-row gap-2 w-fit bg-gray-300 dark:bg-gray-800 p-4 rounded-md border-[1px] border-gray-700 text-gray-400 dark:text-gray-400 w-full">
        <FontAwesomeIcon className="mt-1" icon={faAngleDoubleRight}></FontAwesomeIcon>
        <div className="font-medium text-pretty content-center items-start gap-2 whitespace-break-spaces">
            You are playing as 
            {props.coalition=='blue' ? (
                <div className="inline-block font-bold text-blue-500"> BLUE COMMANDER </div>
            ) : (
                <div className="inline-block font-bold text-red-500"> RED COMMANDER </div>
            )}
            
            
        </div>
    </div>
}

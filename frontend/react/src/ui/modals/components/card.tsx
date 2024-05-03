import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faCheckCircle, faExternalLink, faLink, faUnlink } from '@fortawesome/free-solid-svg-icons'

export function Card(props: {
	children?: JSX.Element | JSX.Element[],
    className?: string
}) {
    return <div className={props.className + " group flex flex-col gap-3 border-[1px] border-black/10 max-h-80 w-full max-w-64 max-lg:max-w-[320px] dark:hover:bg-olympus-300 content-start rounded-md p-4 drop-shadow-md dark:bg-olympus-400 text-black dark:text-white text-pretty cursor-pointer"}>
        {props.children}
        <div className='flex flex-grow justify-end items-end text-black dark:text-gray-500 pr-2'><FontAwesomeIcon className="group-hover:translate-x-2 transition-transform" icon={faArrowRight} /></div>
    </div>
}
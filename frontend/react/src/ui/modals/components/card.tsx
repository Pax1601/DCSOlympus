import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faCheckCircle, faExternalLink, faLink, faUnlink } from '@fortawesome/free-solid-svg-icons'

export function Card(props: {
	children?: JSX.Element | JSX.Element[],
    className?: string
}) {
    return <div className={props.className + "flex flex-col gap-3 max-h-80 w-full max-w-64 max-lg:max-w-[100%] dark:hover:bg-olympus-300 content-start rounded-md p-5 drop-shadow dark:bg-olympus-500 text-black dark:text-white text-pretty cursor-pointer"}>
        {props.children}
        <div className='flex flex-grow justify-end items-end text-black dark:text-gray-500'><FontAwesomeIcon className="" icon={faArrowRight} /></div>
    </div>
}
import React, { useId, useEffect, useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowCircleDown } from "@fortawesome/free-solid-svg-icons";

export function OlAccordion(props) {
	var [open, setOpen] = useState(false);
	var [scrolledUp, setScrolledUp] = useState(true);
	var [scrolledDown, setScrolledDown] = useState(false);

	var contentRef = useRef(null);

	useEffect(() => {
		contentRef.current && (contentRef.current as HTMLElement).children[0]?.addEventListener('scroll', (e: any) => {
			if (e.target.clientHeight < e.target.scrollHeight) {
				setScrolledDown(e.target.scrollTop === (e.target.scrollHeight - e.target.offsetHeight));
				setScrolledUp(e.target.scrollTop === 0);
			}
		})
	})

	return <div className="bg-white dark:bg-transparent text-gray-900 dark:text-white">
		<h3>
			<button type="button" onClick={() => setOpen(!open)} className="flex items-center justify-between w-full py-2 font-medium rtl:text-right text-gray-700 border-gray-200 dark:border-gray-700 dark:text-gray-300 gap-3">
				<span>{props.title}</span>
				<svg data-open={open} className="w-3 h-3 -rotate-180 data-[open='false']:-rotate-90 shrink-0 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
					<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
				</svg>
			</button>
		</h3>
		<div className={open? "": "hidden"}>
			{props.showArrows && <div className="rotate-180"> {!scrolledUp && <FontAwesomeIcon icon={faArrowCircleDown} className="text-white animate-bounce opacity-20 absolute w-full"/>}</div>}
			<div ref={contentRef} className="py-2 border-gray-200 dark:border-gray-700">
				{props.children}
			</div>
			{props.showArrows && <div>{!scrolledDown && <FontAwesomeIcon icon={faArrowCircleDown} className="text-white animate-bounce opacity-20 absolute w-full"/>}</div>}
		</div>
	</div>
}
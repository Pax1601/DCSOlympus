import React, { useId, useEffect, useRef, useState } from "react"

import 'flowbite';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowCircleDown, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

export function OlAccordion(props) {
	var [scrolledUp, setScrolledUp] = useState(true);
	var [scrolledDown, setScrolledDown] = useState(false);

	const bodyId = useId();
	const accordionId = useId();
	const headingId = useId();

	var contentRef = useRef(null);

	useEffect(() => {
		contentRef.current && (contentRef.current as HTMLElement).children[0]?.addEventListener('scroll', (e: any) => {
			if (e.target.clientHeight < e.target.scrollHeight) {
				setScrolledDown(e.target.scrollTop === (e.target.scrollHeight - e.target.offsetHeight));
				setScrolledUp(e.target.scrollTop === 0);
			}
		})
	})

	return <div id={accordionId} data-accordion="collapse" data-active-classes="bg-white dark:bg-transparent text-gray-900 dark:text-white" data-inactive-classes="text-gray-500 dark:text-gray-400">
		<h3 id={headingId}>
			<button type="button" className="flex items-center justify-between w-full py-2 font-medium rtl:text-right text-gray-500 border-gray-200 dark:border-gray-700 dark:text-gray-300 gap-3" data-accordion-target={"#" + CSS.escape(bodyId)} aria-expanded="false" aria-controls={bodyId}>
				<span>{props.title}</span>
				<svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
					<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
				</svg>
			</button>
		</h3>
		<div id={bodyId} className="hidden relative" aria-labelledby={headingId}>
			<div className="rotate-180"> {!scrolledUp && <FontAwesomeIcon icon={faArrowCircleDown} className="text-white animate-bounce opacity-20 absolute w-full"/>}</div>
			<div ref={contentRef} className="py-2 border-gray-200 dark:border-gray-700">
				{props.children}
			</div>
			<div>{!scrolledDown && <FontAwesomeIcon icon={faArrowCircleDown} className="text-white animate-bounce opacity-20 absolute w-full"/>}</div>
		</div>
	</div>
}
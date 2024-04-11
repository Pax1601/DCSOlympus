import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

export function Menu(props) {
   return <div data-open={props.open} className="w-[430px] absolute top-[62px] left-16 z-ui-0 h-screen overflow-y-auto transition-transform data-[open='false']:-translate-x-full bg-gray-200 dark:bg-gray-800" tabIndex={-1}>
      <h5 className="w-full inline-flex items-center pb-3 p-4 shadow-lg dark:border-gray-700 text-base font-semibold text-gray-900 dark:text-gray-400">
         {props.showBackButton && <FontAwesomeIcon onClick={props.onBackCallback ?? (() => {})} icon={faArrowLeft} className="mr-4 cursor-pointer dark:hover:bg-gray-600 p-2 rounded-md"/>} {props.title}
      <button type="button" onClick={props.closeCallback} className="text-gray-900 dark:text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex items-center justify-center dark:hover:bg-gray-600 dark:hover:text-white ml-auto" >
         <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
         </svg>
      </button>
      </h5>
      {props.children}
   </div>
}
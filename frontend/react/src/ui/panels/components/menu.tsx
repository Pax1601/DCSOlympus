import { Drawer, DrawerInterface } from "flowbite";
import React, { useEffect, useId, useRef } from "react";

export function Menu(props) {
   const ref = useRef(null);
   const labelId = useId();

   useEffect(() => {
      const drawer: DrawerInterface = new Drawer(ref.current, { backdrop: false });
      props.open ? drawer.show() : drawer.hide();
   })

   return <div ref={ref} className="w-[430px] absolute top-[80px] left-0 z-ui h-screen p-4 overflow-y-auto transition-transform -translate-x-full bg-white dark:bg-gray-800" tabIndex={-1} aria-labelledby={labelId}>
      <h5 id={labelId} className="w-full inline-flex items-center pb-3 mb-4 border-b-2 dark:border-gray-700 text-base font-semibold text-gray-500 dark:text-gray-400">
         {props.title}
      </h5>
      <button type="button" onClick={props.closeCallback} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 absolute top-2.5 end-2.5 flex items-center justify-center dark:hover:bg-gray-600 dark:hover:text-white" >
         <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
         </svg>
         <span className="sr-only">Close menu</span>
      </button>
      {props.children}

   </div>
}
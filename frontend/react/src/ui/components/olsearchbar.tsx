import { faMultiply, faSearch } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, {useId, useRef} from "react"

export function OlSearchBar(props) {
    const searchId = useId();
    const inputRef = useRef(null);

    function resetSearch() {
        inputRef.current && ((inputRef.current as HTMLInputElement).value = '');
    }

    return <div {...props}>
        <label htmlFor={searchId} className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
        <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="dark:text-gray-400" />
            </div>
            <input type="search" ref={inputRef} id={searchId} className="block w-full p-3 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search" required />
            <FontAwesomeIcon icon={faMultiply} className="absolute cursor-pointer end-4 bottom-4 my-auto dark:text-gray-400 text-sm" onClick={resetSearch}/>
        </div>
    </div>
}
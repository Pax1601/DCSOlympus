import { faMultiply, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useId, useRef } from "react";

export function OlSearchBar(props: {
  onChange: (e: string) => void;
  text: string;
}) {
  const searchId = useId();
  const inputRef = useRef(null);

  function resetSearch() {
    inputRef.current && ((inputRef.current as HTMLInputElement).value = "");
    props.onChange("");
  }

  return (
    <div>
      <label
        htmlFor={searchId}
        className={`
          sr-only mb-2 text-sm font-medium text-gray-900
          dark:text-white
        `}
      >
        Search
      </label>
      <div className="relative">
        <div
          className={`
            pointer-events-none absolute inset-y-0 start-0 flex items-center
            ps-4
          `}
        >
          <FontAwesomeIcon icon={faSearch} className="dark:text-gray-400" />
        </div>
        <input
          type="search"
          ref={inputRef}
          id={searchId}
          onChange={(e) => props.onChange(e.currentTarget.value)}
          className={`
            mb-2 block w-full rounded-full border border-gray-300 bg-gray-50 p-3
            ps-10 text-sm text-gray-900
            dark:border-gray-600 dark:bg-gray-700 dark:text-white
            dark:placeholder-gray-400 dark:focus:border-blue-500
            dark:focus:ring-blue-500
            focus:border-blue-500 focus:ring-blue-500
          `}
          placeholder="Search"
          value={props.text}
          required
        />
        <FontAwesomeIcon
          icon={faMultiply}
          className={`
            absolute bottom-4 end-4 my-auto cursor-pointer text-sm
            dark:text-gray-400
          `}
          onClick={resetSearch}
        />
      </div>
    </div>
  );
}

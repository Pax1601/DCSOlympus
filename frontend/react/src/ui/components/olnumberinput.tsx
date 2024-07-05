import React, { ChangeEvent, useEffect, useId } from "react";

export function OlNumberInput(props: {
  value: number;
  min: number;
  max: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="min-w-32">
      <div className="relative flex max-w-[8rem] items-center">
        <button
          type="button"
          onClick={props.onDecrease}
          className={`
            h-10 rounded-s-lg bg-gray-100 p-3
            dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-blue-700
            focus:outline-none focus:ring-2 focus:ring-gray-100
            hover:bg-gray-200
          `}
        >
          <svg
            className={`
              h-3 w-3 text-gray-900
              dark:text-white
            `}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 18 2"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 1h16"
            />
          </svg>
        </button>
        <input
          type="text"
          onChange={props.onChange}
          min={props.min}
          max={props.max}
          className={`
            block h-10 w-full border-[2px] bg-gray-50 py-2.5 text-center text-sm
            text-gray-900
            dark:border-gray-700 dark:bg-olympus-600 dark:text-white
            dark:placeholder-gray-400 dark:focus:border-blue-700
            dark:focus:ring-blue-700
            focus:border-blue-700 focus:ring-blue-500
          `}
          value={props.value}
        />
        <button
          type="button"
          onClick={props.onIncrease}
          className={`
            h-10 rounded-e-lg bg-gray-100 p-3
            dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-blue-500
            focus:outline-none focus:ring-2 focus:ring-gray-100
            hover:bg-gray-200
          `}
        >
          <svg
            className={`
              h-3 w-3 text-gray-900
              dark:text-white
            `}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 18 18"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 1v16M1 9h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

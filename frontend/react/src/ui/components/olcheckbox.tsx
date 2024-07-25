import React, { ChangeEvent } from "react";

export function OlCheckbox(props: {
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      onChange={props.onChange}
      type="checkbox"
      checked={props.checked}
      value=""
      className={`
        my-auto h-4 w-4 cursor-pointer rounded border-gray-300 bg-gray-100
        text-blue-600
        dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800
        dark:focus:ring-blue-600
        focus:ring-2 focus:ring-blue-500
      `}
    />
  );
}

import React from "react";
import { UnitBlueprint } from "../../interfaces";
import { Coalition } from "../../types/types";

export function OlUnitSummary(props: {
  blueprint: UnitBlueprint;
  coalition: Coalition;
}) {
  return (
    <div
      data-coalition={props.coalition}
      className={`
        relative flex flex-col items-start gap-2 border-l-4 bg-white p-2 pb-4
        pt-4 shadow-lg
        dark:bg-olympus-200/30
        data-[coalition='blue']:border-blue-600
        data-[coalition='neutral']:border-gray-400
        data-[coalition='red']:border-red-500
      `}
    >
      <div className="flex flex-row content-center gap-2">
        <img
          className={`
            absolute right-5 top-0 h-full object-cover opacity-10 invert
          `}
          src={"images/units/" + props.blueprint.filename}
          alt=""
        />
        <div
          className={`
            my-auto ml-2 w-full font-semibold tracking-tight text-gray-900
            dark:text-white
          `}
        >
          {props.blueprint.label}
        </div>
      </div>
      <div
        className={`
													flex h-fit flex-col justify-between px-2 leading-normal
												`}
      >
        <p
          className={`
            mb-1 text-sm text-gray-700
            dark:text-gray-400
          `}
        >
          {props.blueprint.description}
        </p>
      </div>
      <div className="flex flex-row gap-1 px-2">
        {props.blueprint.abilities?.split(" ").map((tag) => {
          return (
            <div
              key={tag}
              className={`
                rounded-full bg-olympus-800 px-2 py-0.5 text-xs font-bold
                dark:text-olympus-50
              `}
            >
              {tag}
            </div>
          );
        })}

        <div
          className={`
            rounded-full bg-olympus-800 px-2 py-0.5 text-xs font-bold
            dark:text-olympus-50
          `}
        >
          {props.blueprint.era === "WW2"
            ? "WW2"
            : props.blueprint.era.split(" ").map((word) => {
                return word.charAt(0).toLocaleUpperCase();
              })}
        </div>
      </div>
    </div>
  );
}

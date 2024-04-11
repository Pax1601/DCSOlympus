import React from "react";
import { UnitBlueprint } from "../../interfaces";
import { Coalition } from "../../types/types";

export function OlUnitSummary(props: {
    blueprint: UnitBlueprint,
    coalition: Coalition
}) {
    return <div data-coalition={props.coalition} className="relative border-l-4 flex flex-col gap-2 p-2 pt-4 items-start shadow-lg bg-white hover:bg-gray-100  dark:bg-[#243141] dark:hover:bg-gray-700 data-[coalition='blue']:border-blue-600 data-[coalition='neutral']:border-gray-400 data-[coalition='red']:border-red-500">
            <div className="flex flex-row gap-2 content-center">
            <img className="object-cover h-8 ml-2 rounded-tl-md rotate-180 invert" src={"images/units/"+props.blueprint.filename} alt="" />  
            <div className="my-auto w-full font-bold tracking-tight text-gray-900 dark:text-white">{props.blueprint.label}</div>
            </div>
            <div className="flex flex-col justify-between px-2 leading-normal h-fit">
                <p className="font-normal text-gray-700 dark:text-gray-400">{props.blueprint.description}</p>
            </div>
            <div className="flex flex-row gap-2 p-2">
                {props.blueprint.abilities?.split(" ").map((tag) => {
                    return <div key={tag} className="bg-black bg-opacity-20 dark:text-gray-400 rounded-full px-2 py-0.5 text-xs">
                        {tag}
                    </div>
                })}
            
            <div className="bg-black bg-opacity-20 dark:text-gray-400 rounded-full px-2 py-0.5 text-xs">{props.blueprint.era === "WW2" ? "WW2" : props.blueprint.era.split(" ").map((word) => {
                return word.charAt(0).toLocaleUpperCase();
            })}</div>
            </div>
            
        </div>
}
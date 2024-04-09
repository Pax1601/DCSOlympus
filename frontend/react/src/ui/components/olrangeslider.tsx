import React, { useState } from "react";

export function OlRangeSlider(props) {
    return <input type="range"
        onChange={(ev) => { props.onChange(Number(ev.target?.value ?? props.value)) }}
        value={props.value}
        min={props.minValue ?? 0}
        max={props.maxValue ?? 100}
        step={props.step ?? 1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
}
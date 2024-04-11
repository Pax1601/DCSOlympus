import React, { useEffect, useRef } from "react";

export function OlRangeSlider(props) {
    var elementRef = useRef(null);

    useEffect(() => {
        if (elementRef.current) {
            const sliderEl = elementRef.current as HTMLInputElement;
            const tempSliderValue = Number(sliderEl.value);
            const progress = (tempSliderValue / Number(sliderEl.max)) * 100;
            sliderEl.style.background = `linear-gradient(to right, #3F83F8 ${progress}%, #4B5563 ${progress}%)`;
        }
    })

    return <input type="range"
        ref={elementRef}
        onChange={(ev) => { props.onChange(Number(ev.target?.value ?? props.value)) }}
        value={props.value}
        min={props.minValue ?? 0}
        max={props.maxValue ?? 100}
        step={props.step ?? 1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
}
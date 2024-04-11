import React, { ChangeEvent, useEffect, useRef } from "react";

export function OlRangeSlider(props: {
    value: number | undefined,
    min?: number,
    max?: number,
    step?: number,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
}) {
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
        onChange={props.onChange}
        value={props.value}
        min={props.min ?? 0}
        max={props.max ?? 100}
        step={props.step ?? 1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
}
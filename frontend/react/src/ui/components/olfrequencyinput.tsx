import React from "react";
import { OlNumberInput } from "./olnumberinput";

export function OlFrequencyInput(props: { value: number; className?: string; onChange: (value: number) => void }) {
  let frequency = props.value;

  return (
    <div className={`
      ${props.className}
      flex gap-2
    `}>
      <OlNumberInput
        min={0}
        max={400}
        onChange={(e) => {
          let newValue = Math.max(Math.min(Number(e.target.value), 400), 0) * 1000000;
          let decimalPart = frequency - Math.floor(frequency / 1000000) * 1000000;
          frequency = newValue + decimalPart;
          props.onChange(frequency);
        }}
        onDecrease={() => {
          frequency = Math.max(Math.min(Number(frequency - 1000000), 400000000), 1000000);
          props.onChange(frequency);
        }}
        onIncrease={() => {
          frequency = Math.max(Math.min(Number(frequency + 1000000), 400000000), 1000000);
          props.onChange(frequency);
        }}
        value={Math.floor(frequency / 1000000)}
        className="!min-w-28"
      ></OlNumberInput>
      <div className="my-auto">.</div>
      <OlNumberInput
        min={0}
        max={990}
        minLength={3}
        onChange={(e) => {
          let newValue = Math.max(Math.min(Number(e.target.value), 990), 0) * 1000;
          let integerPart = Math.floor(frequency / 1000000) * 1000000;
          frequency = newValue + integerPart;
          props.onChange(frequency);
        }}
        onDecrease={() => {
          frequency = Math.max(Math.min(Number(frequency - 25000), 400000000), 1000000);
          props.onChange(frequency);
        }}
        onIncrease={() => {
          frequency = Math.max(Math.min(Number(frequency + 25000), 400000000), 1000000);
          props.onChange(frequency);
        }}
        value={(frequency - Math.floor(frequency / 1000000) * 1000000) / 1000}
        className="!min-w-28"
      ></OlNumberInput>
    </div>
  );
}

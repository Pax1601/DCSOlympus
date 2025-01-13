import React, { useCallback, useEffect, useRef, useState } from "react";
import { Draggable } from "./draggable";
import { Unit } from "../../../unit/unit";

export function DraggableSilhouette(props: {
  position: { x: number; y: number };
  unit: Unit;
  zoom: number;
  scale: number;
  disabled: boolean;
  angle: number;
  onPositionChange: (position: { x: number; y: number }) => void;
  src?: string;
}) {
  return (
    <Draggable position={props.position} onPositionChange={props.onPositionChange} disabled={props.disabled}>
      <img
      data-disabled = {props.disabled}
        className={`
          align-center opacity-80 invert
          data-[disabled=false]:cursor-move
        `}
        src={props.src ?? `./images/units/${props.unit?.getBlueprint()?.filename}`}
        style={{
          maxWidth: `${Math.round((props.scale * (props.disabled ? 20 : (props.unit?.getBlueprint()?.length ?? 50))) / Math.min(3, props.disabled? 1: props.zoom))}px`,
          minWidth: `${Math.round((props.scale * (props.disabled ? 20 : (props.unit?.getBlueprint()?.length ?? 50))) / Math.min(3, props.disabled? 1: props.zoom))}px`,
          rotate: `${props.disabled? props.angle: 90}deg`,
        }}
      ></img>
    </Draggable>
  );
}

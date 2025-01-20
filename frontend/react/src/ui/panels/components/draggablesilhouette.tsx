import React, { useCallback, useEffect, useRef, useState } from "react";
import { Draggable } from "./draggable";
import { Unit } from "../../../unit/unit";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { nearestNiceNumber } from "../../../other/utils";

export function DraggableSilhouette(props: {
  position: { x: number; y: number; z: number };
  unit: Unit;
  zoom: number;
  scale: number;
  disabled: boolean;
  angle: number;
  showVerticalOffset: boolean;
  onPositionChange: (position: { x: number; y: number; z: number }) => void;
  src?: string;
}) {
  const imgHeight = Math.round((props.scale * (props.disabled ? 20 : (props.unit?.getBlueprint()?.length ?? 50))) / Math.min(3, props.disabled ? 1 : props.zoom));
  return (
    <Draggable position={props.position} onPositionChange={props.onPositionChange} disabled={props.disabled}>
      <img
        data-disabled={props.disabled}
        className={`
          align-center opacity-80 invert
          data-[disabled=false]:cursor-move
        `}
        src={props.src ?? `./images/units/${props.unit?.getBlueprint()?.filename}`}
        style={{
          maxWidth: `${imgHeight}px`,
          minWidth: `${imgHeight}px`,
          rotate: `${props.disabled ? props.angle : 90}deg`,
        }}
        onWheel={(e) => {
          e.stopPropagation();
          let delta = nearestNiceNumber(Math.max(1, 0.1 * Math.abs(props.position.z)));
          let newZ = props.position.z + (e.deltaY > 0 ? -delta : delta);
          newZ = Math.round(newZ / delta) * delta;
          props.onPositionChange({ x: props.position.x, y: props.position.y, z: newZ });
        }}
      />
      {props.showVerticalOffset ? (
        <div className={`absolute flex w-full justify-center text-gray-400`}
        style={{top: `calc(50% + ${imgHeight / 2}px)`}}>
          <div className="flex gap-1">
          {Math.round(props.position.z) > 0 ? (
            <FaArrowUp className={`my-auto text-xs`} />
          ) : Math.round(props.position.z) < 0 ? (
            <FaArrowDown className={`my-auto text-xs`} />
          ) : (
            <></>
          )}
          {Math.round(Math.abs(props.position.z))} <div>ft</div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </Draggable>
  );
}

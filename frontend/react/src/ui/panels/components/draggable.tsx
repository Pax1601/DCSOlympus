import React, { useCallback, useEffect, useRef, useState } from "react";

export function Draggable(props: {
  position: { x: number; y: number, z: number };
  children: JSX.Element | JSX.Element[];
  disabled: boolean;
  onPositionChange: (position: { x: number; y: number, z: number }) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [refPosition, setRefPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e) => {
      if (dragging) {
        e.stopPropagation();
        e.preventDefault();
        setRefPosition({ x: e.clientX, y: e.clientY });
        if (!props.disabled) props.onPositionChange({ x: props.position.x + e.clientX - refPosition.x, y: props.position.y + e.clientY - refPosition.y, z: props.position.z });
      }
    },
    [dragging, refPosition]
  );

  const handleMouseUp = useCallback(
    (e) => {
      if (dragging) {
        e.stopPropagation();
        e.preventDefault();
        setDragging(false);
      }
    },
    [dragging, refPosition]
  );

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`absolute translate-x-[-50%] translate-y-[-50%]`}
      style={{
        top: props.position.y,
        left: props.position.x,
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setRefPosition({ x: e.clientX, y: e.clientY });
        setDragging(true);
      }}
    >
      {props.children}
    </div>
  );
}

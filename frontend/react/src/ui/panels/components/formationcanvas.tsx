import React, { useCallback, useEffect, useRef, useState } from "react";
import { Unit } from "../../../unit/unit";
import { DraggableSilhouette } from "./draggablesilhouette";
import { FaCompressArrowsAlt, FaExclamationTriangle, FaExpand, FaExpandArrowsAlt } from "react-icons/fa";

const FT_TO_PX = 1;

export function FormationCanvas(props: {
  units: Unit[];
  unitPositions: { x: number; y: number }[];
  setUnitPositions: (positions: { x: number; y: number }[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [refPosition, setRefPosition] = useState({ x: 0, y: 0 });
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  /* Init references and hooks */
  const containerRef = useRef(null);

  let containerCenter = { x: 0, y: 0 };
  let containerSize = { width: 0, height: 0 };
  if (containerRef.current) {
    const containerDiv = containerRef.current as HTMLDivElement;
    containerCenter = {
      x: containerDiv.clientWidth / 2,
      y: containerDiv.clientHeight / 3,
    };
    containerSize = { width: containerDiv.clientWidth, height: containerDiv.clientHeight };
  }

  /* Handle mouse movement, for dragging of the scene */
  const handleMouseMove = useCallback(
    (e) => {
      if (dragging) {
        e.stopPropagation();
        e.preventDefault();
        setDragDelta({
          x: dragDelta.x + e.clientX - refPosition.x,
          y: dragDelta.y + e.clientY - refPosition.y,
        });
        setRefPosition({ x: e.clientX, y: e.clientY });
      }
    },
    [dragging, refPosition]
  );

  /* Handle mouse up, to stop dragging the scene */
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

  /* Register the dragging handlers */
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  let referenceDistance = 200 * zoom;
  if (referenceDistance < 250) referenceDistance = 100;
  else if (referenceDistance < 500) referenceDistance = 250;
  else if (referenceDistance < 1000) referenceDistance = 500;
  else if (referenceDistance < 3000) referenceDistance = 1000;
  else if (referenceDistance < 5280 * 2) referenceDistance = 5280;
  else referenceDistance = 5280 * 2;
  const referenceWidth = referenceDistance / zoom;

  return (
    <>
      <div className="flex w-fit gap-1 p-1">
        <button
          type="button"
          onDoubleClick={(e) => {
            e.stopPropagation();
          }}
          onClick={() => {
            props.setUnitPositions(
              props.unitPositions.map((position) => {
                return {
                  x: position.x * 1.1,
                  y: position.y * 1.1,
                };
              })
            );
          }}
          className={`
            rounded-lg p-2 text-md flex content-center justify-center gap-2
            bg-gray-600 font-medium text-white
            hover:bg-gray-700
          `}
        >
          <FaExpandArrowsAlt className="my-auto" /> <div> Loosen </div>
        </button>
        <button
          type="button"
          onDoubleClick={(e) => {
            e.stopPropagation();
          }}
          onClick={() => {
            props.setUnitPositions(
              props.unitPositions.map((position) => {
                return {
                  x: position.x * 0.9,
                  y: position.y * 0.9,
                };
              })
            );
          }}
          className={`
            rounded-lg p-2 text-md flex content-center justify-center gap-2
            bg-gray-600 font-medium text-white
            hover:bg-gray-700
          `}
        >
          <FaCompressArrowsAlt className="my-auto" /> <div>Tighten</div>
        </button>
      </div>

      <div
        data-dragging={dragging}
        className={`
          relative h-full w-full cursor-grab overflow-hidden rounded-md
          border-[1px] border-white/20 bg-white/10
          data-[dragging=true]:cursor-grabbing
        `}
        onWheel={(e) => {
          if (e.deltaY > 0) setZoom(Math.max(Math.min(zoom * 1.1, 100), 0.8));
          else setZoom(Math.max(Math.min(zoom * 0.9, 100), 0.8));
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setRefPosition({ x: e.clientX, y: e.clientY });
          setDragging(true);
        }}
        onDoubleClick={() => {
          setDragDelta({ x: 0, y: 0 });
          setZoom(1);
        }}
      >
        <div className={`h-full w-full`} ref={containerRef}>
          {props.units.map((unit, idx) => {
            let unitPosition = props.unitPositions[idx]
              ? {
                  x:
                    props.unitPositions[0].x +
                    (((props.unitPositions[idx].x - props.unitPositions[0].x) * 1) / zoom) * FT_TO_PX +
                    dragDelta.x +
                    containerCenter.x,
                  y:
                    props.unitPositions[0].y +
                    (((props.unitPositions[idx].y - props.unitPositions[0].y) * 1) / zoom) * FT_TO_PX +
                    dragDelta.y +
                    containerCenter.y,
                }
              : { x: 0, y: 0 };

            let disabled = false;
            let overflowX = null as null | string;
            let overflowY = null as null | string;
            if (unitPosition.x < 0) {
              disabled = true;
              unitPosition.x = 10;
              overflowX = "left";
            } else if (unitPosition.x > containerSize.width) {
              disabled = true;
              unitPosition.x = containerSize.width - 10;
              overflowX = "right";
            }

            if (unitPosition.y < 0) {
              disabled = true;
              unitPosition.y = 10;
              overflowY = "top";
            } else if (unitPosition.y > containerSize.height) {
              disabled = true;
              unitPosition.y = containerSize.height - 10;
              overflowY = "bottom";
            }

            let angle = 0;
            if (overflowX === "right") {
              if (overflowY === "top") angle = 45;
              else if (overflowY === "bottom") angle = 135;
              else angle = 90;
            } else if (overflowX === "left") {
              if (overflowY === "top") angle = 360 - 45;
              else if (overflowY === "bottom") angle = 360 - 135;
              else angle = 360 - 90;
            } else {
              if (overflowY === "top") angle = 0;
              else if (overflowY === "bottom") angle = 180;
              else angle = 0;
            }

            return (
              <DraggableSilhouette
                key={idx}
                zoom={zoom}
                position={unitPosition}
                unit={unit}
                scale={FT_TO_PX}
                disabled={disabled}
                onPositionChange={({ x, y }) => {
                  props.unitPositions[idx] = {
                    x: ((x - props.unitPositions[0].x - dragDelta.x - containerCenter.x) * zoom) / FT_TO_PX - props.unitPositions[0].x,
                    y: ((y - props.unitPositions[0].y - dragDelta.y - containerCenter.y) * zoom) / FT_TO_PX - props.unitPositions[0].y,
                  };
                  props.setUnitPositions([...props.unitPositions]);
                }}
                src={disabled ? `./images/others/caret.svg` : undefined}
                angle={angle}
              />
            );
          })}
        </div>
        {zoom > 3 && (
          <div className="absolute bottom-2 left-2 flex gap-2">
            <FaExclamationTriangle className={`text-xl text-yellow-400`} />
            <div className="text-white">Silhouettes not to scale!</div>
          </div>
        )}
        <div className="absolute left-0 top-2 m-[-0.75rem] h-0">
          <div
            className={`
              relative left-6 top-4 h-4 border-2 border-white
              border-t-transparent text-center text-white
            `}
            style={{
              width: `${referenceWidth}px`,
            }}
          >
            {referenceDistance === 5280 && <div className="translate-y-[-8px]">1 NM</div>}
            {referenceDistance === 5280 * 2 && (
              <div
                className={`translate-y-[-8px]`}
              >
                2 NM
              </div>
            )}
            {referenceDistance < 5280 && <div className="translate-y-[-8px]">{referenceDistance} ft</div>}
          </div>
        </div>
      </div>
    </>
  );
}

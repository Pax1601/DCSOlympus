import React, { useRef, useState } from "react";
import { Menu } from "./components/menu";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { useDrag } from "../libs/useDrag";
import { Unit } from "../../unit/unit";
import { OlRangeSlider } from "../components/olrangeslider";

export function FormationMenu(props: {
  open: boolean;
  onClose: () => void;
  leader: Unit | null;
  wingmen: Unit[] | null;
  children?: JSX.Element | JSX.Element[];
}) {
  const [formationType, setFormationType] = useState("echelon-lh");
  const [horizontalScale, setHorizontalScale] = useState(0);
  const [verticalScale, setVerticalScale] = useState(30);
  const [count, setCount] = useState(0);

  let units = Array(128).fill(null) as (Unit | null)[];
  units[0] = props.leader;
  props.wingmen?.forEach((unit, idx) => (units[idx + 1] = unit));

  const containerRef = useRef(null);
  const silhouetteReferences = units.map((unit) => useRef(null));
  const silhouetteHandles = units.map((unit, idx) => {
    let offset = computeFormationOffset(formationType, idx);
    let center = { x: 0, y: 0 };
    if (containerRef.current) {
      center.x = (containerRef.current as HTMLDivElement).getBoundingClientRect().width / 2;
      center.y = 150;
    }
    return useDrag({
      ref: silhouetteReferences[idx],
      initialPosition: { x: offset.z + center.x, y: -offset.x + center.y },
      count: count,
    });
  });

  let formationTypes = {
    "echelon-lh": "Echelon left",
    "echelon-rh": "Echelon right",
    "line-abreast-rh": "Line abreast right",
    "line-abreast-lh": "Line abreast left",
    trail: "Trail",
    front: "Front",
    diamond: "Diamond",
  };

  return (
    <Menu title="Formation menu" open={props.open} showBackButton={false} onClose={props.onClose}>
      <div className="flex h-full flex-col gap-4 p-4">
        <span className="text-white">Formation type presets</span>
        <OlDropdown label={formationTypes[formationType]}>
          {Object.keys(formationTypes).map((optionFormationType) => {
            return (
              <OlDropdownItem
                onClick={() => {
                  setCount(count + 1);
                  setFormationType(optionFormationType);
                }}
              >
                {formationTypes[optionFormationType]}
              </OlDropdownItem>
            );
          })}
        </OlDropdown>
        <div className="flex">
          <span>Parade</span>
          <OlRangeSlider
            value={horizontalScale}
            onChange={(ev) => {
              setHorizontalScale(Number(ev.target.value));
            }}
          />
          <span>Tactical</span>
        </div>
        <div className="flex">
          <span>Down</span>
          <OlRangeSlider
            value={verticalScale}
            onChange={(ev) => {
              setVerticalScale(Number(ev.target.value));
            }}
          />
          <span>Up</span>
        </div>
        <button
          type="button"
          onClick={() => {
            let center = { x: 0, y: 0 };

            if (containerRef.current) {
              center.x = (containerRef.current as HTMLDivElement).getBoundingClientRect().width / 2;
              center.y = 150;
            }

            units
              .filter((unit) => unit !== null)
              .forEach((unit, idx) => {
                if (units.length > 0 && units[0] !== null && idx != 0) {
                  const ID = units[0].ID;
                  const horizontalRatio = 1 + horizontalScale;
                  const verticalRatio = (verticalScale - 50) / 50;
                  const [dx, dz] = [
                    -(silhouetteHandles[idx].position.y - silhouetteHandles[0].position.y),
                    silhouetteHandles[idx].position.x - silhouetteHandles[0].position.x
                  ];
                  const distance = Math.sqrt(dx ** 2 + dz ** 2);
                  const offset = {
                    x: dx * horizontalRatio,
                    y: distance * verticalRatio,
                    z: dz * horizontalRatio,
                  };
                  unit.followUnit(ID, offset);
                }
              });
          }}
          className={`
            mb-2 me-2 rounded-lg bg-blue-700 px-5 py-2.5 text-md font-medium
            text-white
            dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
            focus:outline-none focus:ring-4 focus:ring-blue-300
            hover:bg-blue-800
          `}
        >
          Apply
        </button>
        <div
          className={`
            relative h-full w-full rounded-md border-[1px] border-white/20
            bg-white/10
          `}
          ref={containerRef}
        >
          <>
            {units.map((unit, idx) => {
              return (
                <div
                  key={`${count}-${idx}`}
                  className={`
                    absolute
                    ${unit ? "" : "hidden"}
                  `}
                  ref={silhouetteReferences[idx]}
                  style={{
                    top: silhouetteHandles[idx].position.y,
                    left: silhouetteHandles[idx].position.x,
                  }}
                  onMouseDown={silhouetteHandles[idx].handleMouseDown}
                >
                  <img
                    className={`
                      h-10 min-h-10 w-10 min-w-10 translate-x-[-50%]
                      translate-y-[-50%] rotate-90 opacity-80 invert
                    `}
                    src="public\images\units\general1.png"
                  ></img>
                </div>
              );
            })}
          </>
        </div>
      </div>
    </Menu>
  );
}

function computeFormationOffset(formation, idx) {
  let offset = { x: 0, y: 0, z: 0 };
  if (formation === "trail") {
    offset.x = -50 * idx;
    offset.y = -30 * idx;
    offset.z = 0;
  } else if (formation === "echelon-lh") {
    offset.x = -50 * idx;
    offset.y = -10 * idx;
    offset.z = -50 * idx;
  } else if (formation === "echelon-rh") {
    offset.x = -50 * idx;
    offset.y = -10 * idx;
    offset.z = 50 * idx;
  } else if (formation === "line-abreast-lh") {
    offset.x = 0;
    offset.y = 0;
    offset.z = -50 * idx;
  } else if (formation === "line-abreast-rh") {
    offset.x = 0;
    offset.y = 0;
    offset.z = 50 * idx;
  } else if (formation === "front") {
    offset.x = 100 * idx;
    offset.y = 0;
    offset.z = 0;
  } else if (formation === "diamond") {
    var xr = 0;
    var yr = 1;
    var zr = -1;
    var layer = 1;

    for (let i = 0; i < idx; i++) {
      var xl = xr * Math.cos(Math.PI / 4) - yr * Math.sin(Math.PI / 4);
      var yl = xr * Math.sin(Math.PI / 4) + yr * Math.cos(Math.PI / 4);
      offset = { x: -yl * 50, y: zr * 10, z: xl * 50 };
      if (yr == 0) {
        layer++;
        xr = 0;
        yr = layer;
        zr = -layer;
      } else {
        if (xr < layer) {
          xr++;
          zr--;
        } else {
          yr--;
          zr++;
        }
      }
    }
  }
  return offset;
}

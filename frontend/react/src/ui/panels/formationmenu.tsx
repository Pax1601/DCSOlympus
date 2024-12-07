import React, { useEffect, useRef, useState } from "react";
import { Menu } from "./components/menu";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { useDrag } from "../libs/useDrag";
import { Unit } from "../../unit/unit";
import { OlRangeSlider } from "../components/olrangeslider";
import { FormationCreationRequestEvent } from "../../events";

export function FormationMenu(props: {
  open: boolean;
  onClose: () => void;
  children?: JSX.Element | JSX.Element[];
}) {
  const [leader, setLeader] = useState(null as Unit | null)
  const [wingmen, setWingmen] = useState(null as Unit[] | null)

  /* The useDrag custom hook used to handle the dragging of the units requires that the number of hooks remains unchanged.
  The units array is therefore initialized to 128 units maximum. */
  let units = Array(128).fill(null) as (Unit | null)[];
  units[0] = leader;
  wingmen?.forEach((unit, idx) => {
    if (idx < units.length) units[idx + 1] = unit;
  });

  /* Init state variables */
  const [formationType, setFormationType] = useState("echelon-lh");
  const [horizontalScale, setHorizontalScale] = useState(0);
  const [verticalScale, setVerticalScale] = useState(30);
  const [offsets, setOffsets] = useState(
    units.map((unit, idx) => {
      return computeFormationOffset(formationType, idx);
    })
  );

  /* The count state is used to force the reset of the initial position of the silhouettes */
  // TODO it works but I don't like it, it feels like a hack
  const [count, setCount] = useState(0);

  /* Init references and hooks */
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const silhouetteReferences = units.map((_) => useRef(null));
  const silhouetteHandles = units.map((_, idx) => {
    /* Set the initial position of the unit to be centered in the drawing canvas, depending on the currently loaded formation */
    let offset = offsets[idx] ?? { x: 0, y: 0, z: 0 };
    let center = { x: 0, y: 0 };
    if (containerRef.current) {
      center.x = (containerRef.current as HTMLDivElement).getBoundingClientRect().width / 2;
      center.y = (containerRef.current as HTMLDivElement).getBoundingClientRect().height / 2;
    }
    return useDrag({
      ref: silhouetteReferences[idx],
      initialPosition: { x: offset.z + center.x, y: -offset.x + center.y },
      count: count,
    });
  });

  useEffect(() => {
    FormationCreationRequestEvent.on((leader, wingmen) => {
      setLeader(leader);
      setWingmen(wingmen);
    })
  })

  /* When the formation type is changed, reset the position to the center and the position of the silhouettes depending on the aircraft */
  useEffect(() => {
    if (scrollRef.current && containerRef.current) {
      const containerDiv = containerRef.current as HTMLDivElement;
      const scrollDiv = scrollRef.current as HTMLDivElement;
      scrollDiv.scrollTop = (containerDiv.clientHeight - scrollDiv.clientHeight) / 2 + 150;
      scrollDiv.scrollLeft = (containerDiv.clientWidth - scrollDiv.clientWidth) / 2;
    }

    if (formationType !== "custom") {
      setOffsets(
        units.map((unit, idx) => {
          return computeFormationOffset(formationType, idx);
        })
      );
      setCount(count + 1);
    }
  }, [formationType]);

  const horizontalRatio = 1 + (horizontalScale / 100) ** 2 * 100;
  const verticalRatio = (verticalScale - 50) / 50;

  let referenceDistance = 200 * horizontalRatio;
  if (referenceDistance < 250) {
    referenceDistance = 100;
  } else if (referenceDistance < 500) {
    referenceDistance = 250;
  } else if (referenceDistance < 1000) {
    referenceDistance = 500;
  } else if (referenceDistance < 3000) {
    referenceDistance = 1000;
  } else if (referenceDistance < 10000) {
    referenceDistance = 5000;
  } else {
    referenceDistance = 10000;
  }

  const referenceWidth = referenceDistance / horizontalRatio;

  return (
    <Menu title="Formation menu" open={props.open} showBackButton={false} onClose={props.onClose}>
      <div className="flex h-full flex-col gap-4 p-4">
        <span className="text-white">Formation type presets</span>
        <div className="flex gap-2">
          <OlDropdown label={formationTypes[formationType]} className="w-full">
            {Object.keys(formationTypes)
              .filter((type) => type !== "custom")
              .map((optionFormationType) => {
                return (
                  <OlDropdownItem
                    key={optionFormationType}
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
          <button
            type="button"
            onClick={() => {
              let content = JSON.stringify(
                units
                  .filter((unit) => unit !== null)
                  .map((unit, idx) => {
                    if (units.length > 0 && units[0] !== null) {
                      const [dx, dz] = [
                        -(silhouetteHandles[idx].position.y - silhouetteHandles[0].position.y),
                        silhouetteHandles[idx].position.x - silhouetteHandles[0].position.x,
                      ];
                      const distance = Math.sqrt(dx ** 2 + dz ** 2);
                      const offset = {
                        x: dx * horizontalRatio,
                        y: distance * verticalRatio,
                        z: dz * horizontalRatio,
                      };
                      return offset;
                    }
                  })
              );
              var a = document.createElement("a");
              var file = new Blob([content], { type: "text/plain" });
              a.href = URL.createObjectURL(file);
              a.download = "formation.json";
              a.click();
            }}
            className={`
              mb-2 rounded-lg bg-blue-700 px-5 py-2.5 text-md font-medium
              text-white
              dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
              focus:outline-none focus:ring-4 focus:ring-blue-300
              hover:bg-blue-800
            `}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              var input = document.createElement("input");
              input.type = "file";

              input.onchange = async (e) => {
                // @ts-ignore TODO
                var file = e.target?.files[0];
                var reader = new FileReader();
                reader.readAsText(file, "UTF-8");
                reader.onload = (readerEvent) => {
                  // @ts-ignore TODO
                  var content = readerEvent.target.result;
                  if (content) {
                    setOffsets(JSON.parse(content.toString()));
                    setCount(count + 1);
                    setFormationType("custom");
                  }
                };
              };

              input.click();
            }}
            className={`
              mb-2 rounded-lg bg-blue-700 px-5 py-2.5 text-md font-medium
              text-white
              dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
              focus:outline-none focus:ring-4 focus:ring-blue-300
              hover:bg-blue-800
            `}
          >
            Load
          </button>
        </div>
        <span className="text-white">Formation distance</span>
        <div className="flex h-fit content-center gap-4">
          <span
            className={`
              my-auto min-w-16 text-center align-middle text-sm text-white
            `}
          >
            Parade
          </span>
          <OlRangeSlider
            className="my-auto"
            value={horizontalScale}
            onChange={(ev) => {
              setHorizontalScale(Number(ev.target.value));
            }}
          />
          <span className="my-auto min-w-16 text-center text-sm text-white">Tactical</span>
        </div>
        <span className="text-white">Vertical separation</span>
        <div className="flex h-fit content-center gap-4">
          <span className="ml-auto min-w-16 text-center text-sm text-white">Down</span>
          <OlRangeSlider
            className="my-auto"
            value={verticalScale}
            onChange={(ev) => {
              setVerticalScale(Number(ev.target.value));
            }}
          />
          <span className="my-auto min-w-16 text-center text-sm text-white">Up</span>
        </div>
        <button
          type="button"
          onClick={() => {
            let center = { x: 0, y: 0 };

            if (containerRef.current) {
              center.x = (containerRef.current as HTMLDivElement).getBoundingClientRect().width / 2;
              center.y = (containerRef.current as HTMLDivElement).getBoundingClientRect().height / 2;
            }

            units
              .filter((unit) => unit !== null)
              .forEach((unit, idx) => {
                if (units.length > 0 && units[0] !== null && idx != 0) {
                  const ID = units[0].ID;

                  const [dx, dz] = [
                    -(silhouetteHandles[idx].position.y - silhouetteHandles[0].position.y),
                    silhouetteHandles[idx].position.x - silhouetteHandles[0].position.x,
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
        <div className="relative m-[-0.75rem] h-0">
          <div
            className={`
              relative left-6 top-4 h-4 border-2 border-white
              border-t-transparent text-center text-white
            `}
            style={{
              width: `${referenceWidth}px`,
            }}
          >
            <div className="translate-y-[-8px]">{referenceDistance}ft</div>
          </div>
        </div>

        <div
          className={`
            relative h-full w-full overflow-scroll rounded-md border-[1px]
            border-white/20 bg-white/10
          `}
          ref={scrollRef}
        >
          <div className={`h-[1000px] w-[1000px] h-max-[1000px] w-max-[1000px]`} ref={containerRef}>
            <>
              {Array(100)
                .fill(0)
                .map((_, idx) => {
                  return (
                    <div
                      key={idx}
                      className={`
                        absolute top-0 h-[1000px] w-[1px] border-[1px]
                        border-white/10
                      `}
                      style={{
                        left: `${idx * 10}px`,
                      }}
                    ></div>
                  );
                })}
            </>
            <>
              {Array(100)
                .fill(0)
                .map((_, idx) => {
                  return (
                    <div
                      key={idx}
                      className={`
                        absolute left-0 h-[1px] w-[1000px] border-[1px]
                        border-white/5
                      `}
                      style={{
                        top: `${idx * 10}px`,
                      }}
                    ></div>
                  );
                })}
            </>
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
                    onMouseDown={(e) => {
                      silhouetteHandles[idx].handleMouseDown(e);
                      setFormationType("custom");
                    }}
                  >
                    <img
                      className={`
                        h-10 min-h-10 w-10 min-w-10 translate-x-[-50%]
                        translate-y-[-50%] rotate-90 cursor-move opacity-80
                        invert
                      `}
                      src={`./images/units/${unit?.getBlueprint()?.filename}`}
                    ></img>
                  </div>
                );
              })}
            </>
          </div>
        </div>
      </div>
    </Menu>
  );
}

function computeFormationOffset(formation, idx) {
  let offset = { x: 0, z: 0 };
  if (formation === "trail") {
    offset.x = -50 * idx;
    offset.z = 0;
  } else if (formation === "echelon-lh") {
    offset.x = -50 * idx;
    offset.z = -50 * idx;
  } else if (formation === "echelon-rh") {
    offset.x = -50 * idx;
    offset.z = 50 * idx;
  } else if (formation === "line-abreast-lh") {
    offset.x = 0;
    offset.z = -50 * idx;
  } else if (formation === "line-abreast-rh") {
    offset.x = 0;
    offset.z = 50 * idx;
  } else if (formation === "front") {
    offset.x = 100 * idx;
    offset.z = 0;
  } else if (formation === "diamond") {
    var xr = 0;
    var yr = 1;
    var zr = -1;
    var layer = 1;

    for (let i = 0; i < idx; i++) {
      var xl = xr * Math.cos(Math.PI / 4) - yr * Math.sin(Math.PI / 4);
      var yl = xr * Math.sin(Math.PI / 4) + yr * Math.cos(Math.PI / 4);
      offset = { x: -yl * 50, z: xl * 50 };
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

let formationTypes = {
  "echelon-lh": "Echelon left",
  "echelon-rh": "Echelon right",
  "line-abreast-rh": "Line abreast right",
  "line-abreast-lh": "Line abreast left",
  trail: "Trail",
  front: "Front",
  diamond: "Diamond",
  custom: "Custom",
};

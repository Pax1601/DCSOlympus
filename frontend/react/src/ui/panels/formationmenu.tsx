import React, { useCallback, useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { Unit } from "../../unit/unit";
import { FormationCreationRequestEvent } from "../../events";
import { computeStandardFormationOffset, fromDCSFormationOffset, toDCSFormationOffset } from "../../other/utils";
import { formationTypes, UnitState } from "../../constants/constants";
import { FormationCanvas } from "./components/formationcanvas";

export function FormationMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [leader, setLeader] = useState(null as Unit | null);
  const [wingmen, setWingmen] = useState([] as Unit[]);

  /* Init state variables */
  const [formationType, setFormationType] = useState("echelon-lh");
  const [unitPositions, setUnitPositions] = useState([] as { x: number; y: number, z: number }[]);

  useEffect(() => {
    setFormationType("echelon-lh");
  }, [props.open])

  /* Listen for the setting of a new leader and wingmen and check if the formation is too big */
  useEffect(() => {
    FormationCreationRequestEvent.on((leader, wingmen) => {
      setLeader(leader);
      setWingmen(wingmen);
    });
  }, []);

  /* When the formation type is changed, reset the position to the center and the position of the silhouettes depending on the aircraft */
  const setStandardFormation = useCallback(() => {
    /* If a standard formation is chosen, compute the positions */
    if (formationType !== "custom") {
      setUnitPositions(
        [leader, ...wingmen].map((unit, idx) => {
          return computeStandardFormationOffset(formationType, idx);
        })
      );
    }
  }, [formationType]);
  useEffect(setStandardFormation, [formationType]);

  const setCurrentFormation = useCallback(() => {
    if (
      wingmen.every((unit: Unit) => {
        return unit.getState() === UnitState.FOLLOW && unit.getLeader() === leader;
      })
    ) {
      setUnitPositions([
        { x: 0, y: 0, z: 0 },
        ...wingmen.map((unit, idx) => {
          return fromDCSFormationOffset(unit.getFormationOffset());
        }),
      ]);
      setFormationType("custom");
    }
  }, [leader, wingmen]);
  useEffect(setCurrentFormation, [leader, wingmen]);

  if (leader && unitPositions.length < [leader, ...wingmen].length) {
    /* If more units are added to the group keep the existing positions */
    setUnitPositions(
      [leader, ...wingmen].map((unit, idx) => {
        if (idx < unitPositions.length) return unitPositions[idx];
        else return computeStandardFormationOffset(formationType, idx);
      })
    );
  }

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
                  <OlDropdownItem key={optionFormationType} onClick={() => setFormationType(optionFormationType)}>
                    {formationTypes[optionFormationType]}
                  </OlDropdownItem>
                );
              })}
          </OlDropdown>
          <button
            type="button"
            onClick={() => {
              let content = JSON.stringify(unitPositions);
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
                    setUnitPositions(JSON.parse(content.toString()));
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
        <FormationCanvas
          units={leader ? [leader, ...wingmen] : []}
          unitPositions={unitPositions}
          setUnitPositions={(positions) => {
            setUnitPositions(positions);
            setFormationType("custom");
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (leader) {
              [leader, ...wingmen]
                .filter((unit) => unit !== null)
                .forEach((unit, idx) => {
                  if (idx != 0) {
                    const [dx, dy] = [unitPositions[idx].x - unitPositions[0].x, unitPositions[idx].y - unitPositions[0].y];

                    unit.followUnit(leader.ID, toDCSFormationOffset({
                      x: dx,
                      y: dy,
                      z: unitPositions[idx].z,
                    }));
                  }
                });
            }
          }}
          className={`
            rounded-lg bg-blue-700 px-5 py-2.5 text-md font-medium text-white
            dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
            focus:outline-none focus:ring-4 focus:ring-blue-300
            hover:bg-blue-800
          `}
        >
          Apply
        </button>
      </div>
    </Menu>
  );
}

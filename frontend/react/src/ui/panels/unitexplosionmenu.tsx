import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { Unit } from "../../unit/unit";
import { getApp } from "../../olympusapp";
import { UnitExplosionRequestEvent } from "../../events";

export function UnitExplosionMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [units, setUnits] = useState(null as null | Unit[])
  const [explosionType, setExplosionType] = useState("High explosive");

  useEffect(() => {
    UnitExplosionRequestEvent.on((units) => setUnits(units))
  }, [])

  return (
    <Menu title="Unit explosion menu" open={props.open} showBackButton={false} onClose={props.onClose}>
      <div className="flex h-full flex-col gap-4 p-4">
        <span className="text-white">Explosion type</span>

        <OlDropdown label={explosionType} className="w-full">
          {["High explosive", "Napalm", "White phosphorous", "Fire"].map((optionExplosionType) => {
            return (
              <OlDropdownItem
                key={optionExplosionType}
                onClick={() => {
                  setExplosionType(optionExplosionType);
                }}
              >
                {optionExplosionType}
              </OlDropdownItem>
            );
          })}
        </OlDropdown>
        {units !== null && (
          <button
            type="button"
            onClick={() => {
              if (explosionType === "High explosive") {
                getApp()?.getUnitsManager().delete(true, "normal", units);
              } else if (explosionType === "Napalm") {
                getApp()?.getUnitsManager().delete(true, "napalm", units);
              } else if (explosionType === "White phosphorous") {
                getApp()?.getUnitsManager().delete(true, "phosphorous", units);
              }
              props.onClose();
            }}
            className={`
              mb-2 rounded-lg bg-blue-700 px-5 py-2.5 text-md font-medium
              text-white
              dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
              focus:outline-none focus:ring-4 focus:ring-blue-300
              hover:bg-blue-800
            `}
          >
            Apply
          </button>
        )}
      </div>
    </Menu>
  );
}

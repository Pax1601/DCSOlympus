import React, { useState } from "react";
import { Menu } from "./components/menu";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { Unit } from "../../unit/unit";
import { getApp } from "../../olympusapp";

export function UnitExplosionMenu(props: { open: boolean; onClose: () => void; units: Unit[] | null; children?: JSX.Element | JSX.Element[] }) {
  const [explosionType, setExplosionType] = useState("High explosive");

  return (
    <Menu title="Unit explosion menu" open={props.open} showBackButton={false} onClose={props.onClose}>
      <div className="flex h-full flex-col gap-4 p-4">
        <span className="text-white">Explosion type</span>

        <OlDropdown label={explosionType} className="w-full">
          {["High explosive", "Napalm", "White phosphorous"].map((optionExplosionType) => {
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
        {props.units !== null && (
          <button
            type="button"
            onClick={() => {
              if (explosionType === "High explosive") {
                getApp()?.getUnitsManager().delete(true, "normal", props.units);
              } else if (explosionType === "Napalm") {
                getApp()?.getUnitsManager().delete(true, "napalm", props.units);
              } else if (explosionType === "White phosphorous") {
                getApp()?.getUnitsManager().delete(true, "phosphorous", props.units);
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

import React, { useState } from "react";
import { Menu } from "./components/menu";
import { faGamepad } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'
import { Unit } from "../../unit/unit";

library.add(faGamepad);

export function UnitControlMenu(props) {
   var [open, setOpen] = useState(false);
   var [selectedUnits, setSelectedUnits] = useState([] as Unit[]);

   document.addEventListener("unitsSelection", (ev: CustomEventInit) => {
      setOpen(true);
      setSelectedUnits(ev.detail as Unit[])
   })

   document.addEventListener("unitDeselection", (ev: CustomEventInit) => {

   })

   document.addEventListener("clearSelection", () => {
      setOpen(false);
      setSelectedUnits([])
   })

   var unitOccurences = {
      blue: {},
      red: {},
      neutral: {}
   }

   selectedUnits.forEach((unit) => {
      if (!(unit.getName() in unitOccurences[unit.getCoalition()]))
         unitOccurences[unit.getCoalition()][unit.getName()] = 1;
      else
         unitOccurences[unit.getCoalition()][unit.getName()]++;
   })

   return <Menu open={open} title="Unit control menu" titleIcon="fa-solid fa-gamepad">
      <div className="dark:bg-[#243141] h-fit p-0 flex flex-col gap-0">
         {
            <>
            {
            ['blue', 'red', 'neutral'].map((coalition) => {
                  return Object.keys(unitOccurences[coalition]).map((name) => {
                     return <div data-coalition={coalition} className="flex justify-between content-center border-l-4 data-[coalition='blue']:border-blue-500 data-[coalition='neutral']:border-gray-500 data-[coalition='red']:border-red-500 p-2">
                        <span className="dark:text-gray-300 text-sm font-medium my-auto">
                           {name}
                        </span>
                        <span className="dark:text-gray-500 text-sm  my-auto">
                           x{unitOccurences[coalition][name]}
                        </span>
                     </div>
                  })
               })
            }
            </>
         }
      </div>

   </Menu>
}
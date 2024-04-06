import React from "react";
import { Menu } from "./components/menu";
import { faJetFighter, faPlus } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'
import { OlSearchBar } from "../components/olsearchbar";
import { OlAccordion } from "../components/olaccordion";
import { getApp } from "../../olympusapp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

library.add(faPlus);

export function SpawnMenu(props) {
   return <Menu {...props} title="Spawn menu" titleIcon="fa-solid fa-plus">
      <OlSearchBar className="mb-4" />
      <OlAccordion title="Aircraft">
         <div className="flex flex-col gap-2 no-scrollbar max-h-80 overflow-scroll">
            {getApp() && Object.keys(getApp().getAircraftDatabase().blueprints).map((key) => {
               return <div className="text-sm text-gray-300 font-thin"><FontAwesomeIcon icon={faJetFighter} className="text-sm mr-2" /> {getApp().getAircraftDatabase().blueprints[key].label}</div>;
            })}
         </div>
      </OlAccordion>
      <OlAccordion title="Helicopter"></OlAccordion>
      <OlAccordion title="Air Defense"></OlAccordion>
   </Menu>
}
import React from "react";
import { Menu } from "./components/menu";
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'

library.add(faPlus);

export function SpawnMenu(props) {

   return <Menu {...props} title="Spawn menu" titleIcon="fa-solid fa-plus">

   </Menu>
}
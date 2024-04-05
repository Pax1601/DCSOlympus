import React from "react";
import { Menu } from "./components/menu";
import { faGamepad } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'

library.add(faGamepad);

export function UnitControlMenu(props) {

   return <Menu {...props} title="Unit control menu" titleIcon="fa-solid fa-gamepad">

   </Menu>
}
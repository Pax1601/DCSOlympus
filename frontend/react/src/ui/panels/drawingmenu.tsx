import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { FaQuestionCircle } from "react-icons/fa";
import { getApp } from "../../olympusapp";
import { COALITIONAREA_DRAW_POLYGON, COALITIONAREA_EDIT, IDLE } from "../../constants/constants";
import { OlStateButton } from "../components/olstatebutton";
import { faDrawPolygon } from "@fortawesome/free-solid-svg-icons";

export function DrawingMenu(props: { open: boolean; onClose: () => void }) {
  const [drawingPolygon, setDrawingPolygon] = useState(false);

  useEffect(() => {
    if (props.open && !drawingPolygon) {
      getApp().getMap().setState(COALITIONAREA_EDIT);
    }
  })

  return (
    <Menu
      open={props.open}
      title="Draw"
      onClose={props.onClose}
      canBeHidden={true}
    >
      <div className="p-4 text-sm text-gray-400">
        The draw tool allows you to quickly draw areas on the map and use these
        areas to spawn units and activate triggers.
      </div>
      <div className="mx-6 my-2 flex rounded-lg bg-olympus-400 p-4 text-sm">
        <div>
          <FaQuestionCircle className="my-4 ml-2 mr-6 text-gray-400" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-gray-100">
            Use the polygon or paint tool to draw areas on the map.
          </div>
          <div className="text-gray-400">
            After drawing a shape, select it to see the options for spawning
            units.
          </div>
        </div>
      </div>
      <div className="p-6 text-sm text-gray-400">
        <OlStateButton
          className="!w-full"
          icon={faDrawPolygon}
          tooltip={"Add a new polygon"}
          checked={drawingPolygon}
          onClick={() => {
            if (drawingPolygon)
              getApp().getMap().setState(COALITIONAREA_EDIT);
            else
              getApp().getMap().setState(COALITIONAREA_DRAW_POLYGON);
            setDrawingPolygon(!drawingPolygon);
          }}
        >
          <div className="text-sm">Add polygon</div>
        </OlStateButton>
      </div>
    </Menu>
  );
}

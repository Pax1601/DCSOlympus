import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { FaQuestionCircle, FaRegCircle } from "react-icons/fa";
import { getApp } from "../../olympusapp";
import {
  COALITIONAREA_DRAW_POLYGON,
  COALITIONAREA_EDIT,
  IDLE,
} from "../../constants/constants";
import { OlStateButton } from "../components/olstatebutton";
import { faDrawPolygon } from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { CoalitionPolygon } from "../../map/coalitionarea/coalitionpolygon";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { OlCheckbox } from "../components/olcheckbox";
import { Coalition } from "../../types/types";
import { OlRangeSlider } from "../components/olrangeslider";

export function DrawingMenu(props: { open: boolean; onClose: () => void }) {
  const [drawingPolygon, setDrawingPolygon] = useState(false);
  const [drawingCircle, setDrawingCircle] = useState(false);
  const [activeCoalitionArea, setActiveCoalitionArea] = useState(
    null as null | CoalitionPolygon
  );
  const [areaCoalition, setAreaCoalition] = useState("blue" as Coalition);
  const [IADSDensity, setIADSDensity] = useState(50);
  const [IADSDistribution, setIADSDistribution] = useState(50);
  const [forceCoalitionAppropriateUnits, setForceCoalitionApproriateUnits] = useState(false);

  useEffect(() => {
    if (
      drawingPolygon &&
      getApp().getMap().getState() !== COALITIONAREA_DRAW_POLYGON
    )
      setDrawingPolygon(false);

    if (props.open && !drawingPolygon)
      getApp().getMap().setState(COALITIONAREA_EDIT);

    if (
      activeCoalitionArea &&
      activeCoalitionArea?.getCoalition() !== areaCoalition
    )
      setAreaCoalition(activeCoalitionArea?.getCoalition());
  });

  document.addEventListener("mapStateChanged", (event: any) => {
    if (
      drawingPolygon &&
      getApp().getMap().getState() !== COALITIONAREA_DRAW_POLYGON
    )
      setDrawingPolygon(false);

    if (
      [COALITIONAREA_DRAW_POLYGON, COALITIONAREA_EDIT].includes(
        getApp().getMap().getState()
      )
    ) {
      setActiveCoalitionArea(
        getApp().getMap().getSelectedCoalitionArea() ?? null
      );
    }
  });

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
      <div className="mx-6 flex rounded-lg bg-olympus-400 p-4 text-sm">
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
      <>
        {activeCoalitionArea === null && (
          <div className="flex flex-col gap-2 p-6 text-sm text-gray-400">
            <OlStateButton
              className="!w-full"
              icon={faDrawPolygon}
              tooltip={"Add a new polygon"}
              checked={drawingPolygon}
              onClick={() => {
                if (drawingPolygon)
                  getApp().getMap().setState(COALITIONAREA_EDIT);
                else getApp().getMap().setState(COALITIONAREA_DRAW_POLYGON);
                setDrawingPolygon(!drawingPolygon);
              }}
            >
              <div className="text-sm">Add polygon</div>
            </OlStateButton>
            <OlStateButton
              className="!w-full"
              icon={faCircle}
              tooltip={"Add a new circle"}
              checked={drawingCircle}
              onClick={() => {}}
            >
              <div className="text-sm">Add circle (WIP)</div>
            </OlStateButton>
          </div>
        )}
      </>
      <div>
        {activeCoalitionArea !== null && (
          <div className={`flex flex-col gap-4 py-4`}>
            <div
              className={`
                flex flex-col content-center justify-start gap-2 px-6
                text-gray-200
              `}
            >
              <div className="my-auto text-md">Area label </div>
              <input
                type="text"
                className={`
                  block max-w-80 flex-grow rounded-lg border border-gray-300
                  bg-gray-50 p-2.5 text-sm text-gray-900
                  dark:border-gray-600 dark:bg-gray-700 dark:text-white
                  dark:placeholder-gray-400 dark:focus:border-blue-500
                  dark:focus:ring-blue-500
                  focus:border-blue-500 focus:ring-blue-500
                `}
                defaultValue={activeCoalitionArea.getLabelText()}
                onInput={(ev) =>
                  activeCoalitionArea.setLabelText(ev.currentTarget.value)
                }
              ></input>
            </div>
            <div
              className={`
                flex content-center justify-start gap-4 px-6 text-gray-200
              `}
            >
              <div className="my-auto text-md">Coalition: </div>
              <OlCoalitionToggle
                coalition={areaCoalition}
                onClick={() => {
                  let newCoalition = "";
                  if (areaCoalition === "blue") newCoalition = "neutral";
                  else if (areaCoalition === "neutral") newCoalition = "red";
                  else if (areaCoalition === "red") newCoalition = "blue";
                  setAreaCoalition(newCoalition as Coalition);
                  activeCoalitionArea.setCoalition(newCoalition as Coalition);
                }}
              ></OlCoalitionToggle>
            </div>
            <div
              className={`
                flex flex-col gap-3 border-l-4 border-l-olympus-100
                bg-olympus-600 p-5
              `}
            >
              <div className="border-b-2 border-b-olympus-100 pb-4 text-gray-300">
                Automatic IADS generation
              </div>
              <OlDropdown className="" label="Units types">
                {getApp()
                  .getGroundUnitDatabase()
                  .getTypes()
                  .map((era) => {
                    return (
                      <OlDropdownItem className={`flex gap-4`}>
                        <OlCheckbox checked={true} onChange={() => {}} />
                        {era}
                      </OlDropdownItem>
                    );
                  })}
              </OlDropdown>
              <OlDropdown className="" label="Units eras">
                {getApp()
                  .getGroundUnitDatabase()
                  .getEras()
                  .map((era) => {
                    return (
                      <OlDropdownItem className={`flex gap-4`}>
                        <OlCheckbox checked={true} onChange={() => {}} />
                        {era}
                      </OlDropdownItem>
                    );
                  })}
              </OlDropdown>
              <OlDropdown className="" label="Units ranges">
                {["Short range", "Medium range", "Long range"].map((era) => {
                  return (
                    <OlDropdownItem className={`flex gap-4`}>
                      <OlCheckbox checked={true} onChange={() => {}} />
                      {era}
                    </OlDropdownItem>
                  );
                })}
              </OlDropdown>
              <div>
                <div className="flex justify-between">
                  <div className="text-gray-100">IADS Density</div>
                  <div
                    className={`
                      font-bold
                      dark:text-blue-500
                    `}
                  >
                    50%
                  </div>
                </div>
                <OlRangeSlider value={50} onChange={() => {}}></OlRangeSlider>
              </div>
              <div>
                <div className="flex justify-between">
                  <div className="text-gray-100">IADS Distribution</div>
                  <div
                    className={`
                      font-bold
                      dark:text-blue-500
                    `}
                  >
                    50%
                  </div>
                </div>
                <OlRangeSlider value={IADSDistribution} onChange={(ev) => {setIADSDistribution(Number(ev.target.value))}}></OlRangeSlider>
              </div>
              <div className="flex content-center gap-4 text-gray-200">
                <OlCheckbox checked={forceCoalitionAppropriateUnits} onChange={() => {
                  setForceCoalitionApproriateUnits(!forceCoalitionAppropriateUnits);
                }} />
                Force coalition appropriate units
              </div>
              <button type="button" className={`
                mb-2 me-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium
                text-white
                dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
                focus:outline-none focus:ring-4 focus:ring-blue-300
                hover:bg-blue-800
              `}>Generate IADS</button>
            </div>
          </div>
        )}
      </div>
    </Menu>
  );
}

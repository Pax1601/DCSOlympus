import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { FaQuestionCircle, FaRegCircle, FaTrash } from "react-icons/fa";
import { getApp } from "../../olympusapp";
import { COALITIONAREA_DRAW_CIRCLE, COALITIONAREA_DRAW_POLYGON, COALITIONAREA_EDIT, IDLE } from "../../constants/constants";
import { OlStateButton } from "../components/olstatebutton";
import { faDrawPolygon } from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { CoalitionPolygon } from "../../map/coalitionarea/coalitionpolygon";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { OlCheckbox } from "../components/olcheckbox";
import { Coalition } from "../../types/types";
import { OlRangeSlider } from "../components/olrangeslider";
import { CoalitionCircle } from "../../map/coalitionarea/coalitioncircle";

export function DrawingMenu(props: { open: boolean; onClose: () => void }) {
  const [drawingPolygon, setDrawingPolygon] = useState(false);
  const [drawingCircle, setDrawingCircle] = useState(false);
  const [activeCoalitionArea, setActiveCoalitionArea] = useState(null as null | CoalitionPolygon | CoalitionCircle);
  const [areaCoalition, setAreaCoalition] = useState("blue" as Coalition);
  const [IADSDensity, setIADSDensity] = useState(50);
  const [IADSDistribution, setIADSDistribution] = useState(50);
  const [forceCoalitionAppropriateUnits, setForceCoalitionApproriateUnits] = useState(false);

  const [typesSelection, setTypesSelection] = useState({});
  const [erasSelection, setErasSelection] = useState({});
  const [rangesSelection, setRangesSelection] = useState({});

  useEffect(() => {
    /* If we are not in polygon drawing mode, force the draw polygon button off */
    if (drawingPolygon && getApp().getMap().getState() !== COALITIONAREA_DRAW_POLYGON) setDrawingPolygon(false);

    /* If we are not in circle drawing mode, force the draw circle button off */
    if (drawingCircle && getApp().getMap().getState() !== COALITIONAREA_DRAW_CIRCLE) setDrawingCircle(false);

    /* If we are not in any drawing mode, force the map in edit mode */
    if (props.open && !drawingPolygon && !drawingCircle) getApp().getMap().setState(COALITIONAREA_EDIT);

    /* Align the state of the coalition toggle to the coalition of the area */
    if (activeCoalitionArea && activeCoalitionArea?.getCoalition() !== areaCoalition) setAreaCoalition(activeCoalitionArea?.getCoalition());
  });

  useEffect(() => {
    if (!props.open) {
      if ([COALITIONAREA_EDIT, COALITIONAREA_DRAW_CIRCLE, COALITIONAREA_DRAW_POLYGON].includes(getApp()?.getMap()?.getState()))
        getApp().getMap().setState(IDLE);
    }
  });

  document.addEventListener("mapStateChanged", (event: any) => {
    if (drawingPolygon && getApp().getMap().getState() !== COALITIONAREA_DRAW_POLYGON) setDrawingPolygon(false);

    if (getApp().getMap().getState() == COALITIONAREA_EDIT) {
      setActiveCoalitionArea(getApp().getMap().getSelectedCoalitionArea() ?? null);
    }
  });

  document.addEventListener("coalitionAreaSelected", (event: any) => {
    setActiveCoalitionArea(event.detail);
  });

  return (
    <Menu
      open={props.open}
      title="Draw"
      onClose={props.onClose}
      canBeHidden={true}
      showBackButton={activeCoalitionArea !== null}
      onBack={() => {
        setActiveCoalitionArea(null);
        getApp().getMap().deselectAllCoalitionAreas();
      }}
    >
      <>
        {activeCoalitionArea === null && !drawingPolygon && !drawingCircle && (
          <>
            <div className="p-4 text-sm text-gray-400">
              The draw tool allows you to quickly draw areas on the map and use these areas to spawn units and activate triggers.
            </div>
            <div className="mx-6 flex rounded-lg bg-olympus-400 p-4 text-sm">
              <div>
                <FaQuestionCircle className="my-4 ml-2 mr-6 text-gray-400" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-gray-100">Use the polygon or circle tool to draw areas on the map.</div>
                <div className="text-gray-400">After drawing a shape, select it to see the options for spawning units. Click on a shape to select it.</div>
              </div>
            </div>
          </>
        )}
      </>

      <>
        {activeCoalitionArea === null && drawingPolygon && (
          <div className="mx-6 flex rounded-lg bg-olympus-400 p-4 text-sm">
            <div>
              <FaQuestionCircle className="my-4 ml-2 mr-6 text-gray-400" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-gray-100">Click on the map to add vertices to the polygon.</div>
              <div className="text-gray-400">
                When you are done, double click on the map to finalize the polygon. Vertices can be dragged or added to adjust the shape.
              </div>
            </div>
          </div>
        )}
      </>

      <>
        {activeCoalitionArea === null && drawingCircle && (
          <div className="mx-6 flex rounded-lg bg-olympus-400 p-4 text-sm">
            <div>
              <FaQuestionCircle className="my-4 ml-2 mr-6 text-gray-400" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-gray-100">Click on the map to add a new circle.</div>
              <div className="text-gray-400">You can drag the circle to move it and you can use the handle to set the radius.</div>
            </div>
          </div>
        )}
      </>

      <>
        {activeCoalitionArea === null && (
          <div className="flex flex-col gap-2 p-6 text-sm text-gray-400">
            <OlStateButton
              className="!w-full"
              icon={faDrawPolygon}
              tooltip={"Add a new polygon"}
              checked={drawingPolygon}
              onClick={() => {
                if (drawingPolygon) getApp().getMap().setState(COALITIONAREA_EDIT);
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
              onClick={() => {
                if (drawingCircle) getApp().getMap().setState(COALITIONAREA_EDIT);
                else getApp().getMap().setState(COALITIONAREA_DRAW_CIRCLE);
                setDrawingCircle(!drawingCircle);
              }}
            >
              <div className="text-sm">Add circle</div>
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
              <div className="my-auto flex justify-between text-md">
                Area label
                <div
                  className="rounded-md bg-red-800 p-2"
                  onClick={() => {
                    getApp().getMap().deleteCoalitionArea(activeCoalitionArea);
                    setActiveCoalitionArea(null);
                  }}
                >
                  <FaTrash className={`text-gray-50`}></FaTrash>
                </div>
              </div>
              <input
                type="text"
                className={`
                  block w-full flex-grow rounded-lg border border-gray-300
                  bg-gray-50 p-2.5 text-sm text-gray-900
                  dark:border-gray-600 dark:bg-gray-700 dark:text-white
                  dark:placeholder-gray-400 dark:focus:border-blue-500
                  dark:focus:ring-blue-500
                  focus:border-blue-500 focus:ring-blue-500
                `}
                placeholder={activeCoalitionArea.getLabelText()}
                onInput={(ev) => activeCoalitionArea.setLabelText(ev.currentTarget.value)}
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
              <div className="border-b-2 border-b-olympus-100 pb-4 text-gray-300">Automatic IADS generation</div>
              <OlDropdown className="" label="Units types">
                {getApp()
                  .getGroundUnitDatabase()
                  .getTypes()
                  .map((type) => {
                    if (!(type in typesSelection)) {
                      typesSelection[type] = true;
                      setTypesSelection(JSON.parse(JSON.stringify(typesSelection)));
                    }

                    return (
                      <OlDropdownItem className={`flex gap-4`}>
                        <OlCheckbox
                          checked={typesSelection[type]}
                          onChange={(ev) => {
                            typesSelection[type] = ev.currentTarget.checked;
                            setTypesSelection(JSON.parse(JSON.stringify(typesSelection)));
                          }}
                        />
                        {type}
                      </OlDropdownItem>
                    );
                  })}
              </OlDropdown>
              <OlDropdown className="" label="Units eras">
                {getApp()
                  .getGroundUnitDatabase()
                  .getEras()
                  .map((era) => {
                    if (!(era in erasSelection)) {
                      erasSelection[era] = true;
                      setErasSelection(JSON.parse(JSON.stringify(erasSelection)));
                    }

                    return (
                      <OlDropdownItem className={`flex gap-4`}>
                        <OlCheckbox
                          checked={erasSelection[era]}
                          onChange={(ev) => {
                            erasSelection[era] = ev.currentTarget.checked;
                            setErasSelection(JSON.parse(JSON.stringify(erasSelection)));
                          }}
                        />
                        {era}
                      </OlDropdownItem>
                    );
                  })}
              </OlDropdown>
              <OlDropdown className="" label="Units ranges">
                {["Short range", "Medium range", "Long range"].map((range) => {
                  if (!(range in rangesSelection)) {
                    rangesSelection[range] = true;
                    setRangesSelection(JSON.parse(JSON.stringify(rangesSelection)));
                  }

                  return (
                    <OlDropdownItem className={`flex gap-4`}>
                      <OlCheckbox
                        checked={rangesSelection[range]}
                        onChange={(ev) => {
                          rangesSelection[range] = ev.currentTarget.checked;
                          setErasSelection(JSON.parse(JSON.stringify(rangesSelection)));
                        }}
                      />
                      {range}
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
                    {IADSDensity}%
                  </div>
                </div>
                <OlRangeSlider
                  value={IADSDensity}
                  onChange={(ev) => {
                    setIADSDensity(Number(ev.currentTarget.value));
                  }}
                ></OlRangeSlider>
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
                    {IADSDistribution}%
                  </div>
                </div>
                <OlRangeSlider
                  value={IADSDistribution}
                  onChange={(ev) => {
                    setIADSDistribution(Number(ev.target.value));
                  }}
                ></OlRangeSlider>
              </div>
              <div className="flex content-center gap-4 text-gray-200">
                <OlCheckbox
                  checked={forceCoalitionAppropriateUnits}
                  onChange={() => {
                    setForceCoalitionApproriateUnits(!forceCoalitionAppropriateUnits);
                  }}
                />
                Force coalition appropriate units
              </div>
              <button
                type="button"
                className={`
                  mb-2 me-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm
                  font-medium text-white
                  dark:bg-blue-600 dark:hover:bg-blue-700
                  dark:focus:ring-blue-800
                  focus:outline-none focus:ring-4 focus:ring-blue-300
                  hover:bg-blue-800
                `}
                onClick={() =>
                  getApp()
                    .getUnitsManager()
                    .createIADS(
                      activeCoalitionArea,
                      typesSelection,
                      erasSelection,
                      rangesSelection,
                      IADSDensity,
                      IADSDistribution,
                      forceCoalitionAppropriateUnits
                    )
                }
              >
                Generate IADS
              </button>
            </div>
          </div>
        )}
      </div>
    </Menu>
  );
}

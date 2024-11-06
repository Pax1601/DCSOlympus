import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { FaTrash } from "react-icons/fa";
import { getApp } from "../../olympusapp";
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
import { DrawSubState, NO_SUBSTATE, OlympusState, OlympusSubState } from "../../constants/constants";
import { AppStateChangedEvent, CoalitionAreaSelectedEvent } from "../../events";
import { UnitBlueprint } from "../../interfaces";

export function DrawingMenu(props: { open: boolean; onClose: () => void }) {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE as OlympusSubState);
  const [activeCoalitionArea, setActiveCoalitionArea] = useState(null as null | CoalitionPolygon | CoalitionCircle);
  const [areaCoalition, setAreaCoalition] = useState("blue" as Coalition);
  const [IADSDensity, setIADSDensity] = useState(50);
  const [IADSDistribution, setIADSDistribution] = useState(50);
  const [forceCoalitionAppropriateUnits, setForceCoalitionApproriateUnits] = useState(false);

  const [typesSelection, setTypesSelection] = useState({});
  const [erasSelection, setErasSelection] = useState({});
  const [rangesSelection, setRangesSelection] = useState({});

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
  }, []);

  /* Get all the unique types and eras for groundunits */
  /* TODO move in effect */
  const blueprints = getApp()?.getUnitsManager().getDatabase().getBlueprints();
  let types: string[] = [];
  let eras: string[] = [];
  if (blueprints) {
    types = blueprints
      .filter((blueprint) => blueprint.category === "groundunit")
      .map((blueprint) => blueprint.type)
      .filter((type) => type !== undefined);
    eras = blueprints
      .filter((blueprint) => blueprint.category === "groundunit")
      .map((blueprint) => blueprint.era)
      .filter((era) => era !== undefined);
  }

  useEffect(() => {
    if (getApp()) {
      // TODO
      ///* If we are not in polygon drawing mode, force the draw polygon button off */
      //if (drawingPolygon && getApp().getState() !== COALITIONAREA_DRAW_POLYGON) setDrawingPolygon(false);
      //
      ///* If we are not in circle drawing mode, force the draw circle button off */
      //if (drawingCircle && getApp().getState() !== COALITIONAREA_DRAW_CIRCLE) setDrawingCircle(false);
      //
      ///* If we are not in any drawing mode, force the map in edit mode */
      //if (props.open && !drawingPolygon && !drawingCircle) getApp().getMap().setState(COALITIONAREA_EDIT);
      //
      ///* Align the state of the coalition toggle to the coalition of the area */
      //if (activeCoalitionArea && activeCoalitionArea?.getCoalition() !== areaCoalition) setAreaCoalition(activeCoalitionArea?.getCoalition());
    }
  });

  useEffect(() => {
    CoalitionAreaSelectedEvent.on((coalitionArea) => setActiveCoalitionArea(coalitionArea));
  }, []);

  return (
    <Menu
      open={props.open}
      title="Draw"
      onClose={props.onClose}
      canBeHidden={true}
      showBackButton={activeCoalitionArea !== null}
      onBack={() => {
        getApp().setState(OlympusState.DRAW, DrawSubState.NO_SUBSTATE);
      }}
    >
      <>
        {appState === OlympusState.DRAW && appSubState !== DrawSubState.EDIT && (
          <div className="flex flex-col gap-2 p-6 text-sm text-gray-400">
            <OlStateButton
              className="!w-full"
              icon={faDrawPolygon}
              tooltip={"Add a new polygon"}
              checked={appSubState === DrawSubState.DRAW_POLYGON}
              onClick={() => {
                if (appSubState === DrawSubState.DRAW_POLYGON) getApp().setState(OlympusState.DRAW, DrawSubState.EDIT);
                else getApp().setState(OlympusState.DRAW, DrawSubState.DRAW_POLYGON);
              }}
            >
              <div className="text-sm">Add polygon</div>
            </OlStateButton>
            <OlStateButton
              className="!w-full"
              icon={faCircle}
              tooltip={"Add a new circle"}
              checked={appSubState === DrawSubState.DRAW_CIRCLE}
              onClick={() => {
                if (appSubState === DrawSubState.DRAW_CIRCLE) getApp().setState(OlympusState.DRAW, DrawSubState.EDIT);
                else getApp().setState(OlympusState.DRAW, DrawSubState.DRAW_CIRCLE);
              }}
            >
              <div className="text-sm">Add circle</div>
            </OlStateButton>
          </div>
        )}
      </>
      <div>
        {activeCoalitionArea !== null && appSubState === DrawSubState.EDIT && (
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
              <div className={`
                border-b-2 border-b-olympus-100 pb-4 text-gray-300
              `}>Automatic IADS generation</div>
              <OlDropdown className="" label="Units types">
                {types.map((type, idx) => {
                  if (!(type in typesSelection)) {
                    typesSelection[type] = true;
                    setTypesSelection(JSON.parse(JSON.stringify(typesSelection)));
                  }

                  return (
                    <OlDropdownItem key={idx} className={`flex gap-4`}>
                      <OlCheckbox
                        checked={typesSelection[type]}
                        onChange={(ev) => {
                          typesSelection[type] = ev.currentTarget.checked;
                          setTypesSelection(JSON.parse(JSON.stringify(typesSelection)));
                        }}
                      />
                      <div>{type}</div>
                    </OlDropdownItem>
                  );
                })}
              </OlDropdown>
              <OlDropdown className="" label="Units eras">
                {eras.map((era) => {
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
                      <div>{era}</div>
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
                      <div>{range}</div>
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

import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { FaArrowDown, FaArrowUp, FaChevronRight, FaTrash } from "react-icons/fa";
import { getApp } from "../../olympusapp";
import { OlStateButton } from "../components/olstatebutton";
import { faDrawPolygon, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { CoalitionPolygon } from "../../map/coalitionarea/coalitionpolygon";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { OlCheckbox } from "../components/olcheckbox";
import { Coalition } from "../../types/types";
import { OlRangeSlider } from "../components/olrangeslider";
import { CoalitionCircle } from "../../map/coalitionarea/coalitioncircle";
import { DrawSubState, ERAS_ORDER, IADSTypes, NO_SUBSTATE, OlympusState, OlympusSubState } from "../../constants/constants";
import { AppStateChangedEvent, CoalitionAreasChangedEvent, CoalitionAreaSelectedEvent, DrawingsInitEvent, DrawingsUpdatedEvent } from "../../events";
import { FaXmark } from "react-icons/fa6";
import { deepCopyTable } from "../../other/utils";
import { DCSDrawingsContainer, DCSEmptyLayer } from "../../map/drawings/drawingsmanager";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OlSearchBar } from "../components/olsearchbar";

export function DrawingMenu(props: { open: boolean; onClose: () => void }) {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE as OlympusSubState);
  const [activeCoalitionArea, setActiveCoalitionArea] = useState(null as null | CoalitionPolygon | CoalitionCircle);
  const [coalitionAreas, setCoalitionAreas] = useState([] as (CoalitionPolygon | CoalitionCircle)[]);
  const [IADSDensity, setIADSDensity] = useState(50);
  const [IADSDistribution, setIADSDistribution] = useState(50);
  const [forceCoalitionAppropriateUnits, setForceCoalitionApproriateUnits] = useState(false);

  const [typesSelection, setTypesSelection] = useState({});
  const [erasSelection, setErasSelection] = useState({});
  const [rangesSelection, setRangesSelection] = useState({});

  const [openContainers, setOpenContainers] = useState([] as DCSDrawingsContainer[]);
  const [mainDrawingsContainer, setDrawingsContainer] = useState({ container: null } as { container: null | DCSDrawingsContainer });
  const [searchString, setSearchString] = useState("");

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
    DrawingsInitEvent.on((drawingContainer) => {
      setDrawingsContainer({ container: drawingContainer });
    });
    DrawingsUpdatedEvent.on(() => {
      setDrawingsContainer({ container: getApp().getDrawingsManager().getDrawingsContainer() });
    });
  }, []);

  /* Get all the unique types and eras for groundunits */
  let types = IADSTypes;
  let eras = getApp()
    ?.getUnitsManager()
    .getDatabase()
    .getEras()
    .sort((era1, era2) => (ERAS_ORDER[era1] > ERAS_ORDER[era2] ? 1 : -1));

  useEffect(() => {
    CoalitionAreaSelectedEvent.on((coalitionArea) => setActiveCoalitionArea(coalitionArea));
    CoalitionAreasChangedEvent.on((coalitionAreas) => setCoalitionAreas([...coalitionAreas]));
  }, []);

  function renderDrawingsContainerControls(container: DCSDrawingsContainer) {
    if (container.hasSearchString(searchString)) {
      return (
        <div className="ml-2 flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between gap-2">
              <FaChevronRight
                className={`
                  my-auto
                  ${openContainers.includes(container) && `rotate-90`}
                  cursor-pointer text-gray-400 transition-transform
                `}
                onClick={() => {
                  if (openContainers.includes(container)) {
                    let index = openContainers.indexOf(container);
                    openContainers.splice(index, 1);
                  } else {
                    openContainers.push(container);
                  }
                  setOpenContainers([...openContainers]);
                }}
              ></FaChevronRight>
              <FontAwesomeIcon
                icon={container.getVisibility() ? faEye : faEyeSlash}
                className={`
                  my-auto w-6 cursor-pointer text-gray-400 transition-transform
                  hover:scale-125 hover:text-gray-200
                `}
                onClick={() => {
                  container.setVisibility(!container.getVisibility(), true);
                }}
              />
              <div
                className={`
                  w-40 w-max-40 overflow-hidden text-ellipsis text-nowrap bg-
                `}
              >
                {container.getName()}
              </div>

              <OlRangeSlider
                value={container.getOpacity() * 100}
                min={0}
                max={100}
                onChange={(ev) => {
                  container.setOpacity(Number(ev.currentTarget.value) / 100);
                }}
                className={`my-auto ml-auto max-w-32`}
              ></OlRangeSlider>
            </div>
          </div>
          {openContainers.includes(container) && container.getSubContainers().map((container) => renderDrawingsContainerControls(container))}
          {openContainers.includes(container) &&
            container.getDrawings().map((drawing) => {
              if (drawing instanceof DCSEmptyLayer) return <></>;
              return (
                <div className="ml-4 flex justify-start gap-2">
                  <FontAwesomeIcon
                    icon={drawing.getVisibility() ? faEye : faEyeSlash}
                    className={`
                      my-auto w-6 cursor-pointer text-gray-400
                      transition-transform
                      hover:scale-125 hover:text-gray-200
                    `}
                    onClick={() => {
                      drawing.setVisibility(!drawing.getVisibility());
                    }}
                  />
                  <div className={`overflow-hidden text-ellipsis text-nowrap`}>{drawing.getName()}</div>
                </div>
              );
            })}
        </div>
      );
    } else {
      return <></>;
    }
  }

  return (
    <Menu
      open={props.open}
      title="Draw"
      onClose={props.onClose}
      canBeHidden={true}
      showBackButton={appSubState !== DrawSubState.NO_SUBSTATE}
      onBack={() => {
        getApp().getCoalitionAreasManager().setSelectedArea(null);
        getApp().setState(OlympusState.DRAW, DrawSubState.NO_SUBSTATE);
      }}
    >
      <>
        {appState === OlympusState.DRAW && appSubState === DrawSubState.NO_SUBSTATE && (
          <div className="flex flex-col gap-2 text-sm text-gray-400">
            <div className="flex flex-col bg-olympus-200/30">
              {coalitionAreas.map((coalitionArea) => {
                return (
                  <div
                    data-coalition={coalitionArea.getCoalition()}
                    className={`
                      flex cursor-pointer content-center border-l-4 px-4
                      text-base text-white
                      data-[coalition="blue"]:border-blue-500
                      data-[coalition="neutral"]:border-gray-500
                      data-[coalition="red"]:border-red-500
                      hover:bg-white/10
                    `}
                    onClick={() => {
                      coalitionArea.setSelected(true);
                      getApp().setState(OlympusState.DRAW, DrawSubState.EDIT);
                    }}
                  >
                    <div className="py-3">{coalitionArea.getLabelText()}</div>
                    <FaArrowUp
                      onClick={(ev) => {
                        ev.stopPropagation();
                        getApp().getCoalitionAreasManager().moveAreaUp(coalitionArea);
                      }}
                      className={`
                        my-auto ml-auto rounded-md p-2 text-3xl
                        hover:bg-white/10
                      `}
                    />
                    <FaArrowDown
                      onClick={(ev) => {
                        ev.stopPropagation();
                        getApp().getCoalitionAreasManager().moveCoalitionAreaDown(coalitionArea);
                      }}
                      className={`
                        my-auto rounded-md p-2 text-3xl
                        hover:bg-white/10
                      `}
                    />
                    <FaXmark
                      onClick={(ev) => {
                        ev.stopPropagation();
                        getApp().getCoalitionAreasManager().deleteCoalitionArea(coalitionArea);
                      }}
                      className={`
                        my-auto rounded-md p-2 text-3xl
                        hover:bg-red-500/50
                      `}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 p-6">
              <OlStateButton
                className="!w-full"
                icon={faDrawPolygon}
                checked={false}
                onClick={() => getApp().setState(OlympusState.DRAW, DrawSubState.DRAW_POLYGON)}
              >
                <div className="text-sm">Add polygon</div>
              </OlStateButton>
              <OlStateButton className="!w-full" icon={faCircle} checked={false} onClick={() => getApp().setState(OlympusState.DRAW, DrawSubState.DRAW_CIRCLE)}>
                <div className="text-sm">Add circle</div>
              </OlStateButton>
            </div>

            <div>
              <div className="flex flex-col gap-2 p-6">
                <div className="text-sm text-gray-400">Mission drawings</div>
                <OlSearchBar onChange={(search) => setSearchString(search)} text={searchString || ""}></OlSearchBar>
                <div className="flex flex-col gap-2">{mainDrawingsContainer.container && renderDrawingsContainerControls(mainDrawingsContainer.container)}</div>
              </div>
            </div>
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
                  className={`
                    cursor-pointer rounded-md bg-red-600 p-2
                    hover:bg-red-400
                  `}
                  onClick={() => {
                    getApp().getCoalitionAreasManager().deleteCoalitionArea(activeCoalitionArea);
                    getApp().setState(OlympusState.DRAW);
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
                coalition={activeCoalitionArea.getCoalition()}
                onClick={() => {
                  let newCoalition = "";
                  if (activeCoalitionArea.getCoalition() === "blue") newCoalition = "neutral";
                  else if (activeCoalitionArea.getCoalition() === "neutral") newCoalition = "red";
                  else if (activeCoalitionArea.getCoalition() === "red") newCoalition = "blue";
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
              <div
                className={`border-b-2 border-b-olympus-100 pb-4 text-gray-300`}
              >
                Automatic IADS generation
              </div>
              <OlDropdown className="" label="Units types">
                {types.map((type, idx) => {
                  if (!(type in typesSelection)) {
                    typesSelection[type] = true;
                    setTypesSelection(deepCopyTable(typesSelection));
                  }

                  return (
                    <OlDropdownItem key={idx} className={`flex gap-4`}>
                      <OlCheckbox
                        checked={typesSelection[type]}
                        onChange={(ev) => {
                          typesSelection[type] = ev.currentTarget.checked;
                          setTypesSelection(deepCopyTable(typesSelection));
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
                    setErasSelection(deepCopyTable(erasSelection));
                  }

                  return (
                    <OlDropdownItem className={`flex gap-4`}>
                      <OlCheckbox
                        checked={erasSelection[era]}
                        onChange={(ev) => {
                          erasSelection[era] = ev.currentTarget.checked;
                          setErasSelection(deepCopyTable(erasSelection));
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
                    setRangesSelection(deepCopyTable(rangesSelection));
                  }

                  return (
                    <OlDropdownItem className={`flex gap-4`}>
                      <OlCheckbox
                        checked={rangesSelection[range]}
                        onChange={(ev) => {
                          rangesSelection[range] = ev.currentTarget.checked;
                          setErasSelection(deepCopyTable(rangesSelection));
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

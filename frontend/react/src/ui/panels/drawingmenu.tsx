import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { FaArrowDown, FaArrowUp, FaChevronRight, FaTrash } from "react-icons/fa";
import { getApp } from "../../olympusapp";
import { OlStateButton } from "../components/olstatebutton";
import { faDrawPolygon, faEye, faEyeSlash, faMapLocation } from "@fortawesome/free-solid-svg-icons";
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
import { FaCopy, FaPencil, FaRegCompass, FaXmark } from "react-icons/fa6";
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
  const [navpointsContainer, setNavpointsContainer] = useState({ container: null } as { container: null | DCSDrawingsContainer });
  const [searchString, setSearchString] = useState("");
  const [navpointSearchString, setNavpointSearchString] = useState("");

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setAppState(state);
      setAppSubState(subState);
    });
    DrawingsInitEvent.on((drawingContainer, navpointsContainer) => {
      setDrawingsContainer({ container: drawingContainer });
      setNavpointsContainer({ container: navpointsContainer });
    });
    DrawingsUpdatedEvent.on(() => {
      setDrawingsContainer({ container: getApp().getDrawingsManager().getDrawingsContainer() });
      setNavpointsContainer({ container: getApp().getDrawingsManager().getNavpointsContainer() });
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

  function renderDrawingsContainerControls(container: DCSDrawingsContainer, containerSearchString: string) {
    if (container.hasSearchString(containerSearchString)) {
      /* The following snippet automatically open containers that contains searched drawings */
      if (!openContainers.includes(container) && containerSearchString != "") {
        openContainers.push(container);
        setOpenContainers([...openContainers]);
      }

      return (
        <div className="ml-2 flex flex-col gap-2" key={container.getGuid()}>
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
                  if (container === mainDrawingsContainer.container) {
                    getApp().getMap().setOption("showMissionDrawings", !getApp().getMap().getOptions().showMissionDrawings);
                  } else {
                    container.setVisibility(!container.getVisibility(), true);
                  }
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
          {openContainers.includes(container) &&
            container.getSubContainers().map((container) => renderDrawingsContainerControls(container, containerSearchString))}
          {openContainers.includes(container) &&
            container.getDrawings().map((drawing, index) => {
              if (drawing instanceof DCSEmptyLayer) return <></>;
              if (!drawing.getName().toLowerCase().includes(containerSearchString.toLowerCase())) return <></>;
              return (
                <div className="ml-4 flex justify-start gap-2" key={index}>
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
                  <FontAwesomeIcon
                    icon={faMapLocation}
                    className={`
                      ml-auto cusor-pointer transition-transform
                      hover:scale-125
                    `}
                    onClick={() => {
                      const latLng = drawing.getLayer()["getLatLng"] && drawing.getLayer()["getLatLng"]();
                      const bounds = drawing.getLayer()["getBounds"] && drawing.getLayer()["getBounds"]();
                      latLng && getApp().getMap().setView(latLng, 14);
                      bounds && getApp().getMap().fitBounds(bounds);
                    }}
                  />
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
      showBackButton={appSubState !== DrawSubState.NO_SUBSTATE}
      onBack={() => {
        getApp().getCoalitionAreasManager().setSelectedArea(null);
        getApp().setState(OlympusState.DRAW, DrawSubState.NO_SUBSTATE);
      }}
      wiki={() => {
        return (
          <div
            className={`
              h-full flex-col overflow-auto p-4 text-gray-400 no-scrollbar flex
              gap-2
            `}
          >
            <h2 className="mb-4 font-bold">Drawing menu</h2>
            <div>
              The drawing menu allows you to create and manage custom drawings, such as polygons and circles, and to generate IADS (Integrated Air Defense
              System) areas. Moreover, you can manage the visibility and opacity of mission drawings, i.e. drawings from the Mission Editor.
            </div>
            <h2 className="my-4 font-bold">Custom drawings and IADS</h2>
            <div>
              To create a custom drawing, click on the 'Add polygon' or 'Add circle' buttons, then click on the map to add polygons or to move the drawing.
              Double-click on the map to finish your creation. You can then edit the drawing by clicking on it. You can also move it up or down in the list, or
              delete it.
            </div>
            <div>
              You can change the name and the coalition of the area. You can also generate an IADS area by selecting the types, eras, and ranges of units you
              want to include in the area. You can also set the density and distribution of the IADS. If you check the 'Force coalition appropriate units' box,
              the IADS will only include units that are appropriate for the coalition of the area (e.g. Hawk SAMs for {""}
              <span className="text-blue-500">blue</span> and SA-6 SAMs for <span className={`
                text-red-500
              `}>red</span>
              ).
            </div>
            <div>
              The IADS generator will create a random distribution of units in the area, based on the density and distribution you set. Units will be
              concentrated around cities, and airbases that belong to the selected coalition.
            </div>
            <h2 className="my-4 font-bold">Mission drawings</h2>
            <div>
              You can manage the visibility and opacity of mission drawings by clicking on the eye icon. Moreover, you can change the opacity of the drawing by
              using the slider. You can also hide or show all the drawings in a container.
            </div>
            <div>
              You can search for a specific drawing by typing in the search bar. The search is case-insensitive and will match any part of the drawing name.
            </div>
            <div>Any change you make is persistent and will be saved for the next time you reload Olympus, as long as the DCS mission was not restarted.</div>
          </div>
        );
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
                <div
                  className={`flex flex-row items-center text-sm text-gray-400`}
                >
                  <span
                    className={`
                      mr-2 px-1 py-1 text-center font-bold text-olympus-700
                      text-white
                    `}
                  >
                    <FaPencil />
                  </span>
                  Mission drawings
                </div>
                <OlSearchBar
                  key="main-search"
                  onChange={(search) => {
                    setSearchString(search);
                    if (search === "") {
                      setOpenContainers([]);
                    }
                  }}
                  text={searchString || ""}
                ></OlSearchBar>
                <div className="flex flex-col gap-2">
                  {mainDrawingsContainer.container && renderDrawingsContainerControls(mainDrawingsContainer.container, searchString)}
                </div>
              </div>

              <div className="flex flex-col gap-2 p-6">
                <div
                  className={`flex flex-row items-center text-sm text-gray-400`}
                >
                  <span
                    className={`
                      mr-2 px-1 py-1 text-center font-bold text-olympus-700
                      text-white
                    `}
                  >
                    <FaRegCompass />
                  </span>
                  Navpoints
                </div>
                <OlSearchBar
                  key="navpoint-search"
                  onChange={(search) => {
                    setNavpointSearchString(search);
                    if (search === "") {
                      setOpenContainers([]);
                    }
                  }}
                  text={navpointSearchString || ""}
                ></OlSearchBar>
                <div className="flex flex-col gap-2">
                  {navpointsContainer.container && renderDrawingsContainerControls(navpointsContainer.container, navpointSearchString)}
                </div>
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
              <OlDropdown className="" label="Units types" disableAutoClose={true}>
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
              <OlDropdown className="" label="Units eras" disableAutoClose={true}>
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
              <OlDropdown className="" label="Units ranges" disableAutoClose={true}>
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

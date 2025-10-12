import React, { useState, useEffect, useCallback, useRef } from "react";
import { OlUnitSummary } from "../components/olunitsummary";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { OlNumberInput } from "../components/olnumberinput";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { OlRangeSlider } from "../components/olrangeslider";
import { OlDropdownItem, OlDropdown } from "../components/oldropdown";
import { LoadoutBlueprint, SpawnRequestTable, UnitBlueprint } from "../../interfaces";
import { OlStateButton } from "../components/olstatebutton";
import { Coalition } from "../../types/types";
import { getApp } from "../../olympusapp";
import { deepCopyTable, deg2rad, ftToM, hash, mode, normalizeAngle } from "../../other/utils";
import { LatLng } from "leaflet";
import { Airbase } from "../../mission/airbase";
import { altitudeIncrements, groupUnitCount, maxAltitudeValues, minAltitudeValues, OlympusState, SpawnSubState } from "../../constants/constants";
import { faArrowLeft, faStar } from "@fortawesome/free-solid-svg-icons";
import { OlStringInput } from "../components/olstringinput";
import { countryCodes } from "../data/codes";
import { OlAccordion } from "../components/olaccordion";
import { AppStateChangedEvent, SpawnHeadingChangedEvent } from "../../events";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaQuestionCircle } from "react-icons/fa";
import { OlExpandingTooltip } from "../components/olexpandingtooltip";
import { WeaponsWizard } from "./components/weaponswizard";
import { LoadoutViewer } from "./components/loadoutviewer";

enum OpenAccordion {
    NONE,
    LOADOUT,
    UNIT_SUMMARY,
    ADVANCED_OPTIONS,
    LOADOUT_WIZARD,
}

export function UnitSpawnMenu(props: {
    visible: boolean;
    compact: boolean;
    starredSpawns: { [key: string]: SpawnRequestTable };
    blueprint: UnitBlueprint | null;
    airbase?: Airbase | null;
    latlng?: LatLng | null;
    coalition?: Coalition;
    onBack?: () => void;
}) {
    /* Compute the min and max values depending on the unit type */
    const minNumber = 1;
    const maxNumber = groupUnitCount[props.blueprint?.category ?? "aircraft"];
    const minAltitude = minAltitudeValues[props.blueprint?.category ?? "aircraft"];
    const maxAltitude = maxAltitudeValues[props.blueprint?.category ?? "aircraft"];
    const altitudeStep = altitudeIncrements[props.blueprint?.category ?? "aircraft"];

    /* State initialization */
    const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
    const [spawnCoalition, setSpawnCoalition] = useState("blue" as Coalition);
    const [spawnNumber, setSpawnNumber] = useState(1);
    const [spawnRole, setSpawnRole] = useState("");
    const [spawnLoadout, setSpawnLoadout] = useState(null as null | LoadoutBlueprint);
    const [spawnAltitude, setSpawnAltitude] = useState((maxAltitude - minAltitude) / 2);
    const [spawnAltitudeType, setSpawnAltitudeType] = useState(false);
    const [spawnLiveryID, setSpawnLiveryID] = useState("");
    const [spawnSkill, setSpawnSkill] = useState("High");
    const [selectedWeapons, setSelectedWeapons] = useState([] as string[]);
    const [quickAccessName, setQuickAccessName] = useState("Preset 1");
    const [key, setKey] = useState("");
    const [spawnRequestTable, setSpawnRequestTable] = useState(null as null | SpawnRequestTable);

    const [openAccordion, setOpenAccordion] = useState(OpenAccordion.NONE);
    const [showLoadout, setShowLoadout] = useState(false);

    useEffect(() => {
        setAppState(getApp()?.getState());
        AppStateChangedEvent.on((state, subState) => setAppState(state));
    }, []);

    useEffect(() => {
        setSpawnRole("");
        setSpawnLoadout(null);
        setSpawnLiveryID("");
    }, [props.blueprint]);

    /* When the menu is opened show the unit preview on the map as a cursor */
    const setSpawnRequestTableCallback = useCallback(() => {
        if (spawnRequestTable) {
            /* Refresh the unique key identified */
            const tempTable = deepCopyTable(spawnRequestTable);
            delete tempTable.quickAccessName;
            delete tempTable.unit.location;
            delete tempTable.unit.altitude;
            const newKey = hash(JSON.stringify(spawnRequestTable));
            setKey(newKey);

            getApp()?.getMap()?.setSpawnRequestTable(spawnRequestTable);
            if (!props.airbase && !props.latlng && appState === OlympusState.SPAWN) getApp().setState(OlympusState.SPAWN, SpawnSubState.SPAWN_UNIT);
        }
    }, [spawnRequestTable, appState]);
    useEffect(setSpawnRequestTableCallback, [spawnRequestTable]);

    /* Callback and effect to update the quick access name of the starredSpawn */
    const updateStarredSpawnQuickAccessName = useCallback(() => {
        if (key in props.starredSpawns) props.starredSpawns[key].quickAccessName = quickAccessName;
    }, [props.starredSpawns, key, quickAccessName]);
    useEffect(updateStarredSpawnQuickAccessName, [quickAccessName]);

    /* Callback and effect to update the quick access name in the input field */
    const updateQuickAccessName = useCallback(() => {
        if (!props.airbase) {
            /* If the spawn is starred, set the quick access name */
            if (key in props.starredSpawns && props.starredSpawns[key].quickAccessName) setQuickAccessName(props.starredSpawns[key].quickAccessName);
            else setQuickAccessName(`Preset ${Object.keys(props.starredSpawns).length + 1}`);
        }
    }, [props.starredSpawns, key]);
    useEffect(updateQuickAccessName, [key]);

    /* Callback and effect to update the spawn request table */
    const updateSpawnRequestTable = useCallback(() => {
        if (props.blueprint !== null) {
            setSpawnRequestTable({
                category: props.blueprint?.category,
                unit: {
                    unitType: props.blueprint?.name,
                    location: props.latlng ?? new LatLng(0, 0), // This will be filled when the user clicks on the map to spawn the unit
                    skill: spawnSkill,
                    liveryID: spawnLiveryID,
                    altitude: ftToM(spawnAltitude),
                    loadout: props.blueprint?.loadouts?.find((loadout) => loadout.name === spawnLoadout?.name)?.code ?? "",
                },
                amount: spawnNumber,
                coalition: spawnCoalition,
            });
        }
    }, [props.blueprint, props.latlng, spawnAltitude, spawnLoadout, spawnCoalition, spawnNumber, spawnLiveryID, spawnSkill]);
    useEffect(updateSpawnRequestTable, [props.blueprint, props.latlng, spawnAltitude, spawnLoadout, spawnCoalition, spawnNumber, spawnLiveryID, spawnSkill]);

    /* Effect to update the coalition if it is forced externally */
    useEffect(() => {
        if (props.coalition) setSpawnCoalition(props.coalition);
    }, [props.coalition]);

    /* Effect to update the initial altitude when the blueprint changes */
    useEffect(() => {
        setSpawnAltitude((maxAltitude - minAltitude) / 2);
    }, [props.blueprint]);

    /* Heading compass */
    const [compassAngle, setCompassAngle] = useState(0);
    const compassRef = useRef<HTMLImageElement>(null);

    const updateSpawnRequestTableHeading = useCallback(() => {
        getApp()?.getMap().setSpawnHeading(compassAngle);
    }, [compassAngle]);
    useEffect(updateSpawnRequestTableHeading, [compassAngle]);

    useEffect(() => {
        SpawnHeadingChangedEvent.on((heading) => {
            setCompassAngle(heading);
        });
    }, []);

    useEffect(() => {
        setCompassAngle(getApp()?.getMap().getSpawnHeading() ?? 0);
    }, [appState]);

    useEffect(() => {
        setSelectedWeapons([]);

        // Choose the first loadout that matches the selected role that is not empty
        const loadout = props.blueprint?.loadouts?.filter((loadout) => loadout.name !== "Empty loadout").find((loadout) => loadout.roles.includes(spawnRole));
        if (loadout) {
            setSpawnLoadout(loadout);
            //setSelectedWeapons(loadout.items.map((item) => item.name));
        }

        // When the role changes, set the selected weapons to the weapons contained in the first loadout of that type
        // Commented out for usability tests
        //const loadout = loadouts.filter((loadout) => loadout.name !== "Empty loadout").find((loadout) => loadout.roles.includes(spawnRole));
        //if (loadout) {
        //    setSelectedWeapons(loadout.items.map((item) => item.name));
        //}
    }, [spawnRole]);

    useEffect(() => {
        // Select the first loadout that contains all the selected weapons
        if (selectedWeapons.length > 0) {
            const loadout = props.blueprint?.loadouts?.find((loadout) => selectedWeapons.every((weapon) => loadout.items.some((item) => item.name === weapon)));
            if (loadout) setSpawnLoadout(loadout);
        }
    }, [selectedWeapons]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const onMouseMove = (e: MouseEvent) => {
            if (compassRef.current) {
                const rect = compassRef.current.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
                setCompassAngle(Math.round(normalizeAngle(angle + 90)));
            }
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    /* Get a list of all the roles */
    const roles: string[] = [];
    props.blueprint?.loadouts?.forEach((loadout) => {
        loadout.roles.forEach((role) => {
            !roles.includes(role) && roles.push(role);
        });
    });

    /* Initialize the role */
    let allRoles = props.blueprint?.loadouts?.flatMap((loadout) => loadout.roles).filter((role) => role !== "No task");
    let mainRole = roles[0];
    if (allRoles !== undefined) mainRole = mode(allRoles);
    spawnRole === "" && roles.length > 0 && setSpawnRole(mainRole);

    /* Make a list of all the available weapons */
    let allWeapons: { [key: string]: string } = {};
    props.blueprint?.loadouts?.forEach((loadout) => {
        loadout.items.forEach((item) => {
            allWeapons[item.name] = item.type;
        });
    });

    // List the loadouts that contain all the selected weapons
    let filteredLoadouts: LoadoutBlueprint[] = [];
    if (selectedWeapons.length > 0) {
        props.blueprint?.loadouts?.forEach((loadout) => {
            let loadoutWeaponNames = loadout.items.map((item) => item.name);
            if (selectedWeapons.every((weapon) => loadoutWeaponNames.includes(weapon))) {
                filteredLoadouts.push(loadout);
            }
        });
    } else filteredLoadouts = props.blueprint?.loadouts ?? [];

    /* Organize the weapons by type */
    let weaponsByType: { [key: string]: { name: string; available: boolean }[] } = {};
    Object.keys(allWeapons).forEach((weaponName) => {
        // Set which weapons are available and which are not by checking if they are in any of the filtered loadouts
        const isAvailable = filteredLoadouts.some((loadout) => loadout.items.some((item) => item.name === weaponName));
        const weaponType = allWeapons[weaponName];
        if (weaponType in weaponsByType) weaponsByType[weaponType].push({ name: weaponName, available: isAvailable });
        else weaponsByType[weaponType] = [{ name: weaponName, available: isAvailable }];
    });

    return (
        <>
            {props.compact ? (
                <>
                    {props.visible && (
                        <div
                            className={`
                              flex max-h-[800px] flex-col overflow-auto
                            `}
                        >
                            <div className="mr-2">
                                <div className="flex h-fit flex-col gap-3">
                                    <div className="flex">
                                        <FontAwesomeIcon
                                            onClick={props.onBack}
                                            icon={faArrowLeft}
                                            className={`
                                              my-auto mr-1 h-4 cursor-pointer
                                              rounded-md p-2
                                              dark:text-gray-500
                                              dark:hover:bg-gray-700
                                              dark:hover:text-white
                                            `}
                                        />
                                        <h5 className="my-auto text-gray-200">{props.blueprint?.label}</h5>
                                        <OlNumberInput
                                            className={"ml-auto"}
                                            value={spawnNumber}
                                            min={minNumber}
                                            max={maxNumber}
                                            onDecrease={() => {
                                                setSpawnNumber(Math.max(minNumber, spawnNumber - 1));
                                            }}
                                            onIncrease={() => {
                                                setSpawnNumber(Math.min(maxNumber, spawnNumber + 1));
                                            }}
                                            onChange={(ev) => {
                                                !isNaN(Number(ev.target.value)) &&
                                                    setSpawnNumber(Math.max(minNumber, Math.min(maxNumber, Number(ev.target.value))));
                                            }}
                                        />
                                    </div>
                                    <div
                                        className={`
                                          inline-flex w-full flex-row
                                          content-center justify-between gap-2
                                        `}
                                    >
                                        <div
                                            className={`
                                              my-auto text-sm text-white
                                            `}
                                        >
                                            Quick access:{" "}
                                        </div>
                                        <OlStringInput
                                            onChange={(e) => {
                                                setQuickAccessName(e.target.value);
                                            }}
                                            value={quickAccessName}
                                        />
                                        <OlStateButton
                                            onClick={() => {
                                                if (spawnRequestTable) {
                                                    spawnRequestTable.unit.heading = compassAngle;
                                                    if (key in props.starredSpawns) getApp().getMap().removeStarredSpawnRequestTable(key);
                                                    else getApp().getMap().addStarredSpawnRequestTable(key, spawnRequestTable, quickAccessName);
                                                }
                                            }}
                                            tooltip={() => (
                                                <OlExpandingTooltip
                                                    title="Add this spawn to quick access"
                                                    content="Enter a name and click on the button to later be able to quickly respawn a unit with the same configuration."
                                                />
                                            )}
                                            checked={key in props.starredSpawns}
                                            icon={faStar}
                                        ></OlStateButton>
                                    </div>
                                    {["aircraft", "helicopter"].includes(props.blueprint?.category ?? "aircraft") && (
                                        <>
                                            {!props.airbase && (
                                                <div>
                                                    <div
                                                        className={`
                                                          flex flex-row
                                                          content-center
                                                          items-center
                                                          justify-between
                                                        `}
                                                    >
                                                        <div
                                                            className={`
                                                              flex flex-col
                                                            `}
                                                        >
                                                            <span
                                                                className={`
                                                                  font-normal
                                                                  dark:text-gray-400
                                                                `}
                                                            >
                                                                Altitude
                                                            </span>
                                                            <span
                                                                className={`
                                                                  font-bold
                                                                  dark:text-blue-500
                                                                `}
                                                            >{`${Intl.NumberFormat("en-US").format(spawnAltitude)} FT`}</span>
                                                        </div>
                                                        <OlLabelToggle
                                                            toggled={spawnAltitudeType}
                                                            leftLabel={"AGL"}
                                                            rightLabel={"ASL"}
                                                            onClick={() => setSpawnAltitudeType(!spawnAltitudeType)}
                                                            tooltip={() => (
                                                                <OlExpandingTooltip
                                                                    title="Select altitude type"
                                                                    content="If AGL is selected, the aircraft will be spawned at the selected altitude above the ground. If ASL is selected, the aircraft will be spawned at the selected altitude above sea level."
                                                                />
                                                            )}
                                                            tooltipRelativeToParent={true}
                                                        />
                                                    </div>
                                                    <OlRangeSlider
                                                        onChange={(ev) => setSpawnAltitude(Number(ev.target.value))}
                                                        value={spawnAltitude}
                                                        min={minAltitude}
                                                        max={maxAltitude}
                                                        step={altitudeStep}
                                                    />
                                                </div>
                                            )}
                                            <div
                                                className={`
                                                  flex content-center
                                                  justify-between gap-2
                                                `}
                                            >
                                                <span
                                                    className={`
                                                      my-auto font-normal
                                                      dark:text-gray-400
                                                    `}
                                                >
                                                    Role
                                                </span>
                                                <OlDropdown
                                                    label={spawnRole}
                                                    className="w-64"
                                                    tooltip={() => (
                                                        <OlExpandingTooltip
                                                            title="Role of the spawned unit"
                                                            content="This selection has no effect on what the spawned unit will actually perform, and you will have total control on it. However, it is used to filter what loadouts are available."
                                                        />
                                                    )}
                                                    tooltipRelativeToParent={true}
                                                >
                                                    {roles.map((role) => {
                                                        return (
                                                            <OlDropdownItem
                                                                onClick={() => {
                                                                    setSpawnRole(role);
                                                                }}
                                                                className={`
                                                                  w-full
                                                                `}
                                                                key={role}
                                                            >
                                                                {role}
                                                            </OlDropdownItem>
                                                        );
                                                    })}
                                                </OlDropdown>
                                            </div>
                                        </>
                                    )}
                                    <OlAccordion
                                        onClick={() => {
                                            setOpenAccordion(
                                                openAccordion === OpenAccordion.ADVANCED_OPTIONS ? OpenAccordion.NONE : OpenAccordion.ADVANCED_OPTIONS
                                            );
                                        }}
                                        open={openAccordion === OpenAccordion.ADVANCED_OPTIONS}
                                        title="Advanced options"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div
                                                className={`
                                                  flex content-center
                                                  justify-between gap-2
                                                `}
                                            >
                                                <span
                                                    className={`
                                                      my-auto font-normal
                                                      dark:text-gray-400
                                                    `}
                                                >
                                                    Livery
                                                </span>
                                                <OlDropdown
                                                    label={
                                                        props.blueprint?.liveries ? (props.blueprint?.liveries[spawnLiveryID]?.name ?? "Default") : "No livery"
                                                    }
                                                    className={`w-64`}
                                                    tooltip={() => (
                                                        <OlExpandingTooltip
                                                            title="Unit livery"
                                                            content="Selects the livery of the spawned unit. This is a purely cosmetic option."
                                                        />
                                                    )}
                                                    tooltipRelativeToParent={true}
                                                >
                                                    {props.blueprint?.liveries &&
                                                        Object.keys(props.blueprint?.liveries)
                                                            .sort((ida, idb) => {
                                                                if (props.blueprint?.liveries) {
                                                                    if (props.blueprint?.liveries[ida].countries.length > 1) return 1;
                                                                    return props.blueprint?.liveries[ida].countries[0] >
                                                                        props.blueprint?.liveries[idb].countries[0]
                                                                        ? 1
                                                                        : -1;
                                                                } else return -1;
                                                            })
                                                            .map((id) => {
                                                                let country = Object.values(countryCodes).find((countryCode) => {
                                                                    if (
                                                                        props.blueprint?.liveries &&
                                                                        countryCode.liveryCodes?.includes(props.blueprint?.liveries[id].countries[0])
                                                                    )
                                                                        return true;
                                                                });
                                                                return (
                                                                    <OlDropdownItem
                                                                        onClick={() => {
                                                                            setSpawnLiveryID(id);
                                                                        }}
                                                                        className={`
                                                                          w-full
                                                                        `}
                                                                        key={id}
                                                                    >
                                                                        <span
                                                                            className={`
                                                                              w-full
                                                                              content-center
                                                                              overflow-hidden
                                                                              text-ellipsis
                                                                              text-nowrap
                                                                              text-left
                                                                              w-max-full
                                                                              flex
                                                                              gap-2
                                                                            `}
                                                                        >
                                                                            {props.blueprint?.liveries &&
                                                                                props.blueprint?.liveries[id].countries.length == 1 && (
                                                                                    <img
                                                                                        src={`images/countries/${country?.flagCode.toLowerCase()}.svg`}
                                                                                        className={`
                                                                                          h-6
                                                                                        `}
                                                                                    />
                                                                                )}

                                                                            <div
                                                                                className={`
                                                                                  my-auto
                                                                                  truncate
                                                                                `}
                                                                            >
                                                                                <span
                                                                                    className={`
                                                                                      w-full
                                                                                      overflow-hidden
                                                                                      text-left
                                                                                      w-max-full
                                                                                    `}
                                                                                >
                                                                                    {props.blueprint?.liveries ? props.blueprint?.liveries[id].name : ""}
                                                                                </span>
                                                                            </div>
                                                                        </span>
                                                                    </OlDropdownItem>
                                                                );
                                                            })}
                                                </OlDropdown>
                                            </div>
                                            <div
                                                className={`
                                                  flex content-center
                                                  justify-between gap-2
                                                `}
                                            >
                                                <span
                                                    className={`
                                                      my-auto font-normal
                                                      dark:text-gray-400
                                                    `}
                                                >
                                                    Skill
                                                </span>
                                                <OlDropdown
                                                    label={spawnSkill}
                                                    className={`w-64`}
                                                    tooltip={() => (
                                                        <OlExpandingTooltip
                                                            title="Unit skill"
                                                            content="Selects the skill of the spawned unit. Depending on the selection, the unit will be more precise and effective at its mission. Usually a lower level is selected to generate a more forgiving mission."
                                                        />
                                                    )}
                                                    tooltipRelativeToParent={true}
                                                >
                                                    {["Average", "Good", "High", "Excellent"].map((skill) => {
                                                        return (
                                                            <OlDropdownItem
                                                                onClick={() => {
                                                                    setSpawnSkill(skill);
                                                                }}
                                                                className={`
                                                                  w-full
                                                                `}
                                                                key={skill}
                                                            >
                                                                <span
                                                                    className={`
                                                                      w-full
                                                                      content-center
                                                                      overflow-hidden
                                                                      text-ellipsis
                                                                      text-nowrap
                                                                      text-left
                                                                      w-max-full
                                                                      flex gap-2
                                                                    `}
                                                                >
                                                                    <div
                                                                        className={`
                                                                          my-auto
                                                                        `}
                                                                    >
                                                                        {skill}
                                                                    </div>
                                                                </span>
                                                            </OlDropdownItem>
                                                        );
                                                    })}
                                                </OlDropdown>
                                            </div>
                                        </div>
                                        <div
                                            className={`
                                              my-5 flex justify-between
                                            `}
                                        >
                                            <div
                                                className={`
                                                  my-auto flex flex-col gap-2
                                                `}
                                            >
                                                <span>Spawn heading</span>
                                                <div
                                                    className={`
                                                      flex gap-1 text-sm
                                                      text-gray-400
                                                    `}
                                                >
                                                    <FaQuestionCircle
                                                        className={`
                                                      my-auto
                                                    `}
                                                    />{" "}
                                                    <div
                                                        className={`
                          my-auto
                        `}
                                                    >
                                                        Drag to change
                                                    </div>
                                                </div>
                                            </div>

                                            <OlNumberInput
                                                className={"my-auto"}
                                                min={0}
                                                max={360}
                                                onChange={(ev) => {
                                                    setCompassAngle(Number(ev.target.value));
                                                }}
                                                onDecrease={() => {
                                                    setCompassAngle(normalizeAngle(compassAngle - 1));
                                                }}
                                                onIncrease={() => {
                                                    setCompassAngle(normalizeAngle(compassAngle + 1));
                                                }}
                                                value={compassAngle}
                                                tooltip={() => (
                                                    <OlExpandingTooltip
                                                        title="Spawn heading"
                                                        content="This controls the direction the unit will face when spanwned. This is important for units that take longer to change direction, like ships. Air units and helicopters will enter a orbit with its major axis aligned with the spawn heading. Drag the compass to change the heading."
                                                    />
                                                )}
                                                tooltipRelativeToParent={true}
                                            />

                                            <div
                                                className={`
                                                  relative mr-3 h-[60px]
                                                  w-[60px]
                                                `}
                                            >
                                                <img
                                                    className="absolute"
                                                    ref={compassRef}
                                                    onMouseDown={handleMouseDown}
                                                    src={"images/others/arrow_background.png"}
                                                ></img>
                                                <img
                                                    className="absolute left-0"
                                                    ref={compassRef}
                                                    onMouseDown={handleMouseDown}
                                                    src={"images/others/arrow.png"}
                                                    style={{
                                                        width: "60px",
                                                        height: "60px",
                                                        transform: `rotate(${compassAngle}deg)`,
                                                        cursor: "pointer",
                                                    }}
                                                ></img>
                                            </div>
                                        </div>
                                    </OlAccordion>
                                </div>
                                <OlAccordion
                                    onClick={() => {
                                        setOpenAccordion(openAccordion === OpenAccordion.UNIT_SUMMARY ? OpenAccordion.NONE : OpenAccordion.UNIT_SUMMARY);
                                    }}
                                    open={openAccordion === OpenAccordion.UNIT_SUMMARY}
                                    title="Unit summary"
                                >
                                    {props.blueprint ? <OlUnitSummary blueprint={props.blueprint} coalition={spawnCoalition} /> : <span></span>}
                                </OlAccordion>

                                <OlAccordion
                                    onClick={() => {
                                        setOpenAccordion(openAccordion === OpenAccordion.LOADOUT ? OpenAccordion.NONE : OpenAccordion.LOADOUT);
                                    }}
                                    open={openAccordion === OpenAccordion.LOADOUT}
                                    title="Loadout wizard"
                                >
                                    <WeaponsWizard selectedWeapons={selectedWeapons} setSelectedWeapons={setSelectedWeapons} weaponsByType={weaponsByType} />
                                </OlAccordion>

                                {spawnLoadout && spawnLoadout.items.length > 0 && (
                                    <OlAccordion
                                        onClick={() => {
                                            setShowLoadout(!showLoadout);
                                        }}
                                        open={showLoadout}
                                        title="Loadout"
                                    >
                                        <LoadoutViewer spawnLoadout={spawnLoadout} />
                                    </OlAccordion>
                                )}

                                {(props.latlng || props.airbase) && (
                                    <button
                                        type="button"
                                        data-coalition={props.coalition ?? "blue"}
                                        className={`
                                          m-2 rounded-lg px-5 py-2.5 text-sm
                                          font-medium text-white
                                          data-[coalition='blue']:bg-blue-600
                                          data-[coalition='neutral']:bg-gray-400
                                          data-[coalition='red']:bg-red-500
                                          focus:outline-none focus:ring-4
                                        `}
                                        onClick={() => {
                                            if (spawnRequestTable) {
                                                spawnRequestTable.unit.heading = deg2rad(compassAngle);
                                                getApp()
                                                    .getUnitsManager()
                                                    .spawnUnits(
                                                        spawnRequestTable.category,
                                                        Array(spawnRequestTable.amount)
                                                            .fill(spawnRequestTable.unit)
                                                            .map((unit, index) => {
                                                                return {
                                                                    ...unit,
                                                                    location: new LatLng(
                                                                        unit.location.lat +
                                                                            (spawnRequestTable?.category === "groundunit" ? 0.00025 * index : 0.005 * index),
                                                                        unit.location.lng
                                                                    ),
                                                                    heading: unit.heading || 0,
                                                                };
                                                            }),
                                                        spawnRequestTable.coalition,
                                                        false,
                                                        props.airbase?.getName() ?? undefined
                                                    );
                                            }

                                            getApp().setState(OlympusState.IDLE);
                                        }}
                                    >
                                        Spawn
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {" "}
                    {props.visible && (
                        <div className="flex flex-col">
                            {props.blueprint && <OlUnitSummary blueprint={props.blueprint} coalition={spawnCoalition} />}
                            <div
                                className={`
                                  flex h-fit flex-col gap-5 px-5 pb-8 pt-6
                                `}
                            >
                                <div
                                    className={`
                                      inline-flex w-full flex-row content-center
                                      justify-between gap-2
                                    `}
                                >
                                    <div className="my-auto text-white">Quick access: </div>
                                    <OlStringInput
                                        onChange={(e) => {
                                            setQuickAccessName(e.target.value);
                                        }}
                                        value={quickAccessName}
                                    />
                                    <OlStateButton
                                        onClick={() => {
                                            if (spawnRequestTable) {
                                                spawnRequestTable.unit.heading = compassAngle;
                                                if (key in props.starredSpawns) getApp().getMap().removeStarredSpawnRequestTable(key);
                                                else getApp().getMap().addStarredSpawnRequestTable(key, spawnRequestTable, quickAccessName);
                                            }
                                        }}
                                        tooltip={() => (
                                            <OlExpandingTooltip
                                                title="Add this spawn to quick access"
                                                content="Enter a name and click on the button to later be able to quickly respawn a unit with the same configuration."
                                            />
                                        )}
                                        tooltipRelativeToParent={true}
                                        checked={key in props.starredSpawns}
                                        icon={faStar}
                                    ></OlStateButton>
                                </div>
                                <div
                                    className={`
                                      inline-flex w-full flex-row content-center
                                      justify-between gap-2
                                    `}
                                >
                                    {!props.coalition && (
                                        <>
                                            <div
                                                className={`
                                                  my-auto mr-2 text-white
                                                `}
                                            >
                                                Coalition:
                                            </div>
                                            <OlCoalitionToggle
                                                coalition={spawnCoalition}
                                                onClick={() => {
                                                    spawnCoalition === "blue" && setSpawnCoalition("neutral");
                                                    spawnCoalition === "neutral" && setSpawnCoalition("red");
                                                    spawnCoalition === "red" && setSpawnCoalition("blue");
                                                }}
                                                tooltip={() => (
                                                    <OlExpandingTooltip
                                                        title="Unit coalition"
                                                        content="Toggle between blue, neutral and red coalitions. Neutral coalition must be used to employ scenic functions like miss on purpose."
                                                    />
                                                )}
                                                tooltipRelativeToParent={true}
                                            />
                                        </>
                                    )}
                                    <div className="my-auto ml-auto text-white">Units: </div>
                                    <OlNumberInput
                                        className={"ml-2"}
                                        value={spawnNumber}
                                        min={minNumber}
                                        max={maxNumber}
                                        onDecrease={() => {
                                            setSpawnNumber(Math.max(minNumber, spawnNumber - 1));
                                        }}
                                        onIncrease={() => {
                                            setSpawnNumber(Math.min(maxNumber, spawnNumber + 1));
                                        }}
                                        onChange={(ev) => {
                                            !isNaN(Number(ev.target.value)) &&
                                                setSpawnNumber(Math.max(minNumber, Math.min(maxNumber, Number(ev.target.value))));
                                        }}
                                        tooltip={() => (
                                            <OlExpandingTooltip
                                                title="Select number of units"
                                                content="This is how many units of this type will be spawned. If more than one unit is spawned, a DCS group will be created: this means that the units will be spawned in a formation, and you will not be able to control them singularly. The entire group will act as a single entity."
                                            />
                                        )}
                                        tooltipRelativeToParent={true}
                                    />
                                </div>

                                {["aircraft", "helicopter"].includes(props.blueprint?.category ?? "aircraft") && (
                                    <>
                                        {!props.airbase && (
                                            <div>
                                                <div
                                                    className={`
                                                      flex flex-row
                                                      content-center
                                                      items-center
                                                      justify-between
                                                    `}
                                                >
                                                    <div
                                                        className={`
                                                          flex flex-col
                                                        `}
                                                    >
                                                        <span
                                                            className={`
                                                              font-normal
                                                              dark:text-gray-400
                                                            `}
                                                        >
                                                            Altitude
                                                        </span>
                                                        <span
                                                            className={`
                                                              font-bold
                                                              dark:text-blue-500
                                                            `}
                                                        >{`${Intl.NumberFormat("en-US").format(spawnAltitude)} FT`}</span>
                                                    </div>
                                                    <OlLabelToggle
                                                        toggled={spawnAltitudeType}
                                                        leftLabel={"AGL"}
                                                        rightLabel={"ASL"}
                                                        onClick={() => setSpawnAltitudeType(!spawnAltitudeType)}
                                                        tooltip={() => (
                                                            <OlExpandingTooltip
                                                                title="Select altitude type"
                                                                content="If AGL is selected, the aircraft will be spawned at the selected altitude above the ground. If ASL is selected, the aircraft will be spawned at the selected altitude above sea level."
                                                            />
                                                        )}
                                                        tooltipRelativeToParent={true}
                                                    />
                                                </div>
                                                <OlRangeSlider
                                                    onChange={(ev) => setSpawnAltitude(Number(ev.target.value))}
                                                    value={spawnAltitude}
                                                    min={minAltitude}
                                                    max={maxAltitude}
                                                    step={altitudeStep}
                                                />
                                            </div>
                                        )}
                                        <div
                                            className={`
                                              flex content-center
                                              justify-between gap-2
                                            `}
                                        >
                                            <span
                                                className={`
                                                  my-auto font-normal
                                                  dark:text-gray-400
                                                `}
                                            >
                                                Role
                                            </span>
                                            <OlDropdown
                                                label={spawnRole}
                                                className="w-64"
                                                tooltip={() => (
                                                    <OlExpandingTooltip
                                                        title="Role of the spawned unit"
                                                        content="This selection has no effect on what the spawned unit will actually perform, and you will have total control on it. However, it is used to filter what loadouts are available."
                                                    />
                                                )}
                                                tooltipRelativeToParent={true}
                                            >
                                                {roles.map((role) => {
                                                    return (
                                                        <OlDropdownItem
                                                            key={role}
                                                            onClick={() => {
                                                                setSpawnRole(role);
                                                            }}
                                                            className={`w-full`}
                                                        >
                                                            {role}
                                                        </OlDropdownItem>
                                                    );
                                                })}
                                            </OlDropdown>
                                        </div>
                                    </>
                                )}
                                <div
                                    className={`
                                      flex content-center justify-between gap-2
                                    `}
                                >
                                    <span
                                        className={`
                                          my-auto font-normal
                                          dark:text-gray-400
                                        `}
                                    >
                                        Livery
                                    </span>
                                    <OlDropdown
                                        label={props.blueprint?.liveries ? (props.blueprint?.liveries[spawnLiveryID]?.name ?? "Default") : "No livery"}
                                        className={`w-64`}
                                        tooltip={() => (
                                            <OlExpandingTooltip
                                                title="Unit livery"
                                                content="Selects the livery of the spawned unit. This is a purely cosmetic option."
                                            />
                                        )}
                                        tooltipRelativeToParent={true}
                                    >
                                        {props.blueprint?.liveries &&
                                            Object.keys(props.blueprint?.liveries)
                                                .sort((ida, idb) => {
                                                    if (props.blueprint?.liveries) {
                                                        if (props.blueprint?.liveries[ida].countries.length > 1) return 1;
                                                        return props.blueprint?.liveries[ida].countries[0] > props.blueprint?.liveries[idb].countries[0]
                                                            ? 1
                                                            : -1;
                                                    } else return -1;
                                                })
                                                .map((id) => {
                                                    let country = Object.values(countryCodes).find((countryCode) => {
                                                        if (
                                                            props.blueprint?.liveries &&
                                                            countryCode.liveryCodes?.includes(props.blueprint?.liveries[id].countries[0])
                                                        )
                                                            return true;
                                                    });
                                                    return (
                                                        <OlDropdownItem
                                                            key={id}
                                                            onClick={() => {
                                                                setSpawnLiveryID(id);
                                                            }}
                                                            className={`w-full`}
                                                        >
                                                            <span
                                                                className={`
                                                                  w-full
                                                                  content-center
                                                                  overflow-hidden
                                                                  text-ellipsis
                                                                  text-nowrap
                                                                  text-left
                                                                  w-max-full
                                                                  flex gap-2
                                                                `}
                                                            >
                                                                {props.blueprint?.liveries && props.blueprint?.liveries[id].countries.length == 1 && (
                                                                    <img
                                                                        src={`images/countries/${country?.flagCode.toLowerCase()}.svg`}
                                                                        className={`
                                                                          h-6
                                                                        `}
                                                                    />
                                                                )}

                                                                <div
                                                                    className={`
                                                                      my-auto
                                                                      truncate
                                                                    `}
                                                                >
                                                                    <span
                                                                        className={`
                                                                          w-full
                                                                          overflow-hidden
                                                                          text-left
                                                                          w-max-full
                                                                        `}
                                                                    >
                                                                        {props.blueprint?.liveries ? props.blueprint?.liveries[id].name : ""}
                                                                    </span>
                                                                </div>
                                                            </span>
                                                        </OlDropdownItem>
                                                    );
                                                })}
                                    </OlDropdown>
                                </div>
                                <div
                                    className={`
                                      flex content-center justify-between gap-2
                                    `}
                                >
                                    <span
                                        className={`
                                          my-auto font-normal
                                          dark:text-gray-400
                                        `}
                                    >
                                        Skill
                                    </span>
                                    <OlDropdown
                                        label={spawnSkill}
                                        className={`w-64`}
                                        tooltip={() => (
                                            <OlExpandingTooltip
                                                title="Unit skill"
                                                content="Selects the skill of the spawned unit. Depending on the selection, the unit will be more precise and effective at its mission. Usually a lower level is selected to generate a more forgiving mission."
                                            />
                                        )}
                                        tooltipRelativeToParent={true}
                                    >
                                        {["Average", "Good", "High", "Excellent"].map((skill) => {
                                            return (
                                                <OlDropdownItem
                                                    key={skill}
                                                    onClick={() => {
                                                        setSpawnSkill(skill);
                                                    }}
                                                    className={`w-full`}
                                                >
                                                    <span
                                                        className={`
                                                          w-full content-center
                                                          overflow-hidden
                                                          text-ellipsis
                                                          text-nowrap text-left
                                                          w-max-full flex gap-2
                                                        `}
                                                    >
                                                        <div className="my-auto">{skill}</div>
                                                    </span>
                                                </OlDropdownItem>
                                            );
                                        })}
                                    </OlDropdown>
                                </div>
                                <div className="my-5 flex justify-between">
                                    <div className="my-auto flex flex-col gap-2">
                                        <span className="text-white">Spawn heading</span>
                                        <div
                                            className={`
                                              flex gap-1 text-sm text-gray-400
                                            `}
                                        >
                                            <FaQuestionCircle
                                                className={`
                                              my-auto
                                            `}
                                            />{" "}
                                            <div
                                                className={`
                        my-auto
                      `}
                                            >
                                                Drag to change
                                            </div>
                                        </div>
                                    </div>

                                    <OlNumberInput
                                        className={"my-auto"}
                                        min={0}
                                        max={360}
                                        onChange={(ev) => {
                                            setCompassAngle(Number(ev.target.value));
                                        }}
                                        onDecrease={() => {
                                            setCompassAngle(normalizeAngle(compassAngle - 1));
                                        }}
                                        onIncrease={() => {
                                            setCompassAngle(normalizeAngle(compassAngle + 1));
                                        }}
                                        value={compassAngle}
                                        tooltip={() => (
                                            <OlExpandingTooltip
                                                title="Spawn heading"
                                                content="This controls the direction the unit will face when spanwned. This is important for units that take longer to change direction, like ships. Air units and helicopters will enter a orbit with its major axis aligned with the spawn heading. Drag the compass to change the heading."
                                            />
                                        )}
                                        tooltipRelativeToParent={true}
                                        tooltipPosition="above"
                                    />

                                    <div
                                        className={`
                                          relative mr-3 h-[60px] w-[60px]
                                        `}
                                    >
                                        <img
                                            className="absolute"
                                            ref={compassRef}
                                            onMouseDown={handleMouseDown}
                                            src={"/images/others/arrow_background.png"}
                                        ></img>
                                        <img
                                            className="absolute left-0"
                                            ref={compassRef}
                                            onMouseDown={handleMouseDown}
                                            src={"/images/others/arrow.png"}
                                            style={{
                                                width: "60px",
                                                height: "60px",
                                                transform: `rotate(${compassAngle}deg)`,
                                                cursor: "pointer",
                                            }}
                                        ></img>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`
                                  flex h-fit flex-col gap-1 px-4 py-2
                                  dark:bg-olympus-200/30
                                `}
                            >
                                <OlAccordion
                                    onClick={() => {
                                        setOpenAccordion(openAccordion === OpenAccordion.LOADOUT ? OpenAccordion.NONE : OpenAccordion.LOADOUT);
                                    }}
                                    open={openAccordion === OpenAccordion.LOADOUT}
                                    title="Loadout wizard"
                                >
                                    <WeaponsWizard selectedWeapons={selectedWeapons} setSelectedWeapons={setSelectedWeapons} weaponsByType={weaponsByType} />
                                </OlAccordion>
                                {spawnLoadout && spawnLoadout.items.length > 0 && (
                                    <OlAccordion
                                        onClick={() => {
                                            setShowLoadout(!showLoadout);
                                        }}
                                        open={showLoadout}
                                        title="Loadout"
                                    >
                                        <LoadoutViewer spawnLoadout={spawnLoadout} />
                                    </OlAccordion>
                                )}
                            </div>

                            {props.airbase && (
                                <button
                                    type="button"
                                    className={`
                                      m-2 rounded-lg bg-blue-700 px-5 py-2.5
                                      text-sm font-medium text-white
                                      dark:bg-blue-600 dark:hover:bg-blue-700
                                      dark:focus:ring-blue-800
                                      focus:outline-none focus:ring-4
                                      focus:ring-blue-300
                                      hover:bg-blue-800
                                    `}
                                    onClick={() => {
                                        if (spawnRequestTable) {
                                            getApp()
                                                .getUnitsManager()
                                                .spawnUnits(
                                                    spawnRequestTable.category,
                                                    Array(spawnRequestTable.amount).fill(spawnRequestTable.unit),
                                                    spawnRequestTable.coalition,
                                                    false,
                                                    props.airbase?.getName()
                                                );
                                        }
                                    }}
                                >
                                    Spawn
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </>
    );
}

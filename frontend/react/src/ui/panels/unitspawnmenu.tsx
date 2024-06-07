import React, { useState, useEffect } from "react";
import { OlUnitSummary } from "../components/olunitsummary";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { OlNumberInput } from "../components/olnumberinput";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { OlRangeSlider } from "../components/olrangeslider";
import { OlDropdownItem, OlDropdown } from '../components/oldropdown';
import { LoadoutBlueprint, UnitBlueprint } from "../../interfaces";
import { Coalition } from "../../types/types";
import { getApp } from "../../olympusapp";
import { IDLE, SPAWN_UNIT } from "../../constants/constants";
import { ftToM, getUnitCategoryByBlueprint } from "../../other/utils";
import { LatLng } from "leaflet";

export function UnitSpawnMenu(props: {
    blueprint: UnitBlueprint
}) {
    /* Compute the min and max values depending on the unit type */
    const minNumber = 1;
    const maxNumber = 4;
    const minAltitude = 0;
    const maxAltitude = 30000;
    const altitudeStep = 500;
    
    /* State initialization */
    var [spawnCoalition, setSpawnCoalition] = useState("blue" as Coalition);
    var [spawnNumber, setSpawnNumber] = useState(1);
    var [spawnRole, setSpawnRole] = useState("");
    var [spawnLoadoutName, setSpawnLoadout] = useState("");
    var [spawnAltitude, setSpawnAltitude] = useState((maxAltitude - minAltitude) / 2);
    var [spawnAltitudeType, setSpawnAltitudeType] = useState(false);

    /* When the menu is opened show the unit preview on the map as a cursor */
    useEffect(() => {
		if (props.blueprint !== null) {
			getApp()?.getMap()?.setState(SPAWN_UNIT, {
				spawnRequestTable: {
					category: getUnitCategoryByBlueprint(props.blueprint),
					unit: {
						unitType: props.blueprint.name,
						location: new LatLng(0, 0), // This will be filled when the user clicks on the map to spawn the unit
						skill: "High",
						liveryID: "",
						altitude: ftToM(spawnAltitude),
						loadout: props.blueprint.loadouts?.find((loadout) => { return loadout.name === spawnLoadoutName})?.code ?? ""
					},
					coalition: spawnCoalition
				}
			});
		}
		else {
			if (getApp()?.getMap()?.getState() === SPAWN_UNIT)
				getApp()?.getMap()?.setState(IDLE);
		}
	})

    /* Get a list of all the roles */
    const roles: string[] = [];
    (props.blueprint as UnitBlueprint).loadouts?.forEach((loadout) => {
        loadout.roles.forEach((role) => {
            !roles.includes(role) && roles.push(role);
        })
    })

    /* Initialize the role */
    spawnRole === "" && roles.length > 0 && setSpawnRole(roles[0]);

    /* Get a list of all the loadouts */
    const loadouts: LoadoutBlueprint[] = [];
    (props.blueprint as UnitBlueprint).loadouts?.forEach((loadout) => {
        loadout.roles.includes(spawnRole) && loadouts.push(loadout);
    })

    /* Initialize the loadout */
    spawnLoadoutName === "" && loadouts.length > 0 && setSpawnLoadout(loadouts[0].name)
    const spawnLoadout = props.blueprint.loadouts?.find((loadout) => { return loadout.name === spawnLoadoutName; })

    return <div className="flex flex-col">
        <OlUnitSummary blueprint={props.blueprint} coalition={spawnCoalition} />
        <div className="px-5 pt-6 pb-8 h-fit flex flex-col gap-5">
            <div className="flex flex-row content-center justify-between w-full">
                <OlCoalitionToggle
                    coalition={spawnCoalition}
                    onClick={() => {
                        spawnCoalition === 'blue' && setSpawnCoalition('neutral');
                        spawnCoalition === 'neutral' && setSpawnCoalition('red');
                        spawnCoalition === 'red' && setSpawnCoalition('blue');
                    }}
                />
                <OlNumberInput
                    value={spawnNumber}
                    min={minNumber}
                    max={maxNumber}
                    onDecrease={() => { setSpawnNumber(Math.max(minNumber, spawnNumber - 1)) }}
                    onIncrease={() => { setSpawnNumber(Math.min(maxNumber, spawnNumber + 1)) }}
                    onChange={(ev) => { !isNaN(Number(ev.target.value)) && setSpawnNumber(Math.max(minNumber, Math.min(maxNumber, Number(ev.target.value)))) }}
                />
            </div>
            <div>
                <div className="flex flex-row content-center items-center justify-between">
                    <div className="flex flex-col">
                        <span className="font-normal dark:text-white">Altitude</span>
                        <span className="font-bold dark:text-blue-500">{`${Intl.NumberFormat("en-US").format(spawnAltitude)} FT`}</span>
                    </div>
                    <OlLabelToggle toggled={spawnAltitudeType} leftLabel={"AGL"} rightLabel={"ASL"} onClick={() => setSpawnAltitudeType(!spawnAltitudeType)} />
                </div>
                <OlRangeSlider onChange={(ev) => setSpawnAltitude(Number(ev.target.value))} value={spawnAltitude} min={minAltitude} max={maxAltitude} step={altitudeStep} />
            </div>
            <div>
                <div className="flex flex-row content-center justify-between">
                    <span className="font-normal dark:text-white h-8">Role</span>
                </div>
                <OlDropdown label={spawnRole} className="w-full">
                    {
                        roles.map((role) => {
                            return <OlDropdownItem onClick={() => { setSpawnRole(role); setSpawnLoadout(""); }} className="w-full">
                                {role}
                            </OlDropdownItem>
                        })
                    }
                </OlDropdown>
            </div>
            <div>
                <div className="flex flex-row content-center justify-between">
                    <span className="font-normal dark:text-white h-8">Weapons</span>
                </div>
                <OlDropdown label={spawnLoadoutName} className="w-full w-max-full">
                    {
                        loadouts.map((loadout) => {
                            return <OlDropdownItem onClick={() => { setSpawnLoadout(loadout.name) }} className="w-full">
                                <span className="text-left w-full w-max-full text-nowrap text-ellipsis overflow-hidden">
                                    {loadout.name}
                                </span>
                            </OlDropdownItem>
                        })
                    }
                </OlDropdown>
            </div>
        </div>
        <div className="dark:bg-olympus-200/30 h-fit p-4 flex flex-col gap-1">
            {spawnLoadout && spawnLoadout.items.map((item) => {
                return <div className="flex gap-2 content-center">
                    <div className="my-auto font-bold text-sm rounded-full text-gray-500 dark:bg-[#17212D] w-6 py-0.5 text-center">{item.quantity}</div>
                    <div className="my-auto text-sm dark:text-gray-300">{item.name}</div>
                </div>
            })}
        </div>
    </div>
}

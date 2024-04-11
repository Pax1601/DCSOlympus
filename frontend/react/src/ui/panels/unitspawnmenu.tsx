import React, { useState } from "react";
import { OlUnitSummary } from "../components/olunitsummary";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { OlNumberInput } from "../components/olnumberinput";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { OlRangeSlider } from "../components/olrangeslider";
import { OlDropdownItem, OlDropdown } from '../components/oldropdown';
import { LoadoutBlueprint, UnitBlueprint } from "../../interfaces";

export function UnitSpawnMenu(props) {
    var [spawnRole, setSpawnRole] = useState("");
    var [spawnLoadoutName, setSpawnLoadout] = useState("");
    var [spawnAltitude, setSpawnAltitude] = useState(1000);

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

    const spawnLoadout = props.blueprint.loadouts.find((loadout) => { return loadout.name === spawnLoadoutName; })

    return <div className="flex flex-col gap-3">
        <OlUnitSummary blueprint={props.blueprint} />
        <div className="p-5 h-fit flex flex-col gap-2">
            <div className="flex flex-row content-center justify-between w-full">
                <OlCoalitionToggle />
                <OlNumberInput placeHolder={1} minValue={1} maxValue={4} />
            </div>
            <div>
                <div className="flex flex-row content-center justify-between">
                    <div className="flex flex-col">
                        <span className="font-normal dark:text-white">Altitude</span>
                        <span className="dark:text-blue-500">{`${spawnAltitude} FT`}</span>
                    </div>
                    <OlLabelToggle value={false} leftLabel={"AGL"} rightLabel={"ASL"} />
                </div>
                <OlRangeSlider onChange={setSpawnAltitude} value={spawnAltitude} minValue={0} maxValue={30000} step={500} />
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
        <div className="dark:bg-[#243141] h-fit p-4 flex flex-col gap-1">
            {spawnLoadout && spawnLoadout.items.map((item) => {
                return <div className="flex gap-2 content-center">
                    <div className="my-auto text-sm rounded-full text-gray-500 dark:bg-[#17212D] px-1.5 py-0.5 text-center">{item.quantity}</div>
                    <div className="my-auto text-sm dark:text-gray-300">{item.name}</div>
                </div>
            })}
        </div>
    </div>
}

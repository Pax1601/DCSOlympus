import React from "react";
import { OlDropdown, OlDropdownItem } from "../../components/oldropdown";
export function WeaponsWizard(props: {
    selectedWeapons: string[];
    setSelectedWeapons: (weapons: string[]) => void;
    weaponsByType: { [type: string]: { name: string; available: boolean }[] };
}) {
    return (
        <div>
            <div className="flex flex-col gap-2">
                {Object.keys(props.weaponsByType).map((type, idx) => {
                    return (
                        <div
                            className={`
                              flex w-full flex-col content-center gap-2
                            `}
                            key={idx}
                        >
                            <div
                                className={`
                                  my-auto min-w-32 text-sm font-normal
                                  text-gray-400
                                `}
                            >
                                {type}
                            </div>
                            <OlDropdown
                                label={`${props.weaponsByType[type].filter((weapon) => props.selectedWeapons.includes(weapon.name)).length} weapons type selected, ${props.weaponsByType[type].filter((weapon) => weapon.available).length} available`}
                                className={`w-full`}
                            >
                                <>
                                    {props.weaponsByType[type].map((weapon, weaponIdx) => {
                                        const isDisabled = !weapon.available && !props.selectedWeapons.includes(weapon.name);
                                        return (
                                            <OlDropdownItem
                                                onClick={() => {
                                                    if (isDisabled) return;

                                                    if (props.selectedWeapons.includes(weapon.name))
                                                        props.setSelectedWeapons(props.selectedWeapons.filter((w) => w !== weapon.name));
                                                    else props.setSelectedWeapons([...props.selectedWeapons, weapon.name]);
                                                }}
                                                disabled={isDisabled}
                                            >
                                                <div className={`truncate`} key={weaponIdx}>
                                                    {props.selectedWeapons.includes(weapon.name) ? "✓ " : ""}
                                                    {weapon.name}
                                                </div>
                                            </OlDropdownItem>
                                        );
                                    })}
                                </>
                            </OlDropdown>
                        </div>
                    );
                })}
                {props.selectedWeapons.length > 0 && (
                    <div
                        className={`
                          my-auto mb-2 min-w-32 text-sm font-normal
                          text-gray-400
                        `}
                    >
                        Selected weapons
                    </div>
                )}
                <div
                    className={`
                      flex flex-col gap-2 rounded-lg bg-gray-800 p-4
                      text-gray-200
                    `}
                >
                    {props.selectedWeapons.map((weapon, weaponIdx) => (
                        <div key={weaponIdx} className={`truncate text-xs`}>
                            {weapon}
                        </div>
                    ))}
                    {props.selectedWeapons.length === 0 && <div className={`
                      text-sm
                    `}>No weapons selected</div>}
                </div>
            </div>
        </div>
    );
}

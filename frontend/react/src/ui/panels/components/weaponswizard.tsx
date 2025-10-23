import React, { useState } from "react";
import { OlDropdown, OlDropdownItem } from "../../components/oldropdown";
import { FaArrowsRotate, FaTrash, FaXmark } from "react-icons/fa6";
import { OlSearchBar } from "../../components/olsearchbar";
import { OlCheckbox } from "../../components/olcheckbox";
import { OlToggle } from "../../components/oltoggle";
export function WeaponsWizard(props: {
    selectedWeapons: { [key: string]: { clsids: string; name: string; weight: number } };
    setSelectedWeapons: (weapons: { [key: string]: { clsids: string; name: string; weight: number } }) => void;
    weaponsByPylon: { [key: string]: { clsids: string; name: string; weight: number }[] };
}) {
    const [searchText, setSearchText] = useState("");
    const [selectedPylons, setSelectedPylons] = useState<string[]>([]);
    const [autofillPylons, setAutofillPylons] = useState(false);

    // Find the weapons that are availabile in all the selected pylons, meaning the intersection of the weapons in each pylon
    let availableWeapons: { clsids: string; name: string; weight: number }[] = [];
    if (autofillPylons) {
        // If autofill is enabled, show all weapons
        availableWeapons = Object.values(props.weaponsByPylon).flat();
    } else {
        if (selectedPylons.length > 0) {
            // If pylons are selected, show only weapons that are in all selected pylons
            const weaponsInSelectedPylons = selectedPylons.map((pylon) => props.weaponsByPylon[pylon] || []);
            availableWeapons = weaponsInSelectedPylons.reduce((acc, weapons) => {
                return acc.filter((w) => weapons.some((w2) => w2.name === w.name));
            });
        }
    }

    // Sort alphabetically
    availableWeapons.sort((a, b) => a.name.localeCompare(b.name));

    // Remove duplicates
    availableWeapons = availableWeapons.filter((weapon, index, self) => index === self.findIndex((w) => w.name === weapon.name));

    // Filter by search text
    if (searchText.trim() !== "") {
        availableWeapons = availableWeapons.filter((weapon) => weapon.name.toLowerCase().includes(searchText.toLowerCase()));
    }

    return (
        <div>
            <div className="flex flex-col gap-2">
                <div className="flex justify-center">
                    {Object.keys(props.weaponsByPylon).map((pylon) => (
                        <div key={pylon} className={``}>
                            <div
                                className={`
                                  flex h-20 flex-col items-center justify-center
                                  rounded-md border px-1
                                  ${
                                      autofillPylons
                                          ? `
                                    text-gray-400
                                  `
                                          : `
                                            cursor-pointer
                                            hover:bg-gray-700
                                          `
                                  }
                                  ${
                                      selectedPylons.includes(pylon)
                                          ? `
                                    border-gray-200
                                  `
                                          : `border-transparent`
                                  }
                                `}
                                onClick={() => {
                                    if (autofillPylons) return;
                                    if (selectedPylons.includes(pylon)) {
                                        setSelectedPylons(selectedPylons.filter((p) => p !== pylon));
                                    } else {
                                        setSelectedPylons([...selectedPylons, pylon]);
                                    }
                                }}
                            >
                                <div className={`text-center text-xs`}>{pylon}</div>
                                <div
                                    data-autofill={autofillPylons ? "true" : "false"}
                                    className={`
                                      h-3 w-0 rounded-full border
                                      data-[autofill='false']:border-white
                                      data-[autofill='true']:border-gray-400
                                    `}
                                ></div>
                                {props.selectedWeapons[pylon] ? (
                                    <div
                                        data-autofill={autofillPylons ? "true" : "false"}
                                        className={`
                                          flex h-6 w-6 items-center
                                          justify-center rounded-full border
                                          data-[autofill='false']:border-white
                                          data-[autofill='true']:border-gray-400
                                        `}
                                    >
                                        <div
                                            data-autofill={autofillPylons ? "true" : "false"}
                                            className={`
                                              h-5 w-5 rounded-full
                                              data-[autofill='false']:bg-white
                                              data-[autofill='true']:bg-gray-400
                                            `}
                                        ></div>
                                    </div>
                                ) : (
                                    <div
                                        data-autofill={autofillPylons ? "true" : "false"}
                                        className={`
                                          h-6 w-6 rounded-full border
                                          data-[autofill='false']:border-white
                                          data-[autofill='true']:border-gray-400
                                        `}
                                    ></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Buttons to select/deselect all pylons, clear all weapons and remove weapons from selected pylons */}
                <div>
                    <div className="flex justify-center gap-2">
                        {selectedPylons.length > 0 && (
                            <>
                                <button
                                    className={`
                                      text-nowrap rounded-md bg-gray-700 px-2
                                      py-1 text-sm
                                      hover:bg-gray-600
                                    `}
                                    onClick={() => {
                                        setSelectedPylons([]);
                                    }}
                                >
                                    <FaArrowsRotate className="inline" /> Reset selection
                                </button>

                                {
                                    /* Checjk if any of the selected pylons have a weapon selected */
                                    props.selectedWeapons && selectedPylons.some((pylon) => props.selectedWeapons[pylon] !== undefined) && (
                                        <button
                                            className={`
                                              text-nowrap rounded-md bg-gray-700
                                              px-2 py-1 text-sm
                                              hover:bg-gray-600
                                            `}
                                            onClick={() => {
                                                // Remove weapons from selected pylons
                                                let newSelectedWeapons = { ...props.selectedWeapons };
                                                selectedPylons.forEach((pylon) => {
                                                    delete newSelectedWeapons[pylon];
                                                });
                                                props.setSelectedWeapons(newSelectedWeapons);
                                            }}
                                        >
                                            <FaXmark
                                                className={`
                                              inline text-red-500
                                            `}
                                            />{" "}
                                            Remove
                                        </button>
                                    )
                                }
                            </>
                        )}
                        {props.selectedWeapons && Object.keys(props.selectedWeapons).length > 0 && (
                            <button
                                className={`
                                  text-nowrap rounded-md bg-gray-700 px-2 py-1
                                  text-sm
                                  hover:bg-gray-600
                                `}
                                onClick={() => {
                                    // Clear all selected weapons
                                    props.setSelectedWeapons({});
                                }}
                            >
                                <FaTrash className="inline text-red-500" /> Delete all
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <span className="ml-2 text-sm">Autofill compatible pylons with weapon</span>
                    <OlToggle
                        toggled={autofillPylons}
                        onClick={() => {
                            setAutofillPylons(!autofillPylons);
                        }}
                    />
                </div>

                <OlSearchBar onChange={setSearchText} text={searchText} />

                <div
                    className={`
                      flex max-h-48 flex-col overflow-y-auto border
                      border-gray-700 px-2
                    `}
                >
                    {availableWeapons.length === 0 ? (
                        selectedPylons.length === 0 ? (
                            <div className="p-2 text-sm text-gray-400">No pylons selected</div>
                        ) : (
                            <div className="p-2 text-sm text-gray-400">No weapons compatible with all selected pylons</div>
                        )
                    ) : (
                        availableWeapons.map((weapon) => (
                            <div
                                key={weapon.name}
                                onClick={() => {
                                    if (autofillPylons) {
                                        // Autofill all compatible pylons with the selected weapon
                                        let newSelectedWeapons = { ...props.selectedWeapons };
                                        Object.keys(props.weaponsByPylon).forEach((pylon) => {
                                            const weaponsInPylon = props.weaponsByPylon[pylon];
                                            if (weaponsInPylon.some((w) => w.name === weapon.name)) {
                                                newSelectedWeapons[pylon] = weapon;
                                            }
                                        });
                                        props.setSelectedWeapons(newSelectedWeapons);
                                    } else {
                                        let newSelectedWeapons = { ...props.selectedWeapons };
                                        // Add the weapon to the selected pylons
                                        selectedPylons.forEach((pylon) => {
                                            newSelectedWeapons[pylon] = weapon;
                                        });
                                        props.setSelectedWeapons(newSelectedWeapons);
                                        setSelectedPylons([]);
                                    }
                                }}
                                className={`
                                  cursor-pointer rounded-md p-1 text-sm
                                  hover:bg-gray-700
                                `}
                            >
                                {weapon.name}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

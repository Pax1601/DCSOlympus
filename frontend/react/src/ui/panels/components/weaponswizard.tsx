import React, { useEffect, useState } from "react";
import { FaArrowsRotate, FaTrash, FaXmark } from "react-icons/fa6";
import { OlSearchBar } from "../../components/olsearchbar";
import { OlToggle } from "../../components/oltoggle";
export function WeaponsWizard(props: {
    selectedWeapons: { [key: string]: { clsid: string; name: string; weight: number } };
    setSelectedWeapons: (weapons: { [key: string]: { clsid: string; name: string; weight: number } }) => void;
    weaponsByPylon: { [key: string]: { clsid: string; name: string; weight: number }[] };
    loadoutName: string;
    setLoadoutName: (name: string) => void;
    loadoutRole: string;
    setLoadoutRole: (role: string) => void;
}) {
    const [searchText, setSearchText] = useState("");
    const [selectedPylons, setSelectedPylons] = useState<string[]>([]);
    const [autofillPylons, setAutofillPylons] = useState(false);
    const [fillEmptyOnly, setFillEmptyOnly] = useState(true);
    const [weaponLetters, setWeaponLetters] = useState<{ [key: string]: string }>({}); // Letter to weapon name mapping
    const [hoveredWeapon, setHoveredWeapon] = useState<string>("");

    useEffect(() => {
        // If autofill is enabled, clear selected pylons
        if (autofillPylons) {
            setSelectedPylons([]);
        }
    }, [autofillPylons]);

    useEffect(() => {
        // Clear search text when weaponsByPylon changes
        setSearchText("");
        setSelectedPylons([]);
    }, [props.weaponsByPylon]);

    // Find the weapons that are availabile in all the selected pylons, meaning the intersection of the weapons in each pylon
    let availableWeapons: { clsid: string; name: string; weight: number }[] = [];
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

    // If autofill is enabled and fillEmptyOnly is enabled, remove weapons that have no compatible empty pylons
    if (autofillPylons && fillEmptyOnly) {
        availableWeapons = availableWeapons.filter((weapon) => {
            // Check if there is at least one pylon that is compatible with this weapon and is empty
            return Object.keys(props.weaponsByPylon).some((pylon) => {
                const weaponsInPylon = props.weaponsByPylon[pylon];
                return weaponsInPylon.some((w) => w.name === weapon.name) && !props.selectedWeapons[pylon];
            });
        });
    }

    // Assign a letter to each indiviual type of weapon selected in selectedWeapons for display in the pylon selection
    // Find the first unused letter
    Object.values(props.selectedWeapons).forEach((weapon) => {
        if (Object.entries(weaponLetters).findIndex(([letter, name]) => name === weapon.name) === -1) {
            // Find the first unused letter starting from A
            let currentLetter = "A";
            while (weaponLetters[currentLetter]) {
                currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
            }
            weaponLetters[currentLetter] = weapon.name;
            currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
        }
    });

    // Remove letters for weapons that are no longer selected
    Object.entries(weaponLetters).forEach(([letter, name]) => {
        if (Object.values(props.selectedWeapons).findIndex((weapon) => weapon.name === name) === -1) {
            delete weaponLetters[letter];
        }
    });

    if (JSON.stringify(weaponLetters) !== JSON.stringify(weaponLetters)) setWeaponLetters({ ...weaponLetters });

    // List of very bright and distinct colors
    const colors = {
        A: "#FF5733",
        B: "#33FF57",
        C: "#3357FF",
        D: "#F333FF",
        E: "#33FFF5",
        F: "#F5FF33",
        G: "#FF33A8",
        H: "#A833FF",
        I: "#33FFA8",
        J: "#FFA833",
        K: "#33A8FF",
    };

    return (
        <div>
            <div className="flex flex-col gap-6 text-white" onMouseEnter={() => setHoveredWeapon("")}>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                        <div className="my-auto font-semibold">Loadout Name</div>
                        <input
                            type="text"
                            value={props.loadoutName}
                            onChange={(e) => props.setLoadoutName(e.target.value)}
                            className={`
                              rounded-md border border-gray-300 bg-gray-800 p-2
                              text-sm text-white
                            `}
                        />
                    </div>
                    <div className="flex justify-between">
                        <div className="my-auto font-semibold">Loadout Role</div>
                        <input
                            type="text"
                            value={props.loadoutRole}
                            onChange={(e) => props.setLoadoutRole(e.target.value)}
                            className={`
                              rounded-md border border-gray-300 bg-gray-800 p-2
                              text-sm text-white
                            `}
                        />
                    </div>
                </div>
                <span className="text-gray-400">Select weapons for each pylon</span>
                <div className="flex flex-col gap-2">
                    <div className="mx-auto flex flex-col gap-2">
                        {/* Draw an airplane seen from the front using only gray lines */}
                        <div className="flex justify-center">
                            <div
                                className={`
                                  border-b-2 border- b-2 w-full border-gray-300
                                `}
                            ></div>
                            <div
                                className={`
                                  h-14 min-w-14 rounded-full border-2
                                  border-gray-300
                                `}
                            ></div>
                            <div
                                className={`
                                  border-b-2 border- b-2 w-full border-gray-300
                                `}
                            ></div>
                        </div>

                        <div className="flex justify-center gap-1">
                            {Object.keys(props.weaponsByPylon).map((pylon) => {
                                let weapon = props.selectedWeapons[pylon];
                                let letter = Object.entries(weaponLetters).find(([letter, name]) => name === weapon?.name)?.[0] || "";
                                // If the currently hovered weapon is compatible with this pylon, show "Hovered" else "Not Hovered"
                                let isHovered = props.weaponsByPylon[pylon].some((w) => w.name === hoveredWeapon);
                                return (
                                    <div key={pylon} className={``}>
                                        <div
                                            className={`
                                              flex h-20 flex-col items-center
                                              justify-center rounded-md border
                                              px-1
                                              ${
                                                  autofillPylons
                                                      ? `text-gray-400`
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
                                                      : `
                                                border-transparent
                                              `
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
                                                  h-3 w-0 border
                                                  data-[autofill='false']:border-white
                                                  data-[autofill='true']:border-gray-400
                                                `}
                                            ></div>
                                            {props.selectedWeapons[pylon] ? (
                                                <div
                                                    data-autofill={autofillPylons ? "true" : "false"}
                                                    data-hovered={isHovered ? "true" : "false"}
                                                    className={`
                                                      flex h-6 w-6 items-center
                                                      justify-center
                                                      rounded-full border
                                                      data-[autofill='false']:border-white
                                                      data-[autofill='true']:border-gray-400
                                                      data-[hovered='true']:border-green-400
                                                    `}
                                                >
                                                    {/* Show the letter of the group the weapon belongs to from weaponLetters */}
                                                    <span
                                                        className={`
                                                          text-sm font-bold
                                                        `}
                                                        style={{
                                                            color: letter in colors ? colors[letter as keyof typeof colors] : "inherit",
                                                        }}
                                                    >
                                                        {letter}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div
                                                    data-autofill={autofillPylons ? "true" : "false"}
                                                    data-hovered={isHovered ? "true" : "false"}
                                                    className={`
                                                      h-6 w-6 rounded-full
                                                      border
                                                      data-[autofill='false']:border-white
                                                      data-[autofill='true']:border-gray-400
                                                      data-[hovered='true']:border-green-400
                                                    `}
                                                ></div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {/* List all the groups from weaponLetters */}
                    <div className="flex flex-col gap-1">
                        {Object.entries(weaponLetters).map(([letter, weapon]) => (
                            <div
                                key={letter}
                                className={`
                              flex items-center text-sm
                            `}
                            >
                                <span className="font-bold" style={{ color: letter in colors ? colors[letter as keyof typeof colors] : "inherit" }}>
                                    {letter}:
                                </span>
                                <span className="ml-1 text-gray-400">{weapon}</span>
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
                                          text-nowrap rounded-md bg-gray-700
                                          px-2 py-1 text-sm
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
                                                  text-nowrap rounded-md
                                                  bg-gray-700 px-2 py-1 text-sm
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
                                      text-nowrap rounded-md bg-gray-700 px-2
                                      py-1 text-sm
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
                {autofillPylons && (
                    <div className="flex items-center justify-between gap-2">
                        <span className="ml-2 text-sm">Only fill empty pylons</span>
                        <OlToggle
                            toggled={fillEmptyOnly}
                            onClick={() => {
                                setFillEmptyOnly(!fillEmptyOnly);
                            }}
                        />
                    </div>
                )}

                <OlSearchBar onChange={setSearchText} text={searchText} />

                <div
                    className={`
                      flex max-h-48 flex-col overflow-y-auto border
                      border-gray-700 px-2
                    `}
                >
                    {selectedPylons.length === 0 && !autofillPylons && (
                        <div
                            className={`
                      p-2 text-sm text-gray-400
                    `}
                        >
                            No pylons selected
                        </div>
                    )}
                    {availableWeapons.length === 0 && selectedPylons.length !== 0 && !autofillPylons && (
                        <div
                            className={`
                      p-2 text-sm text-gray-400
                    `}
                        >
                            No weapons compatible with all selected pylons
                        </div>
                    )}
                    {availableWeapons.length === 0 && selectedPylons.length === 0 && autofillPylons && (
                        <div
                            className={`
                      p-2 text-sm text-gray-400
                    `}
                        >
                            No empty pylons available
                        </div>
                    )}

                    {availableWeapons.length !== 0 &&
                        availableWeapons.map((weapon) => (
                            <div
                                key={weapon.name}
                                onClick={() => {
                                    if (autofillPylons) {
                                        // Autofill all compatible pylons with the selected weapon
                                        let newSelectedWeapons = { ...props.selectedWeapons };
                                        Object.keys(props.weaponsByPylon).forEach((pylon) => {
                                            const weaponsInPylon = props.weaponsByPylon[pylon];
                                            if (fillEmptyOnly && props.selectedWeapons[pylon]) {
                                                // If "Only fill empty pylons" is enabled, skip filled pylons
                                                return;
                                            }
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
                                onMouseEnter={() => setHoveredWeapon(weapon.name)}
                                onMouseLeave={() => setHoveredWeapon("")}
                                className={`
                                  cursor-pointer rounded-md p-1 text-sm
                                  hover:bg-gray-700
                                `}
                            >
                                {weapon.name}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}

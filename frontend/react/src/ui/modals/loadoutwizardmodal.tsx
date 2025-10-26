import React, { useEffect, useState } from "react";
import { Modal } from "./components/modal";
import { FaMagic, FaStar } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../olympusapp";
import { NO_SUBSTATE, OlympusState } from "../../constants/constants";
import { AppStateChangedEvent, CustomLoadoutsUpdatedEvent, SetLoadoutWizardBlueprintEvent } from "../../events";
import { WeaponsWizard } from "../panels/components/weaponswizard";
import { LoadoutBlueprint, LoadoutItemBlueprint, UnitBlueprint } from "../../interfaces";
import { OlToggle } from "../components/oltoggle";

export function LoadoutWizardModal(props: { open: boolean }) {
    const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
    const [appSubState, setAppSubState] = useState(NO_SUBSTATE);
    const [previousState, setPreviousState] = useState(OlympusState.NOT_INITIALIZED);
    const [previousSubState, setPreviousSubState] = useState(NO_SUBSTATE);
    const [blueprint, setBlueprint] = useState(null as UnitBlueprint | null);
    const [isPersistent, setIsPersistent] = useState(false);

    useEffect(() => {
        AppStateChangedEvent.on((appState, appSubState, previousState, previousSubState) => {
            setAppState(appState);
            setAppSubState(appSubState);
            setPreviousState(previousState);
            setPreviousSubState(previousSubState);
        });
        SetLoadoutWizardBlueprintEvent.on((blueprint) => {
            setBlueprint(blueprint);
        });
    }, []);

    useEffect(() => {
        // Clear blueprint when modal is closed
        if (!props.open) {
            setBlueprint(null);
        }
    }, [props.open]);

    const [selectedWeapons, setSelectedWeapons] = useState({} as { [key: string]: { clsid: string; name: string; weight: number } });
    const [loadoutName, setLoadoutName] = useState("New loadout");
    const [loadoutRole, setLoadoutRole] = useState("Custom");

    useEffect(() => {
        setSelectedWeapons({});
    }, [props.open]);

    // If "New Loadout" already exists in the blueprint loadouts, append a number to make it unique
    useEffect(() => {
        if (!blueprint) return;
        let name = "New loadout";
        let counter = 1;
        const existingLoadoutNames = blueprint.loadouts?.map((loadout) => loadout.name) || [];

        while (existingLoadoutNames.includes(name)) {
            name = `New loadout ${counter}`;
            counter++;
        }

        setLoadoutName(name);
    }, [blueprint]);

    return (
        <Modal open={props.open} size={"tall"} onClose={() => getApp().setState(previousState, previousSubState)}>
            <div className="flex gap-4 text-xl text-white">
                <FaMagic
                    className={`
                  my-auto text-4xl text-gray-300
                `}
                />
                <div className="my-auto">Loadout wizard</div>
            </div>
            <WeaponsWizard
                selectedWeapons={selectedWeapons}
                setSelectedWeapons={setSelectedWeapons}
                weaponsByPylon={blueprint?.acceptedPayloads ?? {}}
                loadoutName={loadoutName}
                setLoadoutName={setLoadoutName}
                loadoutRole={loadoutRole}
                setLoadoutRole={setLoadoutRole}
            />
            <div className="mt-auto flex justify-between">
                <div className="flex gap-2 text-gray-200">
                    <FaStar className={`my-auto text-2xl text-gray-200`}/>
                    <div className={`my-auto mr-auto`}>Keep for the rest of the session</div>
                    <OlToggle toggled={isPersistent} onClick={() => setIsPersistent(!isPersistent)} />
                </div>
                <button
                    type="button"
                    onClick={() => {
                        // Add a new loadout to the blueprint if it doesn't exist already
                        if (blueprint) {
                            const items: LoadoutItemBlueprint[] = [];
                            for (const pylon in selectedWeapons) {
                                const weapon = selectedWeapons[pylon];
                                items.push({
                                    name: weapon.name,
                                    quantity: 1,
                                });
                            }

                            // Group the weapon items and sum their quantities if there are duplicates
                            const groupedItems: LoadoutItemBlueprint[] = [];
                            const itemMap: { [key: string]: LoadoutItemBlueprint } = {};
                            for (const item of items) {
                                if (itemMap[item.name]) {
                                    itemMap[item.name].quantity += item.quantity;
                                } else {
                                    itemMap[item.name] = { ...item };
                                }
                            }
                            for (const itemName in itemMap) {
                                groupedItems.push(itemMap[itemName]);
                            }

                            // Assemble the loadout payload section as a stringified lua table containing the payload number as key and the clsid as values
                            // This must already be lua compatible
                            let payloadLuaTable = "{pylons = {";
                            for (const pylon in selectedWeapons) {
                                const weapon = selectedWeapons[pylon];
                                if (weapon)  payloadLuaTable += `[${pylon}] = {CLSID = "${weapon.clsid}"},`;
                            }
                            payloadLuaTable += "}, fuel = 999999, flare=60, chaff=60, gun=100, ammo_type = 1}";

                            const newLoadout: LoadoutBlueprint = {
                                items: groupedItems,
                                roles: [loadoutRole],
                                code: "",
                                name: loadoutName,
                                enabled: true,
                                isCustom: true,
                                persistent: isPersistent,
                                payload: payloadLuaTable,
                            };

                            if (!blueprint.loadouts) {
                                blueprint.loadouts = [];
                            }
                            blueprint.loadouts.push(newLoadout);
                            CustomLoadoutsUpdatedEvent.dispatch(blueprint.name, newLoadout);
                        }
                        getApp().setState(previousState, previousSubState);
                    }}
                    className={`
                      mb-2 me-2 flex content-center items-center gap-2
                      rounded-sm bg-blue-700 px-5 py-2.5 text-sm font-medium
                      text-white
                      dark:bg-blue-600 dark:hover:bg-blue-700
                      dark:focus:ring-blue-800
                      focus:outline-none focus:ring-4 focus:ring-blue-300
                      hover:bg-blue-800
                    `}
                >
                    Continue
                    <FontAwesomeIcon className={`my-auto`} icon={faArrowRight} />
                </button>
            </div>
        </Modal>
    );
}

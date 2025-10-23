import React, { useEffect, useState } from "react";
import { Modal } from "./components/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../olympusapp";
import { NO_SUBSTATE, OlympusState } from "../../constants/constants";
import { AppStateChangedEvent } from "../../events";
import { ImageOverlay, LatLng, LatLngBounds } from "leaflet";
import { OlNumberInput } from "../components/olnumberinput";
import { OlStringInput } from "../components/olstringinput";

export function ImageOverlayModal(props: { open: boolean }) {
    const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
    const [appSubState, setAppSubState] = useState(NO_SUBSTATE);
    const [bound1Lat, setBound1Lat] = useState("0");
    const [bound1Lon, setBound1Lon] = useState("0");
    const [bound2Lat, setBound2Lat] = useState("0");
    const [bound2Lon, setBound2Lon] = useState("0");
    const [importData, setImportData] = useState("");
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        AppStateChangedEvent.on((appState, appSubState) => {
            setAppState(appState);
            setAppSubState(appSubState);
        });
    }, []);

    useEffect(() => {
        if (appState !== OlympusState.IMPORT_IMAGE_OVERLAY) return;

        setImportData("");
        var input = document.createElement("input");
        input.type = "file";

        input.onchange = async (e) => {
            // @ts-ignore TODO
            var file = e.target?.files[0];
            var reader = new FileReader();
            // Read the file content as image data URL
            reader.readAsDataURL(file);
            reader.onload = (readerEvent) => {
                // @ts-ignore TODO
                var content = readerEvent.target.result;
                if (content) {
                    setImportData(content as string);
                }
            };
        };

        input.click();
    }, [appState, appSubState]);

    return (
        <Modal open={props.open} size="sm">
            <div className="flex h-full w-full flex-col justify-between">
                <div className={`flex flex-col justify-between gap-2`}>
                    <span
                        className={`
                          text-gray-800 text-md
                          dark:text-white
                        `}
                    >
                        Import Image Overlay
                    </span>

                    <span className="text-gray-400">Enter the corner coordinates of the image overlay to be imported.</span>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="text-gray-300">Corner 1 latitude </div>
                            <div>
                            <OlStringInput
                                value={String(bound1Lat)}
                                onChange={(ev) => {
                                    setBound1Lat(ev.target.value);
                                }}
                            />
                            </div>
                            <div className="text-gray-300">Corner 1 longitude </div>
                            <div>
                            <OlStringInput
                                value={String(bound1Lon)}
                                onChange={(ev) => {
                                    setBound1Lon(ev.target.value);
                                }}
                            />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-gray-300">Corner 2 latitude </div>
                            <div>
                            <OlStringInput
                                value={String(bound2Lat)}
                                onChange={(ev) => {
                                    setBound2Lat(ev.target.value);
                                }}
                            />
                            </div>
                            <div className="text-gray-300">Corner 2 longitude </div>
                            <div>
                            <OlStringInput
                                value={String(bound2Lon)}
                                onChange={(ev) => {
                                    setBound2Lon(ev.target.value);
                                }}
                            />
                            </div>
                        </div>
                        <div className={`
                          ${(showWarning ? "text-red-500" : `
                          text-gray-400
                        `)}
                          text-sm
                        `}>
                            Please enter valid latitude and longitude values in decimal degrees format (e.g. 37.7749, -122.4194). Latitude must be between -90 and 90, and longitude must be between -180 and 180.
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            if (
                                isNaN(Number(bound1Lat)) || Number(bound1Lat) < -90 || Number(bound1Lat) > 90 ||
                                isNaN(Number(bound1Lon)) || Number(bound1Lon) < -180 || Number(bound1Lon) > 180 ||
                                isNaN(Number(bound2Lat)) || Number(bound2Lat) < -90 || Number(bound2Lat) > 90 ||
                                isNaN(Number(bound2Lon)) || Number(bound2Lon) < -180 || Number(bound2Lon) > 180
                            ) {
                                setShowWarning(true)
                                return;
                            }
                            setShowWarning(false)

                            const bounds = new LatLngBounds([
                                [Number(bound1Lat), Number(bound1Lon)],
                                [Number(bound2Lat), Number(bound2Lon)]
                            ]
                            )

                            let overlay = new ImageOverlay(importData, bounds);
                            overlay.addTo(getApp().getMap());

                            getApp().setState(OlympusState.IDLE);
                        }}
                        className={`
                          mb-2 me-2 ml-auto flex content-center items-center
                          gap-2 rounded-sm bg-blue-700 px-5 py-2.5 text-sm
                          font-medium text-white
                          dark:bg-blue-600 dark:hover:bg-blue-700
                          dark:focus:ring-blue-800
                          focus:outline-none focus:ring-4 focus:ring-blue-300
                          hover:bg-blue-800
                        `}
                    >
                        Continue
                        <FontAwesomeIcon icon={faArrowRight} />
                    </button>

                    <button
                        type="button"
                        onClick={() => getApp().setState(OlympusState.IDLE)}
                        className={`
                          mb-2 me-2 flex content-center items-center gap-2
                          rounded-sm border-[1px] bg-blue-700 px-5 py-2.5
                          text-sm font-medium text-white
                          dark:border-gray-600 dark:bg-gray-800
                          dark:text-gray-400 dark:hover:bg-gray-700
                          dark:focus:ring-blue-800
                          focus:outline-none focus:ring-4 focus:ring-blue-300
                          hover:bg-blue-800
                        `}
                    >
                        Back
                    </button>
                </div>
            </div>
        </Modal>
    );
}

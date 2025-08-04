import React, { useEffect, useState } from "react";
import { Modal } from "./components/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../olympusapp";
import { ImportExportSubstate, NO_SUBSTATE, OlympusState } from "../../constants/constants";
import { AppStateChangedEvent, MissionDataChangedEvent, UnitsRefreshedEvent } from "../../events";
import {
  olButtonsVisibilityDcs,
  olButtonsVisibilityGroundunit,
  olButtonsVisibilityGroundunitSam,
  olButtonsVisibilityNavyunit,
  olButtonsVisibilityOlympus,
} from "../components/olicons";
import { OlToggle } from "../components/oltoggle";
import { deepCopyTable } from "../../other/utils";
import { OlCheckbox } from "../components/olcheckbox";
import { Unit } from "../../unit/unit";
import { MissionData, UnitData } from "../../interfaces";

export function ImportExportModal(props: { open: boolean }) {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE);
  const [units, setUnits] = useState([] as Unit[]);
  const [missionData, setMissionData] = useState({} as MissionData);
  const [importData, setImportData] = useState({} as { [key: string]: UnitData[] });

  function resetFilter() {
    return {
      control: {
        dcs: true,
        olympus: true,
      },
      blue: {
        "groundunit-sam": true,
        groundunit: true,
        navyunit: true,
      },
      neutral: {
        "groundunit-sam": true,
        groundunit: true,
        navyunit: true,
      },
      red: {
        "groundunit-sam": true,
        groundunit: true,
        navyunit: true,
      },
    };
  }

  const [selectionFilter, setSelectionFilter] = useState(resetFilter);

  useEffect(() => {
    AppStateChangedEvent.on((appState, appSubState) => {
      setAppState(appState);
      setAppSubState(appSubState);
    });
    UnitsRefreshedEvent.on((units) => setUnits(units));
    MissionDataChangedEvent.on((missionData) => setMissionData(missionData));
  }, []);

  useEffect(() => {
    setSelectionFilter(resetFilter);

    if (appState === OlympusState.IMPORT_EXPORT && appSubState === ImportExportSubstate.IMPORT) {
      setImportData({});
      var input = document.createElement("input");
      input.type = "file";

      input.onchange = async (e) => {
        // @ts-ignore TODO
        var file = e.target?.files[0];
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = (readerEvent) => {
          // @ts-ignore TODO
          var content = readerEvent.target.result;
          if (content) {
            setImportData(JSON.parse(content as string));
          }
        };
      };

      input.click();
    }
  }, [appState, appSubState]);

  const selectableUnits = units.filter((unit) => {
    return (
      unit.getAlive() &&
      !unit.getHuman() &&
      ((unit.isControlledByDCS() && selectionFilter.control.dcs) || (unit.isControlledByOlympus() && selectionFilter.control.olympus))
    );
  });

  return (
    <Modal open={props.open} className={``}>
      <div className="flex h-full w-full flex-col justify-between">
      <div className={`flex flex-col justify-between gap-2`}>
        <span
          className={`
            text-gray-800 text-md
            dark:text-white
          `}
        >
          {appSubState === ImportExportSubstate.EXPORT ? "Export to file" : "Import from file"}
        </span>

        <span className="text-gray-400">
          {appSubState === ImportExportSubstate.EXPORT ? <>Select what units you want to export to file using the toggles below</> : <></>}
        </span>

        <div className="flex w-full flex-col gap-2">
          <div
            className={`
              text-bold border-b-2 border-b-white/10 pb-2 text-gray-400
            `}
          >
            Control mode
          </div>

          <div className="flex flex-col justify-start gap-2">
            {Object.entries({
              olympus: ["Olympus controlled", olButtonsVisibilityOlympus],
              dcs: ["From DCS mission", olButtonsVisibilityDcs],
            }).map((entry, idx) => {
              return (
                <div className="flex justify-between" key={idx}>
                  <span className="font-light text-white">{entry[1][0] as string}</span>
                  <OlToggle
                    key={entry[0]}
                    onClick={() => {
                      selectionFilter["control"][entry[0]] = !selectionFilter["control"][entry[0]];
                      setSelectionFilter(deepCopyTable(selectionFilter));
                    }}
                    toggled={selectionFilter["control"][entry[0]]}
                  />
                </div>
              );
            })}
          </div>

          <div
            className={`
              text-bold mt-5 border-b-2 border-b-white/10 pb-2 text-gray-400
            `}
          >
            Types and coalitions
          </div>

          <table className="mr-16">
            <tbody>
              <tr>
                <td></td>
                <td className="pb-4 text-center font-bold text-blue-500">BLUE</td>
                <td className="pb-4 text-center font-bold text-gray-500">NEUTRAL</td>
                <td className="pb-4 text-center font-bold text-red-500">RED</td>
              </tr>
              {Object.entries({
                "groundunit-sam": olButtonsVisibilityGroundunitSam,
                groundunit: olButtonsVisibilityGroundunit,
                navyunit: olButtonsVisibilityNavyunit,
              }).map((entry, idx) => {
                return (
                  <tr key={idx}>
                    <td className="w-16 text-lg text-gray-200">
                      <FontAwesomeIcon icon={entry[1]} />
                    </td>
                    {["blue", "neutral", "red"].map((coalition) => {
                      return (
                        <td className="w-32 text-center" key={coalition}>
                          <OlCheckbox
                            checked={
                              (appSubState === ImportExportSubstate.EXPORT &&
                                selectionFilter[coalition][entry[0]] &&
                                selectableUnits.find((unit) => unit.getMarkerCategory() === entry[0] && unit.getCoalition() === coalition) !== undefined) ||
                              (appSubState === ImportExportSubstate.IMPORT &&
                                selectionFilter[coalition][entry[0]] &&
                                Object.values(importData).find((group) =>
                                  group.find((unit) => unit.markerCategory === entry[0] && unit.coalition === coalition)
                                ) !== undefined)
                            }
                            disabled={
                              (appSubState === ImportExportSubstate.EXPORT &&
                                selectableUnits.find((unit) => unit.getMarkerCategory() === entry[0] && unit.getCoalition() === coalition) === undefined) ||
                              (appSubState === ImportExportSubstate.IMPORT &&
                                Object.values(importData).find((group) =>
                                  group.find((unit) => unit.markerCategory === entry[0] && unit.coalition === coalition)
                                ) === undefined)
                            }
                            onChange={() => {
                              selectionFilter[coalition][entry[0]] = !selectionFilter[coalition][entry[0]];
                              setSelectionFilter(deepCopyTable(selectionFilter));
                            }}
                          />
                          <span className="absolute ml-2 text-white">
                            {appSubState === ImportExportSubstate.EXPORT &&
                              selectableUnits.filter((unit) => unit.getMarkerCategory() === entry[0] && unit.getCoalition() === coalition).length}
                            {appSubState === ImportExportSubstate.IMPORT &&
                              Object.values(importData)
                                .flatMap((unit) => unit)
                                .filter((unit) => unit.markerCategory === entry[0] && unit.coalition === coalition).length}{" "}
                            units{" "}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {
                <tr>
                  <td className="text-gray-200"></td>
                  <td className="text-center">
                    <OlCheckbox
                      checked={Object.values(selectionFilter["blue"]).some((value) => value)}
                      onChange={() => {
                        const newValue = !Object.values(selectionFilter["blue"]).some((value) => value);
                        Object.keys(selectionFilter["blue"]).forEach((key) => {
                          selectionFilter["blue"][key] = newValue;
                        });
                        setSelectionFilter(deepCopyTable(selectionFilter));
                      }}
                    />
                  </td>
                  <td className="text-center">
                    <OlCheckbox
                      checked={Object.values(selectionFilter["neutral"]).some((value) => value)}
                      onChange={() => {
                        const newValue = !Object.values(selectionFilter["neutral"]).some((value) => value);
                        Object.keys(selectionFilter["neutral"]).forEach((key) => {
                          selectionFilter["neutral"][key] = newValue;
                        });
                        setSelectionFilter(deepCopyTable(selectionFilter));
                      }}
                    />
                  </td>
                  <td className="text-center">
                    <OlCheckbox
                      checked={Object.values(selectionFilter["red"]).some((value) => value)}
                      onChange={() => {
                        const newValue = !Object.values(selectionFilter["red"]).some((value) => value);
                        Object.keys(selectionFilter["red"]).forEach((key) => {
                          selectionFilter["red"][key] = newValue;
                        });
                        setSelectionFilter(deepCopyTable(selectionFilter));
                      }}
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            if (appSubState === ImportExportSubstate.EXPORT) {
              var unitsToExport: { [key: string]: any } = {};
              selectableUnits
                .filter((unit) => selectionFilter[unit.getCoalition()][unit.getMarkerCategory()])
                .forEach((unit: Unit) => {
                  var data: any = unit.getData();
                  if (unit.getGroupName() in unitsToExport) unitsToExport[unit.getGroupName()].push(data);
                  else unitsToExport[unit.getGroupName()] = [data];
                });

              const file = new Blob([JSON.stringify(unitsToExport)], {
                type: "text/plain",
              });

              const defaultName = "olympus_export_" + missionData.mission.theatre + "_" + missionData.sessionHash + "_" + missionData.time + ".json";

              //@ts-ignore TODO
              if (window.showSaveFilePicker) {
                const opts = {
                  types: [
                    {
                      description: "DCS Olympus export file",
                      accept: { "text/plain": [".json"] },
                    },
                  ],
                  suggestedName: defaultName,
                };
                //@ts-ignore TODO
                showSaveFilePicker(opts)
                  .then((handle) => handle.createWritable())
                  .then((writeable) => {
                    getApp().setState(OlympusState.IDLE);
                    getApp().addInfoMessage("Exporting data please wait...");
                    writeable
                      .write(file)
                      .then(() => writeable.close())
                      .catch(() => getApp().addInfoMessage("An error occurred while exporting the data"));
                  })
                  .then(() => getApp().addInfoMessage("Data exported correctly"))
                  .catch((err) => getApp().addInfoMessage("An error occurred while exporting the data"));
              } else {
                const a = document.createElement("a");
                const file = new Blob([JSON.stringify(unitsToExport)], {
                  type: "text/plain",
                });
                a.href = URL.createObjectURL(file);

                var filename = defaultName;
                a.download = filename;
                a.click();
              }
            } else {
              for (const [groupName, groupData] of Object.entries(importData)) {
                if (groupName === "" || groupData.length === 0 || !groupData.some((unitData: UnitData) => unitData.alive)) continue;

                let { markerCategory, coalition, category } = groupData[0];

                if (selectionFilter[coalition][markerCategory] !== true) continue;

                let unitsToSpawn = groupData.map((unitData: UnitData) => {
                  return { unitType: unitData.name, location: unitData.position, liveryID: "", skill: "High", heading: unitData.heading || 0 };
                });

                getApp().getUnitsManager().spawnUnits(category.toLocaleLowerCase(), unitsToSpawn, coalition, false);
              }
              getApp().setState(OlympusState.IDLE);
            }
          }}
          className={`
            mb-2 me-2 ml-auto flex content-center items-center gap-2 rounded-sm
            bg-blue-700 px-5 py-2.5 text-sm font-medium text-white
            dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
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
            mb-2 me-2 flex content-center items-center gap-2 rounded-sm
            border-[1px] bg-blue-700 px-5 py-2.5 text-sm font-medium text-white
            dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400
            dark:hover:bg-gray-700 dark:focus:ring-blue-800
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

import React, { useState } from "react";
import { Menu } from "./components/menu";
import { Unit } from "../../unit/unit";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { OlRangeSlider } from "../components/olrangeslider";
import { getApp } from "../../olympusapp";
import { OlButtonGroup, OlButtonGroupItem } from "../components/olbuttongroup";
import { ROEs, emissionsCountermeasures, reactionsToThreat } from "../../constants/constants";
import { OlToggle } from "../components/oltoggle";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { olButtonsEmissionsAttack, olButtonsEmissionsDefend, olButtonsEmissionsFree, olButtonsEmissionsSilent, olButtonsIntensity1, olButtonsIntensity2, olButtonsIntensity3, olButtonsRoeDesignated, olButtonsRoeFree, olButtonsRoeHold, olButtonsRoeReturn, olButtonsScatter1, olButtonsScatter2, olButtonsScatter3, olButtonsThreatEvade, olButtonsThreatManoeuvre, olButtonsThreatNone, olButtonsThreatPassive } from "../components/olicons";
import { Coalition } from "../../types/types";
import { ftToM, knotsToMs, mToFt, msToKnots } from "../../other/utils";

export function UnitControlMenu() {
	var [open, setOpen] = useState(false);
	var [selectedUnits, setSelectedUnits] = useState([] as Unit[]);

	var [selectedUnitsData, setSelectedUnitsData] = useState({
		desiredAltitude: undefined as undefined | number,
		desiredAltitudeType: undefined as undefined | string,
		desiredSpeed: undefined as undefined | number,
		desiredSpeedType: undefined as undefined | string,
		ROE: undefined as undefined | string,
		reactionToThreat: undefined as undefined | string,
		emissionsCountermeasures: undefined as undefined | string,
		shotsScatter: undefined as undefined | number,
		shotsIntensity: undefined as undefined | number,
		operateAs: undefined as undefined | string,
		followRoads: undefined as undefined | boolean,
		isActiveAWACS: undefined as undefined | boolean,
		isActiveTanker: undefined as undefined | boolean,
		onOff: undefined as undefined | boolean
	});

	/* */
	const minAltitude = 0;
	const maxAltitude = getApp()?.getUnitsManager()?.getSelectedUnitsCategories().every((category) => { return category === 'Helicopter'}) ? 20000 : 60000;
	const altitudeStep = getApp()?.getUnitsManager()?.getSelectedUnitsCategories().every((category) => { return category === 'Helicopter'}) ? 100 : 500;
	const minSpeed = 0;
	const maxSpeed = getApp()?.getUnitsManager()?.getSelectedUnitsCategories().every((category) => { return category === 'Helicopter'}) ? 200 : 800;
	const speedStep = getApp()?.getUnitsManager()?.getSelectedUnitsCategories().every((category) => { return category === 'Helicopter'}) ? 5 : 10;;

	/* When a unit is selected, open the menu */
	document.addEventListener("unitsSelection", (ev: CustomEventInit) => {
		setOpen(true);
		setSelectedUnits(ev.detail as Unit[]);

		updateData();
	})

	/* When a unit is deselected, refresh the view */
	document.addEventListener("unitDeselection", (ev: CustomEventInit) => {
		/* TODO add delay to avoid doing it too many times */
		updateData();
	})

	/* When all units are selected clean the view */
	document.addEventListener("clearSelection", () => {
		setOpen(false);
		setSelectedUnits([])
	})

	/* Update the current values of the shown data */
	function updateData() {
		const getters = {
			desiredAltitude: (unit: Unit) => { return Math.round(mToFt(unit.getDesiredAltitude())); },
			desiredAltitudeType: (unit: Unit) => { return unit.getDesiredAltitudeType(); },
			desiredSpeed: (unit: Unit) => { return Math.round(msToKnots(unit.getDesiredSpeed())); },
			desiredSpeedType: (unit: Unit) => { return unit.getDesiredSpeedType(); },
			ROE: (unit: Unit) => { return unit.getROE(); },
			reactionToThreat: (unit: Unit) => { return unit.getReactionToThreat(); },
			emissionsCountermeasures: (unit: Unit) => { return unit.getEmissionsCountermeasures(); },
			shotsScatter: (unit: Unit) => { return unit.getShotsScatter(); },
			shotsIntensity: (unit: Unit) => { return unit.getShotsIntensity(); },
			operateAs: (unit: Unit) => { return unit.getOperateAs(); },
			followRoads: (unit: Unit) => { return unit.getFollowRoads(); },
			isActiveAWACS: (unit: Unit) => { return unit.getIsActiveAWACS(); },
			isActiveTanker: (unit: Unit) => { return unit.getIsActiveTanker(); },
			onOff: (unit: Unit) => { return unit.getOnOff(); },
		} as { [key in keyof (typeof selectedUnitsData)]: (unit: Unit) => void }

		var updatedData = selectedUnitsData;
		Object.entries(getters).forEach(([key, getter]) => {
			updatedData[key] = getApp()?.getUnitsManager()?.getSelectedUnitsVariable(getter);
		});
		setSelectedUnitsData(updatedData);
	}

	/* Count how many units are selected of each type, divided by coalition */
	var unitOccurences = {
		blue: {},
		red: {},
		neutral: {}
	}

	selectedUnits.forEach((unit) => {
		if (!(unit.getName() in unitOccurences[unit.getCoalition()]))
			unitOccurences[unit.getCoalition()][unit.getName()] = 1;
		else
			unitOccurences[unit.getCoalition()][unit.getName()]++;
	})

	const selectedCategories = getApp()?.getUnitsManager()?.getSelectedUnitsCategories() ?? [];

	return <Menu
		open={open}
		title="Unit control menu"
		onClose={() => { }}
	>
		{/* Units list */}
		<div className="dark:bg-[#243141] h-fit p-0 flex flex-col gap-0">
			<div>
				{
					<>
						{
							['blue', 'red', 'neutral'].map((coalition) => {
								return Object.keys(unitOccurences[coalition]).map((name) => {
									return <div data-coalition={coalition} className="flex justify-between content-center border-l-4 data-[coalition='blue']:border-blue-500 data-[coalition='neutral']:border-gray-500 data-[coalition='red']:border-red-500 p-4">
										<span className="dark:text-gray-300 font-semibold my-auto">
											{name}
										</span>
										<span className="dark:text-gray-500 my-auto font-bold">
											x{unitOccurences[coalition][name]}
										</span>
									</div>
								})
							})
						}
					</>
				}
			</div>
		</div>
		<div className="p-5 flex flex-col gap-5">
			{/* Altitude selector */
				selectedCategories.every((category) => { return ['Aircraft', 'Helicopter'].includes(category) }) && <div>
					<div className="flex flex-row content-center justify-between">
						<div className="flex flex-col">
							<span className="font-normal dark:text-white">Altitude</span>
							<span
								data-flash={selectedUnitsData.desiredAltitude === undefined}
								className="data-[flash='true']:animate-pulse dark:text-blue-500 font-bold">{selectedUnitsData.desiredAltitude !== undefined ? (Intl.NumberFormat("en-US").format(selectedUnitsData.desiredAltitude) + " FT") : "Different values"}
							</span>
						</div>
						<OlLabelToggle
							toggled={selectedUnitsData.desiredAltitudeType === undefined ? undefined : selectedUnitsData.desiredAltitudeType === "AGL"}
							leftLabel={"AGL"}
							rightLabel={"ASL"}
							onClick={() => {
								selectedUnits.forEach((unit) => {
									unit.setAltitudeType((selectedUnitsData.desiredAltitudeType === "ASL") ? "AGL" : "ASL");
									setSelectedUnitsData({
										...selectedUnitsData,
										desiredAltitudeType: (selectedUnitsData.desiredAltitudeType === "ASL") ? "AGL" : "ASL"
									})
								})
							}} />
					</div>
					<OlRangeSlider
						onChange={(ev) => {
							selectedUnits.forEach((unit) => {
								unit.setAltitude(ftToM(Number(ev.target.value)));
								setSelectedUnitsData({
									...selectedUnitsData,
									desiredAltitude: Number(ev.target.value)
								})
							})
						}}
						value={selectedUnitsData.desiredAltitude}
						min={minAltitude}
						max={maxAltitude}
						step={altitudeStep}
					/>
				</div>
			}
			{/* Airspeed selector */}
			<div>
				<div className="flex flex-row content-center justify-between">
					<div className="flex flex-col">
						<span className="font-normal dark:text-white">Speed</span>
						<span
							data-flash={selectedUnitsData.desiredSpeed === undefined}
							className="data-[flash='true']:animate-pulse dark:text-blue-500 font-bold">{selectedUnitsData.desiredSpeed !== undefined ? (selectedUnitsData.desiredSpeed + " KTS") : "Different values"}
						</span>
					</div>
					<OlLabelToggle
						toggled={selectedUnitsData.desiredSpeedType === undefined ? undefined : selectedUnitsData.desiredSpeedType === "GS"}
						leftLabel={"GS"}
						rightLabel={"CAS"}
						onClick={() => {
							selectedUnits.forEach((unit) => {
								unit.setSpeedType((selectedUnitsData.desiredSpeedType === "CAS") ? "GS" : "CAS");
								setSelectedUnitsData({
									...selectedUnitsData,
									desiredSpeedType: (selectedUnitsData.desiredSpeedType === "CAS") ? "GS" : "CAS"
								})
							})
						}}
					/>
				</div>
				<OlRangeSlider
					onChange={(ev) => {
						selectedUnits.forEach((unit) => {
							unit.setSpeed(knotsToMs(Number(ev.target.value)));
							setSelectedUnitsData({
								...selectedUnitsData,
								desiredSpeed: Number(ev.target.value)
							})
						})
					}}
					value={selectedUnitsData.desiredSpeed}
					min={minSpeed}
					max={maxSpeed}
					step={speedStep}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<span className="font-normal dark:text-white">Rules of engagement</span>
				<OlButtonGroup>
					{
						[olButtonsRoeHold, olButtonsRoeReturn, olButtonsRoeDesignated, olButtonsRoeFree].map((icon, idx) => {
							return <OlButtonGroupItem
								onClick={() => {
									selectedUnits.forEach((unit) => {
										unit.setROE(ROEs[idx]);
										setSelectedUnitsData({
											...selectedUnitsData,
											ROE: ROEs[idx]
										})
									})
								}}
								active={selectedUnitsData.ROE === ROEs[idx]}
								icon={icon} />
						})
					}
				</OlButtonGroup>
			</div>
			{
				selectedCategories.every((category) => { return ['Aircraft', 'Helicopter'].includes(category) }) && <> <div className="flex flex-col gap-2">
					<span className="font-normal dark:text-white">Threat reaction</span>
					<OlButtonGroup>
						{
							[olButtonsThreatNone, olButtonsThreatPassive, olButtonsThreatManoeuvre, olButtonsThreatEvade].map((icon, idx) => {
								return <OlButtonGroupItem
									onClick={() => {
										selectedUnits.forEach((unit) => {
											unit.setReactionToThreat(reactionsToThreat[idx]);
											setSelectedUnitsData({
												...selectedUnitsData,
												reactionToThreat: reactionsToThreat[idx]
											})
										})
									}}
									active={selectedUnitsData.reactionToThreat === reactionsToThreat[idx]}
									icon={icon} />
							})
						}
					</OlButtonGroup>
				</div>
					<div className="flex flex-col gap-2">
						<span className="font-normal dark:text-white">Radar and ECM</span>
						<OlButtonGroup>
							{
								[olButtonsEmissionsSilent, olButtonsEmissionsDefend, olButtonsEmissionsAttack, olButtonsEmissionsFree].map((icon, idx) => {
									return <OlButtonGroupItem
										onClick={() => {
											selectedUnits.forEach((unit) => {
												unit.setEmissionsCountermeasures(emissionsCountermeasures[idx]);
												setSelectedUnitsData({
													...selectedUnitsData,
													emissionsCountermeasures: emissionsCountermeasures[idx]
												})
											})
										}}
										active={selectedUnitsData.emissionsCountermeasures === emissionsCountermeasures[idx]}
										icon={icon} />
								})
							}
						</OlButtonGroup>
					</div>
				</>
			}
			{
				getApp()?.getUnitsManager()?.getSelectedUnitsVariable((unit) => { return unit.isTanker() }) &&
				<div className="flex content-center justify-between">
					<span className="font-normal dark:text-white"> Act as tanker </span>
					<OlToggle toggled={selectedUnitsData.isActiveTanker} onClick={() => {
						selectedUnits.forEach((unit) => {
							unit.setAdvancedOptions(!selectedUnitsData.isActiveTanker, unit.getIsActiveAWACS(), unit.getTACAN(), unit.getRadio(), unit.getGeneralSettings());
							setSelectedUnitsData({
								...selectedUnitsData,
								isActiveTanker: !selectedUnitsData.isActiveTanker
							})
						})
					}} />
				</div>
			}
			{
				getApp()?.getUnitsManager()?.getSelectedUnitsVariable((unit) => { return unit.isAWACS() }) &&
				<div className="flex content-center justify-between">
					<span className="font-normal dark:text-white"> Act as AWACS </span>
					<OlToggle toggled={selectedUnitsData.isActiveAWACS} onClick={() => {
						selectedUnits.forEach((unit) => {
							unit.setAdvancedOptions(unit.getIsActiveTanker(), !selectedUnitsData.isActiveAWACS, unit.getTACAN(), unit.getRadio(), unit.getGeneralSettings());
							setSelectedUnitsData({
								...selectedUnitsData,
								isActiveAWACS: !selectedUnitsData.isActiveAWACS
							})
						})
					}} />
				</div>
			}
			{
				selectedCategories.every((category) => { return ['GroundUnit', 'NavyUnit'].includes(category) }) && <> <div className="flex flex-col gap-2">
					<span className="font-normal dark:text-white">Shots scatter</span>
					<OlButtonGroup>
						{
							[olButtonsScatter1, olButtonsScatter2, olButtonsScatter3].map((icon, idx) => {
								return <OlButtonGroupItem
									onClick={() => {
										selectedUnits.forEach((unit) => {
											unit.setShotsScatter((idx + 1));
											setSelectedUnitsData({
												...selectedUnitsData,
												shotsScatter: (idx + 1)
											})
										})
									}}
									active={selectedUnitsData.shotsScatter === (idx + 1)}
									icon={icon} />
							})
						}
					</OlButtonGroup>
				</div>
					<div className="flex flex-col gap-2">
						<span className="font-normal dark:text-white">Shots intensity</span>
						<OlButtonGroup>
							{
								[olButtonsIntensity1, olButtonsIntensity2, olButtonsIntensity3].map((icon, idx) => {
									return <OlButtonGroupItem
										onClick={() => {
											selectedUnits.forEach((unit) => {
												unit.setShotsIntensity((idx + 1));
												setSelectedUnitsData({
													...selectedUnitsData,
													shotsIntensity: (idx + 1)
												})
											})
										}}
										active={selectedUnitsData.shotsIntensity === (idx + 1)}
										icon={icon} />
								})
							}
						</OlButtonGroup>
					</div>
					<div className="flex content-center justify-between">
						<span className="font-normal dark:text-white"> Operate as </span>
						<OlCoalitionToggle coalition={selectedUnitsData.operateAs as Coalition} onClick={() => {
							selectedUnits.forEach((unit) => {
								unit.setOperateAs(selectedUnitsData.operateAs === 'blue' ? 'red' : 'blue');
								setSelectedUnitsData({
									...selectedUnitsData,
									operateAs: selectedUnitsData.operateAs === 'blue' ? 'red' : 'blue'
								})
							})
						}} />
					</div>
					<div className="flex content-center justify-between">
						<span className="font-normal dark:text-white"> Follow roads </span>
						<OlToggle toggled={selectedUnitsData.followRoads} onClick={() => {
							selectedUnits.forEach((unit) => {
								unit.setFollowRoads(!selectedUnitsData.followRoads);
								setSelectedUnitsData({
									...selectedUnitsData,
									followRoads: !selectedUnitsData.followRoads
								})
							})
						}} />
					</div>

					<div className="flex content-center justify-between">
						<span className="font-normal dark:text-white"> Unit active </span>
						<OlToggle toggled={selectedUnitsData.onOff} onClick={() => {
							selectedUnits.forEach((unit) => {
								unit.setOnOff(!selectedUnitsData.onOff);
								setSelectedUnitsData({
									...selectedUnitsData,
									onOff: !selectedUnitsData.onOff
								})
							})
						}} />
					</div>
				</>
			}
		</div>
	</Menu>
}
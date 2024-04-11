import React, { useState } from "react";
import { Menu } from "./components/menu";
import { faGamepad } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'
import { Unit } from "../../unit/unit";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { OlRangeSlider } from "../components/olrangeslider";
import { getApp } from "../../olympusapp";

const defaultUnitControlPanelData = {
	desiredAltitude: undefined as undefined | number,
	desiredAltitudeType: undefined as undefined | boolean
}

export function UnitControlMenu() {
	var [open, setOpen] = useState(false);
	var [selectedUnits, setSelectedUnits] = useState([] as Unit[]);

	var [selectedUnitsData, setSelectedUnitsData] = useState(defaultUnitControlPanelData);
	var [selectedUnitsRequestedData, setSelectedUnitsRequestedData] = useState(defaultUnitControlPanelData);

	/* */
	const minAltitude = 0;
	const maxAltitude = 60000;
	const altitudeStep = 500;

	/* When a unit is selected, open the menu */
	document.addEventListener("unitsSelection", (ev: CustomEventInit) => {
		setOpen(true);
		setSelectedUnits(ev.detail as Unit[])
	})

	/* When a unit is deselected, refresh the view */
	document.addEventListener("unitDeselection", (ev: CustomEventInit) => {

	})

	/* When all units are selected clean the view */
	document.addEventListener("clearSelection", () => {
		setOpen(false);
		setSelectedUnits([])
	})

	document.addEventListener("unitUpdated", () => {

	})

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

	return <Menu
		open={open}
		title="Unit control menu"
		onClose={() => { }}
	>
		<div className="dark:bg-[#243141] h-fit p-0 flex flex-col gap-0">
			<div>
				{
					<>
						{
							['blue', 'red', 'neutral'].map((coalition) => {
								return Object.keys(unitOccurences[coalition]).map((name) => {
									return <div data-coalition={coalition} className="flex justify-between content-center border-l-4 data-[coalition='blue']:border-blue-500 data-[coalition='neutral']:border-gray-500 data-[coalition='red']:border-red-500 p-2">
										<span className="dark:text-gray-300 text-sm font-medium my-auto">
											{name}
										</span>
										<span className="dark:text-gray-500 text-sm  my-auto">
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
		<div className="p-5">
			<div>
				<div className="flex flex-row content-center justify-between">
					<div className="flex flex-col">
						<span className="font-normal dark:text-white">Altitude</span>
						<span className="dark:text-blue-500">{`${selectedUnitsRequestedData.desiredAltitude} FT`}</span>
					</div>
					<OlLabelToggle
						toggled={selectedUnitsRequestedData.desiredAltitudeType}
						leftLabel={"AGL"}
						rightLabel={"ASL"}
						onClick={() => {
							selectedUnits.forEach((unit) => {
								unit.setAltitudeType((!selectedUnitsRequestedData.desiredAltitudeType) ? "AGL" : "ASL");
								setSelectedUnitsRequestedData({
									...selectedUnitsRequestedData,
									desiredAltitudeType: !selectedUnitsRequestedData.desiredAltitudeType
								})
							})
						}} />
				</div>
				<OlRangeSlider
					onChange={(ev) => {
						selectedUnits.forEach((unit) => {
							unit.setAltitude(Number(ev.target.value));
							setSelectedUnitsRequestedData({
								...selectedUnitsRequestedData,
								desiredAltitude: Number(ev.target.value)
							})
						})
					}}
					value={selectedUnitsRequestedData.desiredAltitude}
					min={minAltitude}
					max={maxAltitude}
					step={altitudeStep} />
			</div>
		</div>

	</Menu>
}
import React, { useState } from "react";
import { Menu } from "./components/menu";
import { faHelicopter, faJetFighter, faPlus, faShieldAlt, faShip, faTruck } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'
import { OlSearchBar } from "../components/olsearchbar";
import { OlAccordion } from "../components/olaccordion";
import { getApp } from "../../olympusapp";
import { OlUnitEntryList } from "../components/olunitlistentry";
import { UnitSpawnMenu } from "./unitspawnmenu";

library.add(faPlus);

export function SpawnMenu(props) {
	var [blueprint, setBlueprint] = useState(null);

	const filteredAircraft = getApp()?.getAircraftDatabase()?.blueprints ?? {};
	const filteredHelicopters = getApp()?.getHelicopterDatabase()?.blueprints ?? {};
	const filteredNavyUnits = getApp()?.getNavyUnitDatabase()?.blueprints ?? {};

	var filteredAirDefense = {};
	var filteredGroundUnits = {};
	Object.keys(getApp()?.getGroundUnitDatabase()?.blueprints ?? {}).forEach((key) => {
		var blueprint = getApp()?.getGroundUnitDatabase()?.blueprints[key];
		var type = blueprint.label;
		if (/\bAAA|SAM\b/.test(type) || /\bmanpad|stinger\b/i.test(type)) {
			filteredAirDefense[key] = blueprint;
		} else {
			filteredGroundUnits[key] = blueprint;
		}
	});

	return <Menu {...props} title="Spawn menu" titleIcon="fa-solid fa-plus">
		{!blueprint && <div>
			<OlSearchBar className="mb-4" />
			<OlAccordion title="Aircrafts">
				<div className="flex flex-col gap-1 max-h-80 overflow-y-scroll">
					{Object.keys(filteredAircraft).map((key) => {
						const blueprint = getApp().getAircraftDatabase().blueprints[key];
						return <OlUnitEntryList key={key} icon={faJetFighter} blueprint={blueprint} onClick={() => setBlueprint(blueprint)} />
					})}
				</div>
			</OlAccordion>
			<OlAccordion title="Helicopters">
				<div className="flex flex-col gap-1 max-h-80 overflow-y-scroll">
					{Object.keys(filteredHelicopters).map((key) => {
						return <OlUnitEntryList key={key} icon={faHelicopter} blueprint={getApp().getHelicopterDatabase().blueprints[key]} />
					})}
				</div>
			</OlAccordion>
			<OlAccordion title="Air defence (SAM & AAA)">
				<div className="flex flex-col gap-1 max-h-80 overflow-y-scroll">
					{Object.keys(filteredAirDefense).map((key) => {
						return <OlUnitEntryList key={key} icon={faShieldAlt} blueprint={getApp().getGroundUnitDatabase().blueprints[key]} />
					})}
				</div>
			</OlAccordion>
			<OlAccordion title="Ground units">
				<div className="flex flex-col gap-1 max-h-80 overflow-y-scroll">
					{Object.keys(filteredGroundUnits).map((key) => {
						const blueprint = getApp().getGroundUnitDatabase().blueprints[key];
						return <OlUnitEntryList key={key} icon={faTruck} blueprint={blueprint} onClick={() => setBlueprint(blueprint)} />
					})}
				</div>
			</OlAccordion>
			<OlAccordion title="Ships and submarines">
				<div className="flex flex-col gap-1 max-h-80 overflow-y-scroll">
					{Object.keys(filteredNavyUnits).map((key) => {
						return <OlUnitEntryList key={key} icon={faShip} blueprint={getApp().getNavyUnitDatabase().blueprints[key]} />
					})}
				</div>
			</OlAccordion>
			<OlAccordion title="Effects (smokes, explosions etc)">

			</OlAccordion>
		</div>
		}

		{blueprint && <UnitSpawnMenu blueprint={blueprint} />}
	</Menu>
}
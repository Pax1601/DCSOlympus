import React, { useState, useEffect } from 'react'
import './ui.css'

import { EventsProvider } from '../eventscontext'
import { StateProvider } from '../statecontext'

import { Header } from './panels/header'
import { SpawnMenu } from './panels/spawnmenu'
import { UnitControlMenu } from './panels/unitcontrolmenu'
import { MainMenu } from './panels/mainmenu'
import { SideBar } from './panels/sidebar';
import { MapHiddenTypes, MapOptions } from '../types/types'
import { MAP_HIDDEN_TYPES_DEFAULTS, MAP_OPTIONS_DEFAULTS } from '../constants/constants'
import { getApp } from '../olympusapp'

export type OlympusState = {
	mainMenuVisible: boolean,
	spawnMenuVisible: boolean,
	unitControlMenuVisible: boolean,
	measureMenuVisible: boolean,
	drawingMenuVisible: boolean,
	mapHiddenTypes: MapHiddenTypes;
	mapOptions: MapOptions;
}

export function UI() {
	var [mainMenuVisible, setMainMenuVisible] = useState(false);
	var [spawnMenuVisible, setSpawnMenuVisible] = useState(false);
	var [unitControlMenuVisible, setUnitControlMenuVisible] = useState(false);
	var [measureMenuVisible, setMeasureMenuVisible] = useState(false);
	var [drawingMenuVisible, setDrawingMenuVisible] = useState(false);
	var [mapHiddenTypes, setMapHiddenTypes] = useState(MAP_HIDDEN_TYPES_DEFAULTS);
	var [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);

	document.addEventListener("hiddenTypesChanged", (ev) => {
		setMapHiddenTypes({...getApp().getMap().getHiddenTypes()});
	})

	document.addEventListener("mapOptionsChanged", (ev) => {
		setMapOptions({...getApp().getMap().getOptions()});
	})

	function hideAllMenus() {
		setMainMenuVisible(false);
		setSpawnMenuVisible(false);
		setUnitControlMenuVisible(false);
		setMeasureMenuVisible(false);
		setDrawingMenuVisible(false);
	}

	return (
		<div className="absolute top-0 left-0 h-screen w-screen font-sans overflow-hidden">
			<StateProvider value={{
				mainMenuVisible: mainMenuVisible,
				spawnMenuVisible: spawnMenuVisible,
				unitControlMenuVisible: unitControlMenuVisible,
				measureMenuVisible: measureMenuVisible,
				drawingMenuVisible: drawingMenuVisible,
				mapOptions: mapOptions,
				mapHiddenTypes: mapHiddenTypes
			}}>
				<EventsProvider value={
					{
						setMainMenuVisible: setMainMenuVisible,
						setSpawnMenuVisible: setSpawnMenuVisible,
						setUnitControlMenuVisible: setUnitControlMenuVisible,
						setDrawingMenuVisible: setDrawingMenuVisible,
						setMeasureMenuVisible: setMeasureMenuVisible,
						toggleMainMenuVisible: () => { hideAllMenus(); setMainMenuVisible(!mainMenuVisible) },
						toggleSpawnMenuVisible: () => { hideAllMenus(); setSpawnMenuVisible(!spawnMenuVisible) },
						toggleUnitControlMenuVisible: () => { hideAllMenus(); setUnitControlMenuVisible(!unitControlMenuVisible) },
						toggleMeasureMenuVisible: () => { hideAllMenus(); setMeasureMenuVisible(!measureMenuVisible) },
						toggleDrawingMenuVisible: () => { hideAllMenus(); setDrawingMenuVisible(!drawingMenuVisible) },
					}
				}>
					<div className='absolute top-0 left-0 h-full w-full flex flex-col'>
						<Header />
						<div className='flex h-full'>
							<SideBar />
							<MainMenu open={mainMenuVisible} onClose={() => setMainMenuVisible(false)} />
							<SpawnMenu open={spawnMenuVisible} onClose={() => setSpawnMenuVisible(false)} />
							<UnitControlMenu />
						</div>
					</div>
					<div id='map-container' className='fixed h-full w-screen top-0 left-0' />
				</EventsProvider>
			</StateProvider>
		</div>
	)
}

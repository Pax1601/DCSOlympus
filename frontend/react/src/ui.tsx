import React, { useState } from 'react'
import './ui.css'

import { Header } from './ui/panels/header'
import { EventsProvider } from './eventscontext'
import { StateProvider } from './statecontext'
import { SpawnMenu } from './ui/panels/spawnmenu'
import { UnitControlMenu } from './ui/panels/unitcontrolmenu'
import { MainMenu } from './ui/panels/mainmenu'

export type OlympusState = {
	mainMenuVisible: boolean,
	spawnMenuVisible: boolean,
	unitControlMenuVisible: boolean,
	measureMenuVisible: boolean,
	drawingMenuVisible: boolean
}

export function UI(props) {
	var [mainMenuVisible, setMainMenuVisible] = useState(false);
	var [spawnMenuVisible, setSpawnMenuVisible] = useState(false);
	var [unitControlMenuVisible, setUnitControlMenuVisible] = useState(false);
	var [measureMenuVisible, setMeasureMenuVisible] = useState(false);
	var [drawingMenuVisible, setDrawingMenuVisible] = useState(false);

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
				drawingMenuVisible: drawingMenuVisible
			}}>
				<EventsProvider value={
					{
						setMainMenuVisible: setMainMenuVisible,
						setSpawnMenuVisible: setSpawnMenuVisible,
						setUnitControlMenuVisible: setUnitControlMenuVisible,
						setDrawingMenuVisible: setDrawingMenuVisible,
						setMeasureMenuVisible: setMeasureMenuVisible,
						toggleMainMenuVisible: () => {hideAllMenus(); setMainMenuVisible(!mainMenuVisible)},
						toggleSpawnMenuVisible: () => {hideAllMenus(); setSpawnMenuVisible(!spawnMenuVisible)},
						toggleUnitControlMenuVisible: () => {hideAllMenus(); setUnitControlMenuVisible(!unitControlMenuVisible)},
						toggleMeasureMenuVisible: () => {hideAllMenus(); setMeasureMenuVisible(!measureMenuVisible)},
						toggleDrawingMenuVisible: () => {hideAllMenus(); setDrawingMenuVisible(!drawingMenuVisible)},
					}
				}>
					<div className='absolute top-0 left-0 h-full w-full flex flex-col'>
						<Header />
						<div id='map-container' className='relative h-screen w-screen top-0 left-0' />
						<MainMenu open={mainMenuVisible} closeCallback={() => setMainMenuVisible(false)}/>
						<SpawnMenu open={spawnMenuVisible} closeCallback={() => setSpawnMenuVisible(false)}/>
						<UnitControlMenu open={unitControlMenuVisible} closeCallback={() => setUnitControlMenuVisible(false)}/>
					</div>
				</EventsProvider>
			</StateProvider>
		</div>
	)
}

import React, { useState } from 'react'
import './ui.css'

import { Header } from './ui/panels/header'
import { EventsProvider } from './eventscontext'
import { StateProvider } from './statecontext'
import { SpawnMenu } from './ui/panels/spawnmenu'
import { UnitControlMenu } from './ui/panels/unitcontrolmenu'

export type OlympusState = {
	spawnMenuVisible: boolean,
	unitControlMenuVisible: boolean,
	measureMenuVisible: boolean,
	drawingMenuVisible: boolean
}
1
export function UI(props) {
	var [spawnMenuVisible, setSpawnMenuVisible] = useState(false);
	var [unitControlMenuVisible, setUnitControlMenuVisible] = useState(false);
	var [measureMenuVisible, setMeasureMenuVisible] = useState(false);
	var [drawingMenuVisible, setDrawingMenuVisible] = useState(false);

	function hideAllMenus() {
		setSpawnMenuVisible(false);
		setUnitControlMenuVisible(false);
		setMeasureMenuVisible(false);
		setDrawingMenuVisible(false);
	}

	return (
		<div className="absolute top-0 left-0 h-screen w-screen font-sans overflow-hidden">
			<StateProvider value={{
				spawnMenuVisible: spawnMenuVisible,
				unitControlMenuVisible: unitControlMenuVisible,
				measureMenuVisible: measureMenuVisible,
				drawingMenuVisible: drawingMenuVisible
			}}>
				<EventsProvider value={
					{
						setSpawnMenuVisible: setSpawnMenuVisible,
						setUnitControlMenuVisible: setUnitControlMenuVisible,
						setDrawingMenuVisible: setDrawingMenuVisible,
						setMeasureMenuVisible: setMeasureMenuVisible,
						toggleSpawnMenuVisible: () => {hideAllMenus(); setSpawnMenuVisible(!spawnMenuVisible)},
						toggleUnitControlMenuVisible: () => {hideAllMenus(); setUnitControlMenuVisible(!unitControlMenuVisible)},
						toggleMeasureMenuVisible: () => {hideAllMenus(); setMeasureMenuVisible(!measureMenuVisible)},
						toggleDrawingMenuVisible: () => {hideAllMenus(); setDrawingMenuVisible(!drawingMenuVisible)},
					}
				}>
					<div className='absolute top-0 left-0 h-full w-full flex flex-col'>
						<Header />
						<div id='map-container' className='relative h-screen w-screen top-0 left-0' />
						<SpawnMenu open={spawnMenuVisible} closeCallback={() => setSpawnMenuVisible(false)}/>
						<UnitControlMenu open={unitControlMenuVisible} closeCallback={() => setUnitControlMenuVisible(false)}/>
					</div>
				</EventsProvider>
			</StateProvider>
		</div>
	)
}

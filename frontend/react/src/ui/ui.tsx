import React, { useState } from 'react'
import './ui.css'

import { EventsProvider } from '../eventscontext'
import { StateProvider } from '../statecontext'

import { Header } from './panels/header'
import { SpawnMenu } from './panels/spawnmenu'
import { UnitControlMenu } from './panels/unitcontrolmenu'
import { MainMenu } from './panels/mainmenu'
import { SideBar } from './panels/sidebar';
import { Options } from './panels/options';
import { MapHiddenTypes, MapOptions } from '../types/types'
import { BLUE_COMMANDER, GAME_MASTER, MAP_HIDDEN_TYPES_DEFAULTS, MAP_OPTIONS_DEFAULTS, RED_COMMANDER } from '../constants/constants'
import { getApp, setupApp } from '../olympusapp'
import { LoginModal } from './modals/login'
import { sha256 } from 'js-sha256'

export type OlympusState = {
	mainMenuVisible: boolean,
	spawnMenuVisible: boolean,
	unitControlMenuVisible: boolean,
	measureMenuVisible: boolean,
	drawingMenuVisible: boolean,
	optionsMenuVisible: boolean,
	mapHiddenTypes: MapHiddenTypes;
	mapOptions: MapOptions;
}

export function UI() {
	var [mainMenuVisible, setMainMenuVisible] = useState(false);
	var [spawnMenuVisible, setSpawnMenuVisible] = useState(false);
	var [unitControlMenuVisible, setUnitControlMenuVisible] = useState(false);
	var [measureMenuVisible, setMeasureMenuVisible] = useState(false);
	var [drawingMenuVisible, setDrawingMenuVisible] = useState(false);
	var [optionsMenuVisible, setOptionsMenuVisible] = useState(false);
	var [mapHiddenTypes, setMapHiddenTypes] = useState(MAP_HIDDEN_TYPES_DEFAULTS);
	var [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);
	var [checkingPassword, setCheckingPassword] = useState(false);
	var [loginError, setLoginError] = useState(false);
	var [commandMode, setCommandMode] = useState(null as null | string);

	document.addEventListener("hiddenTypesChanged", (ev) => {
		setMapHiddenTypes({ ...getApp().getMap().getHiddenTypes() });
	})

	document.addEventListener("mapOptionsChanged", (ev) => {
		setMapOptions({ ...getApp().getMap().getOptions() });
	})

	function hideAllMenus() {
		setMainMenuVisible(false);
		setSpawnMenuVisible(false);
		setUnitControlMenuVisible(false);
		setMeasureMenuVisible(false);
		setDrawingMenuVisible(false);
		setOptionsMenuVisible(false);
	}

	function checkPassword(password: string) {
		setCheckingPassword(true);
		var hash = sha256.create();
		getApp().getServerManager().setCredentials("no-username", hash.update(password).hex());
		getApp().getServerManager().getMission((response) => {
			const commandMode = response.mission.commandModeOptions.commandMode;
			try {
				[GAME_MASTER, BLUE_COMMANDER, RED_COMMANDER].includes(commandMode) ? setCommandMode(commandMode) : setLoginError(true);
			} catch {
				setLoginError(true);
			}
			setCheckingPassword(false);
		})
	}

	return (
		<div className="absolute top-0 left-0 h-screen w-screen font-sans overflow-hidden" onLoad={setupApp}>
			<StateProvider value={{
				mainMenuVisible: mainMenuVisible,
				spawnMenuVisible: spawnMenuVisible,
				unitControlMenuVisible: unitControlMenuVisible,
				measureMenuVisible: measureMenuVisible,
				drawingMenuVisible: drawingMenuVisible,
				optionsMenuVisible: optionsMenuVisible,
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
						setOptionsMenuVisible: setOptionsMenuVisible,
						toggleMainMenuVisible: () => { hideAllMenus(); setMainMenuVisible(!mainMenuVisible) },
						toggleSpawnMenuVisible: () => { hideAllMenus(); setSpawnMenuVisible(!spawnMenuVisible) },
						toggleUnitControlMenuVisible: () => { hideAllMenus(); setUnitControlMenuVisible(!unitControlMenuVisible) },
						toggleMeasureMenuVisible: () => { hideAllMenus(); setMeasureMenuVisible(!measureMenuVisible) },
						toggleDrawingMenuVisible: () => { hideAllMenus(); setDrawingMenuVisible(!drawingMenuVisible) },
						toggleOptionsMenuVisible: () => { hideAllMenus(); setOptionsMenuVisible(!optionsMenuVisible) },
					}
				}>
					<div className='absolute top-0 left-0 h-full w-full flex flex-col'>
						<Header />
						<div className='flex h-full'>
							<LoginModal
								onLogin={(password) => { checkPassword(password) }}
								checkingPassword={checkingPassword}
								loginError={loginError}
							/>
							<SideBar />
							<MainMenu
								open={mainMenuVisible}
								onClose={() => setMainMenuVisible(false)}
							/>
							<SpawnMenu
								open={spawnMenuVisible}
								onClose={() => setSpawnMenuVisible(false)}
							/>
							<Options
								open={optionsMenuVisible}
								onClose={() => setOptionsMenuVisible(false)}
							/>
							<UnitControlMenu />
						</div>
					</div>
					<div id='map-container' className='fixed h-full w-screen top-0 left-0' />
				</EventsProvider>
			</StateProvider>
		</div>
	)
}

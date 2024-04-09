import React, { useEffect } from 'react'
import { OlRoundStateButton } from '../components/olstatebutton';
import { faPlus, faGamepad, faRuler, faPencil, faMap, faLock, faPerson, faBrain, faRobot, faJetFighter, faHelicopter, faShield, faTruck, faShip, faPlaneDeparture, faSkull, faShieldAlt, faGears } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'
import { EventsConsumer } from '../../eventscontext';
import { StateConsumer } from '../../statecontext';
import { OlDropdownItem, OlElementDropdown, OlTextDropdown } from '../components/oldropdown';
import { OlCheckbox } from '../components/olcheckbox';
import { MAP_OPTIONS_DEFAULTS, MAP_OPTIONS_TOOLTIPS } from '../../constants/constants';
import { getApp } from '../../olympusapp';

library.add(faPlus, faGamepad, faRuler, faPencil, faMap);

export function Header(props) {
	return <StateConsumer>
		{(appState) =>
			<EventsConsumer>
				{(events) =>
					<nav className="bg-gray-300 border-gray-200 dark:bg-[#171C26] dark:border-gray-700">
						<div className="max-w-screen flex flex-wrap items-center justify-between p-4 gap-3">
							<div className="flex flex-row items-center justify-center gap-1">
								<img src="images/icon.png" className='h-12 p-0 rounded-md mr-2 cursor-pointer' onClick={events.toggleMainMenuVisible}></img>
							</div>
							<div className="ml-auto">
								<OlRoundStateButton icon={faLock} />
							</div>
							<div className="flex flex-row h-fit items-center justify-start gap-1">
								{
									Object.entries({
										'human': faPerson,'olympus': faBrain, 'dcs': faRobot
									}).map((entry) => {
										return <OlRoundStateButton
										onClick={() => {
											getApp().getMap().setHiddenType(entry[0], !appState.mapHiddenTypes[entry[0]]);
										}}
										checked={!appState.mapHiddenTypes[entry[0]]}
										icon={entry[1]} />
									})
								}
							</div>
							<div className='h-10 w-0 border-l-2 border-gray-500'></div>
							<div className="flex flex-row h-fit items-center justify-start gap-1">
								{
									Object.entries({
										'aircraft': faJetFighter,'helicopter': faHelicopter, 'groundunit-sam': faShieldAlt, 
										'groundunit': faTruck, 'navyunit': faShip, 'airbase': faPlaneDeparture, 'dead': faSkull
									}).map((entry) => {
										return <OlRoundStateButton
										onClick={() => {
											getApp().getMap().setHiddenType(entry[0], !appState.mapHiddenTypes[entry[0]]);
										}}
										checked={!appState.mapHiddenTypes[entry[0]]}
										icon={entry[1]} />
									})
								}
							</div>
							<div className='h-10 w-0 border-l-2 border-gray-500'></div>
							<div className="flex flex-row h-fit items-center justify-start gap-1">
								<OlRoundStateButton
									onClick={() => getApp().getMap().setHiddenType( 'blue', !appState.mapHiddenTypes['blue'] )}
									checked={!appState.mapHiddenTypes['blue']}
									icon={faShield} className={"!text-blue-500"} />
								<OlRoundStateButton
									onClick={() => getApp().getMap().setHiddenType('red', !appState.mapHiddenTypes['red'] )}
									checked={!appState.mapHiddenTypes['red']}
									icon={faShield} className={"!text-red-500"} />
								<OlRoundStateButton
									onClick={() => getApp().getMap().setHiddenType('neutral', !appState.mapHiddenTypes['neutral'] )}
									checked={!appState.mapHiddenTypes['neutral']}
									icon={faShield} className={"!text-gray-500"} />
							</div>
							<OlTextDropdown items={["DCS Sat", "DCS Alt"]} leftIcon='fa-solid fa-map' />
							<OlElementDropdown leftIcon={faGears} label="Options" className="w-80">
								{Object.keys(MAP_OPTIONS_TOOLTIPS).map((key) => {
									return <OlDropdownItem>
										<OlCheckbox
											checked = {appState.mapOptions[key]} 
											onChange = {(ev) => {
												getApp().getMap()?.setOption(key, ev.target.checked);
											}}/>
										<span className="text-nowrap">{ MAP_OPTIONS_TOOLTIPS[key] }</span>
									</OlDropdownItem>
								})}
							</OlElementDropdown>
						</div>
					</nav>
				}
			</EventsConsumer>
		}
	</StateConsumer>
}

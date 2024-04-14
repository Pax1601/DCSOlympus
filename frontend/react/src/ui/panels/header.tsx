import React from 'react'
import { OlRoundStateButton, OlStateButton } from '../components/olstatebutton';
import { faLock, faPerson, faBrain, faRobot, faJetFighter, faHelicopter, faShield, faTruck, faShip, faPlaneDeparture, faSkull, faShieldAlt, faCamera } from '@fortawesome/free-solid-svg-icons';
import { EventsConsumer } from '../../eventscontext';
import { StateConsumer } from '../../statecontext';
import { OlDropdownItem, OlDropdown } from '../components/oldropdown';
import { OlLabelToggle } from '../components/ollabeltoggle';
import { getApp } from '../../olympusapp';
import { olButtonsVisibilityAirbase, olButtonsVisibilityAircraft, olButtonsVisibilityDcs, olButtonsVisibilityGroundunit, olButtonsVisibilityGroundunitSam, olButtonsVisibilityHelicopter, olButtonsVisibilityHuman, olButtonsVisibilityNavyunit, olButtonsVisibilityOlympus } from '../components/olicons';

export function Header() {
	return <StateConsumer>
		{(appState) =>
			<EventsConsumer>
				{(events) =>
					<nav className="flex w-screen h-[66px] bg-gray-300 border-gray-200 dark:bg-[#171C26] dark:border-gray-700 px-3 z-ui-1">
						<div className="w-full max-w-full flex flex-nowrap items-center justify-between gap-3 my-auto">
							<div className="flex flex-row items-center justify-center gap-1 flex-none">
								<img src="images/icon.png" className='h-10 w-10 p-0 rounded-md mr-2 cursor-pointer'></img>
							</div>
							<div className="ml-auto">
								<OlRoundStateButton icon={faLock} checked={false} onClick={() => {}}/>
							</div>
							<div className="flex flex-row h-fit items-center justify-start gap-2">
								{
									Object.entries({
										'human': olButtonsVisibilityHuman,'olympus': olButtonsVisibilityOlympus, 'dcs': olButtonsVisibilityDcs
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
							<div className='h-11 w-0 border-l-[1px] border-gray-700'></div>
							<div className="flex flex-row h-fit items-center justify-start gap-1">
								{
									Object.entries({
										'aircraft': olButtonsVisibilityAircraft,'helicopter': olButtonsVisibilityHelicopter, 'groundunit-sam': olButtonsVisibilityGroundunitSam, 
										'groundunit': olButtonsVisibilityGroundunit, 'navyunit': olButtonsVisibilityNavyunit, 'airbase': olButtonsVisibilityAirbase, 'dead': faSkull
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
							<div className='h-11 w-0 border-l-[1px] border-gray-700'></div>
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
							<OlLabelToggle toggled={false} leftLabel={"Live"} rightLabel={"Map"} onClick={() => {}}></OlLabelToggle>
							<OlStateButton checked={false} icon={faCamera} onClick={() => {}} />
							<OlDropdown label="DCS Sat" className="w-40">
								<OlDropdownItem className="w-full">DCS Sat</OlDropdownItem>
								<OlDropdownItem className="w-full">DCS Alt</OlDropdownItem>
							</OlDropdown>
						</div>
					</nav>
				}
			</EventsConsumer>
		}
	</StateConsumer>
}

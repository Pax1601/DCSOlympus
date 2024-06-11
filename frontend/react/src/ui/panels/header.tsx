import React from 'react'
import { OlRoundStateButton, OlStateButton, OlLockStateButton } from '../components/olstatebutton';
import { faSkull, faCamera, faFlag, faLink, faUnlink } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EventsConsumer } from '../../eventscontext';
import { StateConsumer } from '../../statecontext';
import { OlDropdownItem, OlDropdown } from '../components/oldropdown';
import { OlLabelToggle } from '../components/ollabeltoggle';
import { getApp, IP, connectedToServer } from '../../olympusapp';
import { olButtonsVisibilityAirbase, olButtonsVisibilityAircraft, olButtonsVisibilityDcs, olButtonsVisibilityGroundunit, olButtonsVisibilityGroundunitSam, olButtonsVisibilityHelicopter, olButtonsVisibilityHuman, olButtonsVisibilityNavyunit, olButtonsVisibilityOlympus } from '../components/olicons';

export function Header() {
	return <StateConsumer>
		{(appState) =>
			<EventsConsumer>
				{(events) =>
					<nav className="flex w-screen h-[66px] bg-gray-300 border-gray-200 dark:bg-olympus-900 dark:border-gray-800 px-3 z-ui-2 drop-shadow-md">
						<div className="w-full max-w-full flex flex-nowrap items-center justify-between gap-3 my-auto">
							<div className="flex flex-row items-center justify-center gap-6 flex-none">
								<img src="images/icon.png" className='h-10 w-10 p-0 rounded-md'></img>
								<div className="flex flex-col items-start">
									<div className="pt-1 text-gray-800 dark:text-gray-400 text-xs">Connected to</div>
									<div className="flex text-gray-800 dark:text-gray-200 text-sm font-extrabold items-center justify-center gap-2">{IP} <FontAwesomeIcon icon={connectedToServer ? faLink : faUnlink} data-connected={connectedToServer} className="py-auto text-green-400 data-[connected='true']:dark:text-green-400 dark:text-red-500" /></div>
								</div>
							</div>
							<div className="ml-auto">
								<OlLockStateButton checked={false} onClick={() => {}} tooltip="Lock/unlock protected units (from scripted mission)"/>
							</div>
							<div className="flex flex-row h-fit items-center justify-start gap-1">
								{
									Object.entries({
										'human': olButtonsVisibilityHuman,'olympus': olButtonsVisibilityOlympus, 'dcs': olButtonsVisibilityDcs
									}).map((entry) => {
										return <OlRoundStateButton
										onClick={() => {
											getApp().getMap().setHiddenType(entry[0], !appState.mapHiddenTypes[entry[0]]);
										}}
										checked={!appState.mapHiddenTypes[entry[0]]}
										icon={entry[1]}
										tooltip={"Hide/show " + entry[0] + " units" } />
									})
								}
							</div>
							<div className='h-8 w-0 border-l-[2px] border-gray-700'></div>
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
										icon={entry[1]}
										tooltip={"Hide/show " + entry[0] + " units" } />
									})
								}
							</div>
							<div className='h-8 w-0 border-l-[2px] border-gray-700'></div>
							<div className="flex flex-row h-fit items-center justify-start gap-1">
								<OlRoundStateButton
									onClick={() => getApp().getMap().setHiddenType( 'blue', !appState.mapHiddenTypes['blue'] )}
									checked={!appState.mapHiddenTypes['blue']}
									icon={faFlag} className={"!text-blue-500"}
									tooltip={"Hide/show blue units" } />
								<OlRoundStateButton
									onClick={() => getApp().getMap().setHiddenType('red', !appState.mapHiddenTypes['red'] )}
									checked={!appState.mapHiddenTypes['red']}
									icon={faFlag} className={"!text-red-500"}
									tooltip={"Hide/show red units" }  />
								<OlRoundStateButton
									onClick={() => getApp().getMap().setHiddenType('neutral', !appState.mapHiddenTypes['neutral'] )}
									checked={!appState.mapHiddenTypes['neutral']}
									icon={faFlag} className={"!text-gray-500"}
									tooltip={"Hide/show neutral units" }  />
							</div>
							<OlLabelToggle toggled={false} leftLabel={"Live"} rightLabel={"Map"} onClick={() => {}}></OlLabelToggle>
							<OlStateButton checked={false} icon={faCamera} onClick={() => {}} tooltip="Activate/deactivate camera plugin" />
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

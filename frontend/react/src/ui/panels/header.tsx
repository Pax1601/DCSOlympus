import React from 'react'
import { OlStateButton } from '../components/olstatebutton';
import { faPlus, faGamepad, faRuler, faPencil, faMap } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'
import { EventsConsumer } from '../../eventscontext';
import { StateConsumer } from '../../statecontext';
import { OlDropdown } from '../components/oldropdown';

library.add(faPlus, faGamepad, faRuler, faPencil, faMap);

export function Header(props) {
	return <StateConsumer>
		{(appState) =>
			<EventsConsumer>
				{(events) =>
					<nav className="bg-white border-gray-200 dark:bg-[#171C26] dark:border-gray-700">
						<div className="max-w-screen flex flex-wrap items-center justify-between p-4">
							<div className="flex flex-row items-center justify-center gap-1">
								<img src="images/icon.png" className='h-12 border-2 p-0 bg-white rounded-md mr-2 cursor-pointer' onClick={events.toggleMainMenuVisible}></img>
								<OlStateButton onClick={events.toggleSpawnMenuVisible} checked={appState.spawnMenuVisible} icon="fa-solid fa-plus"></OlStateButton>
								<OlStateButton onClick={events.toggleUnitControlMenuVisible} checked={appState.unitControlMenuVisible} icon="fa-solid fa-gamepad"></OlStateButton>
								<OlStateButton onClick={events.toggleMeasureMenuVisible} checked={appState.measureMenuVisible} icon="fa-solid fa-ruler"></OlStateButton>
								<OlStateButton onClick={events.toggleDrawingMenuVisible} checked={appState.drawingMenuVisible} icon="fa-solid fa-pencil"></OlStateButton>
							</div>
							<OlDropdown items={["DCS Sat", "DCS Alt"]} leftIcon='fa-solid fa-map' />
						</div>
					</nav>
				}
			</EventsConsumer>
		}
	</StateConsumer>
}

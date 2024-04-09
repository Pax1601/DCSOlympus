import React from 'react'
import { OlStateButton } from '../components/olstatebutton';
import { faPlus, faGamepad, faRuler, faPencil, faMap } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'
import { EventsConsumer } from '../../eventscontext';
import { StateConsumer } from '../../statecontext';

library.add(faPlus, faGamepad, faRuler, faPencil, faMap);

export function SideBar(props) {
	return <StateConsumer>
		{(appState) =>
			<EventsConsumer>
				{(events) =>
					<nav className="z-ui-1 h-full bg-gray-300 border-gray-200 dark:bg-[#171C26] dark:border-gray-700">
						<div className="flex flex-wrap items-center justify-center p-4 w-20">
							<div className="flex flex-col items-center justify-center gap-1">
								<OlStateButton onClick={events.toggleSpawnMenuVisible} checked={appState.spawnMenuVisible} icon="fa-solid fa-plus"></OlStateButton>
								<OlStateButton onClick={events.toggleUnitControlMenuVisible} checked={appState.unitControlMenuVisible} icon="fa-solid fa-gamepad"></OlStateButton>
								<OlStateButton onClick={events.toggleMeasureMenuVisible} checked={appState.measureMenuVisible} icon="fa-solid fa-ruler"></OlStateButton>
								<OlStateButton onClick={events.toggleDrawingMenuVisible} checked={appState.drawingMenuVisible} icon="fa-solid fa-pencil"></OlStateButton>
							</div>
						</div>
					</nav>
				}
			</EventsConsumer>
		}
	</StateConsumer>
}

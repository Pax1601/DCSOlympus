import React from 'react'
import { OlStateButton } from '../components/olstatebutton';
import { faPlus, faGamepad, faRuler, faPencil, faEllipsisV, faCog } from '@fortawesome/free-solid-svg-icons';
import { EventsConsumer } from '../../eventscontext';
import { StateConsumer } from '../../statecontext';

export function SideBar() {
	return <StateConsumer>
		{(appState) =>
			<EventsConsumer>
				{(events) =>
					<nav className="z-ui-1 h-full bg-gray-300 dark:bg-olympus-800">
						<div className="flex flex-wrap items-center justify-center p-4 w-16">
							<div className="flex flex-col items-center justify-center gap-2.5">
								<OlStateButton onClick={events.toggleMainMenuVisible} checked={appState.mainMenuVisible} icon={faEllipsisV}></OlStateButton>
								<OlStateButton onClick={events.toggleSpawnMenuVisible} checked={appState.spawnMenuVisible} icon={faPlus}></OlStateButton>
								<OlStateButton onClick={events.toggleUnitControlMenuVisible} checked={appState.unitControlMenuVisible}  icon={faGamepad}></OlStateButton>
								<OlStateButton onClick={events.toggleMeasureMenuVisible} checked={appState.measureMenuVisible} icon={faRuler}></OlStateButton>
								<OlStateButton onClick={events.toggleDrawingMenuVisible} checked={appState.drawingMenuVisible} icon={faPencil}></OlStateButton>
								<OlStateButton onClick={events.toggleOptionsMenuVisible} checked={appState.optionsMenuVisible} icon={faCog}></OlStateButton>
							</div>
						</div>
					</nav>
				}
			</EventsConsumer>
		}
	</StateConsumer>
}

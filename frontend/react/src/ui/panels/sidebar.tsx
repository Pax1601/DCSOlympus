import React from 'react'
import { OlStateButton } from '../components/olstatebutton';
import { faPlus, faGamepad, faRuler, faPencil, faEllipsisV, faCog, faQuestionCircle, faPlusSquare } from '@fortawesome/free-solid-svg-icons';
import { EventsConsumer } from '../../eventscontext';
import { StateConsumer } from '../../statecontext';

export function SideBar() {
	return <StateConsumer>
		{(appState) =>
			<EventsConsumer>
				{(events) =>
					<nav className="flex flex-col z-ui-1 h-full bg-gray-300 dark:bg-olympus-900">
						<div className="flex-1 flex-wrap items-center justify-center p-4 w-16">
							<div className="flex flex-col items-center justify-center gap-2.5">
								<OlStateButton onClick={events.toggleMainMenuVisible} checked={appState.mainMenuVisible} icon={faEllipsisV}></OlStateButton>
								<OlStateButton onClick={events.toggleSpawnMenuVisible} checked={appState.spawnMenuVisible} icon={faPlusSquare}></OlStateButton>
								<OlStateButton onClick={events.toggleUnitControlMenuVisible} checked={appState.unitControlMenuVisible} icon={faGamepad}></OlStateButton>
								<OlStateButton onClick={events.toggleMeasureMenuVisible} checked={appState.measureMenuVisible} icon={faRuler}></OlStateButton>
								<OlStateButton onClick={events.toggleDrawingMenuVisible} checked={appState.drawingMenuVisible} icon={faPencil}></OlStateButton>
							</div>
						</div>
						<div className="flex flex-wrap content-end justify-center p-4 w-16">
							<div className="flex flex-col items-center justify-center gap-2.5">
								<OlStateButton onClick={() => window.open("https://github.com/Pax1601/DCSOlympus/wiki")} checked={false} icon={faQuestionCircle}></OlStateButton>
								<OlStateButton onClick={events.toggleOptionsMenuVisible} checked={appState.optionsMenuVisible} icon={faCog}></OlStateButton>
							</div>
						</div>
					</nav>
				}
			</EventsConsumer>
		}
	</StateConsumer>
}

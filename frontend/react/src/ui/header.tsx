import React from 'react'
import { StateButton } from './statebuttons';
import { faPlus, faGamepad, faRuler, faPencil } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'
import { EventsConsumer, EventsContext } from '../eventscontext';
import { StateConsumer } from '../statecontext';

library.add(faPlus, faGamepad, faRuler, faPencil)

export class Header extends React.Component<{}, {}> {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<StateConsumer>
				{(appState) =>
					<EventsConsumer>
						{(events) =>
							<div className='absolute top-0 left-0 h-16 w-full z-ui bg-background-steel flex flex-row items-center px-5'>
								<div className="flex flex-row items-center gap-1">
									<StateButton onClick={events.toggleSpawnMenu} active={appState.spawnMenuVisible} icon="fa-solid fa-plus"></StateButton>
									<StateButton onClick={events.toggleUnitControlMenu} active={appState.unitControlMenuVisible} icon="fa-solid fa-gamepad"></StateButton>
									<StateButton onClick={events.toggleMeasureMenu} active={appState.measureMenuVisible} icon="fa-solid fa-ruler"></StateButton>
									<StateButton onClick={events.toggleDrawingMenu} active={appState.drawingMenuVisible} icon="fa-solid fa-pencil"></StateButton>
								</div>
							</div>
						}
					</EventsConsumer>
				}
			</StateConsumer>
		);
	}
}

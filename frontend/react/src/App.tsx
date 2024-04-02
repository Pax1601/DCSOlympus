import React from 'react'
import './app.css'

import { MapContainer, TileLayer } from 'react-leaflet'

import { Map } from './map/map'
import { Header } from './ui/header'
import { EventsProvider } from './eventscontext'
import { StateProvider } from './statecontext'

const position = [51.505, -0.09]

export type OlympusState = {
	spawnMenuVisible: boolean,
	unitControlMenuVisible: boolean,
	measureMenuVisible: boolean,
	drawingMenuVisible: boolean
}

export default class App extends React.Component<{}, OlympusState> {
	constructor(props) {
		super(props);

		/* State initialization */
		this.state = {
			spawnMenuVisible: false,
			unitControlMenuVisible: false,
			measureMenuVisible: false,
			drawingMenuVisible: false
		}

		/* Methods bindings */
		this.showSpawnMenu = this.showSpawnMenu.bind(this);
		this.toggleSpawnMenu = this.toggleSpawnMenu.bind(this);
		this.showUnitControlMenu = this.showUnitControlMenu.bind(this);
		this.toggleUnitControlMenu = this.toggleUnitControlMenu.bind(this);
		this.showMeasureMenu = this.showMeasureMenu.bind(this);
		this.toggleMeasureMenu = this.toggleMeasureMenu.bind(this);
		this.showDrawingMenu = this.showDrawingMenu.bind(this);
		this.toggleDrawingMenu = this.toggleDrawingMenu.bind(this);		
	}

	showSpawnMenu(show: boolean) {
		this.setState({
			spawnMenuVisible: show,
			unitControlMenuVisible: false,
			measureMenuVisible: false,
			drawingMenuVisible: false
		});
	}

	toggleSpawnMenu() {
		this.setState({
			spawnMenuVisible: !this.state.spawnMenuVisible,
			unitControlMenuVisible: false,
			measureMenuVisible: false,
			drawingMenuVisible: false
		});
	}

	showUnitControlMenu(show: boolean) {
		this.setState({
			spawnMenuVisible: false,
			unitControlMenuVisible: show,
			measureMenuVisible: false,
			drawingMenuVisible: false
		});
	}

	toggleUnitControlMenu() {
		this.setState({
			spawnMenuVisible: false,
			unitControlMenuVisible: !this.state.unitControlMenuVisible,
			measureMenuVisible: false,
			drawingMenuVisible: false
		});
	}

	showMeasureMenu(show: boolean) {
		this.setState({
			spawnMenuVisible: false,
			unitControlMenuVisible: false,
			measureMenuVisible: show,
			drawingMenuVisible: false
		});
	}

	toggleMeasureMenu() {
		this.setState({
			spawnMenuVisible: false,
			unitControlMenuVisible: false,
			measureMenuVisible: !this.state.measureMenuVisible,
			drawingMenuVisible: false
		});
	}

	showDrawingMenu(show: boolean) {
		this.setState({
			spawnMenuVisible: false,
			unitControlMenuVisible: false,
			measureMenuVisible: false,
			drawingMenuVisible: show
		});
	}

	toggleDrawingMenu() {
		this.setState({
			spawnMenuVisible: false,
			unitControlMenuVisible: false,
			measureMenuVisible: false,
			drawingMenuVisible: !this.state.drawingMenuVisible
		});
	}

	render() {
		return (
			<div style={{ width: "100%", height: "100%" }}>
				<StateProvider value={this.state}>
					<EventsProvider value={
						{
							showSpawnMenu: this.showSpawnMenu,
							toggleSpawnMenu: this.toggleSpawnMenu,
							showUnitControlMenu: this.showUnitControlMenu,
							toggleUnitControlMenu: this.toggleUnitControlMenu,
							showMeasureMenu: this.showMeasureMenu,
							toggleMeasureMenu: this.toggleMeasureMenu,
							showDrawingMenu: this.showMeasureMenu,
							toggleDrawingMenu: this.toggleDrawingMenu
						}
					}>
						<MapContainer center={position} zoom={13} className='absolute w-full h-full top-0 left-0'>
							<TileLayer
								url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
							/>
						</MapContainer>
						<Header ></Header>
					</EventsProvider>
				</StateProvider>
			</div>
		)
	}
}

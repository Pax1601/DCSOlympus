import React from 'react'
import { useState } from 'react'
import './App.css'

import { MapContainer, TileLayer } from 'react-leaflet'

import { Map } from './map/map'
import { Header } from './ui/header'

var map: Map;
const position = [51.505, -0.09]

function App() {
	const [count, setCount] = useState(0)

	return (
		<div style={{ width: "100%", height: "100%" }}>
			<MapContainer center={position} zoom={13} className='absolute w-full h-full top-0 left-0'>
				<TileLayer
					url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
				/>
			</MapContainer>
			<Header></Header>
		</div>
	)
}

export default App

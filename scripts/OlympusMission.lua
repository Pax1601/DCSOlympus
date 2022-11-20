
Olympus = {}
function Olympus.notify(message, displayFor)
    trigger.action.outText(message, displayFor)
end

function Olympus.setMissionData(arg, time)
	local bullseyeVec3 = coalition.getMainRefPoint(0)
	local bullseyeLatitude, bullseyeLongitude, bullseyeAltitude = coord.LOtoLL(bullseyeVec3)
	local command = "Olympus.missionData = " ..
					"{" ..
						"bullseye = {" .. 
							"x = " .. bullseyeVec3.x .. "," ..
							"y = " .. bullseyeVec3.z .. "," ..
							"lat = " .. bullseyeLatitude .. "," ..
							"lng = " .. bullseyeLongitude .. "," ..	 								
						"}" .. 
					"}\n" ..
					"Olympus.OlympusDLL.setMissionData()"
	net.dostring_in("export", command)
	return time + 5
end

timer.scheduleFunction(Olympus.setMissionData, {}, timer.getTime() + 5)
Olympus.notify("OlympusMission script loaded correctly", 10)

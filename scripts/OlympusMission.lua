
Olympus = {}
function Olympus.notify(message, displayFor)
    trigger.action.outText(message, displayFor)
end

function Olympus.setMissionData(arg, time)
	local missionData = {}

	-- Bullseye data
	local bullseye = {}
	for i = 0, 2 do
		local bullseyeVec3 = coalition.getMainRefPoint(i)
		local bullseyeLatitude, bullseyeLongitude, bullseyeAltitude = coord.LOtoLL(bullseyeVec3)
		bullseye[i] = {}
		bullseye[i]["lat"] =  bullseyeLatitude
		bullseye[i]["lng"] =  bullseyeLongitude
	end

	-- Units tactical data
	-- TODO find some way to spread the load of getting this data (split)
	local unitsData = {}
	for groupName, gp in pairs(mist.DBs.groupsByName) do
		if groupName ~= nil then
			local group = Group.getByName(groupName)
			if group ~= nil then
				local controller = group:getController()
				for index, unit in pairs(group:getUnits()) do
					local table = {}
					table["targets"] = {}
					table["targets"]["visual"] = controller:getDetectedTargets(1)
					table["targets"]["radar"] = controller:getDetectedTargets(4)
					table["targets"]["rwr"] = controller:getDetectedTargets(16)
					table["targets"]["other"] = controller:getDetectedTargets(2, 8, 32)

					table["hasTask"] = controller:hasTask()
					
					table["ammo"] = unit:getAmmo()
					table["fuel"] = unit:getFuel()
					table["life"] = unit:getLife() / unit:getLife0()
					unitsData[unit:getObjectID()] = table
				end
			end
		end
	end

	-- Airbases data
	local base = world.getAirbases()
	local basesData = {}
	for i = 1, #base do
		local info = {}
		local latitude, longitude, altitude = coord.LOtoLL(Airbase.getPoint(base[i]))
		info["callsign"] = Airbase.getCallsign(base[i])
		info["coalition"] = Airbase.getCoalition(base[i])
		info["lat"] =  latitude
		info["lng"] =  longitude
		if Airbase.getUnit(base[i]) then
			info["unitId"] = Airbase.getUnit(base[i]):getID()
		end
		basesData[i] = info
	end

	

	-- Assemble missionData table
	missionData["bullseye"] = bullseye
	missionData["unitsData"] = unitsData
	missionData["airbases"] = basesData

	local command = "Olympus.missionData = " .. Olympus.serializeTable(missionData) .. "\n" .. "Olympus.OlympusDLL.setMissionData()"
	net.dostring_in("export", command)
	return time + 5
end

function Olympus.serializeTable(val, name, skipnewlines, depth)
    skipnewlines = skipnewlines or false
    depth = depth or 0

    local tmp = string.rep(" ", depth)
    if name then 
		if type(name) == "number" then
			tmp = tmp .. "[" .. name .. "]" .. " = " 
		else
			tmp = tmp .. name  .. " = " 
		end
	end

    if type(val) == "table" then
        tmp = tmp .. "{" .. (not skipnewlines and "\n" or "")
        for k, v in pairs(val) do
            tmp =  tmp .. Olympus.serializeTable(v, k, skipnewlines, depth + 1) .. "," .. (not skipnewlines and "\n" or "")
        end
        tmp = tmp .. string.rep(" ", depth) .. "}"
    elseif type(val) == "number" then
        tmp = tmp .. tostring(val)
    elseif type(val) == "string" then
        tmp = tmp .. string.format("%q", val)
    elseif type(val) == "boolean" then
        tmp = tmp .. (val and "true" or "false")
    else
        tmp = tmp .. "\"[inserializeable datatype:" .. type(val) .. "]\""
    end

    return tmp
end

timer.scheduleFunction(Olympus.setMissionData, {}, timer.getTime() + 1)
Olympus.notify("OlympusMission script loaded correctly", 10)

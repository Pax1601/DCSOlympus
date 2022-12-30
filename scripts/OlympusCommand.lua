Olympus = {}
Olympus.unitCounter = 1

function Olympus.notify(message, displayFor)
    trigger.action.outText(message, displayFor)
end

function Olympus.move(unitName, lat, lng, altitude, speed, category, targetName)
    Olympus.notify("Olympus.move " .. unitName .. " (" .. lat .. ", " .. lng ..") " .. altitude .. "m " .. speed .. "m/s " .. category .. " target " .. targetName, 10)
    local unit = Unit.getByName(unitName)
	if unit ~= nil then
		if category == "Aircraft" then
			local startPoint = mist.getLeadPos(unit:getGroup())
			local endPoint = coord.LLtoLO(lat, lng, 0)

			local task = nil
			if targetName ~= "" then
				targetID = Unit.getByName(targetName):getID()
				task = { 
					id = 'EngageUnit', 
					params = { 
						unitId = targetID,
					} 
				}
			end

			local path = {} 
			path[#path + 1] = mist.fixedWing.buildWP(startPoint, flyOverPoint, speed, altitude, 'BARO')
			if task ~= nil then
				path[#path].task = task
			end
			path[#path + 1] = mist.fixedWing.buildWP(endPoint, turningPoint, speed, altitude, 'BARO') 
			if task ~= nil then
				path[#path].task = task
			end
			
			local missionTask = {
				id = 'Mission',
				params = {
					route = {
						points = mist.utils.deepCopy(path),
					},
				},
			}
			group = unit:getGroup()
			local groupCon = group:getController()
			if groupCon then
				groupCon:setTask(missionTask)
			end
			Olympus.notify("Olympus.move executed succesfully on a air unit", 10)
		elseif category == "GroundUnit" then
			vars = 
				{
					group = unit:getGroup(), 
					point = coord.LLtoLO(lat, lng, 0),
					form = "Off Road",
					heading = 0,
					speed = speed,
					disableRoads = true
				}
			mist.groupToRandomPoint(vars)
			Olympus.notify("Olympus.move executed succesfully on a ground unit", 10)
		else
			Olympus.notify("Olympus.move not implemented yet for " .. category, 10)
		end
	else
        Olympus.notify("Error in Olympus.move " .. unitName, 10)
	end
end  

function Olympus.smoke(color, lat, lng)
    Olympus.notify("Olympus.smoke " .. color .. " (" .. lat .. ", " .. lng ..")", 10)
	local colorEnum = nil
	if color == "green" then
		colorEnum = trigger.smokeColor.Green
	elseif color == "red" then
		colorEnum = trigger.smokeColor.Red
	elseif color == "white" then 
		colorEnum = trigger.smokeColor.White
	elseif color == "orange" then 
		colorEnum = trigger.smokeColor.Orange
	elseif color == "blue" then
		colorEnum = trigger.smokeColor.Blue
	end
    trigger.action.smoke(mist.utils.makeVec3GL(coord.LLtoLO(lat, lng, 0)), colorEnum)
end  

function Olympus.spawnGround(coalition, type, lat, lng, ID)
    Olympus.notify("Olympus.spawnGround " .. coalition .. " " .. type .. " (" .. lat .. ", " .. lng ..")", 10)
	local spawnLocation = mist.utils.makeVec3GL(coord.LLtoLO(lat, lng, 0))
	local unitTable = 
	{
		[1] = 
		{
			["type"] = type,
			["x"] = spawnLocation.x,
			["y"] = spawnLocation.z,
			["playerCanDrive"] = true,
			["heading"] = 0,
		},
	} 

	local countryID = nil
	if coalition == 'red' then
		countryID = country.id.RUSSIA
	else
		countryID = country.id.USA
	end

	local vars = 
	{
		units = unitTable, 
		country = countryID, 
		category = 'vehicle',
		name = "Olympus-" .. Olympus.unitCounter,
	}
	mist.dynAdd(vars)
	Olympus.unitCounter = Olympus.unitCounter + 1
	Olympus.notify("Olympus.spawnGround completed succesfully", 10)
end  

function Olympus.spawnAir(coalition, unitType, lat, lng, payloadName)
	local alt = 5000
	Olympus.notify("Olympus.spawnAir " .. coalition .. " " .. unitType .. " (" .. lat .. ", " .. lng ..") " .. payloadName, 10)
	local spawnLocation = mist.utils.makeVec3GL(coord.LLtoLO(lat, lng, 0))
	local payload = {}
	if Olympus.unitPayloads[unitType][payloadName] ~= nil then
		payload = Olympus.unitPayloads[unitType][payloadName]
	end
	local unitTable = 
	{	
		[1] = 
		{
			["type"] = unitType,
			["x"] = spawnLocation.x,
			["y"] = spawnLocation.z,
			["alt"] = alt,
			["skill"] = "Excellent",
			["payload"] = 
			{
				["pylons"] = payload, 
				["fuel"] = 4900,
				["flare"] = 60,
				["ammo_type"] = 1,
				["chaff"] = 60,
				["gun"] = 100,
			}, 
			["heading"] = 0,
			["callsign"] = 
			{
				[1] = 1,
				[2] = 1,
				[3] = 1,
				["name"] = "Enfield11",
			},
		},
	}

	local countryID = nil
	if coalition == 'red' then
		countryID = country.id.RUSSIA
	else
		countryID = country.id.USA
	end

	local vars = 
	{
		units = unitTable, 
		country = countryID, 
		category = 'airplane',
		task = "CAP",
		tasks = {},
		name = "Olympus-" .. Olympus.unitCounter,
	}

	mist.dynAdd(vars)
	Olympus.unitCounter = Olympus.unitCounter + 1
	Olympus.notify("Olympus.spawnAir completed succesfully", 10)
end

Olympus.notify("OlympusCommand script loaded correctly", 10)
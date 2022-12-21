Olympus = {}
Olympus.unitCounter = 1

function Olympus.notify(message, displayFor)
    trigger.action.outText(message, displayFor)
end

function Olympus.move(unitName, lat, lng, v, category)
    Olympus.notify("Olympus.move " .. unitName .. " (" .. lat .. ", " .. lng ..")", 10)
    local unit = Unit.getByName(unitName)
	if unit ~= nil then
		if category == 1 then
			local startPoint =  mist.getLeadPos(unit:getGroup())
			local endPoint = coord.LLtoLO(lat, lng, 0)

			local path = {} 
			path[#path + 1] = mist.fixedWing.buildWP(startPoint, flyOverPoint, v, startPoint.y, 'BARO')
			path[#path + 1] = mist.fixedWing.buildWP(endPoint, turningPoint, v, startPoint.y, 'BARO') 
			
			mist.goRoute(unit:getGroup(), path)
			Olympus.notify("Olympus.move executed succesfully on a air unit", 10)
		elseif category == 2 then
			vars = 
				{
					group = unit:getGroup(), 
					point = coord.LLtoLO(lat, lng, 0),
					form = "Off Road",
					heading = 0,
					speed = v,
					disableRoads = true
				}
			mist.groupToRandomPoint(vars)
			Olympus.notify("Olympus.move executed succesfully on a ground unit", 10)
		else
			Olympus.notify("Olympus.move not implemented yet for navy units", 10)
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

function Olympus.spawnAir(coalition, type, lat, lng, alt)
	Olympus.notify("Olympus.spawnAir " .. coalition .. " " .. type .. " (" .. lat .. ", " .. lng ..")", 10)
	local spawnLocation = mist.utils.makeVec3GL(coord.LLtoLO(lat, lng, 0))
	local unitTable = 
	{	
		[1] = 
		{
			["type"] = type,
			["x"] = spawnLocation.x,
			["y"] = spawnLocation.z,
			["alt"] = alt,
			["skill"] = "Excellent",
			["payload"] = 
			{
				["pylons"] = 
				{
				}, 
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

function Olympus.attackUnit(unitName, targetName, lat, lng) 
	Olympus.notify("Olympus.attackUnit " .. unitName .. " " .. targetName, 10)
	local targetID = Unit.getByName(targetName):getID()
	local unit = Unit.getByName(unitName)


	local category = 1


	if unit ~= nil then
		if category == 1 then
			local startPoint = mist.getLeadPos(unit:getGroup())
			local endPoint = coord.LLtoLO(lat, lng, 0)

			local attackTask = { 
				id = 'EngageUnit', 
				params = { 
					unitId = targetID,
				} 
			}

			local path = {} 
			path[#path + 1] = mist.fixedWing.buildWP(startPoint, flyOverPoint, v, startPoint.y, 'BARO')
			path[#path].task = attackTask
			path[#path + 1] = mist.fixedWing.buildWP(endPoint, turningPoint, v, startPoint.y, 'BARO') 
			path[#path].task = attackTask
			
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
			Olympus.notify("Olympus.attackUnit completed succesfully", 10)
		elseif category == 2 then
			Olympus.notify("Olympus.attackUnit not implemented yet for ground units", 10)
		else
			Olympus.notify("Olympus.attackUnit not implemented yet for navy units", 10)
		end
	end
end

Olympus.notify("OlympusCommand script loaded correctly", 10)
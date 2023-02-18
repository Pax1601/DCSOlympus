Olympus.unitCounter = 1
Olympus.payloadRegistry = {}
  
function Olympus.notify(message, displayFor)
    -- trigger.action.outText(message, displayFor)
end

-- Gets a unit class reference from a given ObjectID (the ID used by Olympus for unit referencing)
function Olympus.getUnitByID(ID)
	for name, table in pairs(mist.DBs.unitsByName) do
		local unit = Unit.getByName(name)
		if unit and unit:getObjectID() == ID then
			return unit
		end
	end
	return nil
end

function Olympus.getCountryIDByCoalition(coalition)
	local countryID = 0
	if coalition == 'red' then
		countryID = country.id.RUSSIA
	else
		countryID = country.id.USA
	end
	return countryID
end

function Olympus.getCoalitionByCoalitionID(coalitionID)
	local coalition = "neutral"
	if coalitionID == 1 then 
		coalition = "red"
	elseif coalitionID == 2 then
		coalition = "blue"
	end
	return coalition
end

-- Builds a valid task depending on the provided options
function Olympus.buildEnrouteTask(options)
	local task = nil
	-- Engage specific target by ID. Checks if target exists.
	if options['id'] == 'EngageUnit' and options['targetID'] then
		local target = Olympus.getUnitByID(options['targetID'])
		if target and target:isExist() then
			task = { 
				id = 'EngageUnit', 
				params = { 
					unitId = options['targetID'],
				} 
			}
		end
	end
	return task
end

-- Builds a valid task depending on the provided options
function Olympus.buildTask(options)
	local task = nil
	-- Engage specific target by ID. Checks if target exists.
	if options['id'] == 'FollowUnit' and options['leaderID'] and options['offset'] then
		local leader = Olympus.getUnitByID(options['leaderID'])
		if leader and leader:isExist() then
			task = {
				id = 'Follow',
				params = {
					groupId = leader:getGroup():getID(),
					pos = options['offset'],
					lastWptIndexFlag = false,
					lastWptIndex = 1
				}    
			}
		end
	end
	return task
end

-- Move a unit. Since many tasks in DCS are Enroute tasks, this function is an important way to control the unit AI
function Olympus.move(ID, lat, lng, altitude, speed, category, taskOptions)
    Olympus.notify("Olympus.move " .. ID .. " (" .. lat .. ", " .. lng ..") " .. altitude .. "m " .. speed .. "m/s " .. category, 2)
    local unit = Olympus.getUnitByID(ID)
	if unit then
		if category == "Aircraft" then
			local startPoint = mist.getLeadPos(unit:getGroup())
			local endPoint = coord.LLtoLO(lat, lng, 0) 

			local path = {}
			if taskOptions and taskOptions['id'] == 'Land' then
				path = {
					[1] = mist.fixedWing.buildWP(startPoint, flyOverPoint, speed, altitude, 'BARO'),
					[2] = mist.fixedWing.buildWP(endPoint, landing, speed, 0, 'AGL')
				} 
			else
				path = {
					[1] = mist.fixedWing.buildWP(startPoint, flyOverPoint, speed, altitude, 'BARO'),
					[2] = mist.fixedWing.buildWP(endPoint, turningPoint, speed, altitude, 'BARO')
				}
			end

			-- If a task exists assign it to the controller
			if taskOptions then
				local task = Olympus.buildEnrouteTask(taskOptions)
				if task then 
					path[1].task = task
					path[2].task = task
				end
			end
			
			-- Assign the mission task to the controller
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
			Olympus.notify("Olympus.move executed successfully on a Aircraft", 2)
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
			Olympus.notify("Olympus.move executed succesfully on a ground unit", 2)
		else
			Olympus.notify("Olympus.move not implemented yet for " .. category, 2)
		end
	else
        Olympus.notify("Error in Olympus.move " .. unitName, 2)
	end
end  

-- Creates a simple smoke on the ground
function Olympus.smoke(color, lat, lng)
    Olympus.notify("Olympus.smoke " .. color .. " (" .. lat .. ", " .. lng ..")", 2)
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

-- Spawns a single ground unit
function Olympus.spawnGroundUnit(coalition, unitType, lat, lng)
    Olympus.notify("Olympus.spawnGroundUnit " .. coalition .. " " .. unitType .. " (" .. lat .. ", " .. lng ..")", 2)
	local spawnLocation = mist.utils.makeVec3GL(coord.LLtoLO(lat, lng, 0))
	local unitTable = 
	{
		[1] = 
		{
			["type"] = unitType,
			["x"] = spawnLocation.x,
			["y"] = spawnLocation.z,
			["playerCanDrive"] = true,
			["heading"] = 0,
		},
	} 

	local countryID = Olympus.getCountryIDByCoalition(coalition)
	
	local vars = 
	{
		units = unitTable, 
		country = countryID, 
		category = 'vehicle',
		name = "Olympus-" .. Olympus.unitCounter,
	}
	mist.dynAdd(vars)
	Olympus.unitCounter = Olympus.unitCounter + 1
	Olympus.notify("Olympus.spawnGround completed succesfully", 2)
end  

-- Spawns a single aircraft. Spawn options are:
-- payloadName: a string, one of the names defined in unitPayloads.lua. Must be compatible with the unitType
-- airbaseName: a string, if present the aircraft will spawn on the ground of the selected airbase
-- payload: a table, if present the unit will receive this specific payload. Overrides payloadName
function Olympus.spawnAircraft(coalition, unitType, lat, lng, spawnOptions)
	local payloadName = spawnOptions["payloadName"]
	local airbaseName = spawnOptions["airbaseName"]
	local payload = spawnOptions["payload"]

	Olympus.notify("Olympus.spawnAircraft " .. coalition .. " " .. unitType .. " (" .. lat .. ", " .. lng ..")", 2)
	local spawnLocation = mist.utils.makeVec3GL(coord.LLtoLO(lat, lng, 0))

	if payload == nil then
		if payloadName and payloadName ~= "" and Olympus.unitPayloads[unitType][payloadName] then
			payload = Olympus.unitPayloads[unitType][payloadName]
		else
			payload = {}
		end
	end
	
	local countryID = Olympus.getCountryIDByCoalition(coalition)

	local unitTable = 
	{	
		[1] = 
		{
			["type"] = unitType,
			["x"] = spawnLocation.x,
			["y"] = spawnLocation.z,
			["skill"] = "Excellent",
			["payload"] = 
			{
				["pylons"] = payload, 
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
				["name"] = "Olympus" .. Olympus.unitCounter,
			},
			["name"] = "Olympus-" .. Olympus.unitCounter
		},
	}

	-- If a airbase is provided the first waypoint is set as a From runway takeoff.
	local route = {}
	if airbaseName and airbaseName ~= "" then
		local airbase = Airbase.getByName(airbaseName)
		if airbase then
			local airbaseID = airbase:getID()
			route = 
			{
				["points"] = 
				{
					[1] = 
					{
						["action"] = "From Runway",
						["task"] = 
						{
							["id"] = "ComboTask",
							["params"] = {["tasks"] = {},}, 
						},
						["type"] = "TakeOff",
						["ETA"] = 0,
						["ETA_locked"] = true,
						["x"] = spawnLocation.x,
						["y"] = spawnLocation.z,
						["formation_template"] = "",
						["airdromeId"] = airbaseID,
						["speed_locked"] = true,
					}, 
				}, 
			} 			
		end
	end
	
	local vars = 
	{
		units = unitTable, 
		country = countryID, 
		category = 'airplane',
		name = "Olympus-" .. Olympus.unitCounter,
		route = route,
		task = 'CAP',
	}

	local newGroup = mist.dynAdd(vars)

	-- Save the payload to be reused in case the unit is cloned. TODO: save by ID not by name (it works but I like consistency)
	Olympus.payloadRegistry[vars.name] = payload
	Olympus.unitCounter = Olympus.unitCounter + 1
	Olympus.notify("Olympus.spawnAir completed successfully", 2)
end

-- Clones a unit by ID. Will clone the unit with the same original payload as the source unit. TODO: only works on Olympus unit not ME units.
function Olympus.clone(ID, lat, lng)
	Olympus.notify("Olympus.clone " .. ID, 2)
	local unit = Olympus.getUnitByID(ID)
	if unit then
		local coalition = Olympus.getCoalitionByCoalitionID(unit:getCoalition())
		
		-- TODO: only works on Aircraft
		local spawnOptions = {
			payload = Olympus.payloadRegistry[unit:getName()]
		}
		Olympus.spawnAircraft(coalition, unit:getTypeName(), lat, lng, spawnOptions)
	end
	Olympus.notify("Olympus.clone completed successfully", 2)
end

function Olympus.delete(ID, lat, lng)
	Olympus.notify("Olympus.delete " .. ID, 2)
	local unit = Olympus.getUnitByID(ID)
	if unit then
		unit:destroy();
		Olympus.notify("Olympus.delete completed successfully", 2)
	end
end

function Olympus.setTask(ID, taskOptions)
	Olympus.notify("Olympus.setTask " .. ID .. " " .. Olympus.serializeTable(taskOptions), 2)
	local unit = Olympus.getUnitByID(ID)
	if unit then
		local task = Olympus.buildTask(taskOptions);
		if task then
			unit:getGroup():getController():setTask(task)
			Olympus.notify("Olympus.setTask completed successfully", 2)
		end
	end
end

function Olympus.resetTask(ID)
	Olympus.notify("Olympus.resetTask " .. ID, 2)
	local unit = Olympus.getUnitByID(ID)
	if unit then
		unit:getGroup():getController():resetTask()
		Olympus.notify("Olympus.resetTask completed successfully", 2)
	end
end

function Olympus.setCommand(ID, command)
	Olympus.notify("Olympus.setCommand " .. ID .. " " .. Olympus.serializeTable(command), 2)
	local unit = Olympus.getUnitByID(ID)
	if unit then
		unit:getGroup():getController():setCommand(command)
		Olympus.notify("Olympus.setCommand completed successfully", 2)
	end
end

function Olympus.setOption(ID, optionID, optionValue)
	Olympus.notify("Olympus.setCommand " .. ID .. " " .. optionID .. " " .. optionValue, 2)
	local unit = Olympus.getUnitByID(ID)
	if unit then
		unit:getGroup():getController():setOption(optionID, optionValue)
		Olympus.notify("Olympus.setOption completed successfully", 2)
	end
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

Olympus.notify("OlympusCommand script loaded successfully", 2)
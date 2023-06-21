local version = "v0.3.0-alpha"

local debug = false

Olympus.unitCounter = 1
Olympus.payloadRegistry = {}
Olympus.groupIndex = 0
Olympus.groupStep = 40
  
Olympus.OlympusDLL = nil
Olympus.DLLsloaded = false
Olympus.OlympusModPath = os.getenv('DCSOLYMPUS_PATH')..'\\bin\\' 

function Olympus.debug(message, displayFor)
	if debug == true then
    	trigger.action.outText(message, displayFor)
	end
end

function Olympus.notify(message, displayFor)
    trigger.action.outText(message, displayFor)
end

function Olympus.loadDLLs()
	-- Add the .dll paths
	package.cpath = package.cpath..';'..Olympus.OlympusModPath..'?.dll;'
	
	local status
	status, Olympus.OlympusDLL = pcall(require, 'olympus')
	if status then
		return true
	else
		return false
	end	
end

-- Gets a unit class reference from a given ObjectID (the ID used by Olympus for unit referencing)
function Olympus.getUnitByID(ID)
	for name, table in pairs(mist.DBs.unitsByName) do
		local unit = Unit.getByName(name)
		if unit and unit["getObjectID"] and unit:getObjectID() == ID then
			return unit
		end
	end
	return nil
end

function Olympus.getCountryIDByCoalition(coalition)
	local countryID = 0
	if coalition == 'red' then
		countryID = country.id.CJTF_RED
	elseif coalition == 'blue' then
		countryID = country.id.CJTF_BLUE
	else
		countryID = country.id.UN_PEACEKEEPERS
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
	-- Start being an active tanker
	elseif options['id'] == 'Tanker' then
		task = { 
			id = 'Tanker', 
			params = {},
		}
	-- Start being an active AWACS
	elseif options['id'] == 'AWACS' then
		task = { 
			id = 'AWACS', 
			params = {},
		}
	end
	return task
end

-- Builds a valid task depending on the provided options
function Olympus.buildTask(groupName, options)
	local task = nil

	local group = Group.getByName(groupName)
	if (Olympus.isArray(options)) then
		local tasks = {}
		for idx, subOptions in pairs(options) do
			tasks[idx] = Olympus.buildTask(groupName, subOptions) or Olympus.buildEnrouteTask(subOptions)
		end
		task = { 
			id = 'ComboTask', 
			params = { 
				tasks = tasks
			} 
		} 
		Olympus.debug(Olympus.serializeTable(task), 30)
	else 
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
		elseif options['id'] == 'Refuel' then
			task = {
				id = 'Refueling', 
				params = {}   
			}
		elseif options['id'] == 'Orbit' then
			task = { 
				id = 'Orbit', 
				params = { 
					pattern = options['pattern'] or "Circle"
				} 
			}
			if options['altitude'] then
				if options ['altitudeType'] then
					if options ['altitudeType'] == "AGL" then
						local groundHeight = 0
						if group then
							local groupPos = mist.getLeadPos(group)
							groundHeight = land.getHeight({x = groupPos.x, y = groupPos.z})
						end
						task['params']['altitude'] = groundHeight + options['altitude']
					else
						task['params']['altitude'] = options['altitude']
					end
				else
					task['params']['altitude'] = options['altitude']
				end
			end
			if options['speed'] then
				task['params']['speed'] = options['speed']
			end
		elseif options['id'] == 'Bombing' and options['lat'] and options['lng'] then
			local point = coord.LLtoLO(options['lat'], options['lng'], 0)
			task = {
				id = 'Bombing', 
				params = {
					point = {x = point.x, y = point.z},
					attackQty = 1
				}   
			}
		elseif options['id'] == 'CarpetBombing' and options['lat'] and options['lng'] then
			local point = coord.LLtoLO(options['lat'], options['lng'], 0)
			task = {
				id = 'CarpetBombing', 
				params = {
					x = point.x,
					y = point.z,
					carpetLength = 1000,
					attackType = 'Carpet',
					expend = "All",
					attackQty = 1,
					attackQtyLimit = true 
				}   
			}
		elseif options['id'] == 'AttackMapObject' and options['lat'] and options['lng'] then
			local point = coord.LLtoLO(options['lat'], options['lng'], 0)
			task = {
				id = 'AttackMapObject', 
				params = {
					point = {x = point.x, y = point.z}
				}   
			}
		elseif options['id'] == 'FireAtPoint' and options['lat'] and options['lng'] and options['radius'] then
			local point = coord.LLtoLO(options['lat'], options['lng'], 0)
			task = {
				id = 'FireAtPoint', 
				params = {
					point = {x = point.x, y = point.z},
					radius = options['radius']
				}   
			}
		end
	end
	return task
end

-- Move a unit. Since many tasks in DCS are Enroute tasks, this function is an important way to control the unit AI
function Olympus.move(groupName, lat, lng, altitude, altitudeType, speed, speedType, category, taskOptions)
    Olympus.debug("Olympus.move " .. groupName .. " (" .. lat .. ", " .. lng ..") " .. altitude .. "m " .. altitudeType .. " ".. speed .. "m/s " .. category .. " " .. Olympus.serializeTable(taskOptions), 2)
    local group = Group.getByName(groupName)
	if group then
		if category == "Aircraft" then
			local startPoint = mist.getLeadPos(group)
			local endPoint = coord.LLtoLO(lat, lng, 0) 

			if altitudeType == "AGL" then
				altitude = land.getHeight({x = endPoint.x, y = endPoint.z}) + altitude
			end

			local path = {}
			if taskOptions and taskOptions['id'] == 'Land' then
				path = {
					[1] = mist.fixedWing.buildWP(startPoint, turningPoint, speed, altitude, 'BARO'),
					[2] = mist.fixedWing.buildWP(endPoint, landing, speed, 0, 'AGL')
				} 
			else
				path = {
					[1] = mist.fixedWing.buildWP(startPoint, turningPoint, speed, altitude, 'BARO'),
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
			local groupCon = group:getController()
			if groupCon then
				groupCon:setTask(missionTask)
			end
			Olympus.debug("Olympus.move executed successfully on a Aircraft", 2)
		elseif category == "GroundUnit" then
			vars = 
				{
					group = group, 
					point = coord.LLtoLO(lat, lng, 0),
					heading = 0,
					speed = speed
				}

			if taskOptions and taskOptions['id'] == 'FollowRoads' and taskOptions['value'] == true then
				vars["disableRoads"] = false
			else
				vars["form"] = "Off Road"
				vars["disableRoads"] = true
			end

			mist.groupToRandomPoint(vars)
			Olympus.debug("Olympus.move executed succesfully on a ground unit", 2)
		else
			Olympus.debug("Olympus.move not implemented yet for " .. category, 2)
		end
	else
        Olympus.debug("Error in Olympus.move " .. groupName, 2)
	end
end  

-- Creates a simple smoke on the ground
function Olympus.smoke(color, lat, lng)
    Olympus.debug("Olympus.smoke " .. color .. " (" .. lat .. ", " .. lng ..")", 2)
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

-- Creates an explosion on the ground
function Olympus.explosion(intensity, lat, lng)
    Olympus.debug("Olympus.explosion " .. intensity .. " (" .. lat .. ", " .. lng ..")", 2)
	trigger.action.explosion(mist.utils.makeVec3GL(coord.LLtoLO(lat, lng, 0)), intensity)
end  

-- Spawns a single ground unit
function Olympus.spawnGroundUnit(coalition, unitType, lat, lng)
    Olympus.debug("Olympus.spawnGroundUnit " .. coalition .. " " .. unitType .. " (" .. lat .. ", " .. lng ..")", 2)
	local spawnLocation = mist.utils.makeVec3GL(coord.LLtoLO(lat, lng, 0))

	local unitTable = {}

	if Olympus.hasKey(templates, unitType) then
		for idx, value in pairs(templates[unitType].units) do
			unitTable[#unitTable + 1] = {
				["type"] = value.name,
				["x"] = spawnLocation.x + value.dx,
				["y"] = spawnLocation.z + value.dy,
				["playerCanDrive"] = true,
				["heading"] = 0,
				["skill"] = "High"
			}
		end 
	else
		unitTable = 
		{
			[1] = 
			{
				["type"] = unitType,
				["x"] = spawnLocation.x,
				["y"] = spawnLocation.z,
				["playerCanDrive"] = true,
				["heading"] = 0,
				["skill"] = "High"
			},
		} 
	end

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
	Olympus.debug("Olympus.spawnGround completed succesfully", 2)
end  

-- Spawns a single aircraft. Spawn options are:
-- payloadName: a string, one of the names defined in unitPayloads.lua. Must be compatible with the unitType
-- airbaseName: a string, if present the aircraft will spawn on the ground of the selected airbase
-- payload: a table, if present the unit will receive this specific payload. Overrides payloadName
function Olympus.spawnAircraft(coalition, unitType, lat, lng, alt, spawnOptions)
	local payloadName = spawnOptions["payloadName"]
	local airbaseName = spawnOptions["airbaseName"]
	local payload = spawnOptions["payload"]

	Olympus.debug("Olympus.spawnAircraft " .. coalition .. " " .. unitType .. " (" .. lat .. ", " .. lng ..", " .. alt .. ")", 2)
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
			["alt"] = alt,
            ["alt_type"] = "BARO",
			["skill"] = "Excellent",
			["payload"] = 
			{
				["pylons"] = payload, 
				["fuel"] = 999999,
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
						["action"] = "From Parking Area Hot",
						["task"] = 
						{
							["id"] = "ComboTask",
							["params"] = {["tasks"] = {},}, 
						},
						["type"] = "TakeOffParkingHot",
						["ETA"] = 0,
						["ETA_locked"] = true,
						["x"] = spawnLocation.x,
						["y"] = spawnLocation.z,
                        ["alt_type"] = "BARO",
						["formation_template"] = "",
						["airdromeId"] = airbaseID,
						["speed_locked"] = true,
					}, 
				}, 
			} 			
		end
	else
		route = {
				["points"] = 
				{
					[1] = 
					{
						["alt"] = alt,
						["alt_type"] = "BARO",
						["task"] = 
						{
							["id"] = "ComboTask",
							["params"] = 
							{
								["tasks"] = 
								{
									[1] = 
									{
										["number"] = 1,
										["auto"] = true,
										["id"] = "WrappedAction",
										["enabled"] = true,
										["params"] = 
										{
											["action"] = 
											{
												["id"] = "EPLRS",
												["params"] = 
												{
													["value"] = true
												}, 
											}, 
										}, 
									},
									[2] = 
									{
										["number"] = 2,
										["auto"] = false,
										["id"] = "Orbit",
										["enabled"] = true,
										["params"] = 
										{
											["pattern"] = "Circle"
										}, 
									},
								}, 
							}, 
						}, 
						["type"] = "Turning Point",
						["x"] = spawnLocation.x,
						["y"] = spawnLocation.z,
					}, -- end of [1]
				}, -- end of ["points"]
			} -- end of ["route"]
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
	Olympus.debug("Olympus.spawnAir completed successfully", 2)
end

-- Clones a unit by ID. Will clone the unit with the same original payload as the source unit. TODO: only works on Olympus unit not ME units.
function Olympus.clone(ID, lat, lng, category)
	Olympus.debug("Olympus.clone " .. ID .. ", " .. category, 2)
	local unit = Olympus.getUnitByID(ID)
	if unit then
		local coalition = Olympus.getCoalitionByCoalitionID(unit:getCoalition())
		
		if category == "Aircraft" then 
			local spawnOptions = {
				payload = Olympus.payloadRegistry[unit:getName()]
			}
			Olympus.spawnAircraft(coalition, unit:getTypeName(), lat, lng, unit:getPoint().y, spawnOptions)
		elseif category == "GroundUnit" then
			Olympus.spawnGroundUnit(coalition, unit:getTypeName(), lat, lng)
		end
	end
	Olympus.debug("Olympus.clone completed successfully", 2)
end

function Olympus.delete(ID, explosion)
	Olympus.debug("Olympus.delete " .. ID .. " " .. tostring(explosion), 2)
	local unit = Olympus.getUnitByID(ID)
	if unit then
		if unit:getPlayerName() or explosion then
			trigger.action.explosion(unit:getPoint() , 250 ) --consider replacing with forcibly deslotting the player, however this will work for now
			Olympus.debug("Olympus.delete completed successfully", 2)
		else
			unit:destroy(); --works for AI units not players
			Olympus.debug("Olympus.delete completed successfully", 2)
		end
	end
end

function Olympus.setTask(groupName, taskOptions)
	Olympus.debug("Olympus.setTask " .. groupName .. " " .. Olympus.serializeTable(taskOptions), 2)
	local group = Group.getByName(groupName)
	if group then
		local task = Olympus.buildTask(groupName, taskOptions);
		Olympus.debug("Olympus.setTask " .. Olympus.serializeTable(task), 20)
		if task then
			group:getController():setTask(task)
			Olympus.debug("Olympus.setTask completed successfully", 2)
		end
	end
end

function Olympus.resetTask(groupName)
	Olympus.debug("Olympus.resetTask " .. groupName, 2)
	local group = Group.getByName(groupName)
	if group then
		group:getController():resetTask()
		Olympus.debug("Olympus.resetTask completed successfully", 2)
	end
end

function Olympus.setCommand(groupName, command)
	Olympus.debug("Olympus.setCommand " .. groupName .. " " .. Olympus.serializeTable(command), 2)
	local group = Group.getByName(groupName)
	if group then
		group:getController():setCommand(command)
		Olympus.debug("Olympus.setCommand completed successfully", 2)
	end
end

function Olympus.setOption(groupName, optionID, optionValue)
	Olympus.debug("Olympus.setOption " .. groupName .. " " .. optionID .. " " .. tostring(optionValue), 2)
	local group = Group.getByName(groupName)
	if group then
		group:getController():setOption(optionID, optionValue)
		Olympus.debug("Olympus.setOption completed successfully", 2)
	end
end

function Olympus.setOnOff(groupName, onOff)
	Olympus.debug("Olympus.setOnOff " .. groupName .. " " .. tostring(onOff), 2)
	local group = Group.getByName(groupName)
	if group then
		group:getController():setOnOff(onOff)
		Olympus.debug("Olympus.setOnOff completed successfully", 2)
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

function Olympus.isArray(t)
	local i = 0
	for _ in pairs(t) do
		i = i + 1
		if t[i] == nil then return false end
	end
	return true
end

function Olympus.hasValue(tab, val)
    for index, value in ipairs(tab) do
        if value == val then
            return true
        end
    end

    return false
end

function Olympus.hasKey(tab, key)
    for k, value in pairs(tab) do
        if k == key then
            return true
        end
    end

    return false
end

function Olympus.setMissionData(arg, time)
	local missionData = {}

	-- Bullseye data
	local bullseyes = {}
	for i = 0, 2 do
		local bullseyeVec3 = coalition.getMainRefPoint(i)
		local bullseyeLatitude, bullseyeLongitude, bullseyeAltitude = coord.LOtoLL(bullseyeVec3)
		bullseyes[i] = {}
		bullseyes[i]["latitude"] = bullseyeLatitude
		bullseyes[i]["longitude"] = bullseyeLongitude
		bullseyes[i]["coalition"] = Olympus.getCoalitionByCoalitionID(i) 
	end

	-- Units tactical data
	local unitsData = {}
	
	local startIndex = Olympus.groupIndex
	local endIndex = startIndex + Olympus.groupStep
	local index = 0
	if mist ~= nil and mist.DBs ~= nil and mist.DBs.groupsByName ~= nil then
		for groupName, gp in pairs(mist.DBs.groupsByName) do
			index = index + 1
			if index > startIndex then
				if groupName ~= nil then
					local group = Group.getByName(groupName)
					if group ~= nil then
						-- Get the targets detected by the group controller
						local controller = group:getController()
						local controllerTargets = controller:getDetectedTargets()

						for index, unit in pairs(group:getUnits()) do
							local unitController = unit:getController()
							local table = {}
							table["contacts"] = {}

							for i, target in ipairs(controllerTargets) do
								for det, enum in pairs(Controller.Detection) do
									if target.object ~= nil then
										local detected = unitController:isTargetDetected(target.object, enum)

										if detected then
											target["detectionMethod"] = det
											table["contacts"][#table["contacts"] + 1] = target
										end
									end
								end
							end

							table["hasTask"] = controller:hasTask()
							
							table["ammo"] = unit:getAmmo()
							table["fuel"] = unit:getFuel()
							table["life"] = unit:getLife() / unit:getLife0()
							unitsData[unit:getObjectID()] = table
						end
					end
				end
			end
			if index >= endIndex then
				break
			end
		end
		if index ~= endIndex then 
			Olympus.groupIndex = 0
		else
			Olympus.groupIndex = endIndex
		end
	end

	-- Airbases data
	local base = world.getAirbases()
	local airbases = {}
	for i = 1, #base do
		local info = {}
		local latitude, longitude, altitude = coord.LOtoLL(Airbase.getPoint(base[i]))
		info["callsign"] = Airbase.getCallsign(base[i])
		info["coalition"] = Olympus.getCoalitionByCoalitionID(Airbase.getCoalition(base[i])) 
		info["latitude"] =  latitude
		info["longitude"] =  longitude
		if Airbase.getUnit(base[i]) then
			info["unitId"] = Airbase.getUnit(base[i]):getID()
		end
		airbases[i] = info
	end

	local mission = {}
	mission.theatre = env.mission.theatre
	mission.elapsedTime = DCS.getRealTime()
	mission.time = mist.time.getDHMS(timer.getAbsTime())
	mission.startTime = env.mission.start_time
	mission.date = env.mission.date

	-- Assemble missionData table
	missionData["bullseyes"] = bullseyes
	missionData["unitsData"] = unitsData
	missionData["airbases"] = airbases
	missionData["mission"] = mission

	Olympus.missionData = missionData
	Olympus.OlympusDLL.setMissionData()
	return time + 1
end

local OlympusName = 'Olympus ' .. version .. ' C++ module';
isOlympusModuleInitialized=true;
Olympus.DLLsloaded = Olympus.loadDLLs()
if Olympus.DLLsloaded then
	Olympus.notify(OlympusName..' successfully loaded.', 20)
else
	Olympus.notify('Failed to load '..OlympusName, 20)
end

timer.scheduleFunction(Olympus.setMissionData, {}, timer.getTime() + 1)

Olympus.notify("OlympusCommand script " .. version .. " loaded successfully", 2, true)
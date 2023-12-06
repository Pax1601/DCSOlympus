local version = "v0.4.11-alpha-rc3"

local debug = false				-- True enables debug printing using DCS messages

-- .dll related variables
Olympus.OlympusDLL = nil
Olympus.DLLsloaded = false

-- Logger reference
Olympus.log = mist.Logger:new("Olympus", 'info')

-- Data structures for transfer to .dll
Olympus.missionData = {}
Olympus.unitsData = {}
Olympus.weaponsData = {}

-- Units data structures
Olympus.unitCounter = 1			-- Counter to generate unique names
Olympus.cloneDatabase = {}		-- Database of spawn options, used for units cloning
Olympus.unitIndex = 0			-- Counter used to spread the computational load of data retrievial from DCS
Olympus.unitStep = 50			-- Max number of units that get updated each cycle
Olympus.units = {}				-- Table holding references to all the currently existing units
Olympus.unitsInitialLife = {}	-- getLife0 returns 0 for ships, so we need to store the initial life of units

Olympus.weaponIndex = 0			-- Counter used to spread the computational load of data retrievial from DCS			
Olympus.weaponStep = 50			-- Max number of weapons that get updated each cycle
Olympus.weapons = {}			-- Table holding references to all the currently existing weapons

-- Miscellaneous initializations
Olympus.missionStartTime = DCS.getRealTime()
Olympus.napalmCounter = 1
Olympus.fireCounter = 1

-- Load the current instance folder
local lfs = require('lfs')

------------------------------------------------------------------------------------------------------
-- Olympus functions
------------------------------------------------------------------------------------------------------
-- Print a debug message if the debug option is true
function Olympus.debug(message, displayFor)
	if debug == true then
    	trigger.action.outText(message, displayFor)
	end
end

-- Print a notify message
function Olympus.notify(message, displayFor)
    trigger.action.outText(message, displayFor)
end

-- Loads the olympus .dll
function Olympus.loadDLLs()
	-- Add the .dll paths
	package.cpath = package.cpath..';'..Olympus.instancePath..'?.dll;'
	
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
	return Olympus.units[ID];
end

-- Gets the ID of the first country that belongs to a coalition
function Olympus.getCountryIDByCoalition(coalitionString)
	for countryName, countryId in pairs(country.id) do
		if coalition.getCountryCoalition(countryId) == Olympus.getCoalitionIDByCoalition(coalitionString) then
			return countryId
		end
	end
	return 0
end

-- Gets the coalition ID of a coalition
function Olympus.getCoalitionIDByCoalition(coalitionString)
	local coalitionID = 0
	if coalitionString == "red" then 
		coalitionID = 1
	elseif coalitionString == "blue" then
		coalitionID = 2
	end
	return coalitionID
end

-- Gets the coalition name from the coalition ID
function Olympus.getCoalitionByCoalitionID(coalitionID)
	local coalitionString = "neutral"
	if coalitionID == 1 then 
		coalitionString = "red"
	elseif coalitionID == 2 then
		coalitionString = "blue"
	end
	return coalitionString
end

-- Builds a valid enroute task depending on the provided options
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

-- Builds a valid main task depending on the provided options
function Olympus.buildTask(groupName, options)
	local task = nil

	local group = Group.getByName(groupName)

	-- Combo tasks require nested tables
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
		-- Follow a unit in formation with a given offset
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
		-- Go refuel to the nearest tanker. If the unit can't refuel it will RTB
		elseif options['id'] == 'Refuel' then
			task = {
				id = 'Refueling', 
				params = {}   
			}
		-- Orbit in place at a given altitude and with a given pattern
		elseif options['id'] == 'Orbit' then
			task = { 
				id = 'Orbit', 
				params = { 
					pattern = options['pattern'] or "Circle"
				} 
			}

			-- Compute the altitude depending on the altitude type 
			if options['altitude'] then
				if options ['altitudeType'] then
					if options ['altitudeType'] == "AGL" then
						local groundHeight = 0
						if group ~= nil then
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

			-- Compute the speed depending on the speed type. CAS calculation is only available if the altitude is also available 
			if options['speed'] then
				-- Simplified formula to compute CAS from GS
				local speed = options['speed']
				if options['speedType'] and options['speedType'] == "CAS" and task['params']['altitude'] then
					speed = speed * (1 + 0.02 * task['params']['altitude'] / 0.3048 / 1000)
				end
				task['params']['speed'] = speed
			end
		-- Bomb a specific location
		elseif options['id'] == 'Bombing' and options['lat'] and options['lng'] then
			local point = coord.LLtoLO(options['lat'], options['lng'], 0)
			task = {
				id = 'Bombing', 
				params = {
					point = {x = point.x, y = point.z},
					attackQty = 1
				}   
			}
		-- Perform carpet bombing at a specific location
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
		-- Fire at a specific point
		elseif options['id'] == 'FireAtPoint' and options['lat'] and options['lng'] and options['radius'] then
			local point = coord.LLtoLO(options['lat'], options['lng'], 0)
			local expendQtyEnabled = false
			local expendQty = 0

			if options['expendQty'] then
				expendQtyEnabled = true
				expendQty = options['expendQty']
			end

			if options['alt'] then
				task = {
					id = 'FireAtPoint', 
					params = {
						point = {x = point.x, y = point.z},
						radius = options['radius'],
						altitude = options['alt'],
						alt_type = 0, -- ASL
						expendQtyEnabled = expendQtyEnabled,
						expendQty = expendQty
					}   
				}
			else
				task = {
					id = 'FireAtPoint', 
					params = {
						point = {x = point.x, y = point.z},
						radius = options['radius'],
						expendQtyEnabled = expendQtyEnabled,
						expendQty = expendQty
					}   
				}
			end
		-- Land at a specific point
		elseif options['id'] == 'LandAtPoint' then
			local point = coord.LLtoLO(options['lat'], options['lng'], 0)
			task = {
				id = 'Land', 
				params = {
					point = {x = point.x, y = point.z},
				}   
			}
		-- Attack unit
		elseif options['id'] == 'AttackUnit' and options['unitID']  then
			task = {
				id = 'AttackUnit', 
				params = {
					unitId = options['unitID'],
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
	if group ~= nil then
		if category == "Aircraft" then
			local startPoint = mist.getLeadPos(group)
			local endPoint = coord.LLtoLO(lat, lng, 0) 

			-- 'AGL' mode does not appear to work in the buildWP function. This is a crude approximation
			if altitudeType == "AGL" then
				altitude = land.getHeight({x = endPoint.x, y = endPoint.z}) + altitude
			end

			-- Simplified formula to compute CAS from GS
			if speedType == "CAS" then
				speed = speed * (1 + 0.02 * altitude / 0.3048 / 1000)
			end

			-- Create the path
			local path = {
				[1] = mist.fixedWing.buildWP(startPoint, turningPoint, speed, altitude, 'BARO'),
				[2] = mist.fixedWing.buildWP(endPoint, turningPoint, speed, altitude, 'BARO')
			}

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
			Olympus.debug("Olympus.move executed successfully on Aircraft", 2)
		elseif category == "Helicopter" then
			local startPoint = mist.getLeadPos(group)
			local endPoint = coord.LLtoLO(lat, lng, 0) 

			-- 'AGL' mode does not appear to work in the buildWP function. This is a crude approximation
			if altitudeType == "AGL" then
				altitude = land.getHeight({x = endPoint.x, y = endPoint.z}) + altitude
			end

			-- Simplified formula to compute CAS from GS
			if speedType == "CAS" then
				speed = speed * (1 + 0.02 * altitude / 0.3048 / 1000)
			end

			-- Create the path
			local path = {
				[1] = mist.heli.buildWP(startPoint, turningPoint, speed, altitude, 'BARO'),
				[2] = mist.heli.buildWP(endPoint, turningPoint, speed, altitude, 'BARO')
			}

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
			Olympus.debug("Olympus.move executed successfully on Helicopter", 2)
		elseif category == "GroundUnit" then
			local startPoint = mist.getLeadPos(group)
			local endPoint = coord.LLtoLO(lat, lng, 0) 
			local bearing = math.atan2(endPoint.z - startPoint.z, endPoint.x - startPoint.x)

			vars = {
				group = group, 
				point = endPoint,
				heading = bearing,
				speed = speed
			}

			if taskOptions and taskOptions['id'] == 'FollowRoads' and taskOptions['value'] == true then
				vars["disableRoads"] = false
			else
				vars["form"] = "Off Road"
				vars["disableRoads"] = true
			end

			mist.groupToRandomPoint(vars)
			Olympus.debug("Olympus.move executed successfully on GroundUnit", 2)
		elseif category == "NavyUnit" then
			local startPoint = mist.getLeadPos(group)
			local endPoint = coord.LLtoLO(lat, lng, 0) 
			local bearing = math.atan2(endPoint.z - startPoint.z, endPoint.x - startPoint.x)
			
			vars = {
				group = group, 
				point = endPoint,
				heading = bearing,
				speed = speed
			}
			mist.groupToRandomPoint(vars)
			Olympus.debug("Olympus.move executed successfully on NavyUnit", 2)
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
function Olympus.explosion(intensity, explosionType, lat, lng, alt)
    Olympus.debug("Olympus.explosion " .. explosionType .. " " .. intensity .. " (" .. lat .. ", " .. lng .. ")", 2)

	local vec3 = nil
	if alt ~= nil then
		vec3 = coord.LLtoLO(lat, lng, alt)
	else
		vec3 = mist.utils.makeVec3GL(coord.LLtoLO(lat, lng))
	end

	if explosionType == "normal" then
		trigger.action.explosion(vec3, intensity)
	elseif explosionType == "phosphorous" then
		Olympus.phosphorous(vec3)
	elseif explosionType == "napalm" then
		Olympus.napalm(vec3)
	elseif explosionType == "secondary" then
		Olympus.secondaries(vec3)
	elseif explosionType == "fire" then
		Olympus.createFire(vec3)
	elseif explosionType == "depthCharge" then

	end
end  

function Olympus.phosphorous(vec3) 
	trigger.action.explosion(vec3, 1)
	for i =	1,math.random(3, 10) do 
		angle = mist.utils.toRadian((math.random(1, 360)))
		local randVec = mist.utils.makeVec3GL((mist.getRandPointInCircle(vec3, 5, 1, 0, 360)))
		trigger.action.signalFlare(randVec, 2, angle)
	end
end

function Olympus.napalm(vec3)
	local napeName = "napalmStrike" .. Olympus.napalmCounter
		Olympus.napalmCounter = Olympus.napalmCounter + 1
		mist.dynAddStatic(
							{
								country = 20,
								category = 'Fortifications',
								hidden = true,
								name = napeName,
								type ="Fuel tank",
								x = vec3.x,
								y = vec3.z,
								heading = 0,
							} -- end of function
						)
		timer.scheduleFunction(Olympus.explodeNapalm, vec3, timer.getTime() + 0.1)
		timer.scheduleFunction(Olympus.removeNapalm, napeName, timer.getTime() + 0.12)
end

function Olympus.explodeNapalm(vec3)
	trigger.action.explosion(vec3, 10)
end

function Olympus.removeNapalm(staticName) 
	StaticObject.getByName(staticName):destroy()
end

function Olympus.createFire(vec3)
	local smokeName = "smokeName" .. Olympus.fireCounter
	Olympus.fireCounter = Olympus.fireCounter + 1
	trigger.action.effectSmokeBig(vec3, 2 , 1, smokeName)
	trigger.action.explosion(vec3, 1) -- looks wierd to spawn in on flat land without this
	timer.scheduleFunction(Olympus.removeFire, smokeName, timer.getTime() + 20)
end

function Olympus.removeFire (smokeName)
	trigger.action.effectSmokeStop(smokeName)
end

function Olympus.secondaries(vec3) 
	Olympus.randomDebrie(vec3)
	--trigger.action.explosion(vec3, 1)
	--for i =	1, 10 do 
	--	timer.scheduleFunction(Olympus.randomDebries, vec3, timer.getTime() + math.random(0, 180))
	--end
end

function Olympus.randomDebries(vec3) 
	trigger.action.explosion(vec3, 1)
	for i =	1,math.random(3, 10) do
		angle = mist.utils.toRadian((math.random(1, 360)))
		local randVec = mist.utils.makeVec3GL((mist.getRandPointInCircle(vec3, 5, 1, 0, 360)))
		trigger.action.signalFlare(randVec, 3, angle)
	end
end

-- Spawns a new unit or group
-- Spawn table contains the following parameters
-- category: (string), either Aircraft, Helicopter, GroundUnit or NavyUnit
-- coalition: (string)
-- country: (string)
-- airbaseName: (string, optional) only for air units
-- units: (array) Array of units to spawn. All units will be in the same group. Each unit element must contain:
	-- unitType: (string) DCS Name of the unit
	-- lat: (number)
	-- lng: (number)
	-- alt: (number, optional) only for air units
	-- loadout: (string, optional) only for air units, must be one of the loadouts defined in unitPayloads.lua
	-- payload: (table, optional) overrides loadout, specifies directly the loadout of the unit
	-- liveryID: (string, optional)
function Olympus.spawnUnits(spawnTable) 
	Olympus.debug("Olympus.spawnUnits " .. Olympus.serializeTable(spawnTable), 2)

	local unitsTable = nil
	local route = nil
	local category = nil

	-- Generate the units table and route as per DCS requirements
	if spawnTable.category == 'Aircraft' then
		unitsTable = Olympus.generateAirUnitsTable(spawnTable.units)
		route = Olympus.generateAirUnitsRoute(spawnTable)
		category = 'plane'
	elseif spawnTable.category == 'Helicopter' then
		unitsTable = Olympus.generateAirUnitsTable(spawnTable.units)
		route = Olympus.generateAirUnitsRoute(spawnTable)
		category = 'helicopter'
	elseif spawnTable.category == 'GroundUnit' then
		unitsTable = Olympus.generateGroundUnitsTable(spawnTable.units)
		category = 'vehicle'
	elseif spawnTable.category == 'NavyUnit' then
		unitsTable = Olympus.generateNavyUnitsTable(spawnTable.units)
		category = 'ship'
	end

	-- It the unit country is not specified, get a country that belongs to the coalition
	local countryID = 0
	if spawnTable.country == nil or spawnTable.country == "" then
		countryID = Olympus.getCountryIDByCoalition(spawnTable.coalition)
	else
		countryID = country.id[spawnTable.country]
	end

	-- Save the units in the database, for cloning
	for idx, unitTable in pairs(unitsTable) do
		Olympus.addToDatabase(unitTable)
	end

	-- Spawn the new group
	local vars = 
	{
		units = unitsTable, 
		country = countryID, 
		category = category,
		route = route,
		name = "Olympus-" .. Olympus.unitCounter,
		task = 'CAP'
	}
	Olympus.debug(Olympus.serializeTable(vars), 2)
	mist.dynAdd(vars)

	Olympus.unitCounter = Olympus.unitCounter + 1
	Olympus.debug("Olympus.spawnUnits completed succesfully", 2)
end

-- Generates unit table for air units 
function Olympus.generateAirUnitsTable(units)
	local unitsTable = {}
	for idx, unit in pairs(units) do
		local loadout = unit.loadout			-- loadout: a string, one of the names defined in unitPayloads.lua. Must be compatible with the unitType
		local payload = unit.payload			-- payload: a table, if present the unit will receive this specific payload. Overrides loadout

		if unit.heading == nil then
			unit.heading = 0
		end

		-- Define the loadout
		if payload == nil then
			if loadout ~= nil and loadout ~= "" and Olympus.unitPayloads[unit.unitType] and Olympus.unitPayloads[unit.unitType][loadout] then
				payload = { ["pylons"] = Olympus.unitPayloads[unit.unitType][loadout], ["fuel"] = 999999, ["flare"] = 60, ["ammo_type"] = 1, ["chaff"] = 60, ["gun"] = 100 } 
			else
				payload = { ["pylons"] = {}, ["fuel"] = 999999, ["flare"] = 60, ["ammo_type"] = 1, ["chaff"] = 60, ["gun"] = 100 } 
			end
		end
		
		-- Generate the unit table
		local spawnLocation = mist.utils.makeVec3GL(coord.LLtoLO(unit.lat, unit.lng, 0))
		unitsTable[#unitsTable + 1] = 
		{
			["type"] = unit.unitType,
			["x"] = spawnLocation.x,
			["y"] = spawnLocation.z,
			["alt"] = unit.alt,
			["alt_type"] = "BARO",
			["skill"] = "Excellent",
			["payload"] = payload, 
			["heading"] = unit.heading,
			["callsign"] = { [1] = 1, [2] = 1, [3] = 1, ["name"] = "Olympus" .. Olympus.unitCounter.. "-" .. #unitsTable + 1 },
			["name"] = "Olympus-" .. Olympus.unitCounter .. "-" .. #unitsTable + 1,
			["livery_id"] = unit.liveryID
		}
	end
	return unitsTable
end

function Olympus.generateAirUnitsRoute(spawnTable)
	local airbaseName = spawnTable.airbaseName	-- airbaseName: a string, if present the aircraft will spawn on the ground of the selected airbase
	local spawnLocation = mist.utils.makeVec3GL(coord.LLtoLO(spawnTable.units[1].lat, spawnTable.units[1].lng, 0))

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
						["tasks"] = {
							[1] = {["number"] = 1, ["auto"] = true, ["id"] = "WrappedAction", ["enabled"] = true, ["params"] = {["action"] = {["id"] = "EPLRS", ["params"] = {["value"] = true}, }, }, },
							[2] = {["number"] = 2, ["auto"] = false, ["id"] = "Orbit", ["enabled"] = true, ["params"] = {["pattern"] = "Circle"}, },
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
						["tasks"] = {
							[1] = {["number"] = 1, ["auto"] = true, ["id"] = "WrappedAction", ["enabled"] = true, ["params"] = {["action"] = {["id"] = "EPLRS", ["params"] = {["value"] = true}, }, }, },
							[2] = {["number"] = 2, ["auto"] = false, ["id"] = "Orbit", ["enabled"] = true, ["params"] = {["pattern"] = "Circle"}, },
						},
						["type"] = "Turning Point",
						["x"] = spawnLocation.x,
						["y"] = spawnLocation.z,
					},
				}, 
			} 
	end
	return route
end

-- Generates ground units table, either single or from template
function Olympus.generateGroundUnitsTable(units)
	local unitsTable = {}
	for idx, unit in pairs(units) do
		local spawnLocation = mist.utils.makeVec3GL(coord.LLtoLO(unit.lat, unit.lng, 0))
		if Olympus.hasKey(templates, unit.unitType) then
			for idx, value in pairs(templates[unit.unitType].units) do
				unitsTable[#unitsTable + 1] = 
				{
					["type"] = value.name,
					["x"] = spawnLocation.x + value.dx,
					["y"] = spawnLocation.z + value.dy,
					["heading"] = 0,
					["skill"] = "High",
					["name"] = "Olympus-" .. Olympus.unitCounter .. "-" .. #unitsTable + 1
				}
			end 
		else
			unitsTable[#unitsTable + 1] = 
			{
				["type"] = unit.unitType,
				["x"] = spawnLocation.x,
				["y"] = spawnLocation.z,
				["heading"] = unit.heading,
				["skill"] = "High",
				["name"] = "Olympus-" .. Olympus.unitCounter .. "-" .. #unitsTable + 1,
				["livery_id"] = unit.liveryID
			}
		end
	end

	return unitsTable
end  

-- Generates navy units table, either single or from template
function Olympus.generateNavyUnitsTable(units)
	local unitsTable = {}
	for idx, unit in pairs(units) do
		local spawnLocation = mist.utils.makeVec3GL(coord.LLtoLO(unit.lat, unit.lng, 0))
		if Olympus.hasKey(templates, unit.unitType) then
			for idx, value in pairs(templates[unit.unitType].units) do
				unitsTable[#unitsTable + 1] = 
				{
					["type"] = value.name,
					["x"] = spawnLocation.x + value.dx,
					["y"] = spawnLocation.z + value.dy,
					["heading"] = 0,
					["skill"] = "High",
					["name"] = "Olympus-" .. Olympus.unitCounter .. "-" .. #unitsTable + 1,
					["transportable"] = { ["randomTransportable"] = false }
				}
			end 
		else
			unitsTable[#unitsTable + 1] = 
			{
				["type"] = unit.unitType,
				["x"] = spawnLocation.x,
				["y"] = spawnLocation.z,
				["heading"] = unit.heading,
				["skill"] = "High",
				["name"] = "Olympus-" .. Olympus.unitCounter .. "-" .. #unitsTable + 1,
				["transportable"] = { ["randomTransportable"] = false },
				["livery_id"] = unit.liveryID
			}
		end
	end

	return unitsTable
end  

-- Add the unit data to the database, used for unit cloning
function Olympus.addToDatabase(unitTable)
	Olympus.cloneDatabase[unitTable.name] = unitTable
end

-- Find a database entry by ID
function Olympus.findInDatabase(ID)
	for idx, unitRecord in pairs(Olympus.cloneDatabase) do
		if unitRecord ~= nil and unitRecord["ID"] == ID then
			return unitRecord
		end
	end
	return nil
end

-- Clones a unit by ID. Will clone the unit with the same original payload as the source unit. TODO: only works on Olympus unit not ME units (TO BE VERIFIED).
-- cloneTable is an array of element, each of which contains
	-- ID: (number) ID of the unit to clone
	-- lat: (number)
	-- lng: (number)
function Olympus.clone(cloneTable, deleteOriginal)
	Olympus.debug("Olympus.clone " .. Olympus.serializeTable(cloneTable), 2)

	local unitsTable = {}
	local countryID = nil
	local category = nil
	local route = {}

	-- All the units in the table will be cloned in a single group
	for idx, cloneData in pairs(cloneTable) do
		local ID = cloneData.ID
		local unitRecord = Olympus.findInDatabase(ID)

		if unitRecord ~= nil then
			-- Update the data of the cloned unit
			local unitTable = mist.utils.deepCopy(unitRecord)

			local point = coord.LLtoLO(cloneData['lat'], cloneData['lng'], 0)
			if unitTable then
				unitTable["x"] = point.x
				unitTable["y"] = point.z
				unitTable["name"] = "Olympus-" .. Olympus.unitCounter .. "-" .. #unitsTable + 1
			end

			if countryID == nil and category == nil then
				countryID = unitRecord["country"]
				if unitRecord["category"] == Unit.Category.AIRPLANE then
					category = 'plane'
					route = {
						["points"] = 
						{
							[1] = 
							{
								["alt"] = alt,
								["alt_type"] = "BARO",
								["tasks"] = {
									[1] = {["number"] = 1, ["auto"] = true, ["id"] = "WrappedAction", ["enabled"] = true, ["params"] = {["action"] = {["id"] = "EPLRS", ["params"] = {["value"] = true}, }, }, },
									[2] = {["number"] = 2, ["auto"] = false, ["id"] = "Orbit", ["enabled"] = true, ["params"] = {["pattern"] = "Circle"}, },
								},
								["type"] = "Turning Point",
								["x"] = point.x,
								["y"] = point.z,
							},
						}, 
					}
				elseif unitRecord["category"] == Unit.Category.HELICOPTER then
					category = 'helicopter'
					route = {
						["points"] = 
						{
							[1] = 
							{
								["alt"] = alt,
								["alt_type"] = "BARO",
								["tasks"] = {
									[1] = {["number"] = 1, ["auto"] = true, ["id"] = "WrappedAction", ["enabled"] = true, ["params"] = {["action"] = {["id"] = "EPLRS", ["params"] = {["value"] = true}, }, }, },
									[2] = {["number"] = 2, ["auto"] = false, ["id"] = "Orbit", ["enabled"] = true, ["params"] = {["pattern"] = "Circle"}, },
								},
								["type"] = "Turning Point",
								["x"] = point.x,
								["y"] = point.z,
							},
						}, 
					}
				elseif unitRecord["category"] == Unit.Category.GROUND_UNIT then
					category = 'vehicle'
				elseif unitRecord["category"] == Unit.Category.SHIP then
					category = 'ship'
				end
			end
			unitsTable[#unitsTable + 1] = mist.utils.deepCopy(unitTable)
		end

		if deleteOriginal then
			Olympus.delete(ID, false)
		end
	end

	local vars = 
	{
		units = unitsTable, 
		country = countryID, 
		category = category,
		route = route,
		name = "Olympus-" .. Olympus.unitCounter,
		task = 'CAP'
	}

	Olympus.debug(Olympus.serializeTable(vars), 1)

	-- Save the units in the database, for cloning
	for idx, unitTable in pairs(unitsTable) do
		Olympus.addToDatabase(unitTable)
	end

	Olympus.debug(Olympus.serializeTable(vars), 2)
	mist.dynAdd(vars)
	Olympus.unitCounter = Olympus.unitCounter + 1

	Olympus.debug("Olympus.clone completed successfully", 2)
end

-- Delete a unit by ID, optionally use an explosion
function Olympus.delete(ID, explosion, explosionType)
	Olympus.debug("Olympus.delete " .. ID .. " " .. tostring(explosion), 2)
	local unit = Olympus.getUnitByID(ID)
	if unit ~= nil and unit:isExist() then
		if unit:getPlayerName() or explosion then
			if explosionType == nil then
				explosionType = "normal"
			end
			local lat, lng, alt = coord.LOtoLL(unit:getPoint())
			Olympus.explosion(250, explosionType, lat, lng, alt)
			Olympus.debug("Olympus.delete completed successfully", 2)
		else
			unit:destroy(); --works for AI units not players
			Olympus.debug("Olympus.delete completed successfully", 2)
		end
	end
end

-- Set a DCS main task to a group
function Olympus.setTask(groupName, taskOptions)
	Olympus.debug("Olympus.setTask " .. groupName .. " " .. Olympus.serializeTable(taskOptions), 2)
	local group = Group.getByName(groupName)
	if group ~= nil then
		local task = Olympus.buildTask(groupName, taskOptions);
		Olympus.debug("Olympus.setTask " .. Olympus.serializeTable(task), 20)
		if task then
			group:getController():setTask(task)
			Olympus.debug("Olympus.setTask completed successfully", 2)
		end
	end
end

-- Reset the task of a group
function Olympus.resetTask(groupName)
	Olympus.debug("Olympus.resetTask " .. groupName, 2)
	local group = Group.getByName(groupName)
	if group ~= nil then
		group:getController():resetTask()
		Olympus.debug("Olympus.resetTask completed successfully", 2)
	end
end

-- Give a group a command
function Olympus.setCommand(groupName, command)
	Olympus.debug("Olympus.setCommand " .. groupName .. " " .. Olympus.serializeTable(command), 2)
	local group = Group.getByName(groupName)
	if group ~= nil then
		group:getController():setCommand(command)
		Olympus.debug("Olympus.setCommand completed successfully", 2)
	end
end

-- Set an option of a group
function Olympus.setOption(groupName, optionID, optionValue)
	Olympus.debug("Olympus.setOption " .. groupName .. " " .. optionID .. " " .. tostring(optionValue), 2)
	local group = Group.getByName(groupName)
	if group ~= nil then
		group:getController():setOption(optionID, optionValue)
		Olympus.debug("Olympus.setOption completed successfully", 2)
	end
end

-- Disable the AI of a group on or off entirely
function Olympus.setOnOff(groupName, onOff)
	Olympus.debug("Olympus.setOnOff " .. groupName .. " " .. tostring(onOff), 2)
	local group = Group.getByName(groupName)
	if group ~= nil then
		group:getController():setOnOff(onOff)
		Olympus.debug("Olympus.setOnOff completed successfully", 2)
	end
end

-- This function is periodically called to collect the data of all the existing units in the mission to be transmitted to the olympus.dll
function Olympus.setUnitsData(arg, time)
	-- Units data
	local units = {}
	
	local startIndex = Olympus.unitIndex
	local endIndex = startIndex + Olympus.unitStep
	local index = 0
	for ID, unit in pairs(Olympus.units) do
		index = index + 1
		-- Only the indexes between startIndex and endIndex are handled. This is a simple way to spread the update load over many cycles
		if index > startIndex then
			if unit ~= nil and unit:isExist() then
				local table = {}	

				-- Get the object category in Olympus name
				local objectCategory = Object.getCategory(unit)
				if objectCategory == Object.Category.UNIT then
					if unit:getDesc().category == Unit.Category.AIRPLANE then
						table["category"] = "Aircraft"
					elseif unit:getDesc().category == Unit.Category.HELICOPTER then
						table["category"] = "Helicopter"
					elseif unit:getDesc().category == Unit.Category.GROUND_UNIT then
						table["category"] = "GroundUnit"
					elseif unit:getDesc().category == Unit.Category.SHIP then
						table["category"] = "NavyUnit"
					end
				else
					units[ID] = {isAlive = false}
					Olympus.units[ID] = nil
				end

				-- If the category is handled by Olympus, get the data
				if table["category"] ~= nil then
					-- Compute unit position and heading
					local lat, lng, alt = coord.LOtoLL(unit:getPoint())
					local position = unit:getPosition()
					local heading = math.atan2( position.x.z, position.x.x )
					local velocity = unit:getVelocity();
					
					-- Fill the data table
					table["name"] = unit:getTypeName()
					table["coalitionID"] = unit:getCoalition()
					table["position"] = {}
					table["position"]["lat"] = lat 
					table["position"]["lng"] = lng 
					table["position"]["alt"] = alt
					table["speed"] = mist.vec.mag(velocity)
					table["horizontalVelocity"] =  math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z)
					table["verticalVelocity"] = velocity.y
					table["heading"] = heading 

					-- Track angles are wrong because of weird reference systems, approximate it using latitude and longitude differences
					if Olympus.unitsData["units"] ~= nil and Olympus.unitsData["units"][ID] ~= nil and Olympus.unitsData["units"][ID]["position"] ~= nil and Olympus.unitsData["units"][ID]["position"]["lat"] ~= nil and Olympus.unitsData["units"][ID]["position"]["lng"] ~= nil then
						local latDifference = lat - Olympus.unitsData["units"][ID]["position"]["lat"]
						local lngDifference = lng - Olympus.unitsData["units"][ID]["position"]["lng"]
						table["track"] = math.atan2(lngDifference * math.cos(lat / 57.29577), latDifference)
					else
						table["track"] = math.atan2(velocity.z, velocity.x)
					end

					table["isAlive"] = unit:isExist() and unit:isActive() and unit:getLife() >= 1
					
					local group = unit:getGroup()
					if group ~= nil then
						local controller = group:getController()
						if controller ~= nil then
							-- Get the targets detected by the unit controller
							local contacts = {}
							local unitController = unit:getController()
							if unitController ~= nil then
								for det, enum in pairs(Controller.Detection) do
									local controllerTargets = unitController:getDetectedTargets(enum)
									for i, target in ipairs(controllerTargets) do
										if target ~= nil and target.object ~= nil and target.visible then
											target["detectionMethod"] = det
											contacts[#contacts + 1] = target
										end
									end
								end
							end
							
							-- getLife0 does not seem to work for ships, so we need to keep a reference to the initial life of the unit
							if Olympus.unitsInitialLife[ID] == nil then
								Olympus.unitsInitialLife[ID] = unit:getLife()
							end

							-- Get the initial life of the unit to compute the current health
							local initialLife = 1
							if Olympus.unitsInitialLife[ID] ~= nil then
								initialLife = Olympus.unitsInitialLife[ID]
							end
							
							table["country"] = unit:getCountry()
							table["unitName"] = unit:getName()
							table["groupName"] = group:getName()
							table["isHuman"] = (unit:getPlayerName() ~= nil)
							table["hasTask"] = controller:hasTask()
							table["ammo"] = unit:getAmmo() --TODO remove a lot of stuff we don't really need
							table["fuel"] = unit:getFuel()
							table["health"] = unit:getLife() / initialLife * 100
							table["contacts"] = contacts

							local name = unit:getName()

							-- If the unit is not in the clone database it means it was not spawned by Olympus. Let's try and recover it using mist
							if Olympus.cloneDatabase[name] == nil then
								if mist.DBs ~= nil and mist.DBs.unitsByName ~= nil and mist.DBs.unitsByName[name] ~= nil then
									-- Payloads can be copied from ME units only TODO: can we fix this?
									local payload = {}
									if mist.DBs.MEunitsByName[name] then
										payload = mist.getPayload(name)
									end

									-- Create a mock spawn table to generate the database
									local unitsTable = nil
									local spawnTable = {}
									spawnTable.units = {
										[1] = {
											["unitType"] = table["name"],
											["lat"] = table["position"]["lat"],
											["lng"] = table["position"]["lng"],
											["alt"] = table["position"]["alt"],
											["payload"] = payload,
											["liveryID"] = mist.DBs.unitsByName[name]["livery_id"]
										}
									}

									-- Generate the units table as per DCS requirements
									if table["category"] == 'Aircraft' then
										unitsTable = Olympus.generateAirUnitsTable(spawnTable.units)
									elseif table["category"] == 'Helicopter' then
										unitsTable = Olympus.generateAirUnitsTable(spawnTable.units)
									elseif table["category"] == 'GroundUnit' then
										unitsTable = Olympus.generateGroundUnitsTable(spawnTable.units)
									elseif table["category"] == 'NavyUnit' then
										unitsTable = Olympus.generateNavyUnitsTable(spawnTable.units)
									end

									-- Save the units in the database, for cloning
									for idx, unitTable in pairs(unitsTable) do
										-- Force the name of the unit to be equal to the original name
										unitTable["name"] = name
										Olympus.addToDatabase(mist.utils.deepCopy(unitTable))
									end
								end
							end

							-- Update the database used for unit cloning
							if Olympus.cloneDatabase[name] ~= nil then
								Olympus.cloneDatabase[name]["ID"] = ID
								Olympus.cloneDatabase[name]["category"] = unit:getDesc().category
								Olympus.cloneDatabase[name]["heading"] = table["heading"]
								Olympus.cloneDatabase[name]["alt"] = alt
								Olympus.cloneDatabase[name]["country"] = unit:getCountry()
							end

							units[ID] = table
						end
					else
						-- If the unit reference is nil it means the unit no longer exits
						units[ID] = {isAlive = false}
						Olympus.units[ID] = nil
					end
				end
			else
				-- If the unit reference is nil it means the unit no longer exits
				units[ID] = {isAlive = false}
				Olympus.units[ID] = nil
			end
		end
		if index >= endIndex then
			break
		end
	end

	-- Reset the counter 
	if index ~= endIndex then 
		Olympus.unitIndex = 0
	else
		Olympus.unitIndex = endIndex
	end
	
	-- Assemble unitsData table
	Olympus.unitsData["units"] = units

	Olympus.OlympusDLL.setUnitsData()
	return time + 0.05
end

-- This function is periodically called to collect the data of all the existing weapons in the mission to be transmitted to the olympus.dll
function Olympus.setWeaponsData(arg, time)
	-- Weapons data
	local weapons = {}
	
	local startIndex = Olympus.weaponIndex
	local endIndex = startIndex + Olympus.weaponStep
	local index = 0
	for ID, weapon in pairs(Olympus.weapons) do
		index = index + 1

		-- Only the indexes between startIndex and endIndex are handled. This is a simple way to spread the update load over many cycles
		if index > startIndex then
			if weapon ~= nil and weapon:isExist() then
				local table = {}

				-- Get the object category in Olympus name
				local objectCategory = Object.getCategory(weapon)
				if objectCategory == Object.Category.WEAPON then
					if weapon:getDesc().category == Weapon.Category.MISSILE then
						table["category"] = "Missile"
					elseif weapon:getDesc().category == Weapon.Category.ROCKET then
						table["category"] = "Missile"
					elseif weapon:getDesc().category == Weapon.Category.BOMB then
						table["category"] = "Bomb"
					end
				else
					weapons[ID] = {isAlive = false}
					Olympus.weapons[ID] = nil
				end

				-- If the category is handled by Olympus, get the data
				if table["category"] ~= nil then
					-- Compute weapon position and heading
					local lat, lng, alt = coord.LOtoLL(weapon:getPoint())
					local position = weapon:getPosition()
					local heading = math.atan2( position.x.z, position.x.x )

					-- Fill the data table
					table["name"] = weapon:getTypeName()
					table["coalitionID"] = weapon:getCoalition()
					table["position"] = {}
					table["position"]["lat"] = lat 
					table["position"]["lng"] = lng 
					table["position"]["alt"] = alt
					table["speed"] = mist.vec.mag(weapon:getVelocity())
					table["heading"] = heading 
					table["isAlive"] = weapon:isExist()
					
					weapons[ID] = table
				end
			else
				-- If the weapon reference is nil it means the unit no longer exits
				weapons[ID] = {isAlive = false}
				Olympus.weapons[ID] = nil
			end
		end
		if index >= endIndex then
			break
		end
	end

	-- Reset the counter 
	if index ~= endIndex then 
		Olympus.weaponIndex = 0
	else
		Olympus.weaponIndex = endIndex
	end
	
	-- Assemble weaponsData table
	Olympus.weaponsData["weapons"] = weapons

	Olympus.OlympusDLL.setWeaponsData()
	return time + 0.25
end

function Olympus.setMissionData(arg, time)
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

	-- Mission
	local mission = {}
	mission.theatre = env.mission.theatre
	mission.dateAndTime = {
		["elapsedTime"] = DCS.getRealTime() - Olympus.missionStartTime,
		["time"] = mist.time.getDHMS(timer.getAbsTime()),
		["startTime"] = env.mission.start_time,
		["date"] = env.mission.date
	}

	mission.coalitions = {
		["red"] = {},
		["blue"] = {},
		["neutral"] = {}
	}
	for countryName, countryId in pairs(country["id"]) do
		local coalitionName = Olympus.getCoalitionByCoalitionID(coalition.getCountryCoalition(countryId))
		mission.coalitions[coalitionName][#mission.coalitions[coalitionName] + 1] = countryName 
	end

	-- Assemble table
	Olympus.missionData["bullseyes"] = bullseyes
	Olympus.missionData["airbases"] = airbases
	Olympus.missionData["mission"] = mission

	Olympus.OlympusDLL.setMissionData()
	return time + 1	-- For perfomance reasons weapons are updated once every second
end

-- Initializes the units table with all the existing ME units
function Olympus.initializeUnits() 
	if mist and mist.DBs and mist.DBs.MEunitsById then
		for id, unitsTable in pairs(mist.DBs.MEunitsById) do
			local unit = Unit.getByName(unitsTable["unitName"])
			if unit ~= nil and unit:isExist() then
				Olympus.units[unit["id_"]] = unit
			end
		end
		Olympus.notify("Olympus units table initialized", 2)
	else
		Olympus.debug("MIST DBs not ready", 2)
		timer.scheduleFunction(Olympus.initializeUnits, {}, timer.getTime() + 1)
	end
end

------------------------------------------------------------------------------------------------------
-- Olympus utility functions
------------------------------------------------------------------------------------------------------
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

------------------------------------------------------------------------------------------------------
-- Olympus startup script
------------------------------------------------------------------------------------------------------
Olympus.instancePath = lfs.writedir().."Mods\\Services\\Olympus\\bin\\"
Olympus.notify("Starting DCS Olympus backend session in "..Olympus.instancePath, 2)


local OlympusName = 'Olympus ' .. version .. ' C++ module';
Olympus.DLLsloaded = Olympus.loadDLLs()
if Olympus.DLLsloaded then
	Olympus.notify(OlympusName..' successfully loaded.', 20)
else
	Olympus.notify('Failed to load '..OlympusName, 20)
end

-- Create the handler to detect new units
if handler ~= nil then
	world.removeEventHandler(handler)
	Olympus.debug("Olympus handler removed" , 2)
end
handler = {}
function handler:onEvent(event)
	if event.id == 1 then
		local weapon = event.weapon
		if Olympus ~= nil and Olympus.weapons ~= nil then
			Olympus.weapons[weapon["id_"]] = weapon
			Olympus.debug("New weapon created " .. weapon["id_"], 2)
		end
	elseif event.id == 15 then
		local unit = event.initiator
		if Olympus ~= nil and Olympus.units ~= nil then
			Olympus.units[unit["id_"]] = unit
			Olympus.debug("New unit created " .. unit["id_"], 2)
		end
	end
end
world.addEventHandler(handler)

-- Start the periodic functions
timer.scheduleFunction(Olympus.setUnitsData, {}, timer.getTime() + 0.05)
timer.scheduleFunction(Olympus.setWeaponsData, {}, timer.getTime() + 0.25)
timer.scheduleFunction(Olympus.setMissionData, {}, timer.getTime() + 1)

-- Initialize the ME units
Olympus.initializeUnits()

Olympus.notify("OlympusCommand script " .. version .. " loaded successfully", 2, true)


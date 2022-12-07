Olympus = {}
Olympus.unitCounter = 1

function  Olympus.notify(message, displayFor)
    trigger.action.outText(message, displayFor)
end

function Olympus.move(name, lat, lng, v, category)
    Olympus.notify("Olympus.move " .. name .. " (" .. lat .. ", " .. lng ..")", 10)
    local unit = Unit.getByName(name)
	if unit ~= nil then
		if category == 1 then
			local startPoint =  mist.getLeadPos(unit:getGroup())
			local endPoint = coord.LLtoLO(lat, lng, 0)
			
			local endPoint = airbasePos
			local path = {} 
			path[#path + 1] = mist.fixedWing.buildWP(startPoint, flyOverPoint, v, startPoint.y, 'BARO')
			path[#path + 1] = mist.fixedWing.buildWP(endPoint, TurningPoint, v, startPoint.y, 'BARO') 
			
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
        Olympus.notify("Error in Olympus.move " .. name, 10)
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

function Olympus.spawnGround(coalition, type, lat, lng)
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
	--https://wiki.hoggitworld.com/view/MIST_dynAdd

	local spawnLocation = mist.utils.makeVec3GL(coord.LLtoLO(lat, lng, 0))
	plane = {
		["modulation"] = 0,
		["tasks"] = 
		{
		}, -- end of ["tasks"]
		["radioSet"] = false,
		["task"] = "CAP",
		["uncontrolled"] = false,
		["route"] = 
		{
			["points"] = 
			{
				[1] = 
				{
					["alt"] = 2000,
					["action"] = "Turning Point",
					["alt_type"] = "BARO",
					["speed"] = 179.86111111111,
					["task"] = 
					{
						["id"] = "ComboTask",
						["params"] = 
						{
							["tasks"] = 
							{
							}, -- end of ["tasks"]
						}, -- end of ["params"]
					}, -- end of ["task"]
					["type"] = "Turning Point",
					["ETA"] = 0,
					["ETA_locked"] = true,
					["x"] = spawnLocation.x,
					["y"] = spawnLocation.z,
					["formation_template"] = "",
					["speed_locked"] = true,
				}, -- end of [1]
				[2] = 
				{
					["alt"] = 2000,
					["action"] = "Turning Point",
					["alt_type"] = "BARO",
					["speed"] = 179.86111111111,
					["task"] = 
					{
						["id"] = "ComboTask",
						["params"] = 
						{
							["tasks"] = 
							{
							}, -- end of ["tasks"]
						}, -- end of ["params"]
					}, -- end of ["task"]
					["type"] = "Turning Point",
					["ETA"] = 500.42644231043,
					["ETA_locked"] = false,
					["x"] = spawnLocation.x + 10000,
					["y"] = spawnLocation.z,
					["formation_template"] = "",
					["speed_locked"] = true,
				}, -- end of [2]
			}, -- end of ["points"]
		}, -- end of ["route"]
		["groupId"] = 10,
		["hidden"] = false,
		["units"] = 
		{
			[1] = 
			{
				["alt"] = 2000,
				["alt_type"] = "BARO",
				["skill"] = "Excellent",
				["speed"] = 180,
				["AddPropAircraft"] = 
				{
				}, -- end of ["AddPropAircraft"]
				["type"] = type,
				["unitId"] = 10,
				["psi"] = 0.015782716092426,
				["dataCartridge"] = 
				{
					["GroupsPoints"] = 
					{
						["PB"] = 
						{
						}, -- end of ["PB"]
						["Sequence 2 Red"] = 
						{
						}, -- end of ["Sequence 2 Red"]
						["Start Location"] = 
						{
						}, -- end of ["Start Location"]
						["Sequence 1 Blue"] = 
						{
						}, -- end of ["Sequence 1 Blue"]
						["Sequence 3 Yellow"] = 
						{
						}, -- end of ["Sequence 3 Yellow"]
						["A/A Waypoint"] = 
						{
						}, -- end of ["A/A Waypoint"]
						["PP"] = 
						{
						}, -- end of ["PP"]
						["Initial Point"] = 
						{
						}, -- end of ["Initial Point"]
					}, -- end of ["GroupsPoints"]
					["Points"] = 
					{
					}, -- end of ["Points"]
				}, -- end of ["dataCartridge"]
				["x"] = spawnLocation.x,
				["y"] = spawnLocation.z,
				["name"] = "Olympus-" .. Olympus.unitCounter,
				["payload"] = 
				{
					["pylons"] = 
					{
						[7] = 
						{
							["CLSID"] = "{7575BA0B-7294-4844-857B-031A144B2595}",
						}, -- end of [7]
						[3] = 
						{
							["CLSID"] = "{7575BA0B-7294-4844-857B-031A144B2595}",
						}, -- end of [3]
					}, -- end of ["pylons"]
					["fuel"] = 4900,
					["flare"] = 60,
					["ammo_type"] = 1,
					["chaff"] = 60,
					["gun"] = 100,
				}, -- end of ["payload"]
				["heading"] = 0,
				["callsign"] = 
				{
					[1] = 1,
					[2] = 1,
					[3] = 1,
					["name"] = "Enfield11",
				}, -- end of ["callsign"]
				["onboard_num"] = "010",
			},
		}, -- end of ["units"]
		["x"] = spawnLocation.x,
		["y"] = spawnLocation.z,
		["name"] = "Olympus-" .. Olympus.unitCounter,
		["communication"] = true,
		["start_time"] = 0,
		["frequency"] = 305,
	}

	--loads of other stuff you can do with this but this is probably what you need to startPoint
	--you can also set a route here, and included first waypoint as spawn on airbases etc
	--https://github.com/pydcs/dcs/blob/master/dcs/weapons_data.py all weapon pylon types

	if coalition == 'red' then
		plane.country = 'Russia'
	else
		plane.country = 'USA'
	end
	plane.category = 'airplane'

	mist.dynAdd(plane)
	Olympus.unitCounter = Olympus.unitCounter + 1
	Olympus.notify("Olympus.spawnAir completed succesfully", 10)
end

Olympus.notify("OlympusCommand script loaded correctly", 10)
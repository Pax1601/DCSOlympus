tankers = {}
tankers.tankerName = "TankerClone"

function tankers.notify(message, displayFor)
	 trigger.action.outText(message, displayFor, false)
end


function tankers.setFrequency(freq)
	
	unit = Unit.getByName(tankers.tankerName)
	local controller = unit:getController()
	
	freq = freq or 260 --in MHz, 260 channel 19 is our default tanker thing in refs
	
	SetFrequency = { 
	  id = 'SetFrequency', 
	  params = { 
		frequency = freq*1000000 , --in Hz 
		modulation = 0, --AM 0 or FM 1
	  } 
	}

	controller:setCommand(SetFrequency)
end

function tankers.changeCallsign()
	---https://wiki.hoggitworld.com/view/DCS_command_setCallsign
	unit = Unit.getByName(tankers.tankerName)
	local controller = unit:getController()
	
	SetCallsign = { 
	  id = 'SetCallsign', 
	  params = { 
		callname = 3, --1 texaco, --2 arco -- 3 shell 
		number = 1, --1 through 9 valid for tankers only ever 1?
	  } 
	}
	
	controller:setCommand(SetCallsign)
end

--remember to only pick valid tacan channel ranges


-- https://wiki.radioreference.com/index.php/Instrument_Landing_System_(ILS)_Frequencies -- what freqs go with which tacans
-- you want the reply channels on the tankers so the fighter tunes the one you want

function tankers.setTacan(channel, xRay)
	
	defaultTac = 40
	defaultXray = true
	channel = channel or defaultTac -- the channel you want to tell the fighters to enter in, if not provided defaults
	xRay = xRay or defaultXray	-- X or Y are only options so true or false

	unit = Unit.getByName(tankers.tankerName)
	local controller = unit:getController()
	
	--tacan maths is easy
	--for X ray reply it is, channel + 961, Yankee reply is channel + 1087 
	
	if xRay == true then 
		--to not break everyone elses datalink / tacan 37 and above (X)
		if channel > 36 then 
			freq = channel + 961
			ActivateBeacon = { 
				id = 'ActivateBeacon', 
				params = { 
				type = 4, 
				system = 3, 
				name = "TKR", 
				callsign = "ABC", --what shows as a listed word / plays as morese code, 3 max no spaces
				frequency = freq*1000000, 
				} 
			}
			controller:setCommand(ActivateBeacon)
		end

	elseif xRay == false then
		--to not break everyone elses datalink / tacan 30 - 46 (Y) but I don't think the "above" is correct
		if channel > 29 then 
			freq = channel + 1087
			ActivateBeacon = { 
				id = 'ActivateBeacon', 
				params = { 
				type = 4, 
				system = 3, 
				name = "TKR", 
				callsign = "ABC", --what shows as a listed word / plays as morese code, 3 max no spaces
				frequency = freq*1000000, 
				} 
			}
			controller:setCommand(ActivateBeacon)
		end
	end
end

function tankers.dryPlugTanking () -- for whatever reason this ends up being no fuel transfer?
	--tankers.setFrequency(260)
	--tankers.setTacan(41, true)
	--tankers.changeCallsign()
	
	unit = Unit.getByName(tankers.tankerName)
	cvn = Unit.getByName("CVN")
	local cvnPos = cvn:getPosition().p
	local tnkrPos = unit:getPosition().p
	local speed = 250
	local controller = unit:getController()

		--if you want to try making a tanker do something else 
		--https://www.digitalcombatsimulator.com/en/support/faq/1267/#3307682 maybe? stop conditions etc
		--personally i think delete the thing if it doesn't work
		--there is a recovery tanker option, but for me it makes planes stall and hit the floor and we can fake it with this already
	
	-- this might all seem very over the top compared to the docs, but if you don't do it the tanker instantly RTBs, though you can tank on final which is hillarious
	
	task1 = {
			["number"] = 1,
			["auto"] = false,
			["id"] = "ControlledTask",
			["enabled"] = true,
			["params"] = 
			{
				["task"] = 
				{
					["id"] = "Tanker",
					["params"] = 
					{
					}, -- end of ["params"]
				}, -- end of ["task"]
				["stopCondition"] = 
				{
					["duration"] = 600,
					["userFlag"] = "1",
				}, -- end of ["stopCondition"]
			}, -- end of ["params"]
		}
	
	task2 = {  	
				["number"] = 2,
				["auto"] = false,
				["id"] = "WrappedAction",
				["enabled"] = true,
				["params"] = 
				{
					["action"] = 
					{
						["id"] = "ActivateBeacon",
						["params"] = 
						{
							["type"] = 4,
							["AA"] = false,
							["callsign"] = "TKR",
							["modeChannel"] = "Y",
							["channel"] = 71,
							["system"] = 5,
							["unitId"] = 188,
							["bearing"] = true,
							["frequency"] = 1032000000,
						}, -- end of ["params"]
					}, -- end of ["action"]
				}, -- end of ["params"]
			}
	task3 = 
			{
			["number"] = 3,
			["auto"] = false,
			["id"] = "WrappedAction",
			["enabled"] = true,
			["params"] = 
			{
				["action"] = 
				{
					["id"] = "SetFrequency",
					["params"] = 
					{
						["power"] = 10,
						["modulation"] = 0,
						["frequency"] = 305000000,
					}, -- end of ["params"]
				}, -- end of ["action"]
			}, -- end of ["params"]
		}
	
	task4 =
			{
			["number"] = 4,
			["auto"] = false,
			["id"] = "WrappedAction",
			["enabled"] = true,
			["params"] = 
			{
				["action"] = 
				{
					["id"] = "SetInvisible",
					["params"] = 
					{
						["value"] = true,
					}, -- end of ["params"]
				}, -- end of ["action"]
			}, -- end of ["params"]
		}
	
	point1 = {
					['speed_locked'] = false,
					['type'] = 'Turning Point',
					['action'] = 'Turning Point',
					['alt_type'] = 'BARO',
					['y'] = cvnPos.z,
					['x'] = cvnPos.x,
					['speed'] = 128.611,
					['task'] = {
						['id'] = 'ComboTask',
						['params'] = {
							['tasks'] = {
								[1] = task1, --tanker first
								[2] = task2, --whatever second
								[3] = task3, 
								[4] = task4,
								}
							}									
					},
					['alt'] = tnkrPos.y
				}
	point2 = {	
				['speed_locked'] = true,
				['type'] = 'Turning Point',
				['action'] = 'Turning Point',
				['alt_type'] = 'BARO',
				['y'] = 30553,
				['x'] = 35881,
				['speed'] = 128.611,
				['task'] = {
					['id'] = 'ComboTask',
					['params'] = {
						['tasks'] = {
						}
					}
				},
				['alt'] = 2133.6
			}
		
		missionTask =
		{
			['id'] = 'Mission',
			['params'] = {
				['route'] = {
					['points'] = {
						[1] = point1,
						--[2] = point2,
					}
				},
				['airborne'] = true
			}
		}
			controller:pushTask(missionTask)
end	

function tankers.followInFront ()
	unit = Unit.getByName(tankers.tankerName)
	local controller = unit:getController()
	
		FollowAheadOfGroup =  {
				["enabled"] = true,
				["auto"] = false,
				["id"] = "Follow",
				["number"] = 1,
				["params"] = 
				{
					["lastWptIndexFlagChangedManually"] = false,
					["groupId"] = 74,
					["lastWptIndex"] = 2,
					["lastWptIndexFlag"] = false,
					["pos"] = 
					{
						["y"] = 152.4,	--mins for KC 135 to accidentally stern rejoin and overfly
						["x"] = 1000.8,
						["z"] = 39.9288,
					}, -- end of ["pos"]
				}, -- end of ["params"]
			}
	
	controller:pushTask(FollowAheadOfGroup)
end

function tankers.followInFrontClose ()
	unit = Unit.getByName(tankers.tankerName)
	local controller = unit:getController()
	
		FollowAheadOfGroup =  {
				["enabled"] = true,
				["auto"] = false,
				["id"] = "Follow",
				["number"] = 1,
				["params"] = 
				{
					["lastWptIndexFlagChangedManually"] = false,
					["groupId"] = 74,
					["lastWptIndex"] = 2,
					["lastWptIndexFlag"] = false,
					["pos"] = 
					{
						["y"] = 25,	--mins for KC 135 to accidentally stern rejoin and overfly
						["x"] = 150,
						["z"] = 41.45,
					}, -- end of ["pos"]
				}, -- end of ["params"]
			}
	
	controller:pushTask(FollowAheadOfGroup)
end

function tankers.cloneTanker()

local groupName = 'TankerClone' -- Name of the group in the ME

group = mist.getGroupData(groupName)
group.route = { points = mist.getGroupRoute(groupName, true) }
group.groupName = "Tanker1"
group.groupId = nil
group.units[1].unitId = nil
group.units[1].unitName = newName
group.country = country
group.category = 'AIRPLANE'

mist.dynAdd(group)

end

function tankers.newTanker()

local groupName = 'TankerClone' -- Name of the group in the ME
local cloneGroupPos = Unit.getByName(groupName):getPosition().p
cvn = Unit.getByName("CVN")
local cvnPos = cvn:getPosition().p


group = mist.getGroupData(groupName)
group.route = {
                                    ["points"] = 
                                    {
                                        [1] = 
                                        {
                                            ["alt"] = 2133.6,
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
                                                        [1] = 
                                                        {
                                                            ["number"] = 1,
                                                            ["auto"] = false,
                                                            ["id"] = "ControlledTask",
                                                            ["enabled"] = true,
                                                            ["params"] = 
                                                            {
                                                                ["task"] = 
                                                                {
                                                                    ["id"] = "Tanker",
                                                                    ["params"] = 
                                                                    {
                                                                    }, -- end of ["params"]
                                                                }, -- end of ["task"]
                                                                ["stopCondition"] = 
                                                                {
                                                                    ["duration"] = 900,
                                                                }, -- end of ["stopCondition"]
                                                            }, -- end of ["params"]
                                                        }, -- end of [1]
                                                        [2] = 
                                                        {
                                                            ["number"] = 2,
                                                            ["auto"] = false,
                                                            ["id"] = "WrappedAction",
                                                            ["enabled"] = true,
                                                            ["params"] = 
                                                            {
                                                                ["action"] = 
                                                                {
                                                                    ["id"] = "ActivateBeacon",
                                                                    ["params"] = 
                                                                    {
                                                                        ["type"] = 4,
                                                                        ["AA"] = false,
                                                                        ["callsign"] = "TKR",
                                                                        ["modeChannel"] = "Y",
                                                                        ["channel"] = 71,
                                                                        ["system"] = 5,
                                                                        ["unitId"] = 188,
                                                                        ["bearing"] = true,
                                                                        ["frequency"] = 1032000000,
                                                                    }, -- end of ["params"]
                                                                }, -- end of ["action"]
                                                            }, -- end of ["params"]
                                                        }, -- end of [2]
                                                        [3] = 
                                                        {
                                                            ["number"] = 3,
                                                            ["auto"] = false,
                                                            ["id"] = "WrappedAction",
                                                            ["enabled"] = true,
                                                            ["params"] = 
                                                            {
                                                                ["action"] = 
                                                                {
                                                                    ["id"] = "SetFrequency",
                                                                    ["params"] = 
                                                                    {
                                                                        ["power"] = 10,
                                                                        ["modulation"] = 0,
                                                                        ["frequency"] = 260000000,
                                                                    }, -- end of ["params"]
                                                                }, -- end of ["action"]
                                                            }, -- end of ["params"]
                                                        }, -- end of [3]
                                                        [4] = 
                                                        {
                                                            ["number"] = 4,
                                                            ["auto"] = false,
                                                            ["id"] = "WrappedAction",
                                                            ["enabled"] = true,
                                                            ["params"] = 
                                                            {
                                                                ["action"] = 
                                                                {
                                                                    ["id"] = "SetInvisible",
                                                                    ["params"] = 
                                                                    {
                                                                        ["value"] = true,
                                                                    }, -- end of ["params"]
                                                                }, -- end of ["action"]
                                                            }, -- end of ["params"]
                                                        }, -- end of [4]                                                        
                                                    }, -- end of ["tasks"]
                                                }, -- end of ["params"]
                                            }, -- end of ["task"]
                                            ["type"] = "Turning Point",
                                            ["ETA"] = 96.50677034026,
                                            ["ETA_locked"] = false,
                                            ["y"] = cvnPos.z,
                                            ["x"] = cvnPos.x,
                                            ["formation_template"] = "",
                                            ["speed_locked"] = true,
                                        }, -- end of [1]
                                    }, -- end of ["points"]
                                }

--group.units[1].type = "S-3B Tanker"
group.groupName = "Tanker1"
group.groupId = nil
group.units[1].unitId = nil
group.units[1].unitName = newName
group.country = country
group.category = 'AIRPLANE'
group.units[1].x = cloneGroupPos.x
group.units[1].y = cloneGroupPos.z
group.units[1].z = cloneGroupPos.y
group.units[1].speed = 999999


Group.destroy(Group.getByName(groupName))
mist.dynAdd(group)
--timer.scheduleFunction(mist.dynAdd,group, timer.getTime() + 0.00000000001)

end


function tankers.startEnrouteTankingTest (vec3) -- this is the one that works well, clone an existing tanker that is currently mission editor tanking
	 
	--tankers.setFrequency(260)
	--tankers.setTacan(41, true)
	--tankers.changeCallsign()
	route = mist.getGroupRoute(tankers.tankerName, true)
	unit = Unit.getByName(tankers.tankerName)
	cvn = Unit.getByName("CVN")

	local cvnPos = cvn:getPosition().p

	local vec3 = vec3 or cvnPos 
	route[1].x =  unit:getPosition().p.x
	route[1].y =  unit:getPosition().p.z
	route[2].x =  vec3.x
	route[2].y =  vec3.z
	route[2].z =  vec3.y + 100
	
	mist.goRoute(tankers.tankerName ,	route )
end	

function tankers.hyperSpace (vec3) -- this is the one that works well, clone an existing tanker that is currently mission editor tanking
local groupName = 'TankerClone' -- Name of the group in the ME
local cloneGroupPos = Unit.getByName(groupName):getPosition().p
cvn = Unit.getByName("CVN")
local cvnPos = cvn:getPosition().p


group = mist.getGroupData(groupName)
group.route = {
                                    ["points"] = 
                                    {
                                        [1] = 
                                        {
                                            ["alt"] = 2133.6,
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
                                                        [1] = 
                                                        {
                                                            ["number"] = 1,
                                                            ["auto"] = false,
                                                            ["id"] = "ControlledTask",
                                                            ["enabled"] = true,
                                                            ["params"] = 
                                                            {
                                                                ["task"] = 
                                                                {
                                                                    ["id"] = "Tanker",
                                                                    ["params"] = 
                                                                    {
                                                                    }, -- end of ["params"]
                                                                }, -- end of ["task"]
                                                                ["stopCondition"] = 
                                                                {
                                                                    ["duration"] = 900,
                                                                }, -- end of ["stopCondition"]
                                                            }, -- end of ["params"]
                                                        }, -- end of [1]
                                                        [2] = 
                                                        {
                                                            ["number"] = 2,
                                                            ["auto"] = false,
                                                            ["id"] = "WrappedAction",
                                                            ["enabled"] = true,
                                                            ["params"] = 
                                                            {
                                                                ["action"] = 
                                                                {
                                                                    ["id"] = "ActivateBeacon",
                                                                    ["params"] = 
                                                                    {
                                                                        ["type"] = 4,
                                                                        ["AA"] = false,
                                                                        ["callsign"] = "TKR",
                                                                        ["modeChannel"] = "Y",
                                                                        ["channel"] = 71,
                                                                        ["system"] = 5,
                                                                        ["unitId"] = 188,
                                                                        ["bearing"] = true,
                                                                        ["frequency"] = 1032000000,
                                                                    }, -- end of ["params"]
                                                                }, -- end of ["action"]
                                                            }, -- end of ["params"]
                                                        }, -- end of [2]
                                                        [3] = 
                                                        {
                                                            ["number"] = 3,
                                                            ["auto"] = false,
                                                            ["id"] = "WrappedAction",
                                                            ["enabled"] = true,
                                                            ["params"] = 
                                                            {
                                                                ["action"] = 
                                                                {
                                                                    ["id"] = "SetFrequency",
                                                                    ["params"] = 
                                                                    {
                                                                        ["power"] = 10,
                                                                        ["modulation"] = 0,
                                                                        ["frequency"] = 260000000,
                                                                    }, -- end of ["params"]
                                                                }, -- end of ["action"]
                                                            }, -- end of ["params"]
                                                        }, -- end of [3]
                                                        [4] = 
                                                        {
                                                            ["number"] = 4,
                                                            ["auto"] = false,
                                                            ["id"] = "WrappedAction",
                                                            ["enabled"] = true,
                                                            ["params"] = 
                                                            {
                                                                ["action"] = 
                                                                {
                                                                    ["id"] = "SetInvisible",
                                                                    ["params"] = 
                                                                    {
                                                                        ["value"] = true,
                                                                    }, -- end of ["params"]
                                                                }, -- end of ["action"]
                                                            }, -- end of ["params"]
                                                        }, -- end of [4]                                                        
                                                    }, -- end of ["tasks"]
                                                }, -- end of ["params"]
                                            }, -- end of ["task"]
                                            ["type"] = "Turning Point",
                                            ["ETA"] = 96.50677034026,
                                            ["ETA_locked"] = false,
                                            ["y"] = cvnPos.z,
                                            ["x"] = cvnPos.x,
                                            ["formation_template"] = "",
                                            ["speed_locked"] = true,
                                        }, -- end of [1]
                                    }, -- end of ["points"]
                                }

--group.units[1].type = "S-3B Tanker"
group.groupName = "Tanker1"
group.groupId = nil
group.units[1].unitId = nil
group.units[1].unitName = newName
group.country = country
group.category = 'AIRPLANE'
group.units[1].x = cvnPos.x-100
group.units[1].y = cvnPos.z
group.units[1].z = cloneGroupPos.y
group.units[1].heading = 0.000000000001
group.units[1].speed = 300

--Group.destroy(Group.getByName(groupName))
mist.dynAdd(group)
group.groupName = "Tanker2"
group.units[1].x = cvnPos.x+100
group.units[1].heading = 3.1415926537
group.units[1].y = cvnPos.z
mist.dynAdd(group)

end	


handler = {}

local function protectedCall(...)
  local status, retval = pcall(...)
  if not status then
	
  end
end

function tankers.eventHandler (event) 
	if (26 == event.id) then --this is when someone types into a mark
		local vec3 = mist.utils.makeVec3GL(event.pos)
		tankers.startEnrouteTankingTest (vec3)
	end
end

function handler:onEvent(event)
	protectedCall(tankers.eventHandler, event)
end

do
	--world.addEventHandler(handler)
	world.addEventHandler(handler)
end

do
	longRangeShots = missionCommands.addSubMenu("Dynamic Tanking")
		missionCommands.addCommand ("Hyperspace entry", longRangeShots, tankers.hyperSpace)
		missionCommands.addCommand ("Start tanking", longRangeShots, tankers.startEnrouteTankingTest)
		missionCommands.addCommand ("Frequency change approved", longRangeShots, tankers.setFrequency)
		missionCommands.addCommand ("Callsign change approved", longRangeShots, tankers.changeCallsign)
		missionCommands.addCommand ("Tacan change approved", longRangeShots, tankers.setTacan)
		missionCommands.addCommand ("Start a new tanker", longRangeShots, tankers.newTanker)
		missionCommands.addCommand ("Rejoin on a unit", longRangeShots, tankers.followInFront)
		missionCommands.addCommand ("Rejoin close", longRangeShots, tankers.followInFrontClose)

		
end

tankers.notify("tankers.lua loaded",2)
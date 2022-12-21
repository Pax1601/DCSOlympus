--[[--
Olympus base air AI functions 
## Description:
Olympus is a development of zeus, as in for arma, taken into DCS to control stuff easily via a web interface. 
This file is a bunch of functions that relate to basic spawning, control, and removal of AI aircraft. 

assert(loadfile('C:\\Users\\hindsas\\Saved Games\\DCS.openbeta\\Missions\\Olympus\\LUA\\baseFunctions.lua'))()

]]

vv = {} --not actually a virus, possibly just Italian and Windows defender is racist

function vv.notify(message, displayFor)
    trigger.action.outText(message, displayFor)
end

--Functions related to attack
function vv.attackAirUnit () --Unit attacks another unit (forces detection)
	--https://wiki.hoggitworld.com/view/DCS_task_attackUnit
	local controller = Unit.getByName("TestBlue"):getController()
	AttackUnit = { 
		id = 'AttackUnit', 
		params = { 
		unitId = 2, -- obviously you have to work this out somehow 
		groupAttack = false, --I think true sets it to attack first unit, then second unit etc
		} 
	}
	controller:pushTask(AttackUnit)
	vv.notify("AttackAirUnit executed", 2)
end

function vv.attackAirGroup () --Group attacks another group (forces detection)
	--https://wiki.hoggitworld.com/view/DCS_task_attackGroup	
	local controller = Group.getByName("TestBlue"):getController()
	AttackGroup = { 
		id = 'AttackGroup', 
		params = { 
		groupId = 2, -- obviously you have to work this out somehow 
		
		}
	}
	controller:pushTask(AttackGroup)
	vv.notify("attackAirGroup executed", 2)
end

function vv.detectUnits () --what units a thing has detected, and how
	--https://wiki.hoggitworld.com/view/DCS_func_getDetectedTargets
	local controller = Unit.getByName("TestBlue"):getController()
	local detectedUnits = controller:getDetectedTargets()
	vv.notify(mist.utils.tableShow(detectedUnits), 10)
	vv.notify("detectAirUnit executed", 2)
end

function vv.attackGroundPoint() --obviously freaks the eff out over water
	--https://wiki.hoggitworld.com/view/DCS_task_bombing
	local controller = Unit.getByName("TestBlue"):getController()
	local vec3UnderUnit = mist.utils.makeVec3GL(Unit.getByName("TestBlue"):getPosition()) --vec3 on the floor under the unit 
	local vec2 = mist.utils.makeVec2(vec3UnderUnit) --zero reason to do all this, just shows how to get unit locations
	--yes we are bombing whatever is directly below the unit
	Bombing = { 
			id = 'Bombing', 
			params = { 
			point = vec2,
			attackQty = 1, 
			--weaponType = 536870912 , --optional use cannon don't think it works
			weaponType = 2956984318  , --optional this is use any A2G weapon
			} 
		}
	controller:pushTask(Bombing)
	vv.notify("attackGroundPoint executed", 2)
end

function vv.attackGroundUnit()
	-- I actually think my attack air unit code is just attack anything, so this isn't needed
	vv.notify("attackGroundUnit executed", 2)
end


--Functions related to movement

function vv.flyHere ()
	--https://wiki.hoggitworld.com/view/MIST_fixedWingBuildWP has similar shit for helicopters but think its same 
	local startPoint =  mist.getLeadPos(Group.getByName("TestBlue")) --lots of ways to get where it is, this ones cool
	
	--this bit of codes a bit overly flash, as you just need a destination point but its kinda cool
	airbases = coalition.getAirbases(2) --check for coalition airbases, if none, must be neutrals so check them
	if #airbases == 0 then 
		airbases = coalition.getAirbases(0)
	end
	local pickRandomAirbase = math.random(1,#airbases)
	airbase = airbases[pickRandomAirbase]
	airbasePos = Airbase.getPosition(airbase).p
	
	--flashy airbase position crap done on with the main bit
	
	local endPoint = airbasePos
	local path = {} 
	path[#path + 1] = mist.fixedWing.buildWP(startPoint, flyOverPoint, 250, 5000, 'BARO') --type, speed, alt, altType, SI units
	path[#path + 1] = mist.fixedWing.buildWP(endPoint, TurningPoint, 250, 2000, 'BARO') 
	
	mist.goRoute(Group.getByName("TestBlue"), path)
	
	vv.notify("flyHere executed", 2)
end

function vv.landHere ()
	--https://wiki.hoggitworld.com/view/DCS_task_mission there isn't a land thing, the land thing is for helis, there is a give it a mission to land or this somehow works
	local startPoint = mist.getLeadPos(Group.getByName("TestBlue"))

	airbases = coalition.getAirbases(2) --check for coalition airbases, if none, must be neutrals so check them
	if #airbases == 0 then 
		airbases = coalition.getAirbases(0)
	end
	local pickRandomAirbase = math.random(1,#airbases)
	airbase = airbases[pickRandomAirbase]
	airbasePos = Airbase.getPosition(airbase).p

	local endPoint = mist.utils.makeVec2(airbasePos)

	local path = {}
	path[#path + 1] = mist.heli.buildWP(startPoint, TurningPoint, 200, 2000, 'agl') --no difference between heli and fixedWing waypoints, baar default speeds are higher
	path[#path + 1] = mist.heli.buildWP(endPoint, Landing, 200, 2000, 'agl') 
	
	mist.goRoute(Group.getByName("TestBlue"), path)
	
	vv.notify("landHere executed", 2)
end

function vv.followGroup()
			local group = Group.getByName("TestBlue")
			local controller = group:getController()

			controller:resetTask()
			local groupFlw = Group.getByName("TestRed"):getID()
			local position = {x= 0 , y= 0, z=1600}
			-- position = {x= 0 , y= -5, z=100} -- right 
			-- position = {x= 150 , y= -5, z=-100} --front
			-- position = {x= 0 , y= -5, z=-100} --left
			-- position = {x= -100 , y= -5, z=0} --trail
			-- position = {x= 0 , y= 304, z= 0} --above
			-- position = {x= 0 , y= 0, z=1600} --spread 4 1 mile


			Follow = {
			id = 'Follow',
			params = {
			groupId = groupFlw,
			pos = position,  --x is x y is up and down or Z ( Z is left and right or y)
			lastWptIndexFlag = false,
			lastWptIndex = 1
			}    
			}

			controller:setTask(Follow)
	vv.notify("followGroup executed", 2)
end

function vv.refuelAtUnit ()
		local group = Group.getByName("TestBlue")

		Refueling = {  -- this is go refuel, not I want to become a tanker
			id = 'Refueling', 
			params = {} 
		}
		local controller = group:getController()
		controller:setTask(Refueling)
	
		vv.notify("refuelAtUnit executed", 2)
end



--functions related to formations
--there are loads of options you can do in the same way as setting formations, restrick afterburner, jettison, ROE, etc
--https://wiki.hoggitworld.com/view/DCS_func_setOption
function vv.changeFormation ()
	local group = Group.getByName("TestBlue")
	local controller = group:getController()
	controller:setOption(AI.Option.Air.id.FORMATION,458753) --spread 4 according to page, actually echleon left?
	vv.notify("changeFormation executed", 2)
end

--Functions related to missions
function vv.executeMission ()
	vv.notify("executeMission executed", 2)
end


--Functions related to querying stuff for a unit
--mostly from this https://wiki.hoggitworld.com/view/DCS_Class_Unit
function vv.fuelState () --gives it as a percentage i.e. 0.5 is 50% fuel 1.6 is several tanks of fuel + internal
	local unit = Unit.getByName("TestBlue")
	local fuelState = Unit.getFuel(unit)
	vv.notify(fuelState, 2)
	vv.notify("fuelState executed", 2)
end

--Functions related to air events, like takeoff, landing, ejection

--Functions related to spawning

function vv.spawnAirGroup ()
	--https://wiki.hoggitworld.com/view/MIST_dynAdd

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
                                            ["y"] = -15921.222675484,
                                            ["x"] = 20601.532582682,
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
                                            ["y"] = -17324.285714286,
                                            ["x"] = 109492.85714286,
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
                                        ["livery_id"] = "vfa-37",
                                        ["skill"] = "Excellent",
                                        ["speed"] = 179.86111111111,
                                        ["AddPropAircraft"] = 
                                        {
                                        }, -- end of ["AddPropAircraft"]
                                        ["type"] = "FA-18C_hornet",
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
                                        ["y"] = -15921.222675484,
                                        ["x"] = 20601.532582682,
                                        ["name"] = "TestBlueSpawn",
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
                                        ["heading"] = -0.015782716092426,
                                        ["callsign"] = 
                                        {
                                            [1] = 1,
                                            [2] = 1,
                                            [3] = 1,
                                            ["name"] = "Enfield11",
                                        }, -- end of ["callsign"]
                                        ["onboard_num"] = "010",
                                    }, -- end of [1]
                                    [2] = 
                                    {
                                        ["alt"] = 2000,
                                        ["alt_type"] = "BARO",
                                        ["livery_id"] = "vfa-37",
                                        ["skill"] = "Excellent",
                                        ["speed"] = 179.86111111111,
                                        ["AddPropAircraft"] = 
                                        {
                                        }, -- end of ["AddPropAircraft"]
                                        ["type"] = "FA-18C_hornet",
                                        ["unitId"] = 11,
                                        ["psi"] = 0.015782716092426,
                                        ["y"] = -15881.222675484,
                                        ["x"] = 20561.532582682,
                                        ["name"] = "TestBlueSpawn-1",
                                        ["payload"] = 
                                        {
                                            ["pylons"] = 
                                            {
                                            }, -- end of ["pylons"]
                                            ["fuel"] = 4900,
                                            ["flare"] = 60,
                                            ["ammo_type"] = 1,
                                            ["chaff"] = 60,
                                            ["gun"] = 100,
                                        }, -- end of ["payload"]
                                        ["heading"] = -0.015782716092426,
                                        ["callsign"] = 
                                        {
                                            [1] = 1,
                                            [2] = 1,
                                            [3] = 2,
                                            ["name"] = "Enfield12",
                                        }, -- end of ["callsign"]
                                        ["onboard_num"] = "012",
                                    }, -- end of [2]
                                }, -- end of ["units"]
                                ["y"] = -15921.222675484,
                                ["x"] = 20601.532582682,
                                ["name"] = "TestBlueSpawn",
                                ["communication"] = true,
                                ["start_time"] = 0,
                                ["frequency"] = 305,
                            }
--loads of other stuff you can do with this but this is probably what you need to startPoint
--you can also set a route here, and included first waypoint as spawn on airbases etc
--https://github.com/pydcs/dcs/blob/master/dcs/weapons_data.py all weapon pylon types
plane.country = 'Russia'
plane.category = 'airplane'

mist.dynAdd(plane)
	vv.notify("spawnAirGroup executed", 2)
end

function vv.destroyAirGroup ()
	local unit = Unit.getByName("TestBlue")
	Object.destroy(unit)
	vv.notify("destroyAirGroup executed", 2)
end

function vv.detonateAirGroup ()
	local unit = Unit.getByName("TestBlue")
	local unitPos = Object.getPosition(unit)
	trigger.action.explosion(unitPos.p , 5 )
	vv.notify("detonateAirGroup executed", 2)
end



controlRadio = missionCommands.addSubMenuForGroup(3, "Air control functions" , nil)
		 specificCommand = missionCommands.addCommandForGroup(3 , "Attack the unit" , controlRadio , vv.attackAirUnit)
		 specificCommand = missionCommands.addCommandForGroup(3 , "Attack the group" , controlRadio , vv.attackAirGroup)
		 specificCommand = missionCommands.addCommandForGroup(3 , "Get detected targets" , controlRadio , vv.detectUnits)
		 specificCommand = missionCommands.addCommandForGroup(3 , "Bomb below me" , controlRadio , vv.attackGroundPoint)
		 specificCommand = missionCommands.addCommandForGroup(3 , "Fly here (to random airbase)" , controlRadio , vv.flyHere)
		 specificCommand = missionCommands.addCommandForGroup(3 , "Land there" , controlRadio , vv.landHere)
		 specificCommand = missionCommands.addCommandForGroup(3 , "Follow group" , controlRadio , vv.followGroup)
		 specificCommand = missionCommands.addCommandForGroup(3 , "Go tank" , controlRadio , vv.refuelAtUnit)
		 specificCommand = missionCommands.addCommandForGroup(3 , "Change formation" , controlRadio , vv.changeFormation)
		 specificCommand = missionCommands.addCommandForGroup(3 , "Get fuel" , controlRadio , vv.fuelState)
controlRadio2 = missionCommands.addSubMenuForGroup(3, "Spawn Functions" , nil)
		 specificCommand = missionCommands.addCommandForGroup(3 , "Spawn new group" , controlRadio2 , vv.spawnAirGroup)
		 specificCommand = missionCommands.addCommandForGroup(3 , "Delete group" , controlRadio2 , vv.destroyAirGroup)
		 specificCommand = missionCommands.addCommandForGroup(3 , "Blow up group" , controlRadio2 , vv.detonateAirGroup)
		 
env.setErrorMessageBoxEnabled(false)	--mad skills stop server freezing on lua crash error box but also bad from diagnostics POV	 
vv.notify("baseFunctions.lua loaded", 2)		 
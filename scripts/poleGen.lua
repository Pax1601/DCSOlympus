--max range, altitude and it fails?
--shoot right up
--fix sa10 and sa 11

--different static layouts on a carrier depending on what is going on
--guns on a static ship at sea?


pg = {}
handler = {}
pg.name = "Sam"
pg.cloneName = "Clone"
pg.fakeTargetName = "Player"
pg.samCounter = 1
pg.droneAlt = 20000
pg.delay = 40
pg.missileSpeed = 565
pg.samLoc = {}
pg.samLoc.x = 1
pg.samLoc.y = 1 
pg.samLoc.z = 1
pg.missilesActive = 0
pg.droneName = nil
pg.droneSpeed = 300
pg.hidden = false
pg.samDB = {[1] = {["missileDelay"] = 40, ["missileSpeed"] = 770},
			[2] = {["missileDelay"] = 40, ["missileSpeed"] = 770},
			[3] = {["missileDelay"] = 120, ["missileSpeed"] = 550},
			[4] = {["missileDelay"] = 40, ["missileSpeed"] = 770},
			[5] = {["missileDelay"] = 65, ["missileSpeed"] = 770},
			[6] = {["missileDelay"] = 60, ["missileSpeed"] = 500},
			[7] = {["missileDelay"] = 40, ["missileSpeed"] = 770},
			[8] = {["missileDelay"] = 40, ["missileSpeed"] = 770},
			[9] = {["missileDelay"] = 40, ["missileSpeed"] = 770},
			[10] = {["missileDelay"] = 60, ["missileSpeed"] = 1400},		
			}

function pg.notify(message, displayFor)
	 trigger.action.outText(message, displayFor, false)
end


function pg.fakeSam(vec3)

	playerTarget =  Unit.getByName(pg.fakeTargetName)
	pointFakeTarget = playerTarget:getPosition().p
	vec3 = vec3 or pg.samLoc
	
	vecSub = mist.vec.sub(pointFakeTarget , vec3)
	planeHeading = mist.utils.getDir(vecSub)
	missileType = 2
	pg.spawnDrone (vec3,planeHeading,playerTarget,missileType)
	
	--pg.notify("FakeSam Ran", 10)

	targetID = Group.getByName("TargetDrone" .. pg.samCounter):getUnit(1):getID()
	samGroup = Group.getByName("poleGenerator" .. pg.samCounter)
	vars = {[1] = targetID, [2] = samGroup}
	timer.scheduleFunction(pg.attack ,vars, timer.getTime() + 1)
	pg.samCounter = pg.samCounter + 1
	
end


function pg.spawnSamSA2 (vec3,heading)
	--where
	--name
	group = {}
	group.groupName = "poleGenerator" .. pg.samCounter
	group.units = {
					[1] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["hidden"] = pg.hidden,
						["type"] = "S_75M_Volhov",
						--["unitId"] = 35,
						["y"] = vec3.z-40,
						["x"] = vec3.x-40,
						--["name"] = "Ground-1-2",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [1]
					[2] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["type"] = "SNR_75V",
						--["unitId"] = 34,
						["y"] = vec3.z,
						["x"] = vec3.x,
						--["name"] = "Ground-1-1",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [2]
				}
	group.hidden = pg.hidden
	group.category = "VEHICLE"
	group.country = 54
	mist.dynAdd(group)
	--heading 
end

function pg.spawnSamSA3 (vec3,heading)
	--where
	--name
	group = {}
	group.groupName = "poleGenerator" .. pg.samCounter
	group.units = {
					[1] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["hidden"] = pg.hidden,
						["type"] = "snr s-125 tr",
						--["unitId"] = 35,
						["y"] = vec3.z-40,
						["x"] = vec3.x-40,
						--["name"] = "Ground-1-2",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [1]
					[2] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["type"] = "5p73 s-125 ln",
						--["unitId"] = 34,
						["y"] = vec3.z,
						["x"] = vec3.x,
						--["name"] = "Ground-1-1",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [2]
				}
	group.hidden = pg.hidden
	group.category = "VEHICLE"
	group.country = 54
	mist.dynAdd(group)
	--heading 
end

function pg.spawnSamSA5 (vec3,heading)
	--where
	--name
	group = {}
	group.groupName = "poleGenerator" .. pg.samCounter
	group.units = {
					[1] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["hidden"] = pg.hidden,
						["type"] = "RPC_5N62V",
						--["unitId"] = 35,
						["y"] = vec3.z-40,
						["x"] = vec3.x-40,
						--["name"] = "Ground-1-2",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [1]
					[2] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["type"] = "RLS_19J6",
						--["unitId"] = 34,
						["y"] = vec3.z,
						["x"] = vec3.x,
						--["name"] = "Ground-1-1",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [2]
					[3] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["type"] = "S-200_Launcher",
						--["unitId"] = 34,
						["y"] = vec3.z-80,
						["x"] = vec3.x-80,
						--["name"] = "Ground-1-1",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [3]
				}
	group.hidden = pg.hidden
	group.category = "VEHICLE"
	group.country = 54
	mist.dynAdd(group)
	--heading 
end

function pg.spawnSamSA6 (vec3,heading)
	--where
	--name
	group = {}
	group.groupName = "poleGenerator" .. pg.samCounter
	group.units = {
					[1] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["hidden"] = pg.hidden,
						["type"] = "Kub 1S91 str",
						--["unitId"] = 35,
						["y"] = vec3.z-40,
						["x"] = vec3.x-40,
						--["name"] = "Ground-1-2",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [1]
					[2] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["type"] = "Kub 2P25 ln",
						--["unitId"] = 34,
						["y"] = vec3.z,
						["x"] = vec3.x,
						--["name"] = "Ground-1-1",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [2]
				}
	group.hidden = pg.hidden
	group.category = "VEHICLE"
	group.country = 54
	mist.dynAdd(group)
	--heading 
end

function pg.spawnSamSA10 (vec3,heading)
	--where
	--name
	group = {}
	group.groupName = "poleGenerator" .. pg.samCounter
	group.units = {
					[1] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["hidden"] = pg.hidden,
						["type"] = "S-300PS 40B6M tr",
						--["unitId"] = 35,						
						["y"] = vec3.z,
						["x"] = vec3.x,
						--["name"] = "Ground-1-2",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [1]
					[2] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["type"] = "S-300PS 64H6E sr",
						--["unitId"] = 34,
						["y"] = vec3.z-10,
						["x"] = vec3.x-10,
						--["name"] = "Ground-1-1",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [2]
					[3] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["type"] = "S-300PS 54K6 cp",
						--["unitId"] = 34,
						["y"] = vec3.z-20,
						["x"] = vec3.x-20,
						--["name"] = "Ground-1-1",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [3]
					[4] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["type"] = "S-300PS 5P85C ln",
						--["unitId"] = 34,
						["y"] = vec3.z-40,
						["x"] = vec3.x-40,
						--["name"] = "Ground-1-1",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [4]
				}
	group.hidden = pg.hidden
	group.category = "VEHICLE"
	group.country = 54
	mist.dynAdd(group)
	--heading 
end

function pg.spawnSamSA11 (vec3,heading)
	--where
	--name
	group = {}
	group.groupName = "poleGenerator" .. pg.samCounter
	group.units = {
					[1] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["hidden"] = pg.hidden,
						["type"] = "SA-11 Buk SR 9S18M1",
						--["unitId"] = 35,
						["y"] = vec3.z-40,
						["x"] = vec3.x-40,
						--["name"] = "Ground-1-2",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [1]
					[2] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["type"] = "SA-11 Buk CC 9S470M1",
						--["unitId"] = 34,
						["y"] = vec3.z,
						["x"] = vec3.x,
						--["name"] = "Ground-1-1",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [2]
					[2] = 
					{
						["skill"] = "High",
						["coldAtStart"] = false,
						["type"] = "SA-11 Buk LN 9A310M1",
						--["unitId"] = 34,
						["y"] = vec3.z,
						["x"] = vec3.x,
						--["name"] = "Ground-1-1",
						["heading"] = heading+math.pi,
						["playerCanDrive"] = false,
					}, -- end of [2]
				}
	group.hidden = pg.hidden
	group.category = "VEHICLE"
	group.country = 54
	mist.dynAdd(group)
	--heading 
end



function pg.spawnDrone(vec3,planeHeading,playerTarget,missileType)
	-- where is the plane going to be in x seconds
	playerTargetPos = playerTarget:getPosition().p
	futurePlayerTargetPos = playerTargetPos
	playerMotionVec = Object.getVelocity(playerTarget)
	
	--work out what type of SAM we are shooting to work out the delay, missile speed etc
	
	if missileType == 2 then 
		pg.delay = pg.samDB[2].missileDelay
		pg.missileSpeed = pg.samDB[2].missileSpeed
	elseif missileType == 3 then 
		pg.delay = pg.samDB[3].missileDelay
		pg.missileSpeed = pg.samDB[3].missileSpeed
	elseif missileType == 5 then 
		pg.delay = pg.samDB[5].missileDelay
		pg.missileSpeed = pg.samDB[5].missileSpeed
	elseif missileType == 6 then 
		pg.delay = pg.samDB[6].missileDelay
		pg.missileSpeed = pg.samDB[5].missileSpeed
	elseif missileType == 10 then 
		pg.delay = pg.samDB[10].missileDelay
		pg.missileSpeed = pg.samDB[10].missileSpeed
	elseif missileType == 11 then 
		pg.delay = pg.samDB[11].missileDelay
		pg.missileSpeed = pg.samDB[11].missileSpeed
	else --assume SA2
		pg.delay = pg.samDB[2].missileDelay
		pg.missileSpeed = pg.samDB[2].missileSpeed
	end
	
	futurePlayerTargetPos.x = playerTargetPos.x + playerMotionVec.x*pg.delay
	futurePlayerTargetPos.y = playerTargetPos.y + playerMotionVec.y*pg.delay
	futurePlayerTargetPos.z = playerTargetPos.z + playerMotionVec.z*pg.delay
	droneTurnPoint = mist.projectPoint(futurePlayerTargetPos, 10000 ,planeHeading+math.pi)
	--this is where the plane will be when the missile is launched
	
	
	
	--pythago to get hyp
	--x^2 + y^x = hyp^2
	x = mist.utils.get2DDist(futurePlayerTargetPos,vec3)

	y = playerTargetPos.y
		--pg.notify(y,5)
	hyp = math.sqrt(x^2 + y^2)
	roughFlightTime = hyp /pg.missileSpeed-- distance / speed
	
	futurePlayerTargetPos.x = futurePlayerTargetPos.x + playerMotionVec.x*roughFlightTime
	futurePlayerTargetPos.y = futurePlayerTargetPos.y + playerMotionVec.y*roughFlightTime
	futurePlayerTargetPos.z = futurePlayerTargetPos.z + playerMotionVec.z*roughFlightTime
	--this is where the plane will be when the missile arrives at its altitude

	--now we need to work out where the drone is going to go
	vecSub = mist.vec.sub(vec3,futurePlayerTargetPos)
	heading = mist.utils.getDir(vecSub) --heading between picked location and future pos
	extendDistance = x + 10000
	
	alt = (((futurePlayerTargetPos.y) * extendDistance)/x)
	
	droneAtTimePos = mist.projectPoint(vec3, extendDistance ,heading +math.pi)
	
	extendDistance = extendDistance + pg.droneSpeed*roughFlightTime
	droneAtStartPos = mist.projectPoint(vec3, extendDistance ,heading +math.pi)
	--we want to curve the missile in the players direction 
	--planeHeading
	
	pg.makeDrone(droneAtStartPos,heading, droneAtTimePos, futurePlayerTargetPos,alt,droneTurnPoint)
	if missileType == 2 then 
		pg.spawnSamSA2 (vec3,heading)
	elseif missileType == 3 then 
		pg.spawnSamSA3 (vec3,heading)
	elseif missileType == 5 then 
		pg.spawnSamSA5 (vec3,heading)
	elseif missileType == 6 then 
		pg.spawnSamSA6 (vec3,heading)
	elseif missileType == 10 then 
		pg.spawnSamSA10 (vec3,heading)
	else --assume SA2
		pg.spawnSamSA2 (vec3,heading)
	end

	
end

function pg.makeDrone(spawnVec,heading, routeVec, nextRouteVec,alt,droneTurnPoint)
	--this spawns in the drone 
	group = DroneClone
	group.groupName = "TargetDrone" .. pg.samCounter
	group.groupId = nil
	group.units[1].unitId = nil
	group.units[1].unitName = nil
	group.units[1].y = spawnVec.z
	group.units[1].x = spawnVec.x
	group.units[1].heading = heading
	group.units[1].alt = alt
	group.route["points"][2] = group.route["points"][1]
	group.route["points"][3] = group.route["points"][1]
	group.route["points"][1]["y"] = routeVec.z
	group.route["points"][1]["x"] = routeVec.x
	group.route["points"][1]["alt"] = alt
	group.route["points"][2]["y"] = nextRouteVec.z
	group.route["points"][2]["x"] = nextRouteVec.x
	group.route["points"][2]["alt"] = alt
	group.route["points"][3]["y"] = droneTurnPoint.z
	group.route["points"][3]["x"] = droneTurnPoint.x
	group.route["points"][3]["alt"] = alt
	group.countryId = 56
	group.category = 'AIRPLANE'
	mist.dynAdd(group)
end


function pg.attack (vars)
	targetID = vars[1]
	samGroup = vars[2]
	 AttackUnit = { 
	  id = 'AttackUnit', 
	  params = { 
		unitId = targetID,
		attackQtyLimit = true, 
		attackQty = 1, 
	 } 
	}

	local controller = samGroup:getController()
	controller:pushTask(AttackUnit)
end



function pg.radarOff ()
	group = Group.getByName(pg.name)
	local controller = group:getController()
	controller:setOption(9,1)
end

function pg.radarOn ()
		group = Group.getByName(pg.name)
	local controller = group:getController()
	controller:setOption(9,0)
end

 DroneClone= 
	{
		["modulation"] = 0,
		["tasks"] = 
		{
		}, -- end of ["tasks"]
		["task"] = "Reconnaissance",
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
					["speed"] = 82.222222222222,
					["task"] = 
					{
						["id"] = "ComboTask",
						["params"] = 
						{
							["tasks"] = 
							{}, -- end of ["tasks"]
						}, -- end of ["params"]
					}, -- end of ["task"]
					["type"] = "Turning Point",
					["ETA"] = 0,
					["ETA_locked"] = true,
					["y"] = 0,
					["x"] = 0,
					["formation_template"] = "",
					["speed_locked"] = true,
				}, -- end of [1]
				[2] = 
				{
					["alt"] = 2000,
					["action"] = "Turning Point",
					["alt_type"] = "BARO",
					["speed"] = 82.222222222222,
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
					["ETA"] = 157.20107538291,
					["ETA_locked"] = false,
					["y"] = 0,
					["x"] = 0,
					["formation_template"] = "",
					["speed_locked"] = true,
				}, -- end of [2]
			}, -- end of ["points"]
		}, -- end of ["route"]
		--["groupId"] = 1,
		["hidden"] = pg.hidden,
		["units"] = 
		{
			[1] = 
			{
				["alt"] = 2000,
				["alt_type"] = "BARO",
				["livery_id"] = "'camo' scheme",
				["skill"] = "High",
				["speed"] = 82.222222222222,
				["type"] = "MQ-9 Reaper",
				--["unitId"] = 1,
				--["psi"] = -3.129323330636,
				["y"] = 0,
				["x"] = 0,
				["payload"] = 
				{
					["pylons"] = 
					{
					}, -- end of ["pylons"]
					["fuel"] = 1300,
					["flare"] = 0,
					["chaff"] = 0,
					["gun"] = 100,
				}, -- end of ["payload"]
				["heading"] = 0.5,
				["callsign"] = 
				{
					[1] = 1,
					[2] = 1,
					[3] = 1,
					["name"] = "Enfield11",
				}, -- end of ["callsign"]
				["onboard_num"] = "010",
			}, -- end of [1]
		}, -- end of ["units"]
		["y"] = 0,
		["x"] = 0,
		["communication"] = true,
		["start_time"] = 0,
		["frequency"] = 124,
	}


local function protectedCall(...)
  local status, retval = pcall(...)
  if not status then
	
  end
end

function handler:onEvent(event)
	protectedCall(pg.eventHandler, event)
end

function pg.eventHandler (event) 
	if (26 == event.id) then --this is when someone types into a mark
		local vec3 = mist.utils.makeVec3GL(event.pos)
		pg.fakeSam (vec3)
	end
end

function handler:onEvent(event)
	protectedCall(pg.eventHandler, event)
end


do
	longRangeShots = missionCommands.addSubMenu("SAM")
		missionCommands.addCommand ("Generate pole", longRangeShots, pg.fakeSam)
	world.addEventHandler(handler)
end

pg.notify("poleGen.lua",10)


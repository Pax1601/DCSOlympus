shots = {}	--https://www.youtube.com/watch?v=XNtTEibFvlQ mandatory terrible listening 
shots.shooterName = "TestInfantry"
shots.targetName = "TestTarget1"

function shots.notify(message, displayFor)
	 trigger.action.outText(message, displayFor, false)
end



--infantry

function shots.set556 () --red
	roundVelocity = 910
	unitBarrelHeight = 1
	shotsToFire = 5
	shotDelay = 4.5
	shots.notify("5.56 M4 Georgia", 2)
	shots.fire()
end

function shots.set556SAW () --red
	roundVelocity = 915
	unitBarrelHeight = 0.4
	shotsToFire = 5
	shotDelay = 4.5
	shots.notify("5.56 M249 SAW", 2)
	shots.fire()

end

function shots.setAk74() --red
	roundVelocity = 900
	unitBarrelHeight = 0.9
	shotsToFire = 5
	shotDelay = 4.5
	shots.notify("Ak74", 2)
	shots.fire()
end

--technicals

function shots.hmmwv() --red
	roundVelocity = 928
	unitBarrelHeight = 2.6
	shotsToFire = 5
	shotDelay = 2.5
	shots.notify("Humm drumm Vee", 2)
	shots.fire()
	shots.notify(unitBarrelHeight,2)

end

function shots.technicalDHSKA() --green
	roundVelocity = 928
	unitBarrelHeight = 2.2
	shotsToFire = 5
	shotDelay = 2.5
	shots.notify("technicalDHSKA", 2)
	shots.fire()
	shots.notify(unitBarrelHeight,2)

end

function shots.cobra() --green
	roundVelocity = 928
	unitBarrelHeight = 2.85
	shotsToFire = 5
	shotDelay = 2.6
	shots.notify("Cobra", 2)
	shots.fire()
	shots.notify(unitBarrelHeight,2)

end
--IFVs

function shots.setWarrior() --white
	roundVelocity = 1070
	unitBarrelHeight = 2.28
	shotsToFire = 3
	shotDelay = 6.3
	shots.fire()
end

function shots.setBMP2() --red
	roundVelocity = 970
	unitBarrelHeight = 1.95
	shotsToFire = 3
	shotDelay = 6
	shots.fire()
end

--Tanks

function shots.m1a1() --red
	roundVelocity = 928
	unitBarrelHeight = 2.15
	shotsToFire = 5
	shotDelay = 3
	shots.notify("Abrams 50 cal", 2)
	shots.fire()
	shots.notify(unitBarrelHeight,2)

end

function shots.t55() --red and green 
	roundVelocity = 928
	unitBarrelHeight = 1.75
	shotsToFire = 5
	shotDelay = 2.6
	shots.notify("T-72B", 2)
	shots.fire()
	shots.notify(unitBarrelHeight,2)
end

---aaaaaaaaaaaaaaaa

function shots.ZSU57() --red
	roundVelocity = 1070
	shotsToFire = 2
	shotDelay = 10.5
	shots.notify("ZSU57", 2)
	unitMaxRange = 6000
	shots.fireAAA()
end

function shots.ZSU23() --red
	roundVelocity = 1050
	shotsToFire = 2
	shotDelay = 12
	shots.notify("ZSU23", 2)
	unitMaxRange = 2000
	shots.fireAAA()
end

function shots.vulcan() --red
	roundVelocity = 1030
	shotsToFire = 5
	shotDelay = 5
	shots.notify("Vulcan M163", 2)
	unitMaxRange = 1500
	shots.fireAAA()
end

function shots.flak18() --red and green 
	roundVelocity = 870
	shotsToFire = 1
	shotDelay = 10.5
	shots.notify("Flak 18", 2)
	unitMaxRange = 4000
	shots.fireAAA()
end




-- This one is really obvious, however I set towards the end of this file the "parameters" of the shots. 
function shots.fire()
	unit = Unit.getByName(shots.shooterName)	
	target = Unit.getByName(shots.targetName)
	local targetMotionVec = Object.getVelocity(target) --if you don't want to do this i.e. shoot a point send a nil or a vec3 of 0's
	--local targetMotionVec = nil
	local targetPos = target:getPosition().p
	shots.calculateAngle(roundVelocity, unit, targetPos, unitBarrelHeight, shotsToFire,shotDelay, targetMotionVec)
end

--main bit that does the maths for simulating a "roughly level" fire fight, not to be used when aiming AAA at aircraft
function shots.calculateAngle(v, unit, targetPos, unitBarrelHeight, shotsToFire,shotDelay, targetMotionVector)
	--v muzzle velocity
	--unit is unit object you want shooting
	--targetPos is a position on the ground, doesn't have to be a targets actual location 
	--unitBarrelHeigh is the height the gun is at when it fires
	--shotsToFire is how many rounds to shoot, 5 is a nice number except for large calibre slow guns
	--shotDelay how long it on average takes to aim from scratch at something and shoot, mostly used in aiming lead
	--targetMotionVector a vec3 of the targets motion if nil just shoots at a spot
	
	g = 9.81	-- gravity, change if on the moon veltro you comment reading prick

	local unitPos = unit:getPosition().p	
	local x = mist.utils.get2DDist(unitPos,targetPos) -- horizontal range
	local x3d = mist.utils.get3DDist(unitPos,targetPos) -- slant range
	
	y = targetPos.y - unitPos.y   
	y = y - unitBarrelHeight

	--works out some stuff for trig later, like x,y and hypoteneueussueee

	if targetMotionVector == nil then
		--no moving? nothing to ammend
	else	--work out where target will be when the bullet arrives
		shotDelay = shotDelay + x3d/v --time taken to aim and time for bullet to fly to spot
		newPosition = mist.utils.tableShow(targetMotionVector)
		targetPos.x = targetPos.x + targetMotionVector.x*shotDelay
		targetPos.y = targetPos.y + targetMotionVector.y*shotDelay
		targetPos.z = targetPos.z + targetMotionVector.z*shotDelay
	end

	x = x - 10 --we actually are aiming 10m in front always so need to remove this
	
    local inner = v^4 - g * (g * x^2 + 2 * y * v^2)	-- this is the inner bit of the quadratic equation for ease of code
	
    if inner < 0 then
        -- No solution exists for these parameters, too far away do nothing we can't hit it, saves us crashing if sqrt of negative
    else 
        local angle2 = math.atan((v^2 - math.sqrt(inner)) / (g * x)) -- do the whole quadratic equation
		-- we didn't need to do the +- sqrt b^2..... bits as we care about the flat path not the one shot miles up falling down

		local aimUp = 10 * math.tan(angle2)*math.cos(angle2)	-- we have to tell dcs to "aim up" at a point 10m ahead of it, this is distance * tan(angle) , so where the fuck has the cos come from? That is because aim correction for shooting up and down is basically modfied by cos(angle) so lazy correction and dcs can't shoot vertically up 
		local xPosDifference = (targetPos.x - unitPos.x)
		local zPosDifference = (targetPos.z - unitPos.z)
		local hyp = math.sqrt((xPosDifference*xPosDifference) + (zPosDifference*zPosDifference))
		xPosDifference = (xPosDifference /hyp) * 10
		zPosDifference = (zPosDifference / hyp) * 10
		
		unitPos.x = unitPos.x + xPosDifference
		unitPos.z = unitPos.z + zPosDifference
		
		--that was all basic trig maths
		
		local controller = unit:getController()
		FireAtPoint = { 
					  id = 'FireAtPoint', 
					  params = { 
						point = {x = unitPos.x, y = unitPos.z},
						radius = 0.0001, 
						expendQty = shotsToFire,
						expendQtyEnabled = true, 
						altitude = unitPos.y+unitBarrelHeight +aimUp, --this is a realtive to sea level shot, so we can shoot down
						alt_type = 0, --0 = sea level, 1 = ground level 
					  }
					 } 
		controller:pushTask(FireAtPoint)	--FIREEEEEE
	end
end


function shots.fireAAA()
	unit = Unit.getByName(shots.shooterName)	
	target = Unit.getByName(shots.targetName)
	targetMotionVec = Object.getVelocity(target) --if you don't want to do this i.e. shoot a point send a nil or a vec3 of 0's
	--local targetMotionVec = nil
	targetPos = target:getPosition().p
	shots.aaa(roundVelocity, unit, unitMaxRange, targetPos, shotsToFire,shotDelay, targetMotionVec)
end

--aaa fires almost straight up, no line of sight fakery needed or working out lobbing bullets onto random points 
--if in range just needs to be told to shoot where the target will be in a few seconds
--if out of range, we just need to extrapolate back and fire inside max range and randomise the up and down, then let it miss 

function shots.aaa(v, unit, unitMaxRange, targetPos, shotsToFire,shotDelay, targetMotionVector)
	local unitPos = unit:getPosition().p	
	local x = mist.utils.get2DDist(unitPos,targetPos) -- horizontal range
	local x3d = mist.utils.get3DDist(unitPos,targetPos) -- slant range
	
	if x3d > unitMaxRange then 
		if targetMotionVector == nil then
			--no moving? nothing to ammend
		else	--work out where target will be when the bullet arrives
			shotDelay = shotDelay + x3d/(v/2) --time taken to aim and time for bullet to fly to spot long range roughly 50% slowdown
			newPosition = mist.utils.tableShow(targetMotionVector)
			targetPos.x = targetPos.x + targetMotionVector.x*shotDelay
			targetPos.y = targetPos.y + targetMotionVector.y*shotDelay
			targetPos.z = targetPos.z + targetMotionVector.z*shotDelay
		end
		
		difference = mist.vec.sub(targetPos,unitPos)
		unitVec = mist.vec.getUnitVec(difference)
		extendPath = mist.vec.scalar_mult(unitVec ,unitMaxRange)
		targetPos = mist.vec.add(extendPath,unitPos)

			
			local controller = unit:getController()
			FireAtPoint = { 
						  id = 'FireAtPoint', 
						  params = { 
							point = {x = targetPos.x, y = targetPos.z},
							radius = 0.0001, 
							expendQty = shotsToFire,
							expendQtyEnabled = true, 
							altitude = targetPos.y+math.random(1,500), --this is a realtive to sea level shot, so we can shoot down
							alt_type = 0, --0 = sea level, 1 = ground level 
						  }
						 } 
			controller:pushTask(FireAtPoint)	--FIREEEEEE
	else
		if targetMotionVector == nil then
			--no moving? nothing to ammend
		else	--work out where target will be when the bullet arrives
			shotDelay = shotDelay + x3d/v --time taken to aim and time for bullet to fly to spot
			newPosition = mist.utils.tableShow(targetMotionVector)
			targetPos.x = targetPos.x + targetMotionVector.x*shotDelay
			targetPos.y = targetPos.y + targetMotionVector.y*shotDelay
			targetPos.z = targetPos.z + targetMotionVector.z*shotDelay
		end
			
			local controller = unit:getController()
			FireAtPoint = { 
						  id = 'FireAtPoint', 
						  params = { 
							point = {x = targetPos.x, y = targetPos.z},
							radius = 0.0001, 
							expendQty = shotsToFire,
							expendQtyEnabled = true, 
							altitude = targetPos.y, --this is a realtive to sea level shot, so we can shoot down
							alt_type = 0, --0 = sea level, 1 = ground level 
						  }
						 } 
			controller:pushTask(FireAtPoint)	--FIREEEEEE
	end
end


do	
	longRangeShots = missionCommands.addSubMenu("Firefight")
		missionCommands.addCommand ("Fire", longRangeShots, shots.vulcan)

end

shots.notify("raisedShots.lua ran", 2)
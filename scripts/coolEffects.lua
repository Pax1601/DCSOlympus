effects = {}	
effects.shooterName = "TestInfantry"
effects.napalmCounter = 1

effects.fireCounter = 1

function effects.notify(message, displayFor)
	 trigger.action.outText(message, displayFor, false)
end

--------------------------------------------
--------------------------------------------
--------------------------------------------
----NAPALM


function effects.napalmSingle ()
	unit = Unit.getByName(effects.shooterName)
	local unitPos = unit:getPosition().p	
	vec3 = mist.utils.makeVec3GL(unitPos)
	effects.spawnNapalm (vec3)
end


function effects.spawnNapalm (vec3)
	
	napeName = "napalmStrike" .. effects.napalmCounter
	effects.napalmCounter = effects.napalmCounter + 1
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
	timer.scheduleFunction(effects.explode,vec3, timer.getTime() + 0.1)
	timer.scheduleFunction(effects.napalam_death,napeName, timer.getTime() + 0.12)
end

function effects.explode(vec3)
	trigger.action.explosion(vec3, 10)
end

function effects.napalam_death(staticName) --yes i know bad pun, removes the fuel tank after a set time
	StaticObject.getByName(staticName):destroy()
end

--------------------------------------------
--------------------------------------------
--------------------------------------------
----Basic smoke or fire that despawns
function effects.smokeFire ()
	unit = Unit.getByName(effects.shooterName)
	local unitPos = unit:getPosition().p	
	vec3 = mist.utils.makeVec3GL(unitPos)
	effects.createFire (vec3, 2) 	
		-- 1 = small smoke and fire
		-- 2 = medium smoke and fire
		-- 3 = large smoke and fire
		-- 4 = huge smoke and fire
		-- 5 = small smoke
		-- 6 = medium smoke 
		-- 7 = large smoke
		-- 8 = huge smoke 
end

function effects.createFire (vec3, size)
	smokeName = "smokeName" .. effects.fireCounter
	effects.fireCounter = effects.fireCounter + 1
	trigger.action.effectSmokeBig(vec3 , size , 1, smokeName)
	trigger.action.explosion(vec3, 1) -- looks wierd to spawn in on flat land without this
	timer.scheduleFunction(effects.removeFire,smokeName, timer.getTime() + 20) --you could set a timer, or if selected give option to despawn later
end

function effects.removeFire (smokeName)
	trigger.action.effectSmokeStop(smokeName)
end

--------------------------------------------
--------------------------------------------
--------------------------------------------
----White phosporus secondaries extra effect, like round cooking off
--if you up the number going pop to somewhere in the 200-400 region with a white phosporus impact it would look mental cool
function effects.secondaries ()
	unit = Unit.getByName(effects.shooterName)
	local unitPos = unit:getPosition().p	
	vec3 = mist.utils.makeVec3GL(unitPos)
	--trigger.action.smoke(vec3 , 2 )
	for i =	1,math.random(3,10) do 
		angle = mist.utils.toRadian((math.random(1,360)))
		local randVec = mist.utils.makeVec3GL((mist.getRandPointInCircle(vec3 ,5 , 1 ,0 ,360)))
		trigger.action.signalFlare(randVec , 2 , angle )
	end

end

--------------------------------------------
--------------------------------------------
--------------------------------------------
----Depth Charges
-- these also make, on land, good dust clouds for a bomb hit in a sandy area?
--				local surface = land.getSurfaceType(mist.utils.makeVec2(unitPos)) -- optional check for water, value 3 or 2

function effects.depthCharge ()
				local unit = Unit.getByName(effects.shooterName)
				local unitPos = unit:getPosition().p	

				vec3 = mist.utils.makeVec3GL(unitPos)
				vec3.y = vec3.y - 1000
				bang = vec3	
				distance = 20
				explosionSize = 2
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				trigger.action.explosion(vec3,explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				trigger.action.explosion(vec3,explosionSize)
							bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				bang = mist.getRandPointInCircle(vec3 , distance ,1,359,0)
				trigger.action.explosion(mist.utils.makeVec3GL(bang),explosionSize)
				timer.scheduleFunction(effects.depthChargeMain,vec3, timer.getTime() + 5)
end



function effects.depthChargeMain (vec3)
	explosionSize = 250
	trigger.action.explosion(vec3,explosionSize)
	trigger.action.explosion(vec3,explosionSize)
	vec3.x = vec3.x 
	trigger.action.explosion(vec3,explosionSize)
	vec3.x = vec3.x - 10
	trigger.action.explosion(vec3,explosionSize)
	vec3.z = vec3.z 
	trigger.action.explosion(vec3,explosionSize)
	vec3.z = vec3.z - 10
end

--------------------------------------------
--------------------------------------------
--------------------------------------------
----Normal small explosion

function effects.normalSmallExplosion (vec3)
	unit = Unit.getByName(effects.shooterName)
	local unitPos = unit:getPosition().p	
	vec3 = mist.utils.makeVec3GL(unitPos)
	trigger.action.explosion(vec3,10)
end



do	
	longRangeShots = missionCommands.addSubMenu("Effects")
		missionCommands.addCommand ("Napalm", longRangeShots, effects.napalmSingle)
		missionCommands.addCommand ("Fire or smoke", longRangeShots, effects.smokeFire)
		missionCommands.addCommand ("Secondary explosions", longRangeShots, effects.secondaries)
		missionCommands.addCommand ("Depth Charge", longRangeShots, effects.depthCharge)
		missionCommands.addCommand ("A regular explosion", longRangeShots, effects.normalSmallExplosion)
end

effects.notify("effects.lua ran", 2)
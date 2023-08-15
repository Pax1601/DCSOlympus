--Spawn a SAM integrated with IADS
--Spawn a normal SAM
--SAM bubble shields

forceBub = {}
forceBub.handler = {}
forceBub.missileList = {}
forceBub.missilesActive = 0
forceBub.shieldOn = false

function forceBub.notify(message, displayFor)
	 trigger.action.outText(message, displayFor, true)
end

function forceBub.setShield()
		forceBub.notify("Shield on", 2)
end

function forceBub.stopShield()
		forceBub.shieldOn = false 
end



local function protectedCall(...)
  local status, retval = pcall(...)
  if not status then
	--rf.notify("Caught error " .. retval,2)
  end
end

function forceBub.handler:onEvent(event)
	protectedCall(forceBub.eventHandler, event)
end

function forceBub.checkMissiles ()
	local currentTime = timer.getTime()
	if forceBub.missilesActive > 0 then 
		for index, data in pairs(forceBub.missileList) do 
			output = mist.utils.tableShow(forceBub.missileList[index])
			if forceBub.missileList[index].exists == true then
				if Object.isExist(forceBub.missileList[index].weapon) == true then					
					forceBub.missileList[index].pos = forceBub.missileList[index].weapon:getPosition()
					
					
					local missilePosition = forceBub.missileList[index].pos.p
					
					unit = Unit.getByName("Test")
					local unitPosition = unit:getPosition().p
					
					local distance = mist.utils.get3DDist(unitPosition , missilePosition )
					forceBub.notify(distance,1)
					
					if forceBub.shieldOn == true and distance < 100 then --this distance is the sweet spot any less and you probably take damage and die, less than 75 death
					
						trigger.action.explosion(missilePosition , 1) --just blows up the missile
					
					end
				
					
				else 						
					forceBub.missileList[index] = nil 
					forceBub.missilesActive = forceBub.missilesActive - 1
				end
			else
			end

		end
	end
	timer.scheduleFunction(forceBub.checkMisProtectCall,{},currentTime + 0.01)
end



function forceBub.eventHandler (event)
	--forceBub.notify(mist.utils.tableShow(event),10)
	if (event.id == 1) then	
		--check if weapon is a missile 
		--rf.notify("Missile fired id " .. event.weapon.id_ ,2)
		forceBub.notify(mist.utils.tableShow(Weapon.getDesc(event.weapon)),10)
		if Weapon.getDesc(event.weapon).missileCategory == 2 then
			local newMis = {}
			newMis.id = event.weapon.id_
			newMis.pos = event.weapon:getPosition()
			newMis.weapon = event.weapon
			newMis.exists = Object.isExist(newMis.weapon)
			forceBub.missileList[event.weapon.id_] = newMis
			forceBub.missilesActive = forceBub.missilesActive + 1 
		end
	end	
end

function forceBub.checkMisProtectCall()
	protectedCall(forceBub.checkMissiles,{})
end

function forceBub.setShield()
	forceBub.shieldOn = true 
end

do	
	forceField = missionCommands.addSubMenu("Force Field")
		missionCommands.addCommand ("Forcefield on", forceField, forceBub.setShield)
		missionCommands.addCommand ("Stop Field", forceField, forceBub.stopShield)
end

do
		world.addEventHandler(forceBub.handler)
end

protectedCall(forceBub.checkMissiles,{})
forceBub.notify("forceBubble.lua loaded", 2)
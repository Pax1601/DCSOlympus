lddl = {}
lddl.refreshRate = 1




function lddl.pointer ()
	origin = Unit.getByName("Laser")
	originPos = origin:getPosition().p
	targetPos = Unit.getByName("LaserTGT"):getPosition().p
	laser = Spot.createInfraRed(origin , originPos, targetPos)
	timer.scheduleFunction(lddl.removePointer,laser, timer.getTime() + lddl.refreshRate)
	
end

function lddl.removePointer(laser)
	Spot.destroy(laser)
	timer.scheduleFunction(lddl.pointer,{}, timer.getTime() + lddl.refreshRate)
end

lddl.pointer ()
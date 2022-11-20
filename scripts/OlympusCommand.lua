dofile("C:\\Users\\dpass\\Documents\\Olympus\\scripts\\mist_4_4_90.lua")

Olympus = {}

function  Olympus.notify(message, displayFor)
    trigger.action.outText(message, displayFor)
end

function Olympus.move(name, lat, lng, v)
    Olympus.notify("Olympus.move " .. name .. " (" .. lat .. ", " .. lng ..")", 10)
    local unit = Unit.getByName(name)
	if unit ~= nil then
        local unitDestination = mist.utils.makeVec2(coord.LLtoLO(lat, lng, 0))
		vars = 
			 {
			 	group = unit:getGroup(), 
			 	point = mist.utils.makeVec3(unitDestination),
				form = "Off Road",
				heading = 0,
			 	speed = v,
				disableRoads = true
			 }
		mist.groupToRandomPoint(vars)
		Olympus.notify("Olympus.move executed succesfully", 10)
	else
        Olympus.notify("Error in Olympus.move " .. name, 10)
	end
end  

Olympus.notify("OlympusCommand script loaded correctly", 10)
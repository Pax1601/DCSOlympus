function disableAutoCapture(airbaseName)
    trigger.action.outText("Olympus.disableAutoCapture " .. airbaseName, 2)
    local airbase = Airbase.getByName(airbaseName)
    if airbase then
        airbase:autoCapture(false)
        trigger.action.outText("Olympus.disableAutoCapture " .. airbaseName .. " completed successfully", 2)
    else
        trigger.action.outText("Olympus.disableAutoCapture failed", 2)
    end
end

function setAirbaseCoalition(airbaseName, coalitionColor)
    trigger.action.outText("Olympus.setAirbaseCoalition trying to set " .. airbaseName .. " to " .. coalitionColor, 2)
    local airbase = Airbase.getByName(airbaseName)
    if airbase then
        disableAutoCapture(airbaseName)
        airbase:setCoalition(coalition.side[coalitionColor])
        trigger.action.outText("Olympus.setAirbaseCoalition " .. airbaseName .. " set to " .. coalitionColor .. " completed successfully", 5)
    else
        trigger.action.outText("Olympus.setAirbaseCoalition Airbase not found: " .. airbaseName, 5)
    end
end

setAirbaseCoalition("Khasab", "RED")
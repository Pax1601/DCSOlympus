-- Read the configuration file
for baseName, values in pairs(olyLink.bases) do
    -- TODO format frequency
    Olympus.notify(baseName .. " base logistics listening on frequency " .. values["frequency"], 10)
end

-- Force the initial data
olyLink.setInitialData()

olyLink.initialized = true

-- Schedule the periodic function
timer.scheduleFunction(olyLink.periodicFunction, {}, timer.getTime() + 1)

Olympus.notify("LuaLink lua file executed correctly", 10)
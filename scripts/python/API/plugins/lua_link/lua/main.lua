-- Read the configuration file
for baseName, values in pairs(olyLink.bases) do
    -- TODO format frequency
    Olympus.notify(baseName .. " base logistics listening on frequency " .. values["frequency"], 10)
end

-- Force the initial data
olyLink.setInitialData()

-- Schedule the periodic function
timer.scheduleFunction(olyLink.periodicFunction, {}, timer.getTime() + 1)

-- Test function, after 30 seconds spawn a fuel barrel in the fuel pickup zone for the Orote base, to test that the zones are being read correctly from the config file and that the spawn function works correctly. This will be removed later.
timer.scheduleFunction(olyLink.spawnFuelBarrel, "Orote", timer.getTime() + 30)

Olympus.notify("LuaLink lua file executed correctly", 10)
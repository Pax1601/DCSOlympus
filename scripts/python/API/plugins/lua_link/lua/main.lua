-- Read the configuration file
for baseName, values in pairs(olyLink.bases) do
    trigger.action.outText(baseName .. " base logistics listening on frequency " .. values["frequency"], 10)
end

trigger.action.outText("LuaLink lua file executed correctly", 10)
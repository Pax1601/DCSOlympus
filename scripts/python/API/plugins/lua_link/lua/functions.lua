-- Enforce the initial value of weapons and fuel to 0 in the controlled bases
function olyLink.setInitialData()
    local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
    for i = 1, #friendlyAirbases do
        if olyLink.contains(olyLink.getBaseNames(), friendlyAirbases[i]:getName()) then
            local baseName = friendlyAirbases[i]:getName()
            local warehouse = friendlyAirbases[i]:getWarehouse()
            local inventory = warehouse:getInventory()

            -- Initialize all weapons to the value according to the config file, or 0 if it is not set
            for k, v in pairs(inventory["weapon"]) do
                if olyLink.contains(olyLink.weaponList, k) or olyLink.contains(olyLink.gunsList, k) or olyLink.contains(olyLink.ammoList, k) or olyLink.contains(olyLink.machineGunList, k) then
                    if olyLink.bases[baseName].weapons[k] == nil then
                        olyLink.bases[baseName].weapons[k] = 0
                        warehouse:setItem(k, 0)
                    else 
                        warehouse:setItem(k, olyLink.bases[baseName].weapons[k])
                    end
                else
                    warehouse:setItem(k, 0)
                end
            end

            -- Initialize the fuel to the value according to the config file, or 0 if it is not set
            warehouse:setLiquidAmount(0, olyLink.bases[baseName].fuel or 0)
        end
    end
end

-- Spawn fuel barrels at a given base
function olyLink.spawnFuelBarrel(baseName)
    Olympus.notify("Spawning fuel barrel at " .. baseName .. " base", 10)

    -- Check tat the base is in the config file
    if not olyLink.contains(olyLink.getBaseNames(), baseName) then
        Olympus.notify("Base " .. baseName .. " not found in config file, cannot spawn fuel barrel", 10)
        return
    end

    -- Read from the config the trigger zone name for the fuel pickup for this base, and spawn a fuel barrel there
    local fuelZoneName = olyLink.bases[baseName].fuelZoneName
    local fuelZone = trigger.misc.getZone(fuelZoneName)
    if fuelZone == nil then
        Olympus.notify("Fuel zone " .. fuelZoneName .. " not found for base " .. baseName .. ", cannot spawn fuel barrel", 10)
        return
    end
    local spawnLocation = fuelZone.point

    local countryId = Olympus.getCountryIDByCoalition("blue")
    Olympus.spawnStatic({
        countryId = countryId,
		heading = 0,
		type = "barrels_cargo",
		shapeName = "barrels_cargo",
		x = spawnLocation.x,
		y = spawnLocation.z,
		z = spawnLocation.y,
		name = "Olympus-" .. Olympus.staticsCounter .. "-Static-barrels_cargo",
		mass = 1000,
		canCargo = true,
		dead = false
    })
end

-- Read the current weapons and fuel levels and update the olyLink.bases table with this data, 
-- then save it in the Olympus mission table to be read back in the plugin.
function olyLink.readCurrentData()
    local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
    for i = 1, #friendlyAirbases do
        if olyLink.contains(olyLink.getBaseNames(), friendlyAirbases[i]:getName()) then
            local baseName = friendlyAirbases[i]:getName()
            local warehouse = friendlyAirbases[i]:getWarehouse()
            local inventory = warehouse:getInventory()

            -- Update the weapons data
            for k, v in pairs(inventory["weapon"]) do
                if olyLink.contains(olyLink.weaponList, k) or olyLink.contains(olyLink.gunsList, k) or olyLink.contains(olyLink.ammoList, k) or olyLink.contains(olyLink.machineGunList, k) then
                    olyLink.bases[baseName].weapons[k] = v
                end
            end

            -- Update the fuel data
            olyLink.bases[baseName].fuel = warehouse:getLiquidAmount(0)
        end
    end

    -- Save this data in the Olympus mission table to read it back in the API
    Olympus.missionData["luaLink"] = olyLink.bases
end

-- Run all the periodic functions. This approach allows to avoid problems when reloading the plugin, 
-- when some functions might be nil because they are being reloaded, so we can check if they are nil.
function olyLink.periodicFunction()
    if olyLink.readCurrentData ~= nil then
        olyLink.readCurrentData()
    end
    
    return timer.getTime() + 1
end
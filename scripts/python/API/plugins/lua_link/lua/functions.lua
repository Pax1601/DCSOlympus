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
    local lat, lng, alt = coord.LOtoLL(spawnLocation)

    local countryId = Olympus.getCountryIDByCoalition("blue")
    Olympus.spawnStaticObject({
        countryId = countryId,
		heading = 0,
		type = "barrels_cargo",
		shapeName = "barrels_cargo",
		lat = lat,
        lng = lng,
		name = "Fuel-" .. Olympus.staticsCounter .. "-" .. baseName,
		mass = 1000,
		canCargo = true,
		dead = false
    })
end

-- Read the current weapons and fuel levels and update the olyLink.bases table with this data, 
-- then save it in the Olympus mission table to be read back in the plugin.
function olyLink.readCurrentWarehouseData()
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

-- Check all bases dropoff zones. If a static of the correct type is inside, increase the related base's fuel or weapons and destroy the static.
function olyLink.checkIfSuppliesDelivered(baseName)
    local dropoffZoneName = olyLink.bases[baseName].dropoffZoneName
    local dropoffZone = trigger.misc.getZone(dropoffZoneName)
    if dropoffZone == nil then
        Olympus.notify("Dropoff zone " .. dropoffZoneName .. " not found for base " .. baseName .. ", cannot check for supplies delivery", 10)
        return
    end

    local volume = {
        id = world.VolumeType.SPHERE,
        params = {
            point = dropoffZone.point,
            radius = dropoffZone.radius
        }
    }
    local hasCargo = false
    local objectInformation = nil
    local objectName = nil
    local objectWeight = nil
    local cargoType = nil
    local function checkCargo(obj)
        if obj and obj:isExist() and obj:getCategory() == Object.Category.CARGO then
            hasCargo = true
            objectInformation = obj:getDesc()
            objectName = obj:getName()
            objectWeight = obj:getCargoWeight()
            cargoType = obj:getDesc().typeName            
            return true
        end
        return false
    end

    world.searchObjects(Object.Category.CARGO, volume, checkCargo)
    if not hasCargo then
        return
    end

    if objectInformation == nil or objectName == nil or cargoType == nil then
        Olympus.notify("Could not get information about the object in the dropoff zone " .. dropoffZoneName .. " for base " .. baseName .. ", cannot check for supplies delivery", 10)
        return
    end

    local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
    local warehouse = nil
    local inventory = nil

    for i = 1, #friendlyAirbases do
        if friendlyAirbases[i]:getName() == baseName then
            warehouse = friendlyAirbases[i]:getWarehouse()
            inventory = warehouse:getInventory()
        end
    end

    if warehouse == nil or inventory == nil then
        Olympus.notify("Warehouse or inventory not found for base " .. baseName .. ", cannot check for supplies delivery", 10)
        return
    end

    if hasCargo then
        if cargoType == "ammo_cargo" and string.match(objectName, "^RocketHE.+") then
            rocketValue = 0
            for k,v in pairs(inventory["weapon"]) do
                if k == "weapons.nurs.HYDRA_70_M151" then -- HE
                    rocketValue = rocketValue + v
                end
            end 
            warehouse:setItem("weapons.nurs.HYDRA_70_M151", rocketValue + 19*2)
            Olympus.notify("Delivered 19 rockets to " .. baseName .. " base!", 10)
        elseif cargoType == "ammo_cargo" and string.match(objectName, "^RocketOther.+") then
            rocketValueIllum = 0
            rocketValueSmoke = 0
            for k,v in pairs(inventory["weapon"]) do
                if k == "weapons.nurs.HYDRA_70_M156" then -- Smoke
                    rocketValueSmoke = rocketValueSmoke + v
                elseif k == "weapons.nurs.HYDRA_70_M257" then -- Illum
                    rocketValueIllum = rocketValueIllum + v
                end
            end
            warehouse:setItem("weapons.nurs.HYDRA_70_M156", rocketValueSmoke + 7)
            warehouse:setItem("weapons.nurs.HYDRA_70_M257", rocketValueIllum + 7)
            Olympus.notify("Delivered 7 smoke and 7 illum rockets to " .. baseName .. " base!", 10)
        elseif cargoType == "ammo_cargo" and string.match(objectName, "^AmmoGuns.+") then
            gun1 = 0
            gun2 = 0
            gunMiniL = 0
            gunMiniR = 0
            for k,v in pairs(inventory["weapon"]) do
                if k == "weapons.containers.M60_SIDE_L" then
                    gun1 = gun1 + v
                elseif k == "weapons.containers.M60_SIDE_R" then
                    gun2 = gun2 + v
                elseif k == "weapons.containers.M134_L" then   
                    gunMiniL = gunMiniL + v
                elseif k ==  "weapons.containers.M134_R" then
                    gunMiniR = gunMiniR + v
                end
            end
            warehouse:setItem("weapons.containers.M60_SIDE_L", gun1 + 1)
            warehouse:setItem("weapons.containers.M60_SIDE_R", gun2 + 1)
            warehouse:setItem("weapons.containers.M134_L", gunMiniL + 1)
            warehouse:setItem("weapons.containers.M134_R", gunMiniR + 1)
            Olympus.notify("Delivered 1 gun container to " .. baseName .. " base!", 10)
        elseif cargoType == "barrels_cargo" and string.match(objectName, "^Fuel.+") then
            warehouse:setLiquidAmount(0, warehouse:getLiquidAmount(0) + objectWeight)
            Olympus.notify("Delivered " .. objectWeight .. " liters of fuel to " .. baseName .. " base!", 10)
        elseif cargoType == "uh1h_cargo" and string.match(objectName, "^Supplies.+") then
            olyLink.bases[baseName].supplies = olyLink.bases[baseName].supplies + 1000
            Olympus.notify("Delivered 1000 supplies to " .. baseName .. " base!", 10)
        elseif cargoType == "uh1h_cargo" and string.match(objectName, "^Shells.+") then
            olyLink.bases[baseName].shells = olyLink.bases[baseName].shells + 1000
            Olympus.notify("Delivered 1000 shells to " .. baseName .. " base!", 10)
        end
    end
end

function olyLink.removeStaticsFromDropoffZone(baseName)
    local dropoffZoneName = olyLink.bases[baseName].dropoffZoneName
    local dropoffZone = trigger.misc.getZone(dropoffZoneName)
    if not dropoffZone then
        return
    end

    local volume = {
        id = world.VolumeType.SPHERE,
        params = {
            point = dropoffZone.point,
            radius = dropoffZone.radius
        }
    }

    local removedCount = 0
    local function tryRemove(obj)
        if obj and obj:isExist() then
                obj:destroy()
        end
        return true
    end

    world.searchObjects(Object.Category.CARGO, volume, tryRemove)
    if Object.Category.CARGO then
        world.searchObjects(Object.Category.CARGO, volume, tryRemove)
    end
end

-- Run all the periodic functions. This approach allows to avoid problems when reloading the plugin, 
-- when some functions might be nil because they are being reloaded, so we can check if they are nil.
function olyLink.periodicFunction()
    if olyLink.readCurrentWarehouseData ~= nil then
        olyLink.readCurrentWarehouseData()
    end

    if olyLink.checkIfSuppliesDelivered ~= nil and olyLink.removeStaticsFromDropoffZone ~= nil then
        for i, baseName in ipairs(olyLink.getBaseNames()) do
            olyLink.checkIfSuppliesDelivered(baseName)
            olyLink.removeStaticsFromDropoffZone(baseName)
        end
    end
    
    return timer.getTime() + 1
end
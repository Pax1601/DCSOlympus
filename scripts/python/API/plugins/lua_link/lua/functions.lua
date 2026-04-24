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

            -- Initialize the detected dropoffs to 0
            olyLink.bases[baseName].detectedDropoffs = 0
        end
    end
end

-- Spawn fuel barrels at a given base
function olyLink.spawnFuelBarrel(baseName)
    Olympus.debug("Spawning fuel barrel at " .. baseName .. " base", 10)

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

    -- Clear the zone
    olyLink.clearZone(fuelZoneName)

    local function spawnFuelBarrelNow()
        -- Spawn the barrel
        local spawnLocation = fuelZone.point
        local lat, lng, alt = coord.LOtoLL(spawnLocation)

        Olympus.spawnStaticObject({
            coalition = "blue",
            heading = 0,
            type = "barrels_cargo",
            shapeName = "barrels_cargo",
            lat = lat,
            lng = lng,
            name = "Fuel-" .. Olympus.staticsCounter .. "-" .. baseName,
            mass = 1000,
            canCargo = true,
            dead = false,
            linkOffset = true
        })
    end
    timer.scheduleFunction(spawnFuelBarrelNow, {}, timer.getTime() + 1) -- add a delay
end

-- Spawn supply crates at a given base
function olyLink.spawnSupplyCrate(baseName)
    Olympus.debug("Spawning supply crate at " .. baseName .. " base", 10)

    -- Check tat the base is in the config file
    if not olyLink.contains(olyLink.getBaseNames(), baseName) then
        Olympus.notify("Base " .. baseName .. " not found in config file, cannot spawn supply crate", 10)
        return
    end

    -- Read from the config the trigger zone name for the supplies pickup for this base, and spawn a supply crate there
    local suppliesZoneName = olyLink.bases[baseName].suppliesZoneName
    local suppliesZone = trigger.misc.getZone(suppliesZoneName)
    if suppliesZone == nil then
        Olympus.notify("Supplies zone " .. suppliesZoneName .. " not found for base " .. baseName .. ", cannot spawn supply crate", 10)
        return
    end

    -- Clear the zone
    olyLink.clearZone(suppliesZoneName)

    -- Spawn the crate
    local spawnLocation = suppliesZone.point
    local lat, lng, alt = coord.LOtoLL(spawnLocation)

    local function spawnSupplyCrateNow()
        Olympus.spawnStaticObject({
            coalition = "blue",
            heading = 0,
            type = "uh1h_cargo",
            shapeName = "uh1h_cargo",
            lat = lat,
            lng = lng,
            name = "Supplies-" .. Olympus.staticsCounter .. "-" .. baseName,
            mass = 1000,
            canCargo = true,
            dead = false,
            linkOffset = true
        })
    end
    timer.scheduleFunction(spawnSupplyCrateNow, {}, timer.getTime() + 1) -- add a delay
end

-- Spawn shell crates at a given base
function olyLink.spawnShellCrate(baseName)
    Olympus.debug("Spawning shell crate at " .. baseName .. " base", 10)

    -- Check tat the base is in the config file
    if not olyLink.contains(olyLink.getBaseNames(), baseName) then
        Olympus.notify("Base " .. baseName .. " not found in config file, cannot spawn shell crate", 10)
        return
    end

    -- Read from the config the trigger zone name for the shells pickup for this base, and spawn a shell crate there
    local shellsZoneName = olyLink.bases[baseName].ammoZoneName
    local shellsZone = trigger.misc.getZone(shellsZoneName)
    if shellsZone == nil then
        Olympus.notify("Shells zone " .. shellsZoneName .. " not found for base " .. baseName .. ", cannot spawn shell crate", 10)
        return
    end

    -- Clear the zone
    olyLink.clearZone(shellsZoneName)

    -- Spawn the crate
    local spawnLocation = shellsZone.point
    local lat, lng, alt = coord.LOtoLL(spawnLocation)

    local function spawnShellCrateNow()
        Olympus.spawnStaticObject({
            coalition = "blue",
            heading = 0,
            type = "uh1h_cargo",
            shapeName = "uh1h_cargo",
            lat = lat,
            lng = lng,
            name = "Shells-" .. Olympus.staticsCounter .. "-" .. baseName,
            mass = 1000,
            canCargo = true,
            dead = false,
            linkOffset = true
        })
    end
    timer.scheduleFunction(spawnShellCrateNow, {}, timer.getTime() + 1) -- add a delay
end

-- Spawn a weapon crate at a given base. The type of weapon crate is determined by the type parameter, which can be "RocketHE", "RocketOther", "AmmoGuns"
function olyLink.spawnWeaponCrate(baseName, weaponType)
    Olympus.debug("Spawning weapon crate of type " .. weaponType .. " at " .. baseName .. " base", 10)

    -- Check tat the base is in the config file
    if not olyLink.contains(olyLink.getBaseNames(), baseName) then
        Olympus.notify("Base " .. baseName .. " not found in config file, cannot spawn weapon crate", 10)
        return
    end

    -- Read from the config the trigger zone name for the weapons pickup for this base, and spawn a weapon crate there
    local weaponsZoneName = olyLink.bases[baseName].ammoZoneName
    local weaponsZone = trigger.misc.getZone(weaponsZoneName)
    if weaponsZone == nil then
        Olympus.notify("Weapons zone " .. weaponsZoneName .. " not found for base " .. baseName .. ", cannot spawn weapon crate", 10)
        return
    end

    -- Clear the zone
    olyLink.clearZone(weaponsZoneName)

    -- Spawn the crate
    local spawnLocation = weaponsZone.point
    local lat, lng, alt = coord.LOtoLL(spawnLocation)

    local function spawnWeaponCrateNow()
        Olympus.spawnStaticObject({
            coalition = "blue",
            heading = 0,
            type = "ammo_cargo",
            shapeName = "ammo_cargo",
            lat = lat,
            lng = lng,
            name = weaponType .. "-" .. Olympus.staticsCounter .. "-" .. baseName,
            mass = 1000,
            canCargo = true,
            dead = false,
            linkOffset = true
        })
    end
    timer.scheduleFunction(spawnWeaponCrateNow, {}, timer.getTime() + 1) -- add a delay
end

-- Spawn a fireteam at the given base
function olyLink.spawnFireTeam(baseName)
    Olympus.debug("Spawning fireteam at " .. baseName .. " base", 10)

    -- Check tat the base is in the config file
    if not olyLink.contains(olyLink.getBaseNames(), baseName) then
        Olympus.notify("Base " .. baseName .. " not found in config file, cannot spawn fireteam", 10)
        return
    end

    -- Read from the config the trigger zone name for the fireteam pickup for this base, and spawn a fireteam there
    local fireTeamZoneName = olyLink.bases[baseName].fireTeamZoneName
    local fireTeamZone = trigger.misc.getZone(fireTeamZoneName)
    if fireTeamZone == nil then
        Olympus.notify("Fireteam zone " .. fireTeamZoneName .. " not found for base " .. baseName .. ", cannot spawn fireteam", 10)
        return
    end

    -- Check how many troops are still available for this base in the config, and if there are no troops left, don't spawn anything
    if olyLink.bases[baseName].troopsAvailable == nil or olyLink.bases[baseName].troopsAvailable <= 0 then
        Olympus.notify("No troops available for base " .. baseName .. ", cannot spawn fireteam", 10)
        return
    end
    local troopsToSpawn = math.min(8, olyLink.bases[baseName].troopsAvailable) -- spawn a maximum of 8 troops at a time

    -- Check how many supplies are still available
    local requiredSupplies = (olyLink.bases[baseName].suppliesPerTroop or 0) * troopsToSpawn
    if olyLink.bases[baseName].supplies == nil or olyLink.bases[baseName].supplies < requiredSupplies then
        Olympus.notify("Not enough supplies available for base " .. baseName .. ", cannot spawn fireteam", 10)
        return
    end

    local spawnLocation = fireTeamZone.point
    local randomOffsetZ = math.random(-15, 15) -- add a random offset of up to 1 meter in x direction to avoid perfect line
    -- Spawn a group for 8 soldiers in a line
    for i = 1, troopsToSpawn do
        local offset = (i - 1) * 2 -- 2 meters apart
        local lat, lng, alt = coord.LOtoLL({x = spawnLocation.x + offset, y = spawnLocation.y, z = spawnLocation.z + randomOffsetZ})

        Olympus.spawnUnits({
            category = "GroundUnit",
            coalition = "blue",
            units = {
                {
                    unitType = "Soldier M4 GRG",
                    lat = lat,
                    lng = lng,
                    heading = 0
                }
            }
        })
    end

    -- Decrease the number of available troops for this base in the config, and the supplies as well
    olyLink.bases[baseName].troopsAvailable = olyLink.bases[baseName].troopsAvailable - troopsToSpawn
    olyLink.bases[baseName].supplies = olyLink.bases[baseName].supplies - requiredSupplies
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
            point = mist.utils.makeVec3GL(dropoffZone.point),
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
            objectInformation = obj:getDesc()
            objectName = obj:getName()
            objectWeight = obj:getCargoWeight()
            cargoType = obj:getDesc().typeName   
            
            -- Get the ground elevation of the cargo
            local cargoPosition = obj:getPosition().p
            local groundElevation = land.getHeight({x = cargoPosition.x, y = cargoPosition.z})

            --local pointZone = mist.utils.makeVec3GL(dropoffZone.point)
            --local deltaX = cargoPosition.x - pointZone.x
            --local deltaY = cargoPosition.y - pointZone.y
            --local deltaZ = cargoPosition.z - pointZone.z
            --local distance = math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ)
            --Olympus.notify("Detected cargo " .. objectName .. " heigh above ground " .. (cargoPosition.y - groundElevation) .. " distance " .. distance, 1)

            -- If the cargo is above the ground more than 1 meter, we consider it not delivered yet
            if cargoPosition.y - groundElevation < 1 then
                hasCargo = true
            end
        end
        return true
    end

    world.searchObjects(Object.Category.CARGO, volume, checkCargo)

    -- Return if no cargo in the volume
    if not hasCargo then
        return
    end

    -- Check there is at least one helicopter in the volume also
    if not olyLink.checkHelicopterInVolume(volume) then
        return
    end

    if olyLink.alreadySuppliedStatics[objectName] == true then
        return
    end

    -- Register that we already supplied the static for this object name
    olyLink.alreadySuppliedStatics[objectName] = true

    if objectInformation == nil or objectName == nil or cargoType == nil then
        Olympus.notify("Could not get information about the object in the dropoff zone " .. dropoffZoneName .. " for base " .. baseName .. ", cannot check for supplies delivery", 10)
        return
    end

    local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
    local warehouse = nil
    local inventory = nil

    for i = 1, #friendlyAirbases do
        Olympus.debug("Checking base " .. friendlyAirbases[i]:getName(), 2)
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
        olyLink.bases[baseName].detectedDropoffs = olyLink.bases[baseName].detectedDropoffs + 1
        if cargoType == "ammo_cargo" and string.match(objectName, "^RocketHE.+") then
            rocketValue = 0
            for k,v in pairs(inventory["weapon"]) do
                if k == "weapons.nurs.HYDRA_70_M151" then -- HE
                    rocketValue = rocketValue + v
                end
            end 
            warehouse:setItem("weapons.nurs.HYDRA_70_M151", rocketValue + 19*2)
            Olympus.notify("Delivered 38 rockets to " .. baseName .. " base!", 10)
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

function olyLink.checkHelicopterInVolume(volume)
    -- Check if any helicopter unit is inside the search area
    local hasHelicopter = false
    local function checkHelicopter(obj)
        if obj and obj:isExist() and obj:getDesc().category == Unit.Category.HELICOPTER then
            hasHelicopter = true
            return true            
        end
        return true
    end
    world.searchObjects(Object.Category.UNIT, volume, checkHelicopter)
    return hasHelicopter
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
            point = mist.utils.makeVec3GL(dropoffZone.point),
            radius = dropoffZone.radius
        }
    }

    -- Check there are no helicopters in the volume
    if olyLink.checkHelicopterInVolume(volume) then
        return
    end

    local removedCount = 0
    local function tryRemove(obj)
        if obj and obj:isExist() then
            local objectName = obj:getName()
            if olyLink.alreadySuppliedStatics[objectName] == true then
                obj:destroy()
            end
        end
        return true
    end

    world.searchObjects(Object.Category.CARGO, volume, tryRemove)
    if Object.Category.CARGO then
        world.searchObjects(Object.Category.CARGO, volume, tryRemove)
    end
end

function olyLink.clearBasePickupZones(baseName)
    Olympus.debug("Clearing all zones", 2)
    local fuelZoneName = olyLink.bases[baseName].fuelZoneName
    local suppliesZoneName = olyLink.bases[baseName].suppliesZoneName
    local weaponsZoneName = olyLink.bases[baseName].ammoZoneName
    
    local zonesToClear = {fuelZoneName, suppliesZoneName, weaponsZoneName}
    for i, zoneName in ipairs(zonesToClear) do
        olyLink.clearZone(zoneName)
    end
end

function olyLink.clearZone(zoneName)
    local zone = trigger.misc.getZone(zoneName)
    if zone then
        local volume = {
            id = world.VolumeType.SPHERE,
            params = {
                point = mist.utils.makeVec3GL(zone.point),
                radius = 5000
            }
        }

        local foundObjects = 0
        local function tryRemove(obj)
            if obj and obj:isExist() then
                -- Check if the distance between the object and the zone center is less than the zone radius, ignoring height
                local objPosition = obj:getPosition().p
                local distance = math.sqrt((objPosition.x - zone.point.x)^2 + (objPosition.z - zone.point.z)^2)
                if distance <= zone.radius then
                    foundObjects = foundObjects + 1
                    obj:destroy()
                end
            end
            return true
        end

        world.searchObjects(Object.Category.CARGO, volume, tryRemove)
        if Object.Category.CARGO then
            world.searchObjects(Object.Category.CARGO, volume, tryRemove)
        end
        Olympus.debug(zoneName .. " cleared " .. foundObjects .. " objects", 2)
    end
end

function olyLink.onFireTeamUnitReachedDestination(baseName)
    -- When a fireteam unit reaches the destination increase the number of available troops for this base in the config, to allow spawning more troops, and decrease the supplies as well
    olyLink.bases[baseName].troopsAvailable = olyLink.bases[baseName].troopsAvailable + 1
end

function olyLink.rearmArtilleryPiece(baseName)
    -- When an artillery piece is rearmed, decrease the number of available shells for this base in the config
    local requiredShells = olyLink.bases[baseName].shellsPerArtilleryPiece or 0
    if olyLink.bases[baseName].shells == nil or olyLink.bases[baseName].shells < requiredShells then
        Olympus.notify("Not enough shells available for base " .. baseName .. " to rearm artillery piece", 10)
        return
    end

    olyLink.bases[baseName].shells = olyLink.bases[baseName].shells - requiredShells
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
    
    if olyLink.initialized then
        return timer.getTime() + 1
    else
        Olympus.notify("Stopping periodic task", 2)
    end
end
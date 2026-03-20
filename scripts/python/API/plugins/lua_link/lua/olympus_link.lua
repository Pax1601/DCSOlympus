
--assert(loadfile('C:\\Users\\hindsas\\Saved Games\\DCS.openbeta\\Missions\\Vietnam Islands\\LUA\\olympus_link.lua'))()

olyLink = {}
olyLink.filePath = "C:\\Users\\veltro\\Documents\\olympus\\olympus_link_data.txt"
storeCounter = storeCounter or {}
storeCounter.countIDtoLua = storeCounter.countIDtoLua or 1
storeCounter.staticSpawnCounter = storeCounter.staticSpawnCounter or 1
storeCounter.suppliesAlreadyDeliveredArray = storeCounter.suppliesAlreadyDeliveredArray or {}
storeCounter.troopsDeployed = storeCounter.troopsDeployed or 0
--trigger.action.outText("Olympus Link: Run", 1)

olyLink.bases = {
    ["Orote"] = {
        supplies = 0,
        shells = 0,
        fuel = 0,
        fuelZoneName = "Pickup-Oil",
        ammoZoneName = "Pickup-Weapons",
        suppliesZoneName = "Pickup-Supplies",
        dropoffZoneName = "Dropoff"
    }
}

olyLink.weaponList = {
    "weapons.torpedoes.G7A_T1",
    "weapons.torpedoes.Mark_46",
    "weapons.torpedoes.YU-6",
    "weapons.torpedoes.mk46torp_name",
    "weapons.containers.SPRD-99",
    "weapons.torpedoes.LTF_5B",
}

olyLink.gunsList = {
    "weapons.containers.M60_SIDE_L",
    "weapons.containers.M60_SIDE_R",
    "weapons.containers.M134_L",
    "weapons.containers.M134_R",
    "weapons.nurs.HYDRA_70_M257",
    "weapons.nurs.HYDRA_70_M156",
    "weapons.nurs.HYDRA_70_M151"
}

olyLink.ammoList = {
    "weapons.nurs.HYDRA_70_M257",
    "weapons.nurs.HYDRA_70_M156",
    "weapons.nurs.HYDRA_70_M151"
}

olyLink.machineGunList = {
    "weapons.containers.M60_SIDE_L",
    "weapons.containers.M60_SIDE_R",
    "weapons.containers.M134_L",
    "weapons.containers.M134_R"
}

--useful checking funcion to see if a value is in a list
function olyLink.contains(list, value)
    for _, v in ipairs(list) do
        if v == value then
            return true
        end
    end
    return false
end

function olyLink.createOrUpdateFile(data)
    local file = io.open(olyLink.filePath, "w")
    if file then
        file:write(data)
        file:close()
        --trigger.action.outText("Olympus Link: File created or updated successfully", 1)
    else
        --trigger.action.outText("Olympus Link: Failed to create or update file", 1)
    end
end

--this closes a file if already open
function olyLink.executeFileClose(file)
    if file then
        file:close()
    else 
        --trigger.action.outText("Olympus Link: No file to close", 1)
    end
end

function olyLink.compileInitialData()
    --trigger.action.outText("Olympus Link: Compiling initial data", 1)
    local data = ""
    local longTermData = ""

    --command section to transfer data commands back and forth
    commandSection = "<commandToLua>\n" 
    .. "  <order></order>\n" 
    .. "  <base></base>\n" 
    .. "  <read></read>\n"
    .. "</commandToLua>\n"
    .. "<commandToPython>\n" 
    .. "  <order></order>\n" 
    .. "  <read></read>\n"
    .. "</commandToPython>\n"

    longTermData = longTermData .. commandSection

    local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
        for i = 1, #friendlyAirbases do
            if olyLink.contains(olyLink.getBaseNames(), friendlyAirbases[i]:getName()) then
                local warehouse = friendlyAirbases[i]:getWarehouse()
                local inventory = warehouse:getInventory()
                for k,v in pairs(inventory["weapon"]) do
                    if olyLink.contains(olyLink.weaponList, k) then
                        warehouse:setItem(k, 0)
                    end
                    if olyLink.contains(olyLink.gunsList, k) then
                        warehouse:setItem(k, 0)
                    end
                end
                local weapons = ""
                local warehouse = friendlyAirbases[i]:getWarehouse()
                local inventory = warehouse:getInventory()
                local liquidAmount = warehouse:getLiquidAmount(0)
                local baseName = friendlyAirbases[i]:getName()
                local weapons = ""
                local hasWeapons = false

                for k, v in pairs(inventory["weapon"]) do
                    hasWeapons = true
                    weapons = weapons
                        .. "    <item>\n" 
                        .. "      <name>" .. k .. "</name>\n"
                        .. "      <quantity>" .. v .. "</quantity>\n"
                        .. "    </item>\n"
                end

                if not hasWeapons then
                    weapons = weapons
                        .. "  <weapons>\n"
                        .. "  </weapons>\n"
                else 
                    weapons = "  <weapons>\n" .. weapons .. "  </weapons>\n"
                end

                data = "<base>\n"
                .. "  <name>" .. baseName .. "</name>\n"
                .. "  <liquid>" .. liquidAmount .. "</liquid>\n"
                .. "  <supplies>" .. olyLink.getSuppliesAtBase(baseName) .. "</supplies>\n"
                .. weapons
                .. "</base>\n"
                --trigger.action.outText("Olympus Link: Found friendly airbase - " .. friendlyAirbases[i]:getName(), 1)
                longTermData = longTermData .. data
                data = ""
            end
        end
        longTermData = longTermData .. data
    return longTermData
end

function olyLink.getSuppliesAtBase(baseName)
    local suppliesValue = 0
    if olyLink.bases[baseName] then
        suppliesValue = olyLink.bases[baseName].supplies or 0
    end
    return suppliesValue
end

function olyLink.getShellsAtBase(baseName)
    local shellsValue = 0
    if olyLink.bases[baseName] then
        shellsValue = olyLink.bases[baseName].shells or 0
    end
    return shellsValue
end

function olyLink.setSuppliesAtBase(baseName, supplies)
    if olyLink.bases[baseName] then
        olyLink.bases[baseName].supplies = supplies
    end
end

function olyLink.setShellsAtBase(baseName, shells)
    if olyLink.bases[baseName] then
        olyLink.bases[baseName].shells = shells
    end
end

function olyLink.updateFromFileDetails(file)
    --read from file and update values in DCS
    local content = file:read("*all")
    if content == "" then
        --trigger.action.outText("Olympus Link: File is empty, skipping update", 1)
        return
    end
    local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
    for i = 1, #friendlyAirbases do
        if olyLink.contains(olyLink.getBaseNames(), friendlyAirbases[i]:getName()) then
            local warehouse = friendlyAirbases[i]:getWarehouse()
            local inventory = warehouse:getInventory()  
            baseMatchContent = string.match(content, "<base>%s*<name>" .. friendlyAirbases[i]:getName() .. "</name>(.-)</base>")
            if baseMatchContent ~= nil then
                trigger.action.outText(friendlyAirbases[i]:getName(), 1,false)
                fuelValue = string.match(baseMatchContent, "<liquid>%s*([+-]?%d*%.?%d+)%s*</liquid>") or 0
                warehouse:setLiquidAmount(0, tonumber(fuelValue))
                weaponsSection = string.match(baseMatchContent, "<weapons>(.-)</weapons>")
                for k,v in string.gmatch(weaponsSection, "<item>%s*<name>(.-)</name>%s*<quantity>(%d+)</quantity>%s*</item>") do
                    warehouse:setItem(k, tonumber(v))
                    --trigger.action.outText("Weapon: " .. k .. " Quantity: " .. v, 1,false)
                end
                for k,v in pairs(inventory["weapon"]) do
                    if olyLink.contains(olyLink.weaponList, k) then
                        trigger.action.outText("Resetting weapon: " .. k .. " Quantity: " .. v, 1,false)
                        warehouse:setItem(k, 0)
                    end
                        --
                end
                suppliesValue = string.match(baseMatchContent, "<supplies>(%d+)</supplies>")
                olyLink.setSuppliesAtBase(friendlyAirbases[i]:getName(), tonumber(suppliesValue) or olyLink.getSuppliesAtBase(friendlyAirbases[i]:getName()))
            else
                
            end


        end
    end
end

function olyLink.getBaseNames()
    local baseNames = {}
    for baseName, baseValues in pairs(olyLink.bases) do
        table.insert(baseNames, baseName)
    end
    return baseNames
end

function olyLink.showAirBaseInfo()
    local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
    for i = 1, #friendlyAirbases do
        if olyLink.contains(olyLink.getBaseNames(), friendlyAirbases[i]:getName()) then
            local warehouse = friendlyAirbases[i]:getWarehouse()
            local inventory = warehouse:getInventory()  
            for k,v in pairs(inventory["weapon"]) do
                if olyLink.contains(olyLink.weaponList, k) then
                    trigger.action.outText("Weapon: " .. k .. " Quantity: " .. v, 1,false)
                end
            end
            trigger.action.outText("Fuel: " .. warehouse:getLiquidAmount(0), 1,false)
            trigger.action.outText("Supplies: " .. olyLink.getSuppliesAtBase(friendlyAirbases[i]:getName()), 1,false)
            trigger.action.outText("Shells: " .. olyLink.getShellsAtBase(friendlyAirbases[i]:getName()), 1,false)
        end
    end
end

function olyLink.getDropoffZoneAtBase(baseName)
    local dropoffZoneName = nil
    if olyLink.bases[baseName] then
        dropoffZoneName = olyLink.bases[baseName].dropoffZoneName
    end
    return trigger.misc.getZone(dropoffZoneName)
end

function olyLink.getFuelZoneAtBase(baseName)
    local fuelZoneName = nil
    if olyLink.bases[baseName] then
        fuelZoneName = olyLink.bases[baseName].fuelZoneName
    end
    return trigger.misc.getZone(fuelZoneName)
end

function olyLink.getAmmoZoneAtBase(baseName)
    local ammoZoneName = nil
    if olyLink.bases[baseName] then
        ammoZoneName = olyLink.bases[baseName].ammoZoneName
    end
    return trigger.misc.getZone(ammoZoneName)
end

function olyLink.getSuppliesZoneAtBase(baseName)
    local suppliesZoneName = nil
    if olyLink.bases[baseName] then
        suppliesZoneName = olyLink.bases[baseName].suppliesZoneName
    end
    return trigger.misc.getZone(suppliesZoneName) 
end

function olyLink.removeStaticsInZone(zone)
    if not zone then
        return
    end

    local volume = {
        id = world.VolumeType.SPHERE,
        params = {
            point = zone.point,
            radius = zone.radius
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
    else

    end

    trigger.action.outText("Removed statics: " .. tostring(removedCount), 1, false)
end

function olyLink.spawnBarrel(objectName, nextID, mass, baseName)
    local zone = olyLink.getFuelZoneAtBase(baseName)
    if not zone then
        return
    end 
    local zonePosition = zone.point

    local staticObject = {
        ["tasks"] = {},
        ["heading"] = 0,
        ["groupId"] = nextID,
        ["shape_name"] = "barrels_cargo",
        ["mass"] = mass,
        ["type"] = "barrels_cargo",
        ["unitId"] = nextID,
        ["rate"] = 100,
        ["name"] = objectName,
        ["category"] = "Cargos",
        ["canCargo"] = true,
        ["y"] = zonePosition.z,
        ["x"] = zonePosition.x,
        ["z"] = zonePosition.y,
        ["linkOffset"] = true,
        ["dead"] = false
    }

    coalition.addStaticObject(country.id.USA, staticObject)
end

function olyLink.spawnAmmo(objectName, nextID, mass, baseName)
    local zone = olyLink.getAmmoZoneAtBase(baseName)
    if not zone then
        return
    end 
    local zonePosition = zone.point

    local staticObject = {
        ["tasks"] = {},
        ["heading"] = 0,
        ["groupId"] = nextID,
        ["shape_name"] = "ammo_cargo",
        ["mass"] = mass,
        ["type"] = "ammo_cargo",
        ["unitId"] = nextID,
        ["rate"] = 100,
        ["name"] = objectName,
        ["category"] = "Cargos",
        ["canCargo"] = true,
        ["y"] = zonePosition.z,
        ["x"] = zonePosition.x,
        ["z"] = zonePosition.y,
        ["linkOffset"] = true,
        ["dead"] = false
    }

    coalition.addStaticObject(country.id.USA, staticObject)
end

function olyLink.spawnCargoNet(objectName, nextID, mass, baseName)
    local zone = olyLink.getSuppliesZoneAtBase(baseName)
    if not zone then
        return
    end 
    local zonePosition = zone.point

    local staticObject = {
        ["tasks"] = {},
        ["heading"] = 0,
        ["groupId"] = nextID,
        ["shape_name"] = "uh1h_cargo",
        ["mass"] = mass,
        ["type"] = "uh1h_cargo",
        ["unitId"] = nextID,
        ["rate"] = 100,
        ["name"] = objectName,
        ["category"] = "Cargos",
        ["canCargo"] = true,
        ["y"] = zonePosition.z,
        ["x"] = zonePosition.x,
        ["z"] = zonePosition.y,
        ["linkOffset"] = true,
        ["dead"] = false
    }

    coalition.addStaticObject(country.id.USA, staticObject)
end

function olyLink.delayFuelSpawn(baseName)
    fuelWeight = 1000
    olyLink.spawnBarrel("Fuel_" .. fuelWeight .. "_" .. storeCounter.staticSpawnCounter, storeCounter.staticSpawnCounter, fuelWeight, baseName)
    storeCounter.staticSpawnCounter = storeCounter.staticSpawnCounter + 1
end

function olyLink.spawnFuel(file, content, baseName)   
    newContent = string.gsub(
        content,
        "(<commandToLua>[%s%S]-<read>)[%s%S]-(</read>[%s%S]-</commandToLua>)",
        "%1true%2"
    )
    olyLink.executeFileClose(file)
    local file = io.open(olyLink.filePath, "w")
    if file then
        file:write(newContent)
        olyLink.executeFileClose(file)
        olyLink.removeStaticsInZone(olyLink.getFuelZoneAtBase(baseName))
        timer.scheduleFunction(olyLink.delayFuelSpawn, baseName, timer.getTime() + 1)
    end    
end

function olyLink.delayAmmoGunsSpawn(baseName)
    ammoWeight = 1000
    olyLink.spawnAmmo("AmmoGuns_" .. ammoWeight .. "_" .. storeCounter.staticSpawnCounter, storeCounter.staticSpawnCounter, ammoWeight, baseName)
    storeCounter.staticSpawnCounter = storeCounter.staticSpawnCounter + 1
end

function olyLink.spawnAmmoGuns(file, content, baseName)   
    newContent = string.gsub(
        content,
        "(<commandToLua>[%s%S]-<read>)[%s%S]-(</read>[%s%S]-</commandToLua>)",
        "%1true%2"
    )
    olyLink.executeFileClose(file)
    local file = io.open(olyLink.filePath, "w")
    if file then
        file:write(newContent)
        olyLink.executeFileClose(file)
        olyLink.removeStaticsInZone(olyLink.getAmmoZoneAtBase(baseName))
        timer.scheduleFunction(olyLink.delayAmmoGunsSpawn, baseName, timer.getTime() + 1)
    end    
end

function olyLink.delayRocketsHESpawn(baseName)
    ammoWeight = 1000
    olyLink.spawnAmmo("RocketHE_" .. ammoWeight .. "_" .. storeCounter.staticSpawnCounter, storeCounter.staticSpawnCounter, ammoWeight, baseName)
    storeCounter.staticSpawnCounter = storeCounter.staticSpawnCounter + 1
end

function olyLink.spawnRocketsHE(file, content, baseName)   
    newContent = string.gsub(
        content,
        "(<commandToLua>[%s%S]-<read>)[%s%S]-(</read>[%s%S]-</commandToLua>)",
        "%1true%2"
    )
    olyLink.executeFileClose(file)
    local file = io.open(olyLink.filePath, "w")
    if file then
        file:write(newContent)
        olyLink.executeFileClose(file)
        olyLink.removeStaticsInZone(olyLink.getAmmoZoneAtBase(baseName))
        timer.scheduleFunction(olyLink.delayRocketsHESpawn, baseName, timer.getTime() + 1)
    end    
end

function olyLink.delayRocketsSmokeSpawn(baseName)
    ammoWeight = 1000
    olyLink.spawnAmmo("RocketOther" .. ammoWeight .. "_" .. storeCounter.staticSpawnCounter, storeCounter.staticSpawnCounter, ammoWeight, baseName)
    storeCounter.staticSpawnCounter = storeCounter.staticSpawnCounter + 1
end

function olyLink.spawnRocketsSmoke(file, content, baseName)   
    newContent = string.gsub(
        content,
        "(<commandToLua>[%s%S]-<read>)[%s%S]-(</read>[%s%S]-</commandToLua>)",
        "%1true%2"
    )
    olyLink.executeFileClose(file)
    local file = io.open(olyLink.filePath, "w")
    if file then
        file:write(newContent)
        olyLink.executeFileClose(file)
        olyLink.removeStaticsInZone(olyLink.getAmmoZoneAtBase(baseName))
        timer.scheduleFunction(olyLink.delayRocketsSmokeSpawn, baseName, timer.getTime() + 1)
    end    
end

function olyLink.delaySupplies(baseName)
    cargoWeight = 1000
    olyLink.spawnCargoNet("Supplies" .. cargoWeight .. "_" .. storeCounter.staticSpawnCounter, storeCounter.staticSpawnCounter, cargoWeight, baseName)
    storeCounter.staticSpawnCounter = storeCounter.staticSpawnCounter + 1
end

function olyLink.spawnSupplies(file, content, baseName)   
    newContent = string.gsub(
        content,
        "(<commandToLua>[%s%S]-<read>)[%s%S]-(</read>[%s%S]-</commandToLua>)",
        "%1true%2"
    )
    olyLink.executeFileClose(file)
    local file = io.open(olyLink.filePath, "w")
    if file then
        file:write(newContent)
        olyLink.executeFileClose(file)
        olyLink.removeStaticsInZone(olyLink.getSuppliesZoneAtBase(baseName))
        timer.scheduleFunction(olyLink.delaySupplies, baseName, timer.getTime() + 1)
    end    
end

function olyLink.missionRunningUpdateSupplyInfo()
     --trigger.action.outText("Olympus Link: Compiling initial data", 1)
    local data = ""
    local longTermData = ""

    --command section to transfer data commands back and forth
    commandSection = "<commandToLua>\n" 
    .. "  <order></order>\n" 
    .. "  <base></base>\n"
    .. "  <read></read>\n"
    .. "</commandToLua>\n"
    .. "<commandToPython>\n" 
    .. "  <order></order>\n" 
    .. "  <read></read>\n"
    .. "</commandToPython>\n"

    longTermData = longTermData .. commandSection

    local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
        for i = 1, #friendlyAirbases do
            if olyLink.contains(olyLink.getBaseNames(), friendlyAirbases[i]:getName()) then
                local warehouse = friendlyAirbases[i]:getWarehouse()
                local inventory = warehouse:getInventory()
                for k,v in pairs(inventory["weapon"]) do
                    if olyLink.contains(olyLink.ammoList, k) then
                        warehouse:setItem(k, v )
                    end
                end
                local weapons = ""
                local warehouse = friendlyAirbases[i]:getWarehouse()
                local inventory = warehouse:getInventory()
                local liquidAmount = warehouse:getLiquidAmount(0)
                local baseName = friendlyAirbases[i]:getName()
                local weapons = ""
                local hasWeapons = false

                for k, v in pairs(inventory["weapon"]) do
                    hasWeapons = true
                    weapons = weapons
                        .. "    <item>\n" 
                        .. "      <name>" .. k .. "</name>\n"
                        .. "      <quantity>" .. v .. "</quantity>\n"
                        .. "    </item>\n"
                end

                if not hasWeapons then
                    weapons = weapons
                        .. "  <weapons>\n"
                        .. "  </weapons>\n"
                else 
                    weapons = "  <weapons>\n" .. weapons .. "  </weapons>\n"
                end

                data = "<base>\n"
                .. "  <name>" .. baseName .. "</name>\n"
                .. "  <liquid>" .. liquidAmount .. "</liquid>\n"
                .. "  <supplies>" .. olyLink.getSuppliesAtBase(baseName) .. "</supplies>\n"
                .. "  <shells>" .. olyLink.getShellsAtBase(baseName) .. "</shells>\n"
                .. weapons
                .. "</base>\n"
                --trigger.action.outText("Olympus Link: Found friendly airbase - " .. friendlyAirbases[i]:getName(), 1)
                longTermData = longTermData .. data
                data = ""
            end
        end
        longTermData = longTermData .. data
    return longTermData
end

function olyLink.checkIfSuppliesDelivered(baseName)
    local zone = olyLink.getDropoffZoneAtBase(baseName)
    if not zone then
        return
    end 
    local volume = {
        id = world.VolumeType.SPHERE,
        params = {
            point = zone.point,
            radius = zone.radius
        }
    }
    local hasCargo = false
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
    if hasCargo then
        if cargoType == "ammo_cargo" and string.match(objectName, "^RocketHE.+") and not olyLink.contains(storeCounter.suppliesAlreadyDeliveredArray, objectName) then
            table.insert(storeCounter.suppliesAlreadyDeliveredArray, objectName)
            local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
            rocketValue = 0
            for i = 1, #friendlyAirbases do
                if friendlyAirbases[i]:getName() == "Orote" then
                    warehouse = friendlyAirbases[i]:getWarehouse()
                    inventory = warehouse:getInventory()
                    for k,v in pairs(inventory["weapon"]) do
                        if k == "weapons.nurs.HYDRA_70_M151" then -- HE
                            rocketValue = rocketValue + v
                            trigger.action.outText("Current HE Rocket stock: " .. v, 100,false) 
                        end
                    end
                end
            warehouse:setItem("weapons.nurs.HYDRA_70_M151", rocketValue + 19*2)
            end
        elseif cargoType == "ammo_cargo" and string.match(objectName, "^RocketOther.+") and not olyLink.contains(storeCounter.suppliesAlreadyDeliveredArray, objectName) then
            table.insert(storeCounter.suppliesAlreadyDeliveredArray, objectName)
            local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
            rocketValueIllum = 0
            rocketValueSmoke = 0
            for i = 1, #friendlyAirbases do
                if friendlyAirbases[i]:getName() == "Orote" then
                    warehouse = friendlyAirbases[i]:getWarehouse()
                    inventory = warehouse:getInventory()
                    for k,v in pairs(inventory["weapon"]) do
                        if k == "weapons.nurs.HYDRA_70_M156" then -- Smoke
                            rocketValueSmoke = rocketValueSmoke + v
                            trigger.action.outText("Current HE Rocket stock: " .. v, 100,false)
                        elseif k == "weapons.nurs.HYDRA_70_M257" then -- Illum
                            rocketValueIllum = rocketValueIllum + v
                            trigger.action.outText("Current Illum Rocket stock: " .. v, 100,false)
                        end
                    end
                end
            warehouse:setItem("weapons.nurs.HYDRA_70_M156", rocketValueSmoke + 7)
            warehouse:setItem("weapons.nurs.HYDRA_70_M257", rocketValueIllum + 7)
            end
        elseif cargoType == "ammo_cargo" and string.match(objectName, "^AmmoGuns.+") and not olyLink.contains(storeCounter.suppliesAlreadyDeliveredArray, objectName) then
            trigger.action.outText("Executed",1,false)
            table.insert(storeCounter.suppliesAlreadyDeliveredArray, objectName)
            local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
            gun1 = 0
            gun2 = 0
            gunMiniL = 0
            gunMiniR = 0
            for i = 1, #friendlyAirbases do
                if friendlyAirbases[i]:getName() == "Orote" then
                    warehouse = friendlyAirbases[i]:getWarehouse()
                    inventory = warehouse:getInventory()
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
                end
            warehouse:setItem("weapons.containers.M60_SIDE_L", gun1 + 1)
            warehouse:setItem("weapons.containers.M60_SIDE_R", gun2 + 1)
            warehouse:setItem("weapons.containers.M134_L", gunMiniL + 1)
            warehouse:setItem("weapons.containers.M134_R", gunMiniR + 1)
            end
        elseif cargoType == "barrels_cargo" and string.match(objectName, "^Fuel.+") and not olyLink.contains(storeCounter.suppliesAlreadyDeliveredArray, objectName) then
            table.insert(storeCounter.suppliesAlreadyDeliveredArray, objectName)
            local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
            for i = 1, #friendlyAirbases do
                if friendlyAirbases[i]:getName() == "Orote" then
                    local warehouse = friendlyAirbases[i]:getWarehouse()
                    local inventory = warehouse:getInventory()
                    warehouse:setLiquidAmount(0, warehouse:getLiquidAmount(0) + objectWeight)
                end
            end
        elseif cargoType == "uh1h_cargo" and string.match(objectName, "^Supplies.+") and not olyLink.contains(storeCounter.suppliesAlreadyDeliveredArray, objectName) then
            table.insert(storeCounter.suppliesAlreadyDeliveredArray, objectName)
            olyLink.setSuppliesAtBase(baseName, olyLink.getSuppliesAtBase(baseName) + 1000)
        elseif cargoType == "uh1h_cargo" and string.match(objectName, "^Shells.+") and not olyLink.contains(storeCounter.suppliesAlreadyDeliveredArray, objectName) then
            table.insert(storeCounter.suppliesAlreadyDeliveredArray, objectName)
            olyLink.setShellsAtBase(baseName, olyLink.getShellsAtBase(baseName) + 1000)
        end
    end
end


function olyLink.checkFileCommands(file)
    if not file then
            trigger.action.outText("Olympus Link: Failed to open file for reading", 1)
        return
    end
    local content = file:read("*all")
    if content == "" then
        --trigger.action.outText("Olympus Link: File is empty, skipping update", 1)
        return
    end
    local command = string.match(content, "<commandToLua>([%s%S]-)</commandToLua>")
    if not command or command == "" then
        --trigger.action.outText("No command found", 1,true)
    else 
        local order = string.match(command, "<order>([%s%S]-)</order>")
        local baseName = string.match(command, "<base>([%s%S]-)</base>")
        local read = string.match(command, "<read>([%s%S]-)</read>")
        if order == "" or read == "" then
            trigger.action.outText("No or incomplete order found", 1,true)
        elseif read == "true" then
            trigger.action.outText("Read already do nothing", 1,true)
        elseif read == "false" then
            if order == "Spawn Fuel" then
                olyLink.spawnFuel(file, content, baseName)
                olyLink.removeStaticsInZone(olyLink.getFuelZoneAtBase(baseName))
            elseif order == "Spawn Ammo" then
                olyLink.spawnAmmoGuns(file, content, baseName)
                olyLink.removeStaticsInZone(olyLink.getAmmoZoneAtBase(baseName))
            elseif order == "Spawn Rocket HE" then
                olyLink.spawnRocketsHE(file, content, baseName)
                olyLink.removeStaticsInZone(olyLink.getAmmoZoneAtBase(baseName))
            elseif order == "Spawn Rocket SMIL" then
                olyLink.spawnRocketsSmoke(file, content, baseName)
                olyLink.removeStaticsInZone(olyLink.getAmmoZoneAtBase(baseName))
            elseif order == "Spawn Supplies" then
                olyLink.spawnSupplies(file, content, baseName)
                olyLink.removeStaticsInZone(olyLink.getSuppliesZoneAtBase(baseName))
            elseif order == "Spawn Shells" then
                olyLink.spawnShellsSupplies(file, content, baseName)
                olyLink.removeStaticsInZone(olyLink.getAmmoZoneAtBase(baseName))
            elseif order == "Clear Area" then
                --trigger.action.outText("Clear area", 1,true)
                olyLink.removeStaticsInZone(olyLink.getFuelZoneAtBase(baseName))
                olyLink.removeStaticsInZone(olyLink.getAmmoZoneAtBase(baseName))
                olyLink.removeStaticsInZone(olyLink.getSuppliesZoneAtBase(baseName))
            elseif order == "Troops created" then
               -- trigger.action.outText("-500", 10,true)
                storeCounter.troopsDeployed = storeCounter.troopsDeployed + 1
                olyLink.setSuppliesAtBase(baseName, math.max(0, olyLink.getSuppliesAtBase(baseName) - 500))
                -- TODO: actually store this in the file 
            end
        else 
            -- this is the block of text that carries out the order        
            trigger.action.outText("Else", 1,true)
        end
        --trigger.action.outText(command, 1,true)
    end
end

--initial file check and creation
file = io.open(olyLink.filePath, "r")
missionElapsedTime = timer.getTime()
if file and missionElapsedTime < 5 then
    trigger.action.outText("First five seconds, file exists load values", 1)
    olyLink.updateFromFileDetails(file)
    olyLink.executeFileClose(file)
    olyLink.showAirBaseInfo()
elseif not file and missionElapsedTime < 5 then
    trigger.action.outText("First five seconds, file does not exist, creating file", 1)
    local data = olyLink.compileInitialData()
    olyLink.createOrUpdateFile(data)
    olyLink.executeFileClose(file)
    --trigger.action.outText("Olympus Link: Failed to open file for writing", 1)
else 
    olyLink.checkFileCommands(file)
    olyLink.executeFileClose(file)
    trigger.action.outText(tostring(storeCounter.countIDtoLua), 1,false)
    storeCounter.countIDtoLua = storeCounter.countIDtoLua + 1

    for baseName, baseValues in pairs(olyLink.bases) do
        local dropoffZone = olyLink.getDropoffZoneAtBase(baseName)
        if dropoffZone then
            olyLink.checkIfSuppliesDelivered(baseName)
        end
    end

    olyLink.showAirBaseInfo()
    data = olyLink.missionRunningUpdateSupplyInfo()
    olyLink.createOrUpdateFile(data)
    olyLink.executeFileClose(file)
end


-- TODO dropoff for the FOB, now it works only for Orote
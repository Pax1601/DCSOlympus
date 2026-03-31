-- Enforce the initial value of weapons and fuel to 0 in the controlled bases
function olyLink.setInitialData()
    local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
    for i = 1, #friendlyAirbases do
        Olympus.notify("Checking base " .. friendlyAirbases[i]:getName(), 1)
        if olyLink.contains(olyLink.getBaseNames(), friendlyAirbases[i]:getName()) then
            local baseName = friendlyAirbases[i]:getName()
            local warehouse = friendlyAirbases[i]:getWarehouse()
            local inventory = warehouse:getInventory()

            -- Reset all the weapons to 0
            for k, v in pairs(inventory["weapon"]) do
                if olyLink.contains(olyLink.weaponList, k) then
                    warehouse:setItem(k, 0)
                    if olyLink.bases[baseName].weapons[k] == nil then
                        olyLink.bases[baseName].weapons[k] = 0
                    end
                end
                if olyLink.contains(olyLink.gunsList, k) then
                    warehouse:setItem(k, 0)
                    if olyLink.bases[baseName].weapons[k] == nil then
                        olyLink.bases[baseName].weapons[k] = 0
                    end
                end
                if olyLink.contains(olyLink.ammoList, k) then
                    warehouse:setItem(k, 0)
                    if olyLink.bases[baseName].weapons[k] == nil then
                        olyLink.bases[baseName].weapons[k] = 0
                    end
                end
                if olyLink.contains(olyLink.machineGunList, k) then
                    warehouse:setItem(k, 0)
                    if olyLink.bases[baseName].weapons[k] == nil then
                        olyLink.bases[baseName].weapons[k] = 0
                    end
                end
            end

            -- Initialize the fuel to 0
            warehouse:setLiquidAmount(0, 0)
        end
    end
end

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

function olyLink.periodicFunction()
    olyLink.readCurrentData()

    return timer.getTime() + 1
end
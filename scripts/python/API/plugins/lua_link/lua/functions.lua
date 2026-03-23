
function olyLink.setInitialData()
    local friendlyAirbases = coalition.getAirbases(coalition.side.BLUE)
    for i = 1, #friendlyAirbases do
        if olyLink.contains(olyLink.getBaseNames(), friendlyAirbases[i]:getName()) then
            local warehouse = friendlyAirbases[i]:getWarehouse()
            local inventory = warehouse:getInventory()
            --for k, v in pairs(inventory["weapon"]) do
            --    if olyLink.contains(olyLink.weaponList, k) then
            --        warehouse:setItem(k, 0)
            --    end
            --    if olyLink.contains(olyLink.gunsList, k) then
            --        warehouse:setItem(k, 0)
            --    end
            --end
            --local weapons = ""
            --local warehouse = friendlyAirbases[i]:getWarehouse()
            --local inventory = warehouse:getInventory()
            --local liquidAmount = warehouse:getLiquidAmount(0)
            --local baseName = friendlyAirbases[i]:getName()
            --local weapons = ""
            --local hasWeapons = false

            --for k, v in pairs(inventory["weapon"]) do
            --    hasWeapons = true
            --    weapons = weapons
            --        .. "    <item>\n" 
            --        .. "      <name>" .. k .. "</name>\n"
            --        .. "      <quantity>" .. v .. "</quantity>\n"
            --        .. "    </item>\n"
            --end

        end
    end
end
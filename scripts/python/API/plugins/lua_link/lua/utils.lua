-- UTILS ----------------------------------------------------
function olyLink.contains(list, value)
    for _, v in ipairs(list) do
        if v == value then
            return true
        end
    end
    return false
end

function olyLink.getBaseNames()
    local baseNames = {}
    for baseName, _ in pairs(olyLink.bases) do
        table.insert(baseNames, baseName)
    end
    return baseNames
end

function olyLink.formatFrequency(frequency)

end
-- Custom Olympus mod registration file (clean sample).
-- Add your mission-specific mods below or let the Mod Manager generate them automatically.

local function log(message)
    if env and env.info then
        env.info(string.format("[Olympus Mods] %s", message))
    end
end

local lfs = lfs or require("lfs")

local function resolvePath(relativePath)
    if relativePath:match("^%a:[\\/]") or relativePath:sub(1, 1) == "\\" or relativePath:sub(1, 1) == "/" then
        return relativePath
    end
    if lfs and lfs.writedir then
        return lfs.writedir() .. relativePath
    end
    return relativePath
end

local function ensurePayloadRoot(unitType)
    Olympus.modsUnitPayloads = Olympus.modsUnitPayloads or {}
    Olympus.modsUnitPayloads[unitType] = Olympus.modsUnitPayloads[unitType] or {}
    return Olympus.modsUnitPayloads[unitType]
end

local function registerPayload(unitType, payloadName, pylons)
    local store = ensurePayloadRoot(unitType)
    store[payloadName] = pylons or {}
end

local function registerCleanPayload(unitType, payloadName)
    registerPayload(unitType, payloadName or "Clean Ferry", {})
end

local function loadPayloadFile(unitType, relativePath)
    local absolutePath = resolvePath(relativePath)
    local chunk, loadError = loadfile(absolutePath)
    if not chunk then
        log(string.format("Unable to load %s payload file (%s): %s", tostring(unitType), absolutePath, tostring(loadError)))
        return
    end
    local ok, payloadTable = pcall(chunk)
    if not ok then
        log(string.format("Execution error loading payloads for %s: %s", tostring(unitType), tostring(payloadTable)))
        return
    end
    if type(payloadTable) ~= "table" then
        log(string.format("Payload file %s did not return a table", absolutePath))
        return
    end
    local payloads = payloadTable.payloads or payloadTable
    local name = unitType or payloadTable.unitType or payloadTable.name
    if not name then
        log(string.format("Payload file %s does not define a valid unitType/name", absolutePath))
        return
    end
    for _, payload in ipairs(payloads) do
        if payload.name and payload.pylons then
            local pylons = {}
            for index, data in pairs(payload.pylons) do
                local slot = data.num or index
                pylons[slot] = { ["CLSID"] = data.CLSID }
            end
            registerPayload(name, payload.name, pylons)
        end
    end
end

-- Default sample entries (A-4E-C + Bronco example from Olympus docs)
Olympus.modsList = {
    ["A-4E-C"] = "Aircraft",
    ["Bronco-OV-10A"] = "Aircraft"
}

Olympus.modsUnitPayloads = {
    ["A-4E-C"] = {
        ["FFAR Mk1 HE *76, Fuel 300G"] = {
            [1] = { ["CLSID"] = "{LAU3_FFAR_MK1HE}" },
            [2] = { ["CLSID"] = "{LAU3_FFAR_MK1HE}" },
            [3] = { ["CLSID"] = "{LAU3_FFAR_MK1HE}" },
            [4] = { ["CLSID"] = "{LAU3_FFAR_MK1HE}" },
            [5] = { ["CLSID"] = "{DFT-300gal}" }
        }
    }
}

registerCleanPayload("Bronco-OV-10A", "Clean Ferry")

local function loadGeneratedMods()
    if not lfs or not lfs.writedir then
        return
    end
    local generatedPath = lfs.writedir() .. "Mods\\Services\\Olympus\\scripts\\mods_generated.lua"
    local chunk, err = loadfile(generatedPath)
    if not chunk then
        if err then
            log(string.format("Unable to load generated mods file: %s", err))
        end
        return
    end
    local ok, data = pcall(chunk)
    if not ok or type(data) ~= "table" then
        log("Generated mods file returned invalid data")
        return
    end
    if data.modsList then
        for modName, category in pairs(data.modsList) do
            Olympus.modsList[modName] = category
        end
    end
    if data.modsUnitPayloads then
        Olympus.modsUnitPayloads = Olympus.modsUnitPayloads or {}
        for unitType, payloads in pairs(data.modsUnitPayloads) do
            Olympus.modsUnitPayloads[unitType] = payloads
        end
    end
    if data.payloadFiles then
        for unitType, relativePath in pairs(data.payloadFiles) do
            if type(unitType) == "string" and type(relativePath) == "string" then
                loadPayloadFile(unitType, relativePath)
            end
        end
    end
end

loadGeneratedMods()

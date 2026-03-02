hs = {}
hs.unitName = "Test"
hs.scanRadius = 20
hs.scanRepeats = 8
hs.scanInterval = 0.005
hs.dumpChunkSize = 3500 
hs.ipDistance = 10000
hs.napalmCounter = 1
hs.napalmExplosionPower = 10
hs.napalmDelay = 0.01
hs.napalmCleanupDelay = 0.12
hs.napalmFireCounter = 1
hs.napalmFireSize = 3
hs.napalmFireDuration = 20

function hs.getAmmoSummary(unitObj)
    local ammo = unitObj:getAmmo() or {}
    local parts = {}
    for i = 1, #ammo do
        local entry = ammo[i] or {}
        local desc = entry.desc or {}
        local name = desc.typeName or desc.displayName or ("slot_" .. tostring(i))
        parts[#parts + 1] = string.format("%s=%s", tostring(name), tostring(entry.count or 0))
    end
    return table.concat(parts, " | ")
end

function hs.safeCall(obj, methodName)
    if not obj or not obj[methodName] then
        return "<unavailable>"
    end
    local ok, value = pcall(obj[methodName], obj)
    if not ok then
        return "<error>"
    end
    return value
end

function hs.dumpObjData(label, data)
    local text = ""
    if mist and mist.utils and mist.utils.tableShow then
        text = mist.utils.tableShow(data, label)
    else
        text = tostring(data)
    end

    local i = 1
    local part = 1
    while i <= #text do
        local chunk = string.sub(text, i, i + hs.dumpChunkSize - 1)
        trigger.action.outText(label .. " part " .. tostring(part) .. "\n" .. chunk, 0.9, true)
        i = i + hs.dumpChunkSize
        part = part + 1
    end
end

function hs.napalmExplode(vec3)
    trigger.action.explosion(vec3, hs.napalmExplosionPower)
end

function hs.napalmDestroy(staticName)
    local staticObj = StaticObject.getByName(staticName)
    if staticObj then
        staticObj:destroy()
    end
end

function hs.napalmStopFire(smokeName)
    trigger.action.effectSmokeStop(smokeName)
end

function hs.napalmStartFire(vec3)
    local smokeName = "napalmFire" .. tostring(hs.napalmFireCounter)
    hs.napalmFireCounter = hs.napalmFireCounter + 1

    trigger.action.effectSmokeBig(vec3, hs.napalmFireSize, 1, smokeName)
    timer.scheduleFunction(hs.napalmStopFire, smokeName, timer.getTime() + hs.napalmFireDuration)

    return smokeName
end

function hs.spawnNapalm(vec3, countryId)
    local napeName = "napalmStrike" .. tostring(hs.napalmCounter)
    hs.napalmCounter = hs.napalmCounter + 1
    local fireName = hs.napalmStartFire(vec3)

    local staticSpawned = false
    local staticSpawnError = nil
    local staticCountryId = countryId

    if (not staticCountryId) and country and country.id then
        staticCountryId = country.id.CJTF_RED or country.id.RUSSIA or country.id.USA
    end

    if coalition and coalition.addStaticObject and staticCountryId then
        local okSpawn, spawnResult = pcall(coalition.addStaticObject, staticCountryId, {
            category = "Fortifications",
            hidden = true,
            name = napeName,
            type = "Fuel tank",
            x = vec3.x,
            y = vec3.z,
            heading = 0,
            dead = false
        })

        staticSpawned = okSpawn and (spawnResult ~= nil)
        if not staticSpawned then
            staticSpawnError = okSpawn and "<addStaticObject_nil_result>" or tostring(spawnResult)
        end
    else
        staticSpawnError = "<coalition_addStaticObject_unavailable_or_country_missing>"
    end

    timer.scheduleFunction(function()
        hs.napalmExplode(vec3)
        return nil
    end, nil, timer.getTime() + hs.napalmDelay)

    if staticSpawned then
        timer.scheduleFunction(function()
            hs.napalmDestroy(napeName)
            return nil
        end, nil, timer.getTime() + hs.napalmCleanupDelay)
    end

    return {
        staticName = napeName,
        fireName = fireName,
        staticCountryId = staticCountryId,
        staticSpawned = staticSpawned,
        staticSpawnError = staticSpawnError,
        explosionScheduled = true
    }
end

function hs.dumpWeaponObj(obj)
    local dump = {
        objectRef = tostring(obj),
        getName = hs.safeCall(obj, "getName"),
        getTypeName = hs.safeCall(obj, "getTypeName"),
        getCategory = hs.safeCall(obj, "getCategory"),
        getDesc = hs.safeCall(obj, "getDesc"),
        getPoint = hs.safeCall(obj, "getPoint"),
        getVelocity = hs.safeCall(obj, "getVelocity"),
        getPosition = hs.safeCall(obj, "getPosition"),
        getLife = hs.safeCall(obj, "getLife"),
        isExist = hs.safeCall(obj, "isExist"),
        getLauncher = hs.safeCall(obj, "getLauncher"),
        getTarget = hs.safeCall(obj, "getTarget")
    }

    local okPoint, origin = pcall(obj.getPoint, obj)
    local okVelocity, velocity = pcall(obj.getVelocity, obj)

    if okPoint and origin and okVelocity and velocity then
        local vx = tonumber(velocity.x) or 0
        local vy = tonumber(velocity.y) or 0
        local vz = tonumber(velocity.z) or 0
        local speed = math.sqrt(vx * vx + vy * vy + vz * vz)

        if speed > 0 then
            local direction = {
                x = vx / speed,
                y = vy / speed,
                z = vz / speed
            }

            local okIP, ip = pcall(land.getIP, origin, direction, hs.ipDistance)
            local launcherCountryId = nil
            local okLauncher, launcher = pcall(obj.getLauncher, obj)
            if okLauncher and launcher and launcher.getCountry then
                local okCountry, countryValue = pcall(launcher.getCountry, launcher)
                if okCountry then
                    launcherCountryId = countryValue
                end
            end

            dump.landGetIP = {
                origin = origin,
                direction = direction,
                distance = hs.ipDistance,
                result = (okIP and ip) or "<no intercept>",
                callOk = okIP
            }

            if okIP and ip and ip.x and ip.y and ip.z then
                local okNapalm, napalmResult = pcall(hs.spawnNapalm, ip, launcherCountryId)
                dump.landGetIP.napalm = okNapalm and napalmResult or {
                    staticSpawned = false,
                    explosionScheduled = false,
                    error = tostring(napalmResult)
                }
            else
                dump.landGetIP.napalm = {
                    staticSpawned = false,
                    explosionScheduled = false,
                    error = "<invalid_intercept_point>"
                }
            end
        else
            dump.landGetIP = "<velocity_zero>"
        end
    else
        dump.landGetIP = "<origin_or_velocity_unavailable>"
    end

    hs.dumpObjData("weaponObj", dump)
    
end

function hs.getWorldSearchSummary(unitObj)
    local point = unitObj:getPoint()
    local volume = {
        id = world.VolumeType.SPHERE,
        params = { point = point, radius = hs.scanRadius }
    }

    local firstWeaponName = nil

    world.searchObjects(Object.Category.WEAPON, volume, function(obj)
        firstWeaponName = tostring((obj.getTypeName and obj:getTypeName()) or "<unknown>")
        hs.dumpWeaponObj(obj)
        return false
    end)

    if not firstWeaponName then
        return string.format("WORLD r=%s WEAPON=0", tostring(hs.scanRadius))
    end
    return string.format("WORLD r=%s WEAPON=1\nWEAPON: %s", tostring(hs.scanRadius), firstWeaponName)
end

function hs.startWeaponScanBurst(unitObj, weaponName)
    local repeats = hs.scanRepeats
    local interval = hs.scanInterval

    if unitObj and unitObj:isExist() then
        hs.getWorldSearchSummary(unitObj)
        repeats = repeats - 1
        if repeats <= 0 then
            return
        end
    end

    local function scanTick(_, now)
        if not unitObj or not unitObj:isExist() then
            return nil
        end

        hs.getWorldSearchSummary(unitObj)

        repeats = repeats - 1
        if repeats <= 0 then
            return nil
        end
        return now + interval
    end

    timer.scheduleFunction(scanTick, nil, timer.getTime() + interval)
end

hs.eventHandler = {}
function hs.eventHandler:onEvent(event)
    if not event or not event.initiator then
        return
    end

    local unitObj = Unit.getByName(hs.unitName)
    if not unitObj or event.initiator ~= unitObj then
        return
    end

    if event.id == world.event.S_EVENT_SHOOTING_START then
        -- trigger.action.outText(
        --     "FIRING: " .. tostring(event.weapon_name or "<unknown>")
        --     .. "\nAMMO: " .. hs.getAmmoSummary(unitObj),
        --     4,
        --     false
        -- )
        if event.weapon_name == "M_60" then
             hs.startWeaponScanBurst(unitObj, event.weapon_name)
        end
       
    end
end

world.addEventHandler(hs.eventHandler)

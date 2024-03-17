local _prevLuaExportStart = LuaExportStart
local _prevLuaExportBeforeNextFrame = LuaExportBeforeNextFrame
local _prevLuaExportStop = LuaExportStop

local server = nil
local port = 3003
local headers = "Access-Control-Allow-Private-Network: true\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: *\r\nAccess-Control-Allow-Headers: *\r\nAccess-Control-Max-Age: 86400\r\nVary: Accept-Encoding, Origin\r\n\r\n"

function startTCPServer()
    log.write('OLYMPUSCAMERACONTROL.EXPORT.LUA', log.INFO, 'Starting TCP Server')
	package.path  = package.path..";"..lfs.currentdir().."/LuaSocket/?.lua"
	package.cpath = package.cpath..";"..lfs.currentdir().."/LuaSocket/?.dll"

	socket = require("socket")

	server = assert(socket.bind("127.0.0.1", port))
    if server then
        server:setoption("tcp-nodelay", true) 
        server:settimeout(0)
        log.write('OLYMPUSCAMERACONTROL.EXPORT.LUA', log.INFO, 'TCP Server listening on port ' .. port)
    else
        log.write('OLYMPUSCAMERACONTROL.EXPORT.LUA', log.INFO, 'TCP Server did not start successfully')
    end
end

function receiveTCP()
    if server then 
        -- Accept a new connection without blocking
        local client = server:accept()

        if client then 
            -- Set the timeout of the connection to 5ms
            client:settimeout(0.005)
            client:setoption("tcp-nodelay", true) 

            local acc = ""
            local data = ""

            log.write('OLYMPUSCAMERACONTROL.EXPORT.LUA', log.INFO, 'CONNECTION')
            
            -- Start receiving data, accumulate it in acc
            while data ~= nil do
                -- Receive a new line
                data, err, partial = client:receive('*l')
                if data then
                    -- If we receive an empty string it means the header section of the message is over
                    if data == "" then
                        -- Is this an OPTIONS request?
                        if string.find(acc, "OPTIONS") ~= nil then
                            client:send("HTTP/1.1 204 OK\r\n" .. headers)
                            client:close()

                        -- Is this a PUT request?
                        elseif string.find(acc, "POST") ~= nil then
                            -- Extract the length of the body
                            local contentLength = string.match(acc, "Content%-Length: (%d+)")
                            if contentLength ~= nil then
                                -- Receive the body
                                body, err, partial = client:receive(tonumber(contentLength))
                                if body ~= nil then
                                    local lat = string.match(body, '"lat":%s*([%+%-]?[%d%.]+)%s*[},]')
                                    local lng = string.match(body, '"lng":%s*([%+%-]?[%d%.]+)%s*[},]')
                                    local alt = string.match(body, '"alt":%s*([%+%-]?[%d%.]+)%s*[},]')
                                    local mode = string.match(body, '"mode":%s*"(%a+)"%s*[},]')

                                    if lat ~= nil and lng ~= nil then
                                        client:send("HTTP/1.1 200 OK\r\n" .. "Content-Type: application/json\r\n" .. headers)
                                        
                                        local position = {}
                                        position["lat"] = tonumber(lat)
                                        position["lng"] = tonumber(lng)
                                        if alt ~= nil then
                                            position["alt"] = tonumber(alt)
                                        end

                                        -- F11 view
                                        if mode == "live" or mode == nil then
                                            LoSetCommand(158)
                                        -- F10 view
                                        elseif mode == "map" then
                                            LoSetCommand(15)
                                        end

                                        client:send(setCameraPosition(position))
                                        client:close()
                                    else
                                        client:send("HTTP/1.1 500 ERROR\r\n" .. headers)
                                        client:close()
                                    end
                                else
                                    log.write('OLYMPUSCAMERACONTROL.EXPORT.LUA', log.ERROR, err)
                                end
                            end
                            client:close()
                            break
                        end
                    else
                        -- Keep accumulating the incoming data
                        acc = acc .. " " .. data
                    end
                end
            end
        end
    end
end

function stopTCPServer()
    if server then 
		log.write('OLYMPUSCAMERACONTROL.EXPORT.LUA', log.INFO, 'Stopping TCP Server')
		server:close()
	end
    server = nil
end

function setCameraPosition(position)   
    -- Get the old camera position
    local oldPos = LoGetCameraPosition()

    -- Extract the commanded position
    local point = LoGeoCoordinatesToLoCoordinates(position.lng, position.lat)
    local pointNorth = LoGeoCoordinatesToLoCoordinates(position.lng, position.lat + 0.1)

    -- Compute the local map rotation and scale and send it back to the server
    local rotation = math.atan2(pointNorth.z - point.z, pointNorth.x - point.x)
    
    -- If no altitude is provided, preserve the current camera altitude
    local altitude = nil
    if position.alt == nil then
        altitude = oldPos.p.y
    else
        altitude = position.alt
    end

    -- Set the camera position
    local pos = 
    {
        x = {x = 0, y = -1, z = 0},	                
        y = {x = 1, y = 0, z = 0},	                
        z = {x = 0, y = 0, z = 1},	                
        p = {x = point.x, y = altitude, z = point.z}   
    }
    LoSetCameraPosition(pos)

    return '{"northRotation": ' .. rotation .. '}'
end

LuaExportStart = function()
    package.path  = package.path..";"..lfs.currentdir().."/LuaSocket/?.lua"
	package.cpath = package.cpath..";"..lfs.currentdir().."/LuaSocket/?.dll"
	
    startTCPServer()
	
	-- call original
    if _prevLuaExportStart then
        _status, _result = pcall(_prevLuaExportStart)
        if not _status then
            log.write('OLYMPUSCAMERACONTROL.EXPORT.LUA', log.ERROR, 'ERROR Calling other LuaExportStart from another script', _result)
        end
    end
end

LuaExportBeforeNextFrame = function()
    receiveTCP()
	
	-- call original
    if _prevLuaExportBeforeNextFrame then
        _status, _result = pcall(_prevLuaExportBeforeNextFrame)
        if not _status then
            log.write('OLYMPUSCAMERACONTROL.EXPORT.LUA', log.ERROR, 'ERROR Calling other LuaExportBeforeNextFrame from another script', _result)
        end
    end
end

LuaExportStop = function()
	stopTCPServer()

	-- call original
    if _prevLuaExportStop then
        _status, _result = pcall(_prevLuaExportStop)
        if not _status then
            log.write('OLYMPUSCAMERACONTROL.EXPORT.LUA', log.ERROR, 'ERROR Calling other LuaExportStop from another script', _result)
        end
    end
end

function serializeTable(val, name, skipnewlines, depth)
    skipnewlines = skipnewlines or false
    depth = depth or 0

    local tmp = string.rep(" ", depth)
    if name then 
		if type(name) == "number" then
			tmp = tmp .. "[" .. name .. "]" .. " = " 
		else
			tmp = tmp .. name  .. " = " 
		end
	end

    if type(val) == "table" then
        tmp = tmp .. "{" .. (not skipnewlines and "\n" or "")
        for k, v in pairs(val) do
            tmp =  tmp .. serializeTable(v, k, skipnewlines, depth + 1) .. "," .. (not skipnewlines and "\n" or "")
        end
        tmp = tmp .. string.rep(" ", depth) .. "}"
    elseif type(val) == "number" then
        tmp = tmp .. tostring(val)
    elseif type(val) == "string" then
        tmp = tmp .. string.format("%q", val)
    elseif type(val) == "boolean" then
        tmp = tmp .. (val and "true" or "false")
    else
        tmp = tmp .. "\"[inserializeable datatype:" .. type(val) .. "]\""
    end

    return tmp
end
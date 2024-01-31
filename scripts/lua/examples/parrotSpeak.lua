--------------------------------THIS FIRST BIT IS THE SRS CODE BLOCK-------------------
-------------------- first 4 things need to be set correctly for the server, they are for ours, we don't do the google creds yet

STTS = {}
-- FULL Path to the FOLDER containing DCS-SR-ExternalAudio.exe - EDIT TO CORRECT FOLDER
STTS.DIRECTORY = "C:\\Users\\Administrator\\Desktop\\DCS\\SRS Refugees"

STTS.SRS_PORT = 5002 -- LOCAL SRS PORT - DEFAULT IS 5002
STTS.GOOGLE_CREDENTIALS = "C:\\Users\\Ciaran\\Downloads\\googletts.json"

-- DONT CHANGE THIS UNLESS YOU KNOW WHAT YOU'RE DOING
STTS.EXECUTABLE = "DCS-SR-ExternalAudio.exe"

local random = math.random
function STTS.uuid()
    local template ='yxxx-xxxxxxxxxxxx'
    return string.gsub(template, '[xy]', function (c)
        local v = (c == 'x') and random(0, 0xf) or random(8, 0xb)
        return string.format('%x', v)
    end)
end

function STTS.round(x, n)
    n = math.pow(10, n or 0)
    x = x * n
    if x >= 0 then x = math.floor(x + 0.5) else x = math.ceil(x - 0.5) end
    return x / n
end

function STTS.getSpeechTime(length,speed,isGoogle)
    -- Function returns estimated speech time in seconds

    -- Assumptions for time calc: 100 Words per min, avarage of 5 letters for english word
    -- so 5 chars * 100wpm = 500 characters per min = 8.3 chars per second
    -- so lengh of msg / 8.3 = number of seconds needed to read it. rounded down to 8 chars per sec
    -- map function:  (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min

    local maxRateRatio = 3 

    speed = speed or 1.0
    isGoogle = isGoogle or false

    local speedFactor = 1.0
    if isGoogle then
        speedFactor = speed
    else
        if speed ~= 0 then
            speedFactor = math.abs(speed) * (maxRateRatio - 1) / 10 + 1
        end
        if speed < 0 then
            speedFactor = 1/speedFactor
        end
    end

    local wpm = math.ceil(100 * speedFactor)
    local cps = math.floor((wpm * 5)/60)

    if type(length) == "string" then
        length = string.len(length)
    end

    return math.ceil(length/cps)
end

function STTS.TextToSpeech(message,freqs,modulations, volume,name, coalition,point, speed,gender,culture,voice, googleTTS )
    if os == nil or io == nil then 
        env.info("[DCS-STTS] LUA modules os or io are sanitized. skipping. ")
        return 
    end

	speed = speed or 1
	gender = gender or "female"
	culture = culture or ""
	voice = voice or ""


    message = message:gsub("\"","\\\"")
    
    local cmd = string.format("start /min \"\" /d \"%s\" /b \"%s\" -f %s -m %s -c %s -p %s -n \"%s\" -h", STTS.DIRECTORY, STTS.EXECUTABLE, freqs, modulations, coalition,STTS.SRS_PORT, name )
    
    if voice ~= "" then
    	cmd = cmd .. string.format(" -V \"%s\"",voice)
    else

    	if culture ~= "" then
    		cmd = cmd .. string.format(" -l %s",culture)
    	end

    	if gender ~= "" then
    		cmd = cmd .. string.format(" -g %s",gender)
    	end
    end

    if googleTTS == true then
        cmd = cmd .. string.format(" -G \"%s\"",STTS.GOOGLE_CREDENTIALS)
    end

    if speed ~= 1 then
        cmd = cmd .. string.format(" -s %s",speed)
    end

    if volume ~= 1.0 then
        cmd = cmd .. string.format(" -v %s",volume)
    end

    if point and type(point) == "table" and point.x then
        local lat, lon, alt = coord.LOtoLL(point)

        lat = STTS.round(lat,4)
        lon = STTS.round(lon,4)
        alt = math.floor(alt)

        cmd = cmd .. string.format(" -L %s -O %s -A %s",lat,lon,alt)        
    end

    cmd = cmd ..string.format(" -t \"%s\"",message)

    if string.len(cmd) > 255 then
        local filename = os.getenv('TMP') .. "\\DCS_STTS-" .. STTS.uuid() .. ".bat"
        local script = io.open(filename,"w+")
        script:write(cmd .. " && exit" )
        script:close()
        cmd = string.format("\"%s\"",filename)
        timer.scheduleFunction(os.remove, filename, timer.getTime() + 1) 
    end

    if string.len(cmd) > 255 then
         env.info("[DCS-STTS] - cmd string too long")
         env.info("[DCS-STTS] TextToSpeech Command :\n" .. cmd.."\n")
    end
    os.execute(cmd)

    return STTS.getSpeechTime(message,speed,googleTTS)

end

function STTS.PlayMP3(pathToMP3,freqs,modulations, volume,name, coalition,point )

    local cmd = string.format("start \"\" /d \"%s\" /b /min \"%s\" -i \"%s\" -f %s -m %s -c %s -p %s -n \"%s\" -v %s -h", STTS.DIRECTORY, STTS.EXECUTABLE, pathToMP3, freqs, modulations, coalition,STTS.SRS_PORT, name, volume )
    
    if point and type(point) == "table" and point.x then
        local lat, lon, alt = coord.LOtoLL(point)

        lat = STTS.round(lat,4)
        lon = STTS.round(lon,4)
        alt = math.floor(alt)

        cmd = cmd .. string.format(" -L %s -O %s -A %s",lat,lon,alt)        
    end

    env.info("[DCS-STTS] MP3/OGG Command :\n" .. cmd.."\n")
    os.execute(cmd)

end

------------------------THIS BIT IS THE CODE YOU'D RUN IN GAME

tts = {}
tts.words = "All players, all players, AO update in 5 Magic to all players AO update as follows	Weather over North ranges is good, recommending full up war. altimeter 3 0 decimal 1 2 , flare restrictions above 5000,in the MOA's and burnout by 100 ft in western ranges. Chaff below 20,000 for all playersAir picture is multiple groups bandits forming a north south CAP 60 miles north west of bullseye, no SAM,manpad or triple A. All units are approved to start moving into tracks for exercise start, exercise commences in 5 minutes"

tts.atis = "All players, all players, AO update in 5 Magic to all players AO update as follows	Weather over North ranges is good, recommending full up war. altimeter 3 0 decimal 1 2 , flare restrictions above 5000,in the MOA's and burnout by 100 ft in western ranges. Chaff below 20,000 for all playersAir picture is multiple groups bandits forming a north south CAP 60 miles north west of bullseye, no SAM,manpad or triple A. All units are approved to start moving into tracks for exercise start, exercise commences in 5 minutes"

function tts.notify(message, displayFor)
	 trigger.action.outText(message, displayFor)
end

function tts.normal ()
	STTS.TextToSpeech(tts.words,"251","AM","1.0","SRS",2)
end

function tts.russian ()
	STTS.TextToSpeech(tts.words,"251","AM","1.0","SRS",2,null,1,"female","ru-RU","Microsoft Irina Desktop")
end


do	
	longRangeShots = missionCommands.addSubMenu("Crash checks")
		missionCommands.addCommand ("Speak", longRangeShots, tts.normal)
		missionCommands.addCommand ("Speak russian", longRangeShots, tts.russian)

end

tts.notify("crashTest.lua loaded", 2)


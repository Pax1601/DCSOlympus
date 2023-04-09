--Spawn a SAM integrated with IADS
--Spawn a normal SAM
--SAM bubble shields

samSim = {}
samSim.samSuffix = 1

do -- needs to go early on
    redIADS = SkynetIADS:create('Red')
	redIADS:setUpdateInterval(5)
	redIADS:activate()
	--redIADS:addRadioMenu()  
end

function samSim.genSAten() --gens an SA 10 as you can imagine, 
		unit = Unit.getByName("Test")
		local pointVec3Gl = 	unit:getPosition().p	-- this is just to find where my aircraft is and whack an SA10 below it, lazy not relevant			
		local isHiddenCheck =  math.random(100)
			if isHiddenCheck > 10 then		
				isHidden = false
			else
				isHidden = true -- fairly obvious hides from F10 and F7 view
			end 
		mist.dynAdd(
							{
								country = 'USSR',
								category = 'vehicle',
								name = "SAM " .. samSim.samSuffix,
								groupName = "SAM " .. samSim.samSuffix,
								groupId = 10000+samSim.samSuffix,
								hidden = isHidden,
								units = 
								{	[1] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "S-300PS 40B6MD sr", --search radar needs to be first always for avoiding a skynet bug
                                        ["y"] = pointVec3Gl.z + 50,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 0,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [1]
									[2] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "S-300PS 40B6M tr",
                                        ["y"] = pointVec3Gl.z,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 4.7123889803847,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [2]

                                    [3] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "S-300PS 54K6 cp",
                                        ["y"] = pointVec3Gl.z + 100,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 3.1415926535898,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [3]
                                    [4] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "S-300PS 64H6E sr",
                                        ["y"] = pointVec3Gl.z - 50,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 3.1415926535898,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [4]
                                    [5] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "S-300PS 5P85C ln",
                                        ["y"] = pointVec3Gl.z +200 ,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 3.1415926535898,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [5]
                                    [6] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "S-300PS 5P85C ln",
                                        ["y"] = pointVec3Gl.z -200,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 3.3161255787892,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [6]
                                    [7] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "S-300PS 5P85C ln",
                                        ["y"] = pointVec3Gl.z ,
                                        ["x"] = pointVec3Gl.x + 200,
                                        ["heading"] = 2.9670597283904,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [7]
                                    [8] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Excellent",
                                        ["type"] = "S-300PS 5P85C ln",
                                        ["y"] = pointVec3Gl.z,
                                        ["x"] = pointVec3Gl.x -200,
                                        ["heading"] = 0,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [8]
                                    [9] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "generator_5i57",
                                        ["y"] = pointVec3Gl.z +200,
                                        ["x"] = pointVec3Gl.x + 200,
                                        ["heading"] = 6.1086523819802,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [9]
                                    [10] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "ATZ-5",
                                        ["y"] = pointVec3Gl.z -200,
                                        ["x"] = pointVec3Gl.x -200,
                                        ["heading"] = 0.17453292519943,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [10]
                                    [11] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "ATZ-5",
                                        ["y"] = pointVec3Gl.z +550,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 0,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [11]
									[12] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "GAZ-66",
                                        ["y"] = pointVec3Gl.z +580,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 0,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [12]
									[13] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "ATZ-60_Maz",
                                        ["y"] = pointVec3Gl.z +600,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 0,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [13]
									[14] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "KAMAZ Truck",
                                        ["y"] = pointVec3Gl.z +500,
                                        ["x"] = pointVec3Gl.x + 20,
                                        ["heading"] = 0,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [14]									
								}, -- end of units
							} -- end of function
							)
		redIADS:addSAMSite("SAM " .. samSim.samSuffix) --skynet bit
		local detectChance = math.random(50,90) 
		local goLiveRange = math.random(50,90)
		local harmStop = math.random(2)
		if harmStop == 1 then
			harmStopping = true
		else
			harmStopping = false
		end
		redIADS:getSAMSiteByGroupName("SAM " .. samSim.samSuffix):setHARMDetectionChance(detectChance) -- doesn't bloody work no idea, don't care want to reinvent this myself
        redIADS:getSAMSiteByGroupName("SAM " .. samSim.samSuffix):setGoLiveRangeInPercent(goLiveRange) -- doesn't bloody work no idea, don't care want to reinvent this myself
		redIADS:getSAMSiteByGroupName("SAM " .. samSim.samSuffix):setCanEngageHARM(harmStopping) -- doesn't bloody work no idea, don't care want to reinvent this myself
		
		samSim.samSuffix = samSim.samSuffix + 1
end

function samSim.genSAtwo()
		unit = Unit.getByName("Test")
		local pointVec3Gl = 	unit:getPosition().p	-- this is just to find where my aircraft is and whack an SA10 below it, lazy not relevant			
		
		local isHiddenCheck =  math.random(100)
			if isHiddenCheck > 50 then		
				isHidden = false
			else
				isHidden = true
			end 
		
		mist.dynAdd(
							{
								country = 'USSR',
								category = 'vehicle',
								name = "SAM " .. samSim.samSuffix,
								groupName = "SAM " .. samSim.samSuffix,
								groupId = 10000+samSim.samSuffix,
								hidden = isHidden,
								units = 
								{
									[1] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "SNR_75V",
                                        ["y"] = pointVec3Gl.z,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 4.7123889803847,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [1]
									[2] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "S_75M_Volhov",
                                        ["y"] = pointVec3Gl.z + 50,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 0,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [2]
                                    [3] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "S_75M_Volhov",
                                        ["y"] = pointVec3Gl.z + 100,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 3.1415926535898,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [3]
                                    [4] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "S_75M_Volhov",
                                        ["y"] = pointVec3Gl.z - 50,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 3.1415926535898,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [4]
                                    [5] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "S_75M_Volhov",
                                        ["y"] = pointVec3Gl.z +200 ,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 3.1415926535898,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [5]
                                    [6] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "S_75M_Volhov",
                                        ["y"] = pointVec3Gl.z -200,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 3.3161255787892,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [6]
                                    [7] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "SKP-11",
                                        ["y"] = pointVec3Gl.z ,
                                        ["x"] = pointVec3Gl.x + 200,
                                        ["heading"] = 2.9670597283904,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [7]
                                    [8] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Excellent",
                                        ["type"] = "SKP-11",
                                        ["y"] = pointVec3Gl.z,
                                        ["x"] = pointVec3Gl.x -200,
                                        ["heading"] = 0,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [8]
                                    [9] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "p-19 s-125 sr",
                                        ["y"] = pointVec3Gl.z +200,
                                        ["x"] = pointVec3Gl.x + 200,
                                        ["heading"] = 6.1086523819802,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [9]
                                    [10] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "Ural-4320 APA-5D",
                                        ["y"] = pointVec3Gl.z -200,
                                        ["x"] = pointVec3Gl.x -200,
                                        ["heading"] = 0.17453292519943,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [10]
                                    [11] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "ATMZ-5",
                                        ["y"] = pointVec3Gl.z +550,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 0,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [11]
									[12] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "Ural-4320T",
                                        ["y"] = pointVec3Gl.z +580,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 0,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [12]
									[13] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "Ural-4320T",
                                        ["y"] = pointVec3Gl.z +600,
                                        ["x"] = pointVec3Gl.x,
                                        ["heading"] = 0,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [13]
									[14] = 
                                    {
                                        ["transportable"] = 
                                        {
                                            ["randomTransportable"] = false,
                                        }, -- end of ["transportable"]
                                        ["skill"] = "Random",
                                        ["type"] = "ATMZ-5",
                                        ["y"] = pointVec3Gl.z +500,
                                        ["x"] = pointVec3Gl.x + 20,
                                        ["heading"] = 0,
                                        ["playerCanDrive"] = true,
										livery_id = "desert",										
                                    }, -- end of [14]									
								}, -- end of units
							} -- end of function
							)
		redIADS:addSAMSite("SAM " .. samSim.samSuffix)
		local detectChance = math.random(75,100)
		local goLiveRange = math.random(50,90)
		redIADS:getSAMSiteByGroupName("SAM " .. samSim.samSuffix):setHARMDetectionChance(detectChance)
        redIADS:getSAMSiteByGroupName("SAM " .. samSim.samSuffix):setGoLiveRangeInPercent(goLiveRange)
		
		samSim.samSuffix = samSim.samSuffix + 1
end

function samSim.genCMD()			
			unit = Unit.getByName("Test")
			local pointVec3Gl = unit:getPosition().p	
			mist.dynAddStatic(
					{
						country = 'USSR',
						category = 'Fortifications',
						name = "CMD " .. samSim.samSuffix,
						type = ".Command Center",
						x = pointVec3Gl.x,
						y = pointVec3Gl.z,
						heading = math.pi*3/2,
					} -- end of function
				)
			nameToAdd = "CMD ".. samSim.samSuffix --.. " " .. "unit1"
			local commandCenter = StaticObject.getByName(nameToAdd)
			redIADS:addCommandCenter(commandCenter)
			redIADS = SkynetIADS:create(nameToAdd)
			redIADS:activate()
			samSim.samSuffix = samSim.samSuffix + 1
end

function samSim.genEWR()
			unit = Unit.getByName("Test")
			local pointVec3Gl = unit:getPosition().p
			mist.dynAdd(
							{
								country = 'USSR',
								category = 'vehicle',
								groupName = "EW " .. samSim.samSuffix,
								name = "EW " .. samSim.samSuffix,
								groupId = 20000+samSim.samSuffix,
								units = 
								{
									[1] = 
									{
										["skill"] = "Random",
                                        ["type"] = "55G6 EWR",
                                        ["y"] = pointVec3Gl.z,
                                        ["x"] = pointVec3Gl.x,
										livery_id = "",
										["heading"] = 0,
                                        ["playerCanDrive"] = true,
									},
								}, -- end of units
							} -- end of function
						)
			nameToAdd = "EW ".. samSim.samSuffix .. " " .. "unit1" -- oddly this is the unit name not the group, if you don't use this naming convention change it
			redIADS:addEarlyWarningRadar(nameToAdd)
			--redIADS:addEarlyWarningRadarsByPrefix("EW")
			samSim.samSuffix = samSim.samSuffix + 1
end




do	
	samSims = missionCommands.addSubMenu("Sam stuff")
		missionCommands.addCommand ("Spawn SA 10", samSims, samSim.genSAten)
		missionCommands.addCommand ("Spawn EWR", samSims, samSim.genEWR)
		missionCommands.addCommand ("Spawn SA 2", samSims, samSim.genSAtwo)		
		missionCommands.addCommand ("Spawn Command Centre and activate", samSims, samSim.genCMD)
end
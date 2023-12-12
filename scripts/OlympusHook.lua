local version = 'v1.0.2'
local lfs = require("lfs")

Olympus = {}
Olympus.OlympusDLL = nil
Olympus.DLLsloaded = false
Olympus.OlympusModPath = lfs.writedir().."Mods\\Services\\Olympus\\bin\\"

log.write('Olympus.HOOKS.LUA', log.INFO,'Executing OlympusHook.lua')

function Olympus.loadDLLs()
	-- Add the .dll paths
	package.cpath = package.cpath..';'..Olympus.OlympusModPath..'?.dll;'
	
	local status
	log.write('Olympus.HOOKS.LUA', log.INFO, 'Loading olympus.dll from ['..Olympus.OlympusModPath..']')
	status, Olympus.OlympusDLL = pcall(require, 'olympus')
	if status then
		log.write('Olympus.HOOKS.LUA', log.INFO, 'olympus.dll loaded successfully')
		return true
	else
		log.write('Olympus.HOOKS.LUA', log.ERROR, 'Error loading olympus.dll: '..Olympus.OlympusDLL)
		return false
	end	
end

do
	if isOlympusModuleInitialized~=true then
		local OlympusName = 'Olympus ' .. version .. ' C++ module';
		Olympus.loadDLLs();
	
		-- Register callbacks
		local OlympusCallbacks = {}
		function OlympusCallbacks.onSimulationStart()
			log.write('Olympus.HOOKS.LUA', log.INFO,OlympusName..' onSimulationStart')
			if DCS.isServer() then
				Olympus.DLLsloaded = Olympus.loadDLLs()
				if Olympus.DLLsloaded then
					Olympus.OlympusDLL.onSimulationStart()
					log.write('Olympus.HOOKS.LUA', log.INFO, OlympusName..' successfully loaded.')
				else
					log.write('Olympus.HOOKS.LUA', log.ERROR, 'Failed to load '..OlympusName)
				end
			end
		end
		
		function OlympusCallbacks.onSimulationFrame()
			if DCS.isServer() and Olympus.DLLsloaded then
				Olympus.OlympusDLL.onSimulationFrame()
			end
		end
		
		function OlympusCallbacks.onSimulationStop()
			if DCS.isServer() and Olympus.DLLsloaded then
				Olympus.OlympusDLL.onSimulationStop()
			end
		end
		DCS.setUserCallbacks(OlympusCallbacks)	
		log.write('Olympus.HOOKS.LUA', log.INFO, OlympusName..' callbacks registered correctly.')
		
		isOlympusModuleInitialized=true;
	end
end
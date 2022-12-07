Olympus = {}
Olympus.OlympusDLL = nil
Olympus.cppRESTDLL = nil
Olympus.DLLsloaded = false
Olympus.OlympusModPath = os.getenv('DCSOLYMPUS_PATH')..'\\bin\\' 

log.write('Olympus.HOOKS.LUA', log.INFO,'Executing OlympusHook.lua')

function loadDLLs()
	-- Add the .dll paths
	package.cpath = package.cpath..';'..Olympus.OlympusModPath..'?.dll;'
	
	log.write('Olympus.HOOKS.LUA', log.INFO, 'Loading cpprest_2_10.dll from ['..Olympus.OlympusModPath..']')
	pcall(require, 'cpprest_2_10')

	log.write('Olympus.HOOKS.LUA', log.INFO, 'Loading hook.dll from ['..Olympus.OlympusModPath..']')
	local status
	
	pcall(require, 'logger')
	pcall(require, 'luatools')
	pcall(require, 'dcstools')
	status, Olympus.OlympusDLL = pcall(require, 'hook')
	if not status then
		return false
	end	
	return true
end

do
	if isOlympusModuleInitialized~=true then
		local OlympusName = 'Olympus 0.0.1 C++ module';
	
		-- Register callbacks
		local OlympusCallbacks = {}
		function OlympusCallbacks.onSimulationStart()
			log.write('Olympus.HOOKS.LUA', log.INFO,OlympusName..' onSimulationStart')
			if DCS.isServer() then
				Olympus.DLLsloaded = loadDLLs()
				if Olympus.DLLsloaded then
					Olympus.OlympusDLL.onSimulationStart()
					log.write('Olympus.HOOKS.LUA', log.INFO, OlympusName..' successfully loaded.')
				else
					log.write('Olympus.HOOKS.LUA', log.ERROR, 'Failed to load '..OlympusName..'.')
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
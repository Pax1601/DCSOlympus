Olympus = {}
Olympus.OlympusDLL = nil
Olympus.cppRESTDLL = nil
Olympus.DLLsloaded = false
Olympus.debug = true
if Olympus.debug then
	Olympus.OlympusModPath = "C:\\Users\\dpass\\Documents\\Olympus\\bin\\x64\\Debug\\"
else
	Olympus.OlympusModPath = "C:\\Users\\dpass\\Doczuments\\Olympus\\bin\\x64\\Release\\"
end

log.write('Olympus.HOOKS.LUA', log.INFO,'Executing OlympusHook.lua')

function loadDLLs()
	-- Add the .dll paths
	package.cpath = package.cpath..';'..Olympus.OlympusModPath..'?.dll;'
	
	if Olympus.debug then
		log.write('Olympus.HOOKS.LUA', log.INFO, 'Loading cpprest_2_10d.dll from ['..Olympus.OlympusModPath..']')
		pcall(require, 'cpprest_2_10d')
	else
		log.write('Olympus.HOOKS.LUA', log.INFO, 'Loading cpprest_2_10.dll from ['..Olympus.OlympusModPath..']')
		pcall(require, 'cpprest_2_10')
	end

	log.write('Olympus.HOOKS.LUA', log.INFO, 'Loading Olympus.dll from ['..Olympus.OlympusModPath..']')
	local status
	status, Olympus.OlympusDLL = pcall(require, 'Olympus')
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
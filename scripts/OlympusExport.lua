Olympus = {}
Olympus.OlympusDLL = nil
Olympus.cppRESTDLL = nil
Olympus.DLLsloaded = false
Olympus.OlympusModPath = os.getenv('DCSOLYMPUS_PATH')..'\\bin\\' 

log.write('Olympus.EXPORT.LUA', log.INFO, 'Executing OlympusExport.lua')

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
		local OlympusName = 'Olympus 0.0.1 C++ module';
		isOlympusModuleInitialized=true;
		Olympus.DLLsloaded = Olympus.loadDLLs()
		if Olympus.DLLsloaded then
			log.write('Olympus.EXPORT.LUA', log.INFO, OlympusName..' successfully loaded.')
		else
			log.write('Olympus.EXPORT.LUA', log.ERROR, 'Failed to load '..OlympusName)
		end
	else
		log.write('Olympus.EXPORT.LUA', log.INFO, 'olympus.dll already initialized')
	end
end
Olympus = {}
Olympus.OlympusDLL = nil
Olympus.cppRESTDLL = nil
Olympus.DLLsloaded = false
Olympus.OlympusModPath = os.getenv('OLYMPUS')..'\\bin\\' 

log.write('Olympus.EXPORT.LUA', log.INFO, 'Executing OlympusExport.lua')

function Olympus.loadDLLs()
	-- Add the .dll paths
	package.cpath = package.cpath..';'..Olympus.OlympusModPath..'?.dll;'
	
	log.write('Olympus.EXPORT.LUA', log.INFO, 'Loading cpprest_2_10.dll from ['..Olympus.OlympusModPath..']')
	pcall(require, 'cpprest_2_10')

	log.write('Olympus.EXPORT.LUA', log.INFO, 'Loading Olympus.dll from ['..Olympus.OlympusModPath..']')
	local status
	status, Olympus.OlympusDLL = pcall(require, 'Olympus')
	if not status then
		return false
	end	
	return true
end

do
	if isOlympusModuleInitialized~=true then
		local OlympusName = 'Olympus 0.0.1 C++ module'
		isOlympusModuleInitialized=true;
		Olympus.loadDLLs()
		log.write('Olympus.EXPORT.LUA', log.INFO, OlympusName..' successfully loaded.')
	else
		log.write('Olympus.EXPORT.LUA', log.INFO, 'Olympus.dll already initialized')
	end
end
#include "framework.h"
#include "dcstools.h"
#include "logger.h"
#include "utils.h"

/* Run-time linking to core dll allows for "hot swap". This is useful for development but could be removed when stable.*/
HINSTANCE hGetProcIDDLL = NULL;
typedef int(__stdcall* f_coreInit)(lua_State* L, const char* path);
typedef int(__stdcall* f_coreDeinit)(lua_State* L);
typedef int(__stdcall* f_coreFrame)(lua_State* L);
typedef int(__stdcall* f_coreUnitsData)(lua_State* L);
typedef int(__stdcall* f_coreWeaponsData)(lua_State* L);
typedef int(__stdcall* f_coreMissionData)(lua_State* L);
f_coreInit coreInit = nullptr;
f_coreDeinit coreDeinit = nullptr;
f_coreFrame coreFrame = nullptr;
f_coreUnitsData coreUnitsData = nullptr;
f_coreWeaponsData coreWeaponsData = nullptr;
f_coreMissionData coreMissionData = nullptr;

string modPath;

static int onSimulationStart(lua_State* L)
{
    log("onSimulationStart callback called successfully");

    string dllLocation = modPath + "\\core.dll";
    
    log("Loading core.dll");
    hGetProcIDDLL = LoadLibrary(to_wstring(dllLocation).c_str());

    if (!hGetProcIDDLL) {
        LogError(L, "Error loading core DLL");
        goto error;
    }

    log("Core DLL loaded successfully");

    coreInit = (f_coreInit)GetProcAddress(hGetProcIDDLL, "coreInit");
    if (!coreInit) 
    {
        LogError(L, "Error getting coreInit ProcAddress from DLL");
        goto error;
    }

    coreDeinit = (f_coreDeinit)GetProcAddress(hGetProcIDDLL, "coreDeinit");
    if (!coreDeinit)
    {
        LogError(L, "Error getting coreDeinit ProcAddress from DLL");
        goto error;
    }

    coreFrame = (f_coreFrame)GetProcAddress(hGetProcIDDLL, "coreFrame");
    if (!coreFrame) 
    {
        LogError(L, "Error getting coreFrame ProcAddress from DLL");
        goto error;
    }

    coreUnitsData = (f_coreUnitsData)GetProcAddress(hGetProcIDDLL, "coreUnitsData");
    if (!coreUnitsData)
    {
        LogError(L, "Error getting coreUnitsData ProcAddress from DLL");
        goto error;
    }

    coreWeaponsData = (f_coreWeaponsData)GetProcAddress(hGetProcIDDLL, "coreWeaponsData");
    if (!coreWeaponsData)
    {
        LogError(L, "Error getting coreWeaponsData ProcAddress from DLL");
        goto error;
    }

    coreMissionData = (f_coreMissionData)GetProcAddress(hGetProcIDDLL, "coreMissionData");
    if (!coreMissionData)
    {
        LogError(L, "Error getting coreMissionData ProcAddress from DLL");
        goto error;
    }

    coreInit(L, modPath.c_str());

    LogInfo(L, "Module loaded and started successfully.");

	return 0;

error:
    LogError(L, "Error while loading module, see Olympus.log in temporary folder for additional details.");
    return 0;
}

static int onSimulationFrame(lua_State* L)
{
    if (coreFrame) 
    {
        coreFrame(L);
    }
    return 0;
}

static int onSimulationStop(lua_State* L)
{
    log("onSimulationStop callback called successfully");
    if (hGetProcIDDLL)
    {
        log("Trying to unload core DLL");
        if (coreDeinit)
        {
            coreDeinit(L);
        }

        if (FreeLibrary(hGetProcIDDLL))
        {
            log("Core DLL unloaded successfully");
        }
        else
        {
            LogError(L, "Error unloading DLL");
            goto error;
        }

        coreInit = nullptr;
        coreDeinit = nullptr;
        coreFrame = nullptr;
        coreUnitsData = nullptr;
        coreWeaponsData = nullptr;
        coreMissionData = nullptr;
    }

    hGetProcIDDLL = NULL;

    return 0;

error:
    LogError(L, "Error while unloading module, see Olympus.log in temporary folder for additional details.");
    return 0;
}

static int setUnitsData(lua_State* L)
{
    if (coreUnitsData)
    {
        coreUnitsData(L);
    }
    return 0;
}

static int setWeaponsData(lua_State* L)
{
    if (coreWeaponsData)
    {
        coreWeaponsData(L);
    }
    return 0;
}

static int setMissionData(lua_State* L)
{
    if (coreMissionData)
    {
        coreMissionData(L);
    }
    return 0;
}

static const luaL_Reg Map[] = {
	{"onSimulationStart", onSimulationStart},
    {"onSimulationFrame", onSimulationFrame},
    {"onSimulationStop", onSimulationStop},
    {"setUnitsData", setUnitsData },
    {"setWeaponsData", setWeaponsData },
    {"setMissionData", setMissionData },
	{NULL, NULL}
};

extern "C" DllExport int luaopen_olympus(lua_State * L)
{
    lua_getglobal(L, "require");
    lua_pushstring(L, "lfs");
    lua_pcall(L, 1, 1, 0);
    lua_getfield(L, -1, "writedir");
    lua_pcall(L, 0, 1, 0);
    if (lua_isstring(L, -1)) {
        modPath = string(lua_tostring(L, -1)) + "Mods\\Services\\Olympus\\bin\\";
        SetDllDirectoryA(modPath.c_str());
        LogInfo(L, "Instance location retrieved successfully");
    }
    else {
        /* Log without using the helper dlls because we have not loaded them yet here */
        lua_getglobal(L, "log");
        lua_getfield(L, -1, "ERROR");
        int errorLevel = (int)lua_tointeger(L, -1);

        lua_getglobal(L, "log");
        lua_getfield(L, -1, "write");
        lua_pushstring(L, "Olympus.dll");
        lua_pushnumber(L, errorLevel);
        lua_pushstring(L, "An error has occurred while trying to retrieve Olympus's instance location");
        lua_pcall(L, 3, 0, 0);

        return 0;
    }

    LogInfo(L, "Loading .dlls from " + modPath);

	luaL_register(L, "olympus", Map);
	return 1;
}
#include "framework.h"
#include "dcstools.h"
#include "logger.h"
#include "utils.h"

/* Run-time linking to core dll allows for "hot swap". This is useful for development but could be removed when stable.*/
HINSTANCE hGetProcIDDLL = NULL;
typedef int(__stdcall* f_coreInit)(lua_State* L);
typedef int(__stdcall* f_coreDeinit)(lua_State* L);
typedef int(__stdcall* f_coreFrame)(lua_State* L);
typedef int(__stdcall* f_coreUnitsData)(lua_State* L);
typedef int(__stdcall* f_coreWeaponsData)(lua_State* L);
typedef int(__stdcall* f_coreMissionData)(lua_State* L);
typedef int(__stdcall* f_coreSetInstancePath)(lua_State* L);
f_coreInit coreInit = nullptr;
f_coreDeinit coreDeinit = nullptr;
f_coreFrame coreFrame = nullptr;
f_coreUnitsData coreUnitsData = nullptr;
f_coreWeaponsData coreWeaponsData = nullptr;
f_coreMissionData coreMissionData = nullptr;
f_coreSetInstancePath coreInstancePath = nullptr;

static int onSimulationStart(lua_State* L)
{
    log("onSimulationStart callback called successfully");

    string modLocation;
    string dllLocation;
    char* buf = nullptr;
    size_t sz = 0;
    if (_dupenv_s(&buf, &sz, "DCSOLYMPUS_PATH") == 0 && buf != nullptr)
    {
        modLocation = buf;
        free(buf);
    }
    else
    {
        log("DCSOLYMPUS_PATH environment variable is missing");
        goto error;
    }
    dllLocation = modLocation + "\\bin\\core.dll";
    
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

    coreInstancePath = (f_coreSetInstancePath)GetProcAddress(hGetProcIDDLL, "coreSetInstancePath");
    if (!coreInstancePath)
    {
        LogError(L, "Error getting coreSetInstancePath ProcAddress from DLL");
        goto error;
    }

    coreInit(L);

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
        coreInstancePath = nullptr;
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

static int setInstancePath(lua_State* L)
{
    if (coreInstancePath)
    {
        coreInstancePath(L);
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
    {"setInstancePath", setInstancePath },
	{NULL, NULL}
};

extern "C" DllExport int luaopen_olympus(lua_State * L)
{
	luaL_register(L, "olympus", Map);
	return 1;
}
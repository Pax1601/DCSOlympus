#include "framework.h"

#include "DCSUtils.h"
#include "Logger.h"

#define DllExport   __declspec( dllexport )

BOOL APIENTRY DllMain( HMODULE hModule,
                       DWORD  ul_reason_for_call,
                       LPVOID lpReserved
                     )
{
    switch (ul_reason_for_call)
    {
    case DLL_PROCESS_ATTACH:
    case DLL_THREAD_ATTACH:
    case DLL_THREAD_DETACH:
    case DLL_PROCESS_DETACH:
        break;
    }
    return TRUE;
}

/* Run-time linking to core dll allows for "hot swap"*/
HINSTANCE hGetProcIDDLL = NULL;
typedef int(__stdcall* f_coreInit)(lua_State* L);
typedef int(__stdcall* f_coreDeinit)(lua_State* L);
typedef int(__stdcall* f_coreFrame)(lua_State* L);
typedef int(__stdcall* f_coreMissionData)(lua_State* L);
f_coreInit coreInit = nullptr;
f_coreDeinit coreDeinit = nullptr;
f_coreFrame coreFrame = nullptr;
f_coreMissionData coreMissionData = nullptr;

static int onSimulationStart(lua_State* L)
{
    LOGGER->Log("onSimulationStart callback called successfully");
#ifdef _DEBUG
    LOGGER->Log("Loading Debug core.dll");
    hGetProcIDDLL = LoadLibrary(L"C:\\Users\\dpass\\Documents\\Olympus\\bin\\x64\\Debug\\core.dll");
#else
    LOGGER->Log("Loading Release core.dll");
    hGetProcIDDLL = LoadLibrary(L"C:\\Users\\dpass\\Documents\\Olympus\\bin\\x64\\Release\\core.dll");
#endif

    if (!hGetProcIDDLL) {
        DCSUtils::LogError(L, "Error loading core DLL");
        goto error;
    }

    LOGGER->Log("Core DLL loaded successfully");

    coreInit = (f_coreInit)GetProcAddress(hGetProcIDDLL, "coreInit");
    if (!coreInit) 
    {
        DCSUtils::LogError(L, "Error getting coreInit ProcAddress from DLL");
        goto error;
    }

    coreDeinit = (f_coreDeinit)GetProcAddress(hGetProcIDDLL, "coreDeinit");
    if (!coreInit) 
    {
        DCSUtils::LogError(L, "Error getting coreDeinit ProcAddress from DLL");
        goto error;
    }

    coreFrame = (f_coreFrame)GetProcAddress(hGetProcIDDLL, "coreFrame");
    if (!coreFrame) 
    {
        DCSUtils::LogError(L, "Error getting coreFrame ProcAddress from DLL");
        goto error;
    }

    coreMissionData = (f_coreFrame)GetProcAddress(hGetProcIDDLL, "coreMissionData");
    if (!coreFrame)
    {
        DCSUtils::LogError(L, "Error getting coreMissionData ProcAddress from DLL");
        goto error;
    }

    coreInit(L);

    DCSUtils::LogInfo(L, "Module loaded and started successfully.");

	return 0;

error:
    DCSUtils::LogError(L, "Error while loading module, see Olympus.log in temporary folder for additional details.");
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
    LOGGER->Log("onSimulationStop callback called successfully");
    if (hGetProcIDDLL)
    {
        LOGGER->Log("Trying to unload core DLL");
        if (coreDeinit)
        {
            coreDeinit(L);
        }

        if (FreeLibrary(hGetProcIDDLL))
        {
            LOGGER->Log("Core DLL unloaded successfully");
        }
        else
        {
            DCSUtils::LogError(L, "Error unloading DLL");
            goto error;
        }

        coreInit = nullptr;
        coreDeinit = nullptr;
        coreFrame = nullptr;
        coreMissionData = nullptr;
    }

    hGetProcIDDLL = NULL;

    return 0;

error:
    DCSUtils::LogError(L, "Error while unloading module, see Olympus.log in temporary folder for additional details.");
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
    {"setMissionData", setMissionData },
	{NULL, NULL}
};

extern "C" DllExport int luaopen_Olympus(lua_State * L)
{
	luaL_register(L, "Olympus", Map);
	return 1;
}

#include "dcstools.h"
#include "logger.h"
#include "defines.h"
#include "unitsFactory.h"
#include "server.h"
#include "scheduler.h"
#include "scriptLoader.h"
#include "luatools.h"

auto before = std::chrono::system_clock::now();
UnitsFactory* unitsFactory = nullptr;
Server* server = nullptr;
Scheduler* scheduler = nullptr;

/* Called when DCS simulation stops. All singleton instances are deleted. */
extern "C" DllExport int coreDeinit(lua_State* L)
{
    log("Olympus coreDeinit called successfully");

    delete unitsFactory;
    delete server;
    delete scheduler;

    log("All singletons objects destroyed successfully");

    return(0);
}

/* Called when DCS simulation starts. All singletons are instantiated, and the custom Lua functions are registered in the Lua state. */
extern "C" DllExport int coreInit(lua_State* L)
{
    unitsFactory = new UnitsFactory(L);
    server = new Server(L);
    scheduler = new Scheduler(L);

    registerLuaFunctions(L);

    return(0);
}

extern "C" DllExport int coreFrame(lua_State* L)
{
    const std::chrono::duration<double> duration = std::chrono::system_clock::now() - before;

    // TODO make intervals editable
    if (duration.count() > UPDATE_TIME_INTERVAL)
    {
        if (unitsFactory != nullptr)
        {
            unitsFactory->updateExportData(L);
        }

        // TODO allow for different intervals
        if (scheduler != nullptr)
        {
            scheduler->execute(L);
        }
        before = std::chrono::system_clock::now();
    }
    return(0);
}

extern "C" DllExport int coreMissionData(lua_State * L)
{
    lua_getglobal(L, "Olympus");
    lua_getfield(L, -1, "missionData");
    json::value missionData = luaTableToJSON(L, -1);

    if (missionData.has_object_field(L"unitsData"))
        unitsFactory->updateMissionData(missionData[L"unitsData"]);

    return(0);
}

BOOL WINAPI DllMain(
    HINSTANCE hinstDLL,  // handle to DLL module
    DWORD fdwReason,     // reason for calling function
    LPVOID lpvReserved)  // reserved
{
    // Perform actions based on the reason for calling.
    switch (fdwReason)
    {
    case DLL_PROCESS_ATTACH:
        // Initialize once for each new process.
        // Return FALSE to fail DLL load.
        break;

    case DLL_THREAD_ATTACH:
        // Do thread-specific initialization.
        break;

    case DLL_THREAD_DETACH:
        // Do thread-specific cleanup.
        break;

    case DLL_PROCESS_DETACH:

        if (lpvReserved != nullptr)
        {
            break; // do not do cleanup if process termination scenario
        }

        // Perform any necessary cleanup.
        break;
    }
    return TRUE;  // Successful DLL_PROCESS_ATTACH.
}
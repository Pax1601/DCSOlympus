#include "framework.h"
#include "DCSUtils.h"
#include "Logger.h"
#include "defines.h"
#include "UnitsHandler.h"
#include "RESTServer.h"
#include "Scheduler.h"
#include "LUAFunctions.h"


auto before = std::chrono::system_clock::now();
UnitsHandler* unitsHandler = nullptr;
RESTServer* restserver = nullptr;
Scheduler* scheduler = nullptr;
json::value missionData;

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

#define DllExport   __declspec( dllexport )

extern "C" DllExport int coreDeinit(lua_State* L)
{
    LOGGER->Log("Olympus coreDeinit called successfully");

    delete unitsHandler;
    delete restserver;
    delete scheduler;

    LOGGER->Log("All singletons objects destroyed successfully");

    return(0);
}

extern "C" DllExport int coreInit(lua_State* L)
{
    unitsHandler = new UnitsHandler(L);
    restserver = new RESTServer(L);
    scheduler = new Scheduler(L);

    LUAFunctions::registerLuaFunctions(L);

    return(0);
}

extern "C" DllExport int coreFrame(lua_State* L)
{
    const std::chrono::duration<double> duration = std::chrono::system_clock::now() - before;

    // TODO make intervals editable
    if (duration.count() > UPDATE_TIME_INTERVAL)
    {
        if (unitsHandler != nullptr)
        {
            unitsHandler->update(L);
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
    missionData = LUAUtils::tableToJSON(L, -1);

    return(0);
}
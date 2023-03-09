#include "dcstools.h"
#include "logger.h"
#include "defines.h"
#include "unitsManager.h"
#include "server.h"
#include "scheduler.h"
#include "scriptLoader.h"
#include "luatools.h"

auto before = std::chrono::system_clock::now();
UnitsManager* unitsManager = nullptr;
Server* server = nullptr;
Scheduler* scheduler = nullptr;
json::value airbasesData;
json::value bullseyesData;
mutex mutexLock;
bool initialized = false;
string sessionHash;

/* Called when DCS simulation stops. All singleton instances are deleted. */
extern "C" DllExport int coreDeinit(lua_State* L)
{
    if (!initialized)
        return (0);

    log("Olympus coreDeinit called successfully");

    server->stop(L);

    delete unitsManager;
    delete server;
    delete scheduler;

    log("All singletons objects destroyed successfully");

    return(0);
}

/* Called when DCS simulation starts. All singletons are instantiated, and the custom Lua functions are registered in the Lua state. */
extern "C" DllExport int coreInit(lua_State* L)
{
    sessionHash = random_string(16);
    unitsManager = new UnitsManager(L);
    server = new Server(L);
    scheduler = new Scheduler(L);

    registerLuaFunctions(L);

    server->start(L);

    initialized = true;
    return(0);
}

extern "C" DllExport int coreFrame(lua_State* L)
{
    if (!initialized)
        return (0);

    /* Lock for thread safety */
    lock_guard<mutex> guard(mutexLock);

    const std::chrono::duration<double> duration = std::chrono::system_clock::now() - before;

    /* TODO make intervals editable */
    if (duration.count() > UPDATE_TIME_INTERVAL)
    {
        if (unitsManager != nullptr)
        {
            unitsManager->updateExportData(L);
        }
        before = std::chrono::system_clock::now();
    }

    if (scheduler != nullptr)
        scheduler->execute(L);
 
    return(0);
}

extern "C" DllExport int coreMissionData(lua_State * L)
{
    if (!initialized)
        return (0);

    /* Lock for thread safety */
    lock_guard<mutex> guard(mutexLock);

    lua_getglobal(L, "Olympus");
    lua_getfield(L, -1, "missionData");
    json::value missionData = luaTableToJSON(L, -1);

    if (missionData.has_object_field(L"unitsData"))
        unitsManager->updateMissionData(missionData[L"unitsData"]);
    if (missionData.has_object_field(L"airbases"))
        airbasesData = missionData[L"airbases"];
    if (missionData.has_object_field(L"bullseye"))
        bullseyesData = missionData[L"bullseyes"];

    return(0);
}

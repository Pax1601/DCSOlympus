#include "dcstools.h"
#include "logger.h"
#include "defines.h"
#include "unitsManager.h"
#include "weaponsManager.h"
#include "server.h"
#include "scheduler.h"
#include "scriptLoader.h"
#include "luatools.h"
#include <chrono>
using namespace std::chrono;

auto lastUnitsUpdate = std::chrono::system_clock::now();
auto lastWeaponsUpdate = std::chrono::system_clock::now();
auto lastExecution = std::chrono::system_clock::now();

/* Singleton objects */
UnitsManager* unitsManager = nullptr;
WeaponsManager* weaponsManager = nullptr;
Server* server = nullptr;
Scheduler* scheduler = nullptr;

/* Data jsons */
json::value missionData = json::value::object();

mutex mutexLock;
string sessionHash;
string instancePath;

bool initialized = false;

unsigned int frameCounter = 0;

/* Called when DCS simulation stops. All singleton instances are deleted. */
extern "C" DllExport int coreDeinit(lua_State* L)
{
    if (!initialized)
        return (0);

    log("Olympus coreDeinit called successfully");

    server->stop(L);

    delete unitsManager;
    delete weaponsManager;
    delete server;
    delete scheduler;

    log("All singletons objects destroyed successfully");

    return(0);
}

/* Called when DCS simulation starts. All singletons are instantiated, and the custom Lua functions are registered in the Lua state. */
extern "C" DllExport int coreInit(lua_State* L, const char* path)
{
    instancePath = path;

    log("Initializing core.dll with instance path " + instancePath);

    sessionHash = random_string(16);

    log("Random session hash " + sessionHash);

    unitsManager = new UnitsManager(L);
    weaponsManager = new WeaponsManager(L);
    server = new Server(L);
    scheduler = new Scheduler(L);

    registerLuaFunctions(L);

    server->start(L);

    unitsManager->loadDatabases();

    initialized = true;
    return(0);
}

extern "C" DllExport int coreFrame(lua_State* L)
{
    if (!initialized)
        return (0);

    /* Lock for thread safety */
    lock_guard<mutex> guard(mutexLock);

    frameCounter++;

    const std::chrono::duration<double> executionDuration = std::chrono::system_clock::now() - lastExecution;
    if (executionDuration.count() > (20 * FRAMERATE_TIME_INTERVAL)) {
        if (executionDuration.count() > 0) {
            scheduler->setFrameRate(frameCounter / executionDuration.count());
            frameCounter = 0;
        }

        lastExecution = std::chrono::system_clock::now();
    }

    if (scheduler != nullptr) 
        scheduler->execute(L);

    return(0);
}

extern "C" DllExport int coreUnitsData(lua_State * L)
{
    if (!initialized)
        return (0);

    /* Lock for thread safety */
    lock_guard<mutex> guard(mutexLock);

    json::value unitsData = json::value::object();
    lua_getglobal(L, "Olympus");
    lua_getfield(L, -1, "unitsData");
    luaTableToJSON(L, -1, unitsData);

    const std::chrono::duration<double> updateDuration = std::chrono::system_clock::now() - lastUnitsUpdate;
    if (unitsData.has_object_field(L"units")) {
        unitsManager->update(unitsData[L"units"], updateDuration.count());
    }
    lastUnitsUpdate = std::chrono::system_clock::now();

    return(0);
}

extern "C" DllExport int coreWeaponsData(lua_State * L)
{
    if (!initialized)
        return (0);

    /* Lock for thread safety */
    lock_guard<mutex> guard(mutexLock);

    json::value weaponsData = json::value::object();
    lua_getglobal(L, "Olympus");
    lua_getfield(L, -1, "weaponsData");
    luaTableToJSON(L, -1, weaponsData);

    const std::chrono::duration<double> updateDuration = std::chrono::system_clock::now() - lastWeaponsUpdate;
    if (weaponsData.has_object_field(L"weapons")) {
        weaponsManager->update(weaponsData[L"weapons"], updateDuration.count());
    }
    lastWeaponsUpdate = std::chrono::system_clock::now();

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
    luaTableToJSON(L, -1, missionData);

    return(0);
}

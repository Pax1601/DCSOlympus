#include "dcstools.h"
#include "logger.h"
#include "defines.h"
#include "unitsManager.h"
#include "server.h"
#include "scheduler.h"
#include "scriptLoader.h"
#include "luatools.h"
#include <chrono>
using namespace std::chrono;

auto lastUpdate = std::chrono::system_clock::now();
auto lastExecution = std::chrono::system_clock::now();

/* Singleton objects */
UnitsManager* unitsManager = nullptr;
Server* server = nullptr;
Scheduler* scheduler = nullptr;

/* Data jsons */
json::value airbases;
json::value bullseyes;
json::value mission;

mutex mutexLock;
string sessionHash;

bool initialized = false;

unsigned int frameCounter = 0;
double frameRate = 30;

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

    frameCounter++;

    /* Slow down the update rate if the frameRate is very low since it means DCS is struggling to keep up */
    const std::chrono::duration<double> updateDuration = std::chrono::system_clock::now() - lastUpdate;
    double updateTimeInterval = max(UPDATE_TIME_INTERVAL, UPDATE_TIME_INTERVAL * (60.0 / frameRate));
    if (updateDuration.count() > updateTimeInterval)
    {
        /* Lock for thread safety */
        lock_guard<mutex> guard(mutexLock);

        milliseconds ms = duration_cast<milliseconds>(system_clock::now().time_since_epoch());
        if (updateDuration.count() > 0)
            frameRate = frameCounter / updateDuration.count();
        frameCounter = 0;

        if (unitsManager != nullptr) {
            unitsManager->updateExportData(L, updateDuration.count());
            unitsManager->runAILoop();
            
        }
        lastUpdate = std::chrono::system_clock::now();
    }

    const std::chrono::duration<double> executionDuration = std::chrono::system_clock::now() - lastExecution;
    double executionTimeInterval = max(EXECUTION_TIME_INTERVAL, EXECUTION_TIME_INTERVAL * (60.0 / frameRate));
    if (executionDuration.count() > executionTimeInterval) {
        if (scheduler != nullptr)
            scheduler->execute(L);
        lastExecution = std::chrono::system_clock::now();
    }

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

    if (missionData.has_object_field(L"unitsData")) {
        unitsManager->updateMissionData(missionData[L"unitsData"]);
    }
    if (missionData.has_object_field(L"airbases"))
        airbases = missionData[L"airbases"];
    if (missionData.has_object_field(L"bullseyes"))
        bullseyes = missionData[L"bullseyes"];
    if (missionData.has_object_field(L"mission"))
        mission = missionData[L"mission"];

    return(0);
}

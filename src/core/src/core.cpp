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

auto before = std::chrono::system_clock::now();
UnitsManager* unitsManager = nullptr;
Server* server = nullptr;
Scheduler* scheduler = nullptr;
json::value airbases;
json::value bullseyes;
json::value mission;
mutex mutexLock;
bool initialized = false;
string sessionHash;
int lastUpdateIndex = 0;
int frameCounter = 0;
double frameRate = 30;
long long lastUpdateTime = 0;

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

    frameCounter++;

    const std::chrono::duration<double> duration = std::chrono::system_clock::now() - before;

    if (unitsManager != nullptr) {
        // TODO put in a function
        vector<int> IDs;
        for (auto iter = unitsManager->getUnits().begin(); iter != unitsManager->getUnits().end(); ++iter)
            IDs.push_back(iter->first);
     
        int updateChunk = 20;
        int finalUpdateIndex = lastUpdateIndex + updateChunk;

        /* Get all the new data (with some margin) */
        while (lastUpdateIndex < unitsManager->getUnits().size() && lastUpdateIndex <= finalUpdateIndex)
            unitsManager->appendUnitData(IDs[lastUpdateIndex++], server->getUpdateJson(), lastUpdateTime - 1000);
    }
     
    if (duration.count() > UPDATE_TIME_INTERVAL && lastUpdateIndex == unitsManager->getUnits().size())
    {
        milliseconds ms = duration_cast<milliseconds>(system_clock::now().time_since_epoch());
        lastUpdateTime = ms.count();
        frameRate = frameCounter / duration.count();
        frameCounter = 0;

        if (unitsManager != nullptr)
            unitsManager->updateExportData(L, duration.count());
        before = std::chrono::system_clock::now();
        
        /* Restart the update counter */
        lastUpdateIndex = 0;
    }

    if (scheduler != nullptr)
        scheduler->execute(L);

    if (duration.count() > UPDATE_TIME_INTERVAL && unitsManager != nullptr)
        unitsManager->runAILoop();
 
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
        airbases = missionData[L"airbases"];
    if (missionData.has_object_field(L"bullseyes"))
        bullseyes = missionData[L"bullseyes"];
    if (missionData.has_object_field(L"mission"))
        mission = missionData[L"mission"];

    return(0);
}

#include "commands.h"
#include "logger.h"
#include "dcstools.h"

/* Move command */
wstring MoveCommand::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.move, " 
        << ID << ", "
        << destination.lat << ", " 
        << destination.lng << ", " 
        << altitude << ", " 
        << speed << ", " 
        << "\"" << unitCategory << "\"" << ", "
        << taskOptions;
    return commandSS.str();
}

/* Smoke command */
wstring SmokeCommand::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.smoke, " 
        << "\"" << color << "\"" << ", "
        << location.lat << ", "
        << location.lng;
    return commandSS.str();
}

/* Spawn ground command */
wstring SpawnGroundUnitCommand::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.spawnGroundUnit, " 
        << "\"" << coalition << "\"" << ", "
        << "\"" << unitType << "\"" << ", "
        << location.lat << ", " 
        << location.lng;
    return commandSS.str();
}

/* Spawn air command */
wstring SpawnAircraftCommand::getString(lua_State* L)
{
    std::wostringstream optionsSS;
    optionsSS.precision(10);
    optionsSS << "{" 
        << "payloadName = \"" << payloadName << "\", "
        << "airbaseName = \"" << airbaseName << "\","
        << "}";

    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.spawnAircraft, " 
        << "\"" << coalition << "\"" << ", "
        << "\"" << unitType << "\"" << ", "
        << location.lat << ", " 
        << location.lng << "," 
        << optionsSS.str();
    return commandSS.str();
}

/* Clone unit command */
wstring CloneCommand::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.clone, " 
        << ID;
    return commandSS.str();
}

/* Follow unit command */
wstring FollowCommand::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.follow, "
        << leaderID << ","
        << ID;

    return commandSS.str();
}
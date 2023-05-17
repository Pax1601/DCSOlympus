#include "commands.h"
#include "logger.h"
#include "dcstools.h"
#include "unit.h"
#include "unitsmanager.h"

extern UnitsManager* unitsManager;

/* Move command */
wstring Move::getString(lua_State* L)
{
    Unit* unit = unitsManager->getUnit(ID);
    if (unit != nullptr)
    {
        std::wostringstream commandSS;
        commandSS.precision(10);
        commandSS << "Olympus.move, "
            << ID << ", "
            << destination.lat << ", "
            << destination.lng << ", "
            << altitude << ", "
            << speed << ", "
            << "\"" << unit->getCategory() << "\"" << ", "
            << taskOptions;
        return commandSS.str();
    }
    else 
    {
        return L"";
    }
}

/* Smoke command */
wstring Smoke::getString(lua_State* L)
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
wstring SpawnGroundUnit::getString(lua_State* L)
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
wstring SpawnAircraft::getString(lua_State* L)
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
wstring Clone::getString(lua_State* L)
{
    Unit* unit = unitsManager->getUnit(ID);
    if (unit != nullptr)
    {
        std::wostringstream commandSS;
        commandSS.precision(10);
        commandSS << "Olympus.clone, "
            << ID << ", "
            << location.lat << ", "
            << location.lng << ", "
            << "\"" << unit->getCategory() << "\"";
        return commandSS.str();
    }
    else
    {
        return L"";
    }
}

/* Delete unit command */
wstring Delete::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.delete, "
        << ID;
    return commandSS.str();
}

/* Set task command */
wstring SetTask::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setTask, "
        << ID << ","
        << task;

    return commandSS.str();
}

/* Reset task command */
wstring ResetTask::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.resetTask, "
        << ID;

    return commandSS.str();
}

/* Set command command */
wstring SetCommand::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setCommand, "
        << ID << ","
        << command;

    return commandSS.str();
}

/* Set option command */
wstring SetOption::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setOption, "
        << ID << ","
        << optionID << ","
        << optionValue;

    return commandSS.str();
}
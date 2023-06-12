#include "commands.h"
#include "logger.h"
#include "dcstools.h"
#include "unit.h"
#include "unitsmanager.h"

extern UnitsManager* unitsManager;

/* Move command */
wstring Move::getString(lua_State* L)
{

    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.move, "
        << "\"" << groupName << "\"" << ", "
        << destination.lat << ", "
        << destination.lng << ", "
        << altitude << ", "
        << "\"" << altitudeType << "\"" << ", "
        << speed << ", "
        << "\"" << speedType << "\"" << ", "
        << "\"" << category << "\"" << ", "
        << taskOptions;
    return commandSS.str();
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
        << "airbaseName = \"" << airbaseName << "\", "
        << "}";

    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.spawnAircraft, " 
        << "\"" << coalition << "\"" << ", "
        << "\"" << unitType << "\"" << ", "
        << location.lat << ", " 
        << location.lng << ", " 
        << location.alt << ", "
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
        << ID << ", "
        << (explosion ? "true" : "false");
    return commandSS.str();
}

/* Set task command */
wstring SetTask::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setTask, "
        << "\"" << groupName << "\"" << ", "
        << task;

    return commandSS.str();
}

/* Reset task command */
wstring ResetTask::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.resetTask, "
        << "\"" << groupName << "\"";

    return commandSS.str();
}

/* Set command command */
wstring SetCommand::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setCommand, "
        << "\"" << groupName << "\"" << ", "
        << command;

    return commandSS.str();
}

/* Set option command */
wstring SetOption::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);

    if (!isBoolean) {
        commandSS << "Olympus.setOption, "
            << "\"" << groupName << "\"" << ", "
            << optionID << ", "
            << optionValue;
    } else {
        commandSS << "Olympus.setOption, "
            << "\"" << groupName << "\"" << ", "
            << optionID << ", "
            << (optionBool? "true": "false");
    }
    return commandSS.str();
}

/* Set onOff command */
wstring SetOnOff::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);

    commandSS << "Olympus.setOnOff, "
        << "\"" << groupName << "\"" << ", "
        << (onOff ? "true" : "false");
 
    return commandSS.str();
}

/* Explosion command */
wstring Explosion::getString(lua_State* L)
{
    std::wostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.explosion, "
        << intensity << ", "
        << location.lat << ", "
        << location.lng;
    return commandSS.str();
}
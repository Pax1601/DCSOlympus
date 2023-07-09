#include "commands.h"
#include "logger.h"
#include "dcstools.h"
#include "unit.h"
#include "unitsmanager.h"

extern UnitsManager* unitsManager;

/* Move command */
string Move::getString(lua_State* L)
{

    std::ostringstream commandSS;
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
string Smoke::getString(lua_State* L)
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.smoke, " 
        << "\"" << color << "\"" << ", "
        << location.lat << ", "
        << location.lng;
    return commandSS.str();
}

/* Spawn ground units command */
string SpawnGroundUnits::getString(lua_State* L)
{
    if (unitTypes.size() != locations.size()) return "";

    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < unitTypes.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {" 
            << "unitType = " << "\"" << unitTypes[i] << "\"" << ", "
            << "lat = " << locations[i].lat << ", "
            << "lng = " << locations[i].lng << "},";
    }

    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.spawnUnits, {"
        << "category = " << "\"" << "GroundUnit" << "\"" << ", "
        << "coalition = " << "\"" << coalition << "\"" << ", "
        << "units = " << "{" << unitsSS.str() << "}" << "}";
    return commandSS.str();
}

/* Spawn aircrafts command */
string SpawnAircrafts::getString(lua_State* L)
{
    if (unitTypes.size() != locations.size() || unitTypes.size() != loadouts.size()) return "";

    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < unitTypes.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {"
            << "unitType = " << "\"" << unitTypes[i] << "\"" << ", "
            << "lat = " << locations[i].lat << ", "
            << "lng = " << locations[i].lng << ", "
            << "alt = " << locations[i].alt << ", "
            << "loadout = \"" << loadouts[i] << "\"" << "},";
    }

    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.spawnUnits, {" 
        << "category = " << "\"" << "Aircraft" << "\"" << ", "
        << "coalition = " << "\"" << coalition << "\"" << ", "
        << "airbaseName = \"" << airbaseName << "\", "
        << "units = " << "{" << unitsSS.str() << "}" << "}";
    return commandSS.str();
}

/* Clone unit command */
string Clone::getString(lua_State* L)
{
    Unit* unit = unitsManager->getUnit(ID);
    if (unit != nullptr)
    {
        std::ostringstream commandSS;
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
        return "";
    }
}

/* Delete unit command */
string Delete::getString(lua_State* L)
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.delete, "
        << ID << ", "
        << (explosion ? "true" : "false");
    return commandSS.str();
}

/* Set task command */
string SetTask::getString(lua_State* L)
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setTask, "
        << "\"" << groupName << "\"" << ", "
        << task;

    return commandSS.str();
}

/* Reset task command */
string ResetTask::getString(lua_State* L)
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.resetTask, "
        << "\"" << groupName << "\"";

    return commandSS.str();
}

/* Set command command */
string SetCommand::getString(lua_State* L)
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setCommand, "
        << "\"" << groupName << "\"" << ", "
        << command;

    return commandSS.str();
}

/* Set option command */
string SetOption::getString(lua_State* L)
{
    std::ostringstream commandSS;
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
string SetOnOff::getString(lua_State* L)
{
    std::ostringstream commandSS;
    commandSS.precision(10);

    commandSS << "Olympus.setOnOff, "
        << "\"" << groupName << "\"" << ", "
        << (onOff ? "true" : "false");
 
    return commandSS.str();
}

/* Explosion command */
string Explosion::getString(lua_State* L)
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.explosion, "
        << intensity << ", "
        << location.lat << ", "
        << location.lng;
    return commandSS.str();
}
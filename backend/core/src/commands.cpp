#include "commands.h"
#include "logger.h"
#include "dcstools.h"
#include "unit.h"
#include "unitsmanager.h"

extern UnitsManager* unitsManager;

/* Move command */
string Move::getString()
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
string Smoke::getString()
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
string SpawnGroundUnits::getString()
{
    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < spawnOptions.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {" 
            << "unitType = " << "\"" << spawnOptions[i].unitType << "\"" << ", "
            << "lat = " << spawnOptions[i].location.lat << ", "
            << "lng = " << spawnOptions[i].location.lng << ", "
            << "heading = " << spawnOptions[i].heading << ", "
            << "liveryID = " << "\"" << spawnOptions[i].liveryID << "\"" << ", "
            << "skill =  \"" << spawnOptions[i].skill << "\"" << "}, ";

    }

    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.spawnUnits, {"
        << "category = " << "\"" << "GroundUnit" << "\"" << ", "
        << "coalition = " << "\"" << coalition << "\"" << ", "
        << "country = \"" << country << "\", "
        << "units = " << "{" << unitsSS.str() << "}" << "}";
    return commandSS.str();
}


/* Spawn ground units command */
string SpawnNavyUnits::getString()
{
    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < spawnOptions.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {"
            << "unitType = " << "\"" << spawnOptions[i].unitType << "\"" << ", "
            << "lat = " << spawnOptions[i].location.lat << ", "
            << "lng = " << spawnOptions[i].location.lng << ", "
            << "heading = " << spawnOptions[i].heading << ", "
            << "liveryID = " << "\"" << spawnOptions[i].liveryID << "\"" << ", "
            << "skill =  \"" << spawnOptions[i].skill << "\"" << "}, ";
    }

    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.spawnUnits, {"
        << "category = " << "\"" << "NavyUnit" << "\"" << ", "
        << "coalition = " << "\"" << coalition << "\"" << ", "
        << "country = \"" << country << "\", "
        << "units = " << "{" << unitsSS.str() << "}" << "}";
    return commandSS.str();
}

/* Spawn aircrafts command */
string SpawnAircrafts::getString()
{
    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < spawnOptions.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {"
            << "unitType = " << "\"" << spawnOptions[i].unitType << "\"" << ", "
            << "lat = " << spawnOptions[i].location.lat << ", "
            << "lng = " << spawnOptions[i].location.lng << ", "
            << "alt = " << spawnOptions[i].location.alt << ", "
            << "heading = " << spawnOptions[i].heading << ", "
            << "loadout = \"" << spawnOptions[i].loadout << "\"" << ", "
            << "liveryID = " << "\"" << spawnOptions[i].liveryID << "\"" << ", "
            << "skill =  \"" << spawnOptions[i].skill << "\"" << "}, ";
    }

    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.spawnUnits, {" 
        << "category = " << "\"" << "Aircraft" << "\"" << ", "
        << "coalition = " << "\"" << coalition << "\"" << ", "
        << "airbaseName = \"" << airbaseName << "\", "
        << "country = \"" << country << "\", "
        << "units = " << "{" << unitsSS.str() << "}" << "}";
    return commandSS.str();
}


/* Spawn helicopters command */
string SpawnHelicopters::getString()
{
    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < spawnOptions.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {"
            << "unitType = " << "\"" << spawnOptions[i].unitType << "\"" << ", "
            << "lat = " << spawnOptions[i].location.lat << ", "
            << "lng = " << spawnOptions[i].location.lng << ", "
            << "alt = " << spawnOptions[i].location.alt << ", "
            << "heading = " << spawnOptions[i].heading << ", "
            << "loadout = \"" << spawnOptions[i].loadout << "\"" << ", "
            << "liveryID = " << "\"" << spawnOptions[i].liveryID << "\"" << ", "
            << "skill =  \"" << spawnOptions[i].skill << "\"" << "}, ";
    }

    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.spawnUnits, {"
        << "category = " << "\"" << "Helicopter" << "\"" << ", "
        << "coalition = " << "\"" << coalition << "\"" << ", "
        << "airbaseName = \"" << airbaseName << "\", "
        << "country = \"" << country << "\", "
        << "units = " << "{" << unitsSS.str() << "}" << "}";
    return commandSS.str();
}

/* Clone unit command */
string Clone::getString()
{
    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < cloneOptions.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {"
            << "ID = " << cloneOptions[i].ID << ", "
            << "lat = " << cloneOptions[i].location.lat << ", "
            << "lng = " << cloneOptions[i].location.lng << " }, ";
    }

    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.clone, "
        << "{" << unitsSS.str() << "}" << ", "
        << (deleteOriginal ? "true" : "false");
    return commandSS.str();

}

/* Delete unit command */
string Delete::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.delete, "
        << ID << ", "
        << (explosion ? "true" : "false") << ", "
        << "\"" << explosionType << "\"";
    return commandSS.str();
}

/* Set task command */
string SetTask::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setTask, "
        << "\"" << groupName << "\"" << ", "
        << task;

    return commandSS.str();
}

/* Reset task command */
string ResetTask::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.resetTask, "
        << "\"" << groupName << "\"";

    return commandSS.str();
}

/* Set command command */
string SetCommand::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setCommand, "
        << "\"" << groupName << "\"" << ", "
        << command;

    return commandSS.str();
}

/* Set option command */
string SetOption::getString()
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
string SetOnOff::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);

    commandSS << "Olympus.setOnOff, "
        << "\"" << groupName << "\"" << ", "
        << (onOff ? "true" : "false");
 
    return commandSS.str();
}

/* Explosion command */
string Explosion::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.explosion, "
        << intensity << ", "
        << "\"" << explosionType << "\"" << ", "
        << location.lat << ", "
        << location.lng;
    return commandSS.str();
}

/* Laser command */
string Laser::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.laser, "
        << ID << ", "
        << code << ", "
        << destination.lat << ", "
        << destination.lng;
    return commandSS.str();
}

/* Infrared command */
string Infrared::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.infrared, "
        << ID << ", "
        << destination.lat << ", "
        << destination.lng;
    return commandSS.str();
}
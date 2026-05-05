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
        unitsSS << "[" << i + 1 << "] = {";

        if (!spawnOptions[i].name.empty()) {
            unitsSS << "name = " << "\"" << spawnOptions[i].name << "\"" << ", ";
		}

        unitsSS << "unitType = " << "\"" << spawnOptions[i].unitType << "\"" << ", "
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
    commandSS << ", \"" << this->getHash() << "\"";
    return commandSS.str();
}


/* Spawn ground units command */
string SpawnNavyUnits::getString()
{
    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < spawnOptions.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {";

        if (!spawnOptions[i].name.empty()) {
            unitsSS << "name = " << "\"" << spawnOptions[i].name << "\"" << ", ";
        }

        unitsSS << "unitType = " << "\"" << spawnOptions[i].unitType << "\"" << ", "
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
    commandSS << ", \"" << this->getHash() << "\"";
    return commandSS.str();
}

/* Spawn aircrafts command */
string SpawnAircrafts::getString()
{
    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < spawnOptions.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {";

        if (!spawnOptions[i].name.empty()) {
            unitsSS << "name = " << "\"" << spawnOptions[i].name << "\"" << ", ";
        }

        unitsSS << "unitType = " << "\"" << spawnOptions[i].unitType << "\"" << ", "
            << "lat = " << spawnOptions[i].location.lat << ", "
            << "lng = " << spawnOptions[i].location.lng << ", "
            << "alt = " << spawnOptions[i].location.alt << ", "
            << "heading = " << spawnOptions[i].heading << ", "
            << "loadout = \"" << spawnOptions[i].loadout << "\"" << ", "
            << "payload = " << spawnOptions[i].payload << ", "
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
    commandSS << ", \"" << this->getHash() << "\"";
    return commandSS.str();
}


/* Spawn helicopters command */
string SpawnHelicopters::getString()
{
    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < spawnOptions.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {";

        if (!spawnOptions[i].name.empty()) {
            unitsSS << "name = " << "\"" << spawnOptions[i].name << "\"" << ", ";
        }

        unitsSS << "unitType = " << "\"" << spawnOptions[i].unitType << "\"" << ", "
            << "lat = " << spawnOptions[i].location.lat << ", "
            << "lng = " << spawnOptions[i].location.lng << ", "
            << "alt = " << spawnOptions[i].location.alt << ", "
            << "heading = " << spawnOptions[i].heading << ", "
            << "loadout = \"" << spawnOptions[i].loadout << "\"" << ", "
            << "payload = " << spawnOptions[i].payload << ", "
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
    commandSS << ", \"" << this->getHash() << "\"";
    return commandSS.str();
}

/* Spawn static object command */
string SpawnStaticObject::getString() {
    std::ostringstream commandSS;
	commandSS.precision(10);
    commandSS << "Olympus.spawnStaticObject, {";
	    // Only include the name if it's not empty, as it is optional
        if (!name.empty()) {
            commandSS
                << "name = " << "\"" << name << "\"" << ", ";
        }
        commandSS << "type = " << "\"" << type << "\"" << ", "
        << "lat = " << location.lat << ", "
        << "lng = " << location.lng << ", "
        << "shapeName = " << "\"" << shapeName << "\"" << ", "
        << "coalition = " << "\"" << coalition << "\"" << ", "
        << "heading = " << heading << ", "
        << "canCargo = " << (canCargo ? "true" : "false") << ", "
        << "linkOffset = " << (linkOffset ? "true" : "false") << ", "
        << "dead = " << (dead ? "true" : "false") << ", "
        << "mass = " << mass << "}";
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
    commandSS << ", \"" << this->getHash() << "\"";
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

/* Delete static object */
string DeleteStaticObject::getString() {
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.deleteStaticObject, "
        << "\"" << name << "\"";
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

/* FireLaser command */
string FireLaser::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.fireLaser, "
        << ID << ", "
        << code << ", "
        << destination.lat << ", "
        << destination.lng;
    return commandSS.str();
}

/* FireInfrared command */
string FireInfrared::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.fireInfrared, "
        << ID << ", "
        << destination.lat << ", "
        << destination.lng;
    return commandSS.str();
}

/* SetLaserCode command */
string SetLaserCode::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setLaserCode, "
        << spotID << ", "
        << code;
    return commandSS.str();
}

/* MoveSpot command */
string MoveSpot::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.moveSpot, "
        << spotID << ", "
        << destination.lat << ", "
        << destination.lng;
    return commandSS.str();
}

/* DeleteSpot command */
string DeleteSpot::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.deleteSpot, "
        << spotID;
    return commandSS.str();
}

/* CreateMarker command */
string CreateMarker::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.createMarker, "
		<< markerID << ", "
        << position.lat << ", "
        << position.lng << ", "
		<< "\"" << text << "\"";
    return commandSS.str();
}

/* DeleteMarker command */
string DeleteMarker::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.deleteMarker, "
        << markerID;
    return commandSS.str();
}

/* SetCargoWeight command */
string SetCargoWeight::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setCargoWeight, "
        << ID << ", " 
        << weight;
    return commandSS.str();
}

/* RegisterDrawArgument command */
string RegisterDrawArgument::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.registerDrawArgument, "
        << ID << ", "
        << argument << ", "
        << active;
    return commandSS.str();
}

/* Execute a file from the local machine */
string ExecuteFile::getString() {
	string tmpFilePath = filePath;
    replace(tmpFilePath.begin(), tmpFilePath.end(), '\\', '/');
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "dofile, "
        << "\"" << tmpFilePath << "\"";
    return commandSS.str();
}
#include "scheduler.h"
#include "logger.h"
#include "dcstools.h"
#include "unitsManager.h"
#include "utils.h"
#include "unit.h"

extern UnitsManager* unitsManager;

Scheduler::Scheduler(lua_State* L) :
	load(0)
{
	LogInfo(L, "Scheduler constructor called successfully");

	
}

Scheduler::~Scheduler()
{

}

void Scheduler::appendCommand(Command* newCommand)
{
	for (auto command : commands) {
		if (command->getString().compare(newCommand->getString()) == 0 && command->getPriority() == newCommand->getPriority())
			return;
	}
	commands.push_back(newCommand);
}

int Scheduler::getLoad() 
{
	int currentLoad = 0;
	for (auto command : commands) {
		currentLoad += command->getLoad();
	}
	return currentLoad;
}

void Scheduler::execute(lua_State* L)
{
	/* Decrease the active computation load. New commands can be sent only if the load has reached 0.
		This is needed to avoid server lag. */
	if (load > 0) {
		load--;
		return;
	}

	int priority = CommandPriority::IMMEDIATE;
	while (priority >= CommandPriority::LOW) {
		for (auto command : commands)
		{
			if (command->getPriority() == priority)
			{
				string commandString = "Olympus.protectedCall(" + command->getString() + ")";
				if (dostring_in(L, "server", (commandString)))
					log("Error executing command " + commandString);
				else
					log("Command '" + commandString + "' executed correctly, current load " + to_string(getLoad()));
				load = command->getLoad();
				commands.remove(command);
				delete command;
				return;
			}
		}
		priority--;
	};
}

void Scheduler::handleRequest(string key, json::value value)
{
	Command* command = nullptr;

	log("Received request with ID: " + key);
	log(value.serialize());
	if (key.compare("setPath") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
		{
			string unitName = unit->getUnitName();
			json::value path = value[L"path"];
			list<Coords> newPath;
			for (unsigned int i = 0; i < path.as_array().size(); i++)
			{
				string WP = to_string(i);
				double lat = path[i][L"lat"].as_double();
				double lng = path[i][L"lng"].as_double();
				log(unitName + " set path destination " + WP + " (" + to_string(lat) + ", " + to_string(lng) + ")");
				Coords dest; dest.lat = lat; dest.lng = lng;
				newPath.push_back(dest);
			}

			unit->setActivePath(newPath);
			unit->setState(State::REACH_DESTINATION);
			log(unitName + " new path set successfully");
		}
	}
	else if (key.compare("smoke") == 0)
	{
		string color = to_string(value[L"color"]);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		log("Adding " + color + " smoke at (" + to_string(lat) + ", " + to_string(lng) + ")");
		Coords loc; loc.lat = lat; loc.lng = lng;
		command = dynamic_cast<Command*>(new Smoke(color, loc));
	}
	else if (key.compare("spawnAircrafts") == 0)
	{
		bool immediate = value[L"immediate"].as_bool();
		string coalition = to_string(value[L"coalition"]);
		string airbaseName = to_string(value[L"airbaseName"]);

		vector<string> unitTypes;
		vector<Coords> locations;
		vector<string> loadouts;
		for (auto unit : value[L"units"].as_array()) {
			string unitType = to_string(unit[L"unitType"]);
			double lat = unit[L"location"][L"lat"].as_double();
			double lng = unit[L"location"][L"lng"].as_double();
			double alt = unit[L"altitude"].as_double();
			Coords location; location.lat = lat; location.lng = lng; location.alt = alt;
			string loadout = to_string(unit[L"loadout"]);

			log("Spawning " + coalition + " aircraft of type " + unitType + " at (" + to_string(lat) + ", " + to_string(lng) + ")");
			unitTypes.push_back(unitType);
			locations.push_back(location);
			loadouts.push_back(loadout);
		}

		command = dynamic_cast<Command*>(new SpawnAircrafts(coalition, unitTypes, locations, loadouts, airbaseName, immediate));
	}
	else if (key.compare("spawnHelicopters") == 0)
	{
		bool immediate = value[L"immediate"].as_bool();
		string coalition = to_string(value[L"coalition"]);
		string airbaseName = to_string(value[L"airbaseName"]);

		vector<string> unitTypes;
		vector<Coords> locations;
		vector<string> loadouts;
		for (auto unit : value[L"units"].as_array()) {
			string unitType = to_string(unit[L"unitType"]);
			double lat = unit[L"location"][L"lat"].as_double();
			double lng = unit[L"location"][L"lng"].as_double();
			double alt = unit[L"altitude"].as_double();
			Coords location; location.lat = lat; location.lng = lng; location.alt = alt;
			string loadout = to_string(unit[L"loadout"]);

			log("Spawning " + coalition + " helicopter of type " + unitType + " at (" + to_string(lat) + ", " + to_string(lng) + ")");
			unitTypes.push_back(unitType);
			locations.push_back(location);
			loadouts.push_back(loadout);
		}

		command = dynamic_cast<Command*>(new SpawnHelicopters(coalition, unitTypes, locations, loadouts, airbaseName, immediate));
	}
	else if (key.compare("spawnGroundUnits") == 0)
	{
		bool immediate = value[L"immediate"].as_bool();
		string coalition = to_string(value[L"coalition"]);

		vector<string> unitTypes;
		vector<Coords> locations;
		for (auto unit : value[L"units"].as_array()) {
			string unitType = to_string(unit[L"unitType"]);
			double lat = unit[L"location"][L"lat"].as_double();
			double lng = unit[L"location"][L"lng"].as_double();
			Coords location; location.lat = lat; location.lng = lng;
			log("Spawning " + coalition + " GroundUnit of type " + unitType + " at (" + to_string(lat) + ", " + to_string(lng) + ")");
			unitTypes.push_back(unitType);
			locations.push_back(location);
		}

		command = dynamic_cast<Command*>(new SpawnGroundUnits(coalition, unitTypes, locations, immediate));
	}
	else if (key.compare("spawnNavyUnits") == 0)
	{
		bool immediate = value[L"immediate"].as_bool();
		string coalition = to_string(value[L"coalition"]);

		vector<string> unitTypes;
		vector<Coords> locations;
		for (auto unit : value[L"units"].as_array()) {
			string unitType = to_string(unit[L"unitType"]);
			double lat = unit[L"location"][L"lat"].as_double();
			double lng = unit[L"location"][L"lng"].as_double();
			Coords location; location.lat = lat; location.lng = lng;
			log("Spawning " + coalition + " NavyUnit of type " + unitType + " at (" + to_string(lat) + ", " + to_string(lng) + ")");
			unitTypes.push_back(unitType);
			locations.push_back(location);
		}

		command = dynamic_cast<Command*>(new SpawnNavyUnits(coalition, unitTypes, locations, immediate));
	}
	else if (key.compare("attackUnit") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		unsigned int targetID = value[L"targetID"].as_integer();

		Unit* unit = unitsManager->getGroupLeader(ID);
		Unit* target = unitsManager->getUnit(targetID);

		string unitName;
		string targetName;

		if (unit != nullptr)
			unitName = unit->getUnitName();
		else
			return;

		if (target != nullptr)
			targetName = target->getUnitName();
		else
			return;

		log("Unit " + unitName + " attacking unit " + targetName);
		unit->setTargetID(targetID);
		unit->setState(State::ATTACK);
	}
	else if (key.compare("followUnit") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		unsigned int leaderID = value[L"targetID"].as_double();
		double offsetX = value[L"offsetX"].as_double();
		double offsetY = value[L"offsetY"].as_double();
		double offsetZ = value[L"offsetZ"].as_double();

		Unit* unit = unitsManager->getGroupLeader(ID);
		Unit* leader = unitsManager->getUnit(leaderID);

		string unitName;
		string leaderName;

		if (unit != nullptr)
			unitName = unit->getUnitName();
		else
			return;

		if (leader != nullptr)
			leaderName = leader->getUnitName();
		else
			return;

		log("Unit " + unitName + " following unit " + leaderName);
		unit->setFormationOffset(Offset(offsetX, offsetY, offsetZ));
		unit->setLeaderID(leaderID);
		unit->setState(State::FOLLOW);
	}
	else if (key.compare("changeSpeed") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
			unit->changeSpeed(to_string(value[L"change"]));
	}
	else if (key.compare("changeAltitude") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
			unit->changeAltitude(to_string(value[L"change"]));
	}
	else if (key.compare("setSpeed") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
			unit->setDesiredSpeed(value[L"speed"].as_double());
	}
	else if (key.compare("setSpeedType") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
			unit->setDesiredSpeedType(to_string(value[L"speedType"]));
	}
	else if (key.compare("setAltitude") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
			unit->setDesiredAltitude(value[L"altitude"].as_double());
	}
	else if (key.compare("setAltitudeType") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
			unit->setDesiredAltitudeType(to_string(value[L"altitudeType"]));
	}
	else if (key.compare("cloneUnit") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		command = dynamic_cast<Command*>(new Clone(ID, loc));
		log("Cloning unit " + to_string(ID));
	}
	else if (key.compare("setROE") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		unsigned char ROE = value[L"ROE"].as_number().to_uint32();
		unit->setROE(ROE);
	}
	else if (key.compare("setReactionToThreat") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		unsigned char reactionToThreat = value[L"reactionToThreat"].as_number().to_uint32();
		unit->setReactionToThreat(reactionToThreat);
	}
	else if (key.compare("setEmissionsCountermeasures") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		unsigned char emissionsCountermeasures = value[L"emissionsCountermeasures"].as_number().to_uint32();
		unit->setEmissionsCountermeasures(emissionsCountermeasures);
	}
	else if (key.compare("landAt") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		unit->landAt(loc);
	}
	else if (key.compare("deleteUnit") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		bool explosion = value[L"explosion"].as_bool();
		bool immediate = value[L"immediate"].as_bool();
		unitsManager->deleteUnit(ID, explosion, immediate);
	}
	else if (key.compare("refuel") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setState(State::REFUEL);
	}
	else if (key.compare("setAdvancedOptions") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
		{
			/* Advanced tasking */
			unit->setIsTanker(value[L"isTanker"].as_bool());
			unit->setIsAWACS(value[L"isAWACS"].as_bool());

			/* TACAN Options */
			DataTypes::TACAN TACAN;
			TACAN.isOn = value[L"TACAN"][L"isOn"].as_bool();
			TACAN.channel = static_cast<unsigned char>(value[L"TACAN"][L"channel"].as_number().to_uint32());
			TACAN.XY = to_string(value[L"TACAN"][L"XY"]).at(0);
			string callsign = to_string(value[L"TACAN"][L"callsign"]);
			if (callsign.length() > 3)
				callsign = callsign.substr(0, 3);
			strcpy_s(TACAN.callsign, 4, callsign.c_str());
			unit->setTACAN(TACAN);

			/* Radio Options */
			auto radio = value[L"radio"];
			unit->setRadio({ radio[L"frequency"].as_number().to_uint32(),
				static_cast<unsigned char>(radio[L"callsign"].as_number().to_uint32()),
				static_cast<unsigned char>(radio[L"callsignNumber"].as_number().to_uint32())
				});

			/* General Settings */
			auto generalSettings = value[L"generalSettings"];
			unit->setGeneralSettings({ generalSettings[L"prohibitJettison"].as_bool(),
				generalSettings[L"prohibitAA"].as_bool(),
				generalSettings[L"prohibitAG"].as_bool(),
				generalSettings[L"prohibitAfterburner"].as_bool(),
				generalSettings[L"prohibitAirWpn"].as_bool(),
				});

			unit->resetActiveDestination();
		}
	}
	else if (key.compare("setFollowRoads") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		bool followRoads = value[L"followRoads"].as_bool();
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setFollowRoads(followRoads);
	}
	else if (key.compare("setOnOff") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		bool onOff = value[L"onOff"].as_bool();
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setOnOff(onOff);
	}
	else if (key.compare("explosion") == 0)
	{
		unsigned int intensity = value[L"intensity"].as_integer();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		log("Adding " + to_string(intensity) + " explosion at (" + to_string(lat) + ", " + to_string(lng) + ")");
		Coords loc; loc.lat = lat; loc.lng = lng;
		command = dynamic_cast<Command*>(new Explosion(intensity, loc));
	}
	else if (key.compare("bombPoint") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setState(State::BOMB_POINT);
		unit->setTargetPosition(loc);
	}
	else if (key.compare("carpetBomb") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setState(State::CARPET_BOMB);
		unit->setTargetPosition(loc);
	}
	else if (key.compare("bombBuilding") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setState(State::BOMB_BUILDING);
		unit->setTargetPosition(loc);
	}
	else if (key.compare("fireAtArea") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setState(State::FIRE_AT_AREA);
		unit->setTargetPosition(loc);
	}
	else
	{
		log("Unknown command: " + key);
	}

	if (command != nullptr)
	{
		appendCommand(command);
		log("New command appended correctly to stack. Current server load: " + to_string(getLoad()));
	}
}


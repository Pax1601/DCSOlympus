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

void Scheduler::setCommandModeOptions(json::value value) {
	if (value.has_boolean_field(L"restrictSpawns"))
		setRestrictSpawns(value[L"restrictSpawns"].as_bool());
	if (value.has_boolean_field(L"restrictToCoalition"))
		setRestrictToCoalition(value[L"restrictToCoalition"].as_bool());
	if (value.has_number_field(L"setupTime"))
		setSetupTime(value[L"setupTime"].as_number().to_int32());
	if (value.has_object_field(L"spawnPoints")) {
		if (value[L"spawnPoints"].has_number_field(L"blue"))
			setBlueSpawnPoints(value[L"spawnPoints"][L"blue"].as_number().to_int32());
		if (value[L"spawnPoints"].has_number_field(L"red"))
			setRedSpawnPoints(value[L"spawnPoints"][L"red"].as_number().to_int32());
	}
	if (value.has_array_field(L"eras")) {
		int length = value[L"eras"].as_array().size();
		vector<string> newEras;
		for (int idx = 0; idx < length; idx++)
			newEras.push_back(to_string(value[L"eras"].as_array().at(idx)));
		setEras(newEras);
	}
}

json::value Scheduler::getCommandModeOptions() {
	json::value json = json::value::object();

	json[L"restrictSpawns"] = json::value(getRestrictSpawns());
	json[L"restrictToCoalition"] = json::value(getRestrictToCoalition());
	json[L"setupTime"] = json::value(getSetupTime());
	json[L"spawnPoints"] = json::value::object();
	json[L"spawnPoints"][L"blue"] = json::value(getBlueSpawnPoints());
	json[L"spawnPoints"][L"red"] = json::value(getRedSpawnPoints());

	int idx = 0;
	json[L"eras"] = json::value::array();
	for (string era : getEras())
		json[L"eras"][idx++] = json::value(to_wstring(era));

	return json;
}

bool Scheduler::checkSpawnPoints(int spawnPoints, string coalition)
{
	if (!getRestrictSpawns()) return true;

	if (coalition.compare("blue") == 0) {
		if (getBlueSpawnPoints() - spawnPoints >= 0) {
			setBlueSpawnPoints(getBlueSpawnPoints() - spawnPoints);
			return true;
		}
		else {
			log("Not enough blue coalition spawn points available. Available: " + to_string(getBlueSpawnPoints()) + ", required: " + to_string(spawnPoints));
			return false;
		}
	}
	else if (coalition.compare("red") == 0) {
		if (getRedSpawnPoints() - spawnPoints >= 0) {
			setRedSpawnPoints(getRedSpawnPoints() - spawnPoints);
			return true;
		}
		else {
			log("Not enough red coalition spawn points available. Available: " + to_string(getRedSpawnPoints()) + ", required: " + to_string(spawnPoints));
			return false;
		}
	}
}

void Scheduler::handleRequest(string key, json::value value, string username)
{
	Command* command = nullptr;

	log("Received request with ID: " + key);
	log(L"Incoming command raw value: " + value.serialize());

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
				Coords dest; dest.lat = lat; dest.lng = lng;
				newPath.push_back(dest);
			}

			unit->setActivePath(newPath);
			unit->setState(State::REACH_DESTINATION);
			log(username + " updated destination path for unit " + unitName, true);
		}
	}
	else if (key.compare("smoke") == 0)
	{
		string color = to_string(value[L"color"]);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		log(username + " added a " + color + " smoke at (" + to_string(lat) + ", " + to_string(lng) + ")", true);
		Coords loc; loc.lat = lat; loc.lng = lng;
		command = dynamic_cast<Command*>(new Smoke(color, loc));
	}
	else if (key.compare("spawnAircrafts") == 0)
	{
		bool immediate = value[L"immediate"].as_bool();
		string coalition = to_string(value[L"coalition"]);
		string airbaseName = to_string(value[L"airbaseName"]);

		int spawnPoints = value[L"spawnPoints"].as_number().to_int32();
		if (!checkSpawnPoints(spawnPoints, coalition)) return;

		vector<string> unitTypes;
		vector<Coords> locations;
		vector<string> loadouts;
		vector<string> liveryIDs;
		for (auto unit : value[L"units"].as_array()) {
			string unitType = to_string(unit[L"unitType"]);
			double lat = unit[L"location"][L"lat"].as_double();
			double lng = unit[L"location"][L"lng"].as_double();
			double alt = unit[L"altitude"].as_double();
			Coords location; location.lat = lat; location.lng = lng; location.alt = alt;
			string loadout = to_string(unit[L"loadout"]);
			string liveryID = to_string(unit[L"liveryID"]);

			unitTypes.push_back(unitType);
			locations.push_back(location);
			loadouts.push_back(loadout);
			liveryIDs.push_back(liveryID);
			log(username + " spawned a " + coalition + " " + unitType, true);
		}

		command = dynamic_cast<Command*>(new SpawnAircrafts(coalition, unitTypes, locations, loadouts, liveryIDs, airbaseName, immediate));
	}
	else if (key.compare("spawnHelicopters") == 0)
	{
		bool immediate = value[L"immediate"].as_bool();
		string coalition = to_string(value[L"coalition"]);
		string airbaseName = to_string(value[L"airbaseName"]);

		int spawnPoints = value[L"spawnPoints"].as_number().to_int32();
		if (!checkSpawnPoints(spawnPoints, coalition)) return;

		vector<string> unitTypes;
		vector<Coords> locations;
		vector<string> loadouts;
		vector<string> liveryIDs;
		for (auto unit : value[L"units"].as_array()) {
			string unitType = to_string(unit[L"unitType"]);
			double lat = unit[L"location"][L"lat"].as_double();
			double lng = unit[L"location"][L"lng"].as_double();
			double alt = unit[L"altitude"].as_double();
			Coords location; location.lat = lat; location.lng = lng; location.alt = alt;
			string loadout = to_string(unit[L"loadout"]);
			string liveryID = to_string(unit[L"liveryID"]);

			unitTypes.push_back(unitType);
			locations.push_back(location);
			loadouts.push_back(loadout);
			liveryIDs.push_back(liveryID);
			log(username + " spawned a " + coalition + " " + unitType, true);
		}

		command = dynamic_cast<Command*>(new SpawnHelicopters(coalition, unitTypes, locations, loadouts, liveryIDs, airbaseName, immediate));
	}
	else if (key.compare("spawnGroundUnits") == 0)
	{
		bool immediate = value[L"immediate"].as_bool();
		string coalition = to_string(value[L"coalition"]);

		int spawnPoints = value[L"spawnPoints"].as_number().to_int32();
		if (!checkSpawnPoints(spawnPoints, coalition)) return;

		vector<string> unitTypes;
		vector<Coords> locations;
		vector<string> liveryIDs;
		for (auto unit : value[L"units"].as_array()) {
			string unitType = to_string(unit[L"unitType"]);
			double lat = unit[L"location"][L"lat"].as_double();
			double lng = unit[L"location"][L"lng"].as_double();
			Coords location; location.lat = lat; location.lng = lng;
			string liveryID = to_string(unit[L"liveryID"]);
			
			unitTypes.push_back(unitType);
			locations.push_back(location);
			liveryIDs.push_back(liveryID);
			log(username + " spawned a " + coalition + " " + unitType, true);
		}

		command = dynamic_cast<Command*>(new SpawnGroundUnits(coalition, unitTypes, locations, liveryIDs, immediate));
	}
	else if (key.compare("spawnNavyUnits") == 0)
	{
		bool immediate = value[L"immediate"].as_bool();
		string coalition = to_string(value[L"coalition"]);

		int spawnPoints = value[L"spawnPoints"].as_number().to_int32();
		if (!checkSpawnPoints(spawnPoints, coalition)) return;

		vector<string> unitTypes;
		vector<Coords> locations;
		vector<string> liveryIDs;
		for (auto unit : value[L"units"].as_array()) {
			string unitType = to_string(unit[L"unitType"]);
			double lat = unit[L"location"][L"lat"].as_double();
			double lng = unit[L"location"][L"lng"].as_double();
			Coords location; location.lat = lat; location.lng = lng;
			string liveryID = to_string(unit[L"liveryID"]);

			unitTypes.push_back(unitType);
			locations.push_back(location);
			liveryIDs.push_back(liveryID);
			log(username + " spawned a " + coalition + " " + unitType, true);
		}

		command = dynamic_cast<Command*>(new SpawnNavyUnits(coalition, unitTypes, locations, liveryIDs, immediate));
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

		log(username + " tasked unit " + unitName + " to attack unit " + targetName, true);
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

		log(username + " tasked unit " + unitName + " to follow unit " + leaderName, true);
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
	}
	else if (key.compare("setROE") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		unsigned char ROE = value[L"ROE"].as_number().to_uint32();
		unit->setROE(ROE);
		log(username + " set unit " + unit->getName() + " ROE to " + to_string(ROE), true);
	}
	else if (key.compare("setReactionToThreat") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		unsigned char reactionToThreat = value[L"reactionToThreat"].as_number().to_uint32();
		unit->setReactionToThreat(reactionToThreat);
		log(username + " set unit " + unit->getName() + " reaction to threat to " + to_string(reactionToThreat), true);
	}
	else if (key.compare("setEmissionsCountermeasures") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		unsigned char emissionsCountermeasures = value[L"emissionsCountermeasures"].as_number().to_uint32();
		unit->setEmissionsCountermeasures(emissionsCountermeasures);
		log(username + " set unit " + unit->getName() + " emissions and countermeasures to " + to_string(emissionsCountermeasures), true);
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
		log(username + " tasked unit " + unit->getName() + " to land", true);
	}
	else if (key.compare("deleteUnit") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		bool explosion = value[L"explosion"].as_bool();
		bool immediate = value[L"immediate"].as_bool();
		unitsManager->deleteUnit(ID, explosion, immediate);
		Unit* unit = unitsManager->getUnit(ID);
		log(username + " deleted unit " + unit->getName(), true);
	}
	else if (key.compare("refuel") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setState(State::REFUEL);
		log(username + " tasked unit " + unit->getName() + " to refuel", true);
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
		log(username + " tasked unit " + unit->getName() + " to bomb a point", true);
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
		log(username + " tasked unit " + unit->getName() + " to perform carpet bombing", true);
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
		log(username + " tasked unit " + unit->getName() + " to fire at area", true);
	}
	else if (key.compare("setCommandModeOptions") == 0) {
		setCommandModeOptions(value);
		log(username + " updated the Command Mode Options", true);
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


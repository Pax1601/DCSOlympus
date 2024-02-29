#include "scheduler.h"
#include "logger.h"
#include "dcstools.h"
#include "unitsManager.h"
#include "utils.h"
#include "unit.h"

extern UnitsManager* unitsManager;

Scheduler::Scheduler(lua_State* L)
{
	LogInfo(L, "Scheduler constructor called successfully");
}

Scheduler::~Scheduler()
{

}

/* Appends a */
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
			
				/* Adjust the load depending on the fps */
				double fpsMultiplier = 20;
				if (getFrameRate() + 3 > 0)
					fpsMultiplier = static_cast<unsigned int>(max(1, 60 / (getFrameRate() + 3))); /* Multiplier between 1 and 20 */

				load = static_cast<unsigned int>(command->getLoad() * fpsMultiplier);
				commands.remove(command);
				executedCommandsHashes.push_back(command->getHash());
				command->executeCallback(); /* Execute the command callback (this is a lambda function that can be used to execute a function when the command is run) */
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
		int length = static_cast<int>(value[L"eras"].as_array().size());
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

	return false;
}

void Scheduler::handleRequest(string key, json::value value, string username, json::value& answer)
{
	Command* command = nullptr;

	log("Received request with ID: " + key);
	log(L"Incoming command raw value: " + value.serialize());

	/************************/
	if (key.compare("setPath") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
		{
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
			log(username + " updated destination path for unit " + unit->getUnitName() + "(" + unit->getName() + ")", true);
		}
	}
	/************************/
	else if (key.compare("smoke") == 0)
	{
		string color = to_string(value[L"color"]);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		
		Coords loc; loc.lat = lat; loc.lng = lng;
		command = dynamic_cast<Command*>(new Smoke(color, loc));
		log(username + " added a " + color + " smoke at (" + to_string(lat) + ", " + to_string(lng) + ")", true);
	}
	/************************/
	else if (key.compare("spawnAircrafts") == 0 || key.compare("spawnHelicopters") == 0)
	{
		bool immediate = value[L"immediate"].as_bool();
		string coalition = to_string(value[L"coalition"]);
		string airbaseName = to_string(value[L"airbaseName"]);
		string country = to_string(value[L"country"]);


		int spawnPoints = value[L"spawnPoints"].as_number().to_int32();
		if (!checkSpawnPoints(spawnPoints, coalition)) return;

		vector<SpawnOptions> spawnOptions;
		for (auto unit : value[L"units"].as_array()) {
			string unitType = to_string(unit[L"unitType"]);
			double lat = unit[L"location"][L"lat"].as_double();
			double lng = unit[L"location"][L"lng"].as_double();
			double alt = unit[L"altitude"].as_double();
			double heading = unit[L"heading"].as_double();
			Coords location; location.lat = lat; location.lng = lng; location.alt = alt;
			string loadout = to_string(unit[L"loadout"]);
			string liveryID = to_string(unit[L"liveryID"]);
			string skill = to_string(unit[L"skill"]);

			spawnOptions.push_back({unitType, location, heading, loadout, skill, liveryID});
			log(username + " spawned a " + coalition + " " + unitType , true);
		}

		if (key.compare("spawnAircrafts") == 0)
			command = dynamic_cast<Command*>(new SpawnAircrafts(coalition, spawnOptions, airbaseName, country, immediate));
		else
			command = dynamic_cast<Command*>(new SpawnHelicopters(coalition, spawnOptions, airbaseName, country, immediate));
	}
	/************************/
	else if (key.compare("spawnGroundUnits") == 0 || key.compare("spawnNavyUnits") == 0)
	{
		bool immediate = value[L"immediate"].as_bool();
		string coalition = to_string(value[L"coalition"]);
		string country = to_string(value[L"country"]);

		int spawnPoints = value[L"spawnPoints"].as_number().to_int32();
		if (!checkSpawnPoints(spawnPoints, coalition)) return;

		vector<SpawnOptions> spawnOptions;
		for (auto unit : value[L"units"].as_array()) {
			string unitType = to_string(unit[L"unitType"]);
			double lat = unit[L"location"][L"lat"].as_double();
			double lng = unit[L"location"][L"lng"].as_double();
			double heading = unit[L"heading"].as_double();
			Coords location; location.lat = lat; location.lng = lng;
			string liveryID = to_string(unit[L"liveryID"]);
			string skill = to_string(unit[L"skill"]);
			
			spawnOptions.push_back({ unitType, location, heading, "", skill, liveryID});
			log(username + " spawned a " + coalition + " " + unitType, true);
		}

		if (key.compare("spawnGroundUnits") == 0)
			command = dynamic_cast<Command*>(new SpawnGroundUnits(coalition, spawnOptions, country, immediate));
		else
			command = dynamic_cast<Command*>(new SpawnNavyUnits(coalition, spawnOptions, country, immediate));
	}
	/************************/
	else if (key.compare("attackUnit") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		unsigned int targetID = value[L"targetID"].as_integer();

		Unit* unit = unitsManager->getGroupLeader(ID);
		Unit* target = unitsManager->getUnit(targetID);

		if (unit != nullptr && target != nullptr) {
			log(username + " tasked unit " + unit->getUnitName() + "(" + unit->getName() + ") to attack unit " + target->getUnitName() + "(" + target->getName() + ")", true);
			unit->setTargetID(targetID);
			unit->setState(State::ATTACK);
		}
	}
	/************************/
	else if (key.compare("followUnit") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		unsigned int leaderID = value[L"targetID"].as_integer();
		double offsetX = value[L"offsetX"].as_double();
		double offsetY = value[L"offsetY"].as_double();
		double offsetZ = value[L"offsetZ"].as_double();

		Unit* unit = unitsManager->getGroupLeader(ID);
		Unit* leader = unitsManager->getUnit(leaderID);

		if (unit != nullptr && leader != nullptr) {
			log(username + " tasked unit " + unit->getUnitName() + "(" + unit->getName() + ") to follow unit " + leader->getUnitName() + "(" + leader->getName() + ")", true);
			unit->setFormationOffset(Offset(offsetX, offsetY, offsetZ));
			unit->setLeaderID(leaderID);
			unit->setState(State::FOLLOW);
		}
	}
	/************************/
	else if (key.compare("changeSpeed") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->changeSpeed(to_string(value[L"change"]));
			log(username + " changed " + unit->getUnitName() + "(" + unit->getName() + ") speed: " + to_string(value[L"change"]), true);
		}
	}
	/************************/
	else if (key.compare("changeAltitude") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->changeAltitude(to_string(value[L"change"]));
			log(username + " changed " + unit->getUnitName() + "(" + unit->getName() + ") altitude: " + to_string(value[L"change"]), true);
		}
	}
	/************************/
	else if (key.compare("setSpeed") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setDesiredSpeed(value[L"speed"].as_double());
			log(username + " set " + unit->getUnitName() + "(" + unit->getName() + ") speed: " + to_string(value[L"speed"].as_double()), true);
		}
	}
	/************************/
	else if (key.compare("setSpeedType") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setDesiredSpeedType(to_string(value[L"speedType"]));
			log(username + " set " + unit->getUnitName() + "(" + unit->getName() + ") speed type: " + to_string(value[L"speedType"]), true);
		}
	}
	/************************/
	else if (key.compare("setAltitude") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setDesiredAltitude(value[L"altitude"].as_double());
			log(username + " set " + unit->getUnitName() + "(" + unit->getName() + ")  altitude: " + to_string(value[L"altitude"].as_double()), true);
		}
	}
	/************************/
	else if (key.compare("setAltitudeType") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setDesiredAltitudeType(to_string(value[L"altitudeType"]));
			log(username + " set " + unit->getUnitName() + "(" + unit->getName() + ") altitude type: " + to_string(value[L"altitudeType"]), true);
		}
	}
	/************************/
	else if (key.compare("cloneUnits") == 0)
	{
		vector<CloneOptions> cloneOptions;
		bool deleteOriginal = value[L"deleteOriginal"].as_bool();

		for (auto unit : value[L"units"].as_array()) {
			unsigned int ID = unit[L"ID"].as_integer();
			double lat = unit[L"location"][L"lat"].as_double();
			double lng = unit[L"location"][L"lng"].as_double();
			
			Coords location; location.lat = lat; location.lng = lng;
			cloneOptions.push_back({ ID, location });
			log(username + " cloning unit with ID " + to_string(ID), true);
		}

		command = dynamic_cast<Command*>(new Clone(cloneOptions, deleteOriginal));
	}
	/************************/
	else if (key.compare("setROE") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unsigned char ROE = value[L"ROE"].as_number().to_uint32();
			unit->setROE(ROE);
			log(username + " set unit " + unit->getUnitName() + "(" + unit->getName() + ") ROE to " + to_string(ROE), true);
		}
	}
	/************************/
	else if (key.compare("setReactionToThreat") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unsigned char reactionToThreat = value[L"reactionToThreat"].as_number().to_uint32();
			unit->setReactionToThreat(reactionToThreat);
			log(username + " set unit " + unit->getUnitName() + "(" + unit->getName() + ") reaction to threat to " + to_string(reactionToThreat), true);
		}
	}
	/************************/
	else if (key.compare("setEmissionsCountermeasures") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unsigned char emissionsCountermeasures = value[L"emissionsCountermeasures"].as_number().to_uint32();
			unit->setEmissionsCountermeasures(emissionsCountermeasures);
			log(username + " set unit " + unit->getUnitName() + "(" + unit->getName() + ") emissions and countermeasures to " + to_string(emissionsCountermeasures), true);
		}
	}
	/************************/
	else if (key.compare("landAt") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			double lat = value[L"location"][L"lat"].as_double();
			double lng = value[L"location"][L"lng"].as_double();
			Coords loc; loc.lat = lat; loc.lng = lng;
			unit->landAt(loc);
			log(username + " tasked unit " + unit->getUnitName() + "(" + unit->getName() + ") to land", true);
		}
	}
	/************************/
	else if (key.compare("deleteUnit") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		bool explosion = value[L"explosion"].as_bool();
		string explosionType = to_string(value[L"explosionType"]);
		bool immediate = value[L"immediate"].as_bool();
		Unit* unit = unitsManager->getUnit(ID);
		if (unit != nullptr) {
			unitsManager->deleteUnit(ID, explosion, explosionType, immediate);
			log(username + " deleted unit " + unit->getUnitName() + "(" + unit->getName() + ")", true);
		}
	}
	/************************/
	else if (key.compare("refuel") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setState(State::REFUEL);
			log(username + " tasked unit " + unit->getUnitName() + "(" + unit->getName() + ")  to refuel", true);
		}
	}
	/************************/
	else if (key.compare("setAdvancedOptions") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
		{
			/* Advanced tasking */
			unit->setIsActiveTanker(value[L"isActiveTanker"].as_bool());
			unit->setIsActiveAWACS(value[L"isActiveAWACS"].as_bool());

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

			log(username + " updated unit " + unit->getUnitName() + "(" + unit->getName() + ") advancedOptions", true);
		}
	}
	/************************/
	else if (key.compare("setFollowRoads") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		bool followRoads = value[L"followRoads"].as_bool();
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setFollowRoads(followRoads);
			log(username + " set unit " + unit->getUnitName() + "(" + unit->getName() + ") followRoads to: " + (followRoads ? "true" : "false"), true);
		}
	}
	/************************/
	else if (key.compare("setOnOff") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		bool onOff = value[L"onOff"].as_bool();
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setOnOff(onOff);
			log(username + " set unit " + unit->getUnitName() + "(" + unit->getName() + ") onOff to: " + (onOff? "true": "false"), true);
		}
	}
	/************************/
	else if (key.compare("explosion") == 0)
	{
		unsigned int intensity = value[L"intensity"].as_integer();
		string explosionType = to_string(value[L"explosionType"]);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		log("Adding explosion of type " + explosionType + " at (" + to_string(lat) + ", " + to_string(lng) + ")");
		Coords loc; loc.lat = lat; loc.lng = lng;
		command = dynamic_cast<Command*>(new Explosion(intensity, explosionType, loc));
	}
	/************************/
	else if (key.compare("bombPoint") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setTargetPosition(loc);
			unit->setState(State::BOMB_POINT);
			log(username + " tasked unit " + unit->getUnitName() + "(" + unit->getName() + ") to bomb a point", true);
		}
	}
	/************************/
	else if (key.compare("carpetBomb") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setTargetPosition(loc);
			unit->setState(State::CARPET_BOMB);
			log(username + " tasked unit " + unit->getUnitName() + "(" + unit->getName() + ") to perform carpet bombing", true);
		}
	}
	/************************/
	/* TODO: this command does not appear to be working in DCS and has been disabled */
	else if (key.compare("bombBuilding") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setTargetPosition(loc);
			unit->setState(State::BOMB_BUILDING);
		}
	}
	/************************/
	else if (key.compare("fireAtArea") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setTargetPosition(loc);
			unit->setState(State::FIRE_AT_AREA);
			log(username + " tasked unit " + unit->getUnitName() + "(" + unit->getName() + ") to fire at area", true);
		}
	}
	/************************/
	else if (key.compare("simulateFireFight") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		double alt = value[L"altitude"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng; loc.alt = alt;
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setTargetPosition(loc);
			unit->setState(State::SIMULATE_FIRE_FIGHT);
			log(username + " tasked unit " + unit->getUnitName() + "(" + unit->getName() + ") to simulate a fire fight", true);
		}
	}
	/************************/
	else if (key.compare("scenicAAA") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setState(State::SCENIC_AAA);
			log(username + " tasked unit " + unit->getUnitName() + "(" + unit->getName() + ") to enter scenic AAA state", true);
		}
	}
	/************************/
	else if (key.compare("missOnPurpose") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setState(State::MISS_ON_PURPOSE);
			log(username + " tasked unit " + unit->getUnitName() + "(" + unit->getName() + ") to enter Miss On Purpose state", true);
		}
	}
	/************************/
	else if (key.compare("setOperateAs") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		unsigned char operateAs = value[L"operateAs"].as_number().to_uint32();
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) 
			unit->setOperateAs(operateAs);
	}
	/************************/
	else if (key.compare("landAtPoint") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		Unit* unit = unitsManager->getGroupLeader(ID);

		if (unit != nullptr) {
			list<Coords> newPath;
			newPath.push_back(loc);
			unit->setActivePath(newPath);
			unit->setState(State::LAND_AT_POINT);

			log(username + " tasked unit " + unit->getUnitName() + "(" + unit->getName() + ") to land at point", true);
		}
	}
	/************************/
	else if (key.compare("setShotsScatter") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unsigned char shotsScatter = value[L"shotsScatter"].as_number().to_uint32();
			unit->setShotsScatter(shotsScatter);
			log(username + " set unit " + unit->getUnitName() + "(" + unit->getName() + ") shots scatter to " + to_string(shotsScatter), true);
		}
	}
	/************************/
	else if (key.compare("setShotsIntensity") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unsigned char shotsIntensity = value[L"shotsIntensity"].as_number().to_uint32();
			unit->setShotsIntensity(shotsIntensity);
			log(username + " set unit " + unit->getUnitName() + "(" + unit->getName() + ") shots intensity to " + to_string(shotsIntensity), true);
		}
	}
	/************************/
	else if (key.compare("setCommandModeOptions") == 0) 
	{
		setCommandModeOptions(value);
		log(username + " updated the Command Mode Options", true);
	}
	/************************/
	else if (key.compare("reloadDatabases") == 0) {
		unitsManager->loadDatabases();
	}
	/************************/
	else
	{
		log("Unknown command: " + key);
	}

	if (command != nullptr)
	{
		appendCommand(command);
		log("New command appended correctly to stack. Current server load: " + to_string(getLoad()));
		answer[L"commandHash"] = json::value(to_wstring(command->getHash()));
	}
}

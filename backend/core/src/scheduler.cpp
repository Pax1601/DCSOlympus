#include "scheduler.h"
#include "logger.h"
#include "dcstools.h"
#include "unitsManager.h"
#include "utils.h"
#include "unit.h"

#include <GeographicLib/Geodesic.hpp>
using namespace GeographicLib;

extern UnitsManager* unitsManager;
extern map<string, function<void(Unit*)>> onSpawnCallbacks;

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
				string resultString = "";
				if (dostring_in(L, "server", (commandString), resultString))
					log("Error executing command " + commandString);
				else
					log("Command '" + commandString + "' executed correctly, current load " + to_string(getLoad()) + ", result string: " + resultString);
			
				/* Adjust the load depending on the fps */
				double fpsMultiplier = 20;
				if (getFrameRate() + 3 > 0)
					fpsMultiplier = static_cast<unsigned int>(max(1, 60 / (getFrameRate() + 3))); /* Multiplier between 1 and 20 */

				load = static_cast<unsigned int>(command->getLoad() * fpsMultiplier);
				commands.remove(command);
				CommandResult commandResult = {
					command->getHash(), resultString
				};
				executedCommandResults.push_back(commandResult);
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
				if (path[i].has_number_field(L"threshold")) {
					double threshold = path[i][L"threshold"].as_double();
					Coords dest; dest.lat = lat; dest.lng = lng; dest.threshold = threshold;
					newPath.push_back(dest);
					continue;
				}
				Coords dest; dest.lat = lat; dest.lng = lng;
				newPath.push_back(dest);
			}

			unit->setActivePath(newPath);
			unit->setState(State::REACH_DESTINATION);
			log(username + " updated destination path for unit " + unit->getUnitName() + "(" + unit->getName() + ")", true);
		}
	}
	/************************/
	else if (key.compare("stop") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
		{
			json::value path = value[L"path"];
			list<Coords> newPath;

			// Set the path to an empty list to stop the unit, and set the state to IDLE
			unit->setActivePath(newPath);
			unit->setState(State::IDLE);

			log(username + " stopped unit " + unit->getUnitName() + "(" + unit->getName() + ")", true);
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
		if (!checkSpawnPoints(spawnPoints, coalition)) {
			log(username + " insufficient spawn points ", true);
			return;
		}

		string groupName = "";
		if (value.has_string_field(L"groupName"))
			groupName = to_string(value[L"groupName"]);

		vector<SpawnOptions> spawnOptions;
		for (auto unit : value[L"units"].as_array()) {
			string unitType = to_string(unit[L"unitType"]);
			double lat = unit[L"location"][L"lat"].as_double();
			double lng = unit[L"location"][L"lng"].as_double();
			double alt = unit[L"altitude"].as_double();
			double heading = 0;
			if (unit.has_number_field(L"heading"))
				heading = unit[L"heading"].as_double();

			Coords location; location.lat = lat; location.lng = lng; location.alt = alt;
			string loadout = to_string(unit[L"loadout"]);
			string liveryID = to_string(unit[L"liveryID"]);
			string skill = to_string(unit[L"skill"]);

			string payload = "nil";
			if (unit.has_string_field(L"payload"))
				payload = to_string(unit[L"payload"]);

			string name = "";
			if (unit.has_string_field(L"name"))
				name = to_string(unit[L"name"]);

			spawnOptions.push_back({ unitType, location, loadout, skill, liveryID, heading, payload, name });
			log(username + " spawned a " + coalition + " " + unitType, true);
		}

		if (key.compare("spawnAircrafts") == 0)
			command = dynamic_cast<Command*>(new SpawnAircrafts(coalition, spawnOptions, airbaseName, country, groupName, immediate));
		else
			command = dynamic_cast<Command*>(new SpawnHelicopters(coalition, spawnOptions, airbaseName, country, groupName, immediate));
	}
	/************************/
	else if (key.compare("spawnGroundUnits") == 0 || key.compare("spawnNavyUnits") == 0)
	{
		bool immediate = value[L"immediate"].as_bool();
		string coalition = to_string(value[L"coalition"]);
		string country = to_string(value[L"country"]);

		int spawnPoints = value[L"spawnPoints"].as_number().to_int32();
		if (!checkSpawnPoints(spawnPoints, coalition)) {
			log(username + " insufficient spawn points ", true);
			return;
		}

		string groupName = "";
		if (value.has_string_field(L"groupName"))
			groupName = to_string(value[L"groupName"]);

		vector<SpawnOptions> spawnOptions;
		for (auto unit : value[L"units"].as_array()) {
			string unitType = to_string(unit[L"unitType"]);
			double lat = unit[L"location"][L"lat"].as_double();
			double lng = unit[L"location"][L"lng"].as_double();
			double heading = 0;
			if (unit.has_number_field(L"heading"))
				heading = unit[L"heading"].as_double();

			Coords location; location.lat = lat; location.lng = lng;
			string liveryID = to_string(unit[L"liveryID"]);
			string skill = to_string(unit[L"skill"]);

			string name = "";
			if (unit.has_string_field(L"name"))
				name = to_string(unit[L"name"]);

			spawnOptions.push_back({ unitType, location, "", skill, liveryID, heading, "", name});
			log(username + " spawned a " + coalition + " " + unitType, true);
		}

		if (key.compare("spawnGroundUnits") == 0)
			command = dynamic_cast<Command*>(new SpawnGroundUnits(coalition, spawnOptions, country, groupName, immediate));
		else
			command = dynamic_cast<Command*>(new SpawnNavyUnits(coalition, spawnOptions, country, groupName, immediate));
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
	else if (key.compare("setRacetrack") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setRacetrackLength(value[L"length"].as_double());

			double lat = value[L"location"][L"lat"].as_double();
			double lng = value[L"location"][L"lng"].as_double();
			Coords location; location.lat = lat; location.lng = lng;
			unit->setRacetrackAnchor(location);

			unit->setRacetrackBearing(value[L"bearing"].as_double());

			log(username + " set " + unit->getUnitName() + "(" + unit->getName() + ")  racetrack length: " + to_string(value[L"length"].as_double()) + " racetrack bearing: " + to_string(value[L"bearing"].as_double()), true);
		}
	}
	/************************/
	else if (key.compare("cloneUnits") == 0)
	{
		vector<CloneOptions> cloneOptions;
		bool deleteOriginal = value[L"deleteOriginal"].as_bool();
		string coalition = to_string(value[L"coalition"]);

		int spawnPoints = value[L"spawnPoints"].as_number().to_int32();
		if (coalition.compare("all") != 0 && !checkSpawnPoints(spawnPoints, coalition)) {
			log(username + " insufficient spawn points ", true);
			return;
		}

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
	else if (key.compare("setAlarmState") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unsigned char alarmState = value[L"alarmState"].as_number().to_uint32();
			unit->setAlarmState(alarmState);
			log(username + " set unit " + unit->getUnitName() + "(" + unit->getName() + ") alarm state to " + to_string(alarmState), true);
		}
		else {
			log("Error while setting setAlarmState. Unit does not exist.");
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
	else if (key.compare("setEngagementProperties") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
		{
			/* Engagement properties tasking */
			unit->setBarrelHeight(value[L"barrelHeight"].as_number().to_double());
			unit->setMuzzleVelocity(value[L"muzzleVelocity"].as_number().to_double());
			unit->setAimTime(value[L"aimTime"].as_number().to_double());
			unit->setShotsToFire(value[L"shotsToFire"].as_number().to_uint32());
			unit->setShotsBaseInterval(value[L"shotsBaseInterval"].as_number().to_double());
			unit->setShotsBaseScatter(value[L"shotsBaseScatter"].as_number().to_double());
			unit->setEngagementRange(value[L"engagementRange"].as_number().to_double());
			unit->setTargetingRange(value[L"targetingRange"].as_number().to_double());
			unit->setAimMethodRange(value[L"aimMethodRange"].as_number().to_double());
			unit->setAcquisitionRange(value[L"acquisitionRange"].as_number().to_double());

			log(username + " updated unit " + unit->getUnitName() + "(" + unit->getName() + ") engagementProperties", true);
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
			log(username + " set unit " + unit->getUnitName() + "(" + unit->getName() + ") onOff to: " + (onOff ? "true" : "false"), true);
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

		unsigned int shotsToFire = value[L"shotsToFire"].as_number().to_uint32();
		double radius = value[L"radius"].as_number().to_double();

		if (value[L"location"].has_number_field(L"alt")) {
			loc.alt = value[L"location"][L"alt"].as_double();
		}

		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setArtilleryShotsToFire(shotsToFire);
			unit->setArtilleryRadius(radius);
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
	else if (key.compare("simulateEngagement") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unit->setState(State::SIMULATE_ENGAGEMENT);
			log(username + " tasked unit " + unit->getUnitName() + "(" + unit->getName() + ") to simulate an engagement", true);
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
	else if (key.compare("setPosture") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		unitsManager->acquireControl(ID);
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr) {
			unsigned char posture = value[L"posture"].as_number().to_uint32();
			unit->setPosture(posture);
			log(username + " set unit " + unit->getUnitName() + "(" + unit->getName() + ") posture to " + to_string(posture), true);
		}
		}
	/************************/
	else if (key.compare("fireLaser") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		if (unit != nullptr) {
			double lat = value[L"location"][L"lat"].as_double();
			double lng = value[L"location"][L"lng"].as_double();
			Coords loc; loc.lat = lat; loc.lng = lng;
			unsigned int code = value[L"code"].as_integer();

			log("Firing laser with code " + to_string(code) + " from unit " + unit->getUnitName() + " to (" + to_string(lat) + ", " + to_string(lng) + ")");

			command = dynamic_cast<Command*>(new FireLaser(ID, code, loc));
		}
	}
	/************************/
	else if (key.compare("fireInfrared") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		if (unit != nullptr) {
			double lat = value[L"location"][L"lat"].as_double();
			double lng = value[L"location"][L"lng"].as_double();
			Coords loc; loc.lat = lat; loc.lng = lng;

			log("Firing infrared from unit " + unit->getUnitName() + " to (" + to_string(lat) + ", " + to_string(lng) + ")");

			command = dynamic_cast<Command*>(new FireInfrared(ID, loc));
		}
	}
	/************************/
	else if (key.compare("setLaserCode") == 0)
	{
		unsigned int spotID = value[L"spotID"].as_integer();
		unsigned int code = value[L"code"].as_integer();

		log("Setting laser code " + to_string(code) + " to spot with ID " + to_string(spotID));
		command = dynamic_cast<Command*>(new SetLaserCode(spotID, code));
	}
	/************************/
	else if (key.compare("moveSpot") == 0)
	{
		unsigned int spotID = value[L"spotID"].as_integer();

		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;

		log("Moving spot with ID " + to_string(spotID) + " to (" + to_string(lat) + ", " + to_string(lng) + ")");
		command = dynamic_cast<Command*>(new MoveSpot(spotID, loc));
	}
	/************************/
	else if (key.compare("deleteSpot") == 0)
	{
		unsigned int spotID = value[L"spotID"].as_integer();
		log("Deleting spot with ID " + to_string(spotID));
		command = dynamic_cast<Command*>(new DeleteSpot(spotID));
	}
	/************************/
	else if (key.compare("createMarker") == 0)
	{
		unsigned int markerID = value[L"markerID"].as_integer();
		string text = to_string(value[L"text"]);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;

		log("Creating marker with ID " + to_string(markerID));
		command = dynamic_cast<Command*>(new CreateMarker(markerID, loc, text));
	}
	/************************/
	else if (key.compare("deleteMarker") == 0)
	{
		unsigned int markerID = value[L"markerID"].as_integer();
		log("Deleting marker with ID " + to_string(markerID));
		command = dynamic_cast<Command*>(new DeleteMarker(markerID));
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
	else if (key.compare("setCargoWeight") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		if (unit != nullptr) {
			double weight = value[L"weight"].as_double();
			unit->setCargoWeight(weight);
			log(username + " set weight to unit " + unit->getUnitName() + "(" + unit->getName() + "), " + to_string(weight), true);
		}
	}
	/************************/
	else if (key.compare("registerDrawArgument") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		if (unit != nullptr) {
			int argument = value[L"argument"].as_integer();
			bool active = value[L"active"].as_bool();

			command = dynamic_cast<Command*>(new RegisterDrawArgument(ID, argument, active));

			log(username + " registered draw argument " + to_string(argument) + " for unit " + unit->getUnitName() + "(" + unit->getName() + "), value:" + to_string(active), true);
		}
	}
	/************************/
	else if (key.compare("setCustomString") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		if (unit != nullptr) {
			string customString = to_string(value[L"customString"]);
			unit->setCustomString(customString);
			log(username + " set custom string to unit " + unit->getUnitName() + "(" + unit->getName() + "), " + customString, true);
		}
	}
	/************************/
	else if (key.compare("setCustomInteger") == 0)
	{
		unsigned int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		if (unit != nullptr) {
			double customNumber = value[L"customInteger"].as_double();
			unit->setCustomInteger(customNumber);
			log(username + " set custom number to unit " + unit->getUnitName() + "(" + unit->getName() + "), " + to_string(customNumber), true);
		}
	}/************************/
	else if (key.compare("embarkUnits") == 0)
	{
		// The json for the loadTroops command is expected to be in the following format:
		// {
		//   "command": "loadTroops",
		//   "ID": 123, // ID of the transport unit
		//   "unitIDs": [ 345, 678 ] // Array of unit IDs to be loaded as troops
		//  }

		unsigned int transportID = value[L"ID"].as_integer();
		vector<unsigned int> unitIDs;
		for (auto unitID : value[L"unitIDs"].as_array()) {
			unitIDs.push_back(unitID.as_integer());
		}

		// Check that the transport unit exists and is a valid transport unit
		Unit* transportUnit = unitsManager->getUnit(transportID);
		if (transportUnit != nullptr && transportUnit->getCanTransportUnits()) {
			// Loop on all the units to be loaded
			for (unsigned int unitID : unitIDs) {
				Unit* unit = unitsManager->getUnit(unitID);
				if (unit != nullptr) {
					// Compute the distance between the transport and the unit
					double dist;
					double bearing1;
					double bearing2;
					Geodesic::WGS84().Inverse(unit->getPosition().lat, unit->getPosition().lng, transportUnit->getPosition().lat, transportUnit->getPosition().lng, dist, bearing1, bearing2);

					// Iterate on all the units and check if this unit is already in any transport
					bool unitAlreadyTransported = false;
					for (auto& u : unitsManager->getUnits()) {
						if (u.second->getCanTransportUnits()) {
							for (unsigned int onBoardUnitID : u.second->getOnBoardUnitsIDs()) {
								if (onBoardUnitID == unitID) {
									unitAlreadyTransported = true;
									break;
								}
							}
						}
					}

					// If the unit is not already being transported, set its targetID to the transport unit and set its state to EMBARK
					if (!unitAlreadyTransported && unit->getType() == "Infantry") {
						unit->setTargetID(transportID);
						unit->setState(State::EMBARKING);
					}
					else {
						log("Error while loading troops. Unit with ID " + to_string(unitID) + " is already being transported by another transport unit.");
					}
				}
				else {
					log("Error while loading troops. Unit with ID " + to_string(unitID) + " does not exist.");
				}
			}
		}
		else {
			log("Error while loading troops. Transport unit with ID " + to_string(transportID) + " does not exist or is not a valid transport unit.");
		}
	}
	/************************/
	else if (key.compare("disembarkUnits") == 0)
	{
		// The json for the unloadTroops command is expected to be in the following format:
		// {
		//   "command": "unloadTroops",
		//   "ID": 123, // ID of the transport unit
		// }

		unsigned int transportID = value[L"ID"].as_integer();
		Unit* transportUnit = unitsManager->getUnit(transportID);

		// Check that the transport unit exists, is alive, is transporting units, is on the ground, and the speed is less than 2 m/s
		if (transportUnit != nullptr && 
			transportUnit->getAlive() && 
			transportUnit->getOnBoardUnitsIDs().size() > 0 && 
			!transportUnit->getAirborne() && 
			transportUnit->getSpeed() < 2) {
			int unitIndex = 0;
			// Loop on all the units being transported and add them back to the map at the position of the transport unit
			for (unsigned int unitID : transportUnit->getOnBoardUnitsIDs()) {
				// Compute the position of the new units to be in front of the transport at a distance of 10 meters + 1 meter for each unit already unloaded (to avoid them being on top of each other)
				Coords newUnitPosition;

				// If the transportr is an aircraft, disembark the troops behind the transport
				if (transportUnit->getDropsUnitsFromTheRear()) {
					// Disembark the troops in a line, with rows of 5 units, behind the transport and 1 meter between each unit
					double disembarkDistance = transportUnit->getLength() / 2 + 5 + (unitIndex / 5) * 2; // Increase the distance for each row of 5 units
					double lateralOffset = (unitIndex % 5 - 2) * 2; // Offset the units laterally, with the middle unit being on the center of the transport
					Geodesic::WGS84().Direct(transportUnit->getPosition().lat, transportUnit->getPosition().lng, transportUnit->getHeading() * 57.29577 + 180, disembarkDistance, newUnitPosition.lat, newUnitPosition.lng);
					Geodesic::WGS84().Direct(newUnitPosition.lat, newUnitPosition.lng, transportUnit->getHeading() * 57.29577 + 90, lateralOffset, newUnitPosition.lat, newUnitPosition.lng);
				}
				// If the transportr is an helicopter, disembark the troops on the two sides of the transport, in a line parallel to the heading of the transport. The first unit will be on the right of the transport, the second on the left, the third on the right, and so on, at a distance of 10 meters from the transport and 1 meter between each unit.
				else {
					double lateralOffset = (unitIndex % 2 == 0 ? 5 : -5); // Alternate the units on the right and left
					Geodesic::WGS84().Direct(transportUnit->getPosition().lat, transportUnit->getPosition().lng, transportUnit->getHeading() * 57.29577 + 90, lateralOffset, newUnitPosition.lat, newUnitPosition.lng);
					Geodesic::WGS84().Direct(newUnitPosition.lat, newUnitPosition.lng, transportUnit->getHeading() * 57.29577 + 180, unitIndex - unitIndex % 2, newUnitPosition.lat, newUnitPosition.lng);
				}

				// Clone the unit by ID and add it back to the map at the position of the transport unit
				// Add a callback to the command to set the state of the unit to IDLE once the clone is created and on the map
				Command* command = dynamic_cast<Command*>(new Clone({ { unitID, newUnitPosition } }, false));
				appendCommand(command);

				// Register the request to set the units to ROE hold fire once the are cloned
				// The callback is a lambda function accepts a pointer to the created unit and sets its state to IDLE and its ROE to HOLD_FIRE, then logs this action
				onSpawnCallbacks[command->getHash()] = [=](Unit* createdUnit) {
					createdUnit->setState(State::IDLE);
					createdUnit->setROE(ROE::WEAPON_HOLD);
					log("Unit " + createdUnit->getUnitName() + "(" + createdUnit->getName() + ") disembarked from transport " + transportUnit->getUnitName() + "(" + transportUnit->getName() + ") and set to HOLD_FIRE", true);
				};

				// Increment the unit index
				unitIndex++;
			}
			// Decrease the weight of the transport by 100 kg for each unloaded unit
			transportUnit->setCargoWeight(transportUnit->getCargoWeight() - (100 * transportUnit->getOnBoardUnitsIDs().size()));
			// Clear the transport on-board units list
			transportUnit->setOnBoardUnitsIDs({});

			log(username + " tasked transport unit " + transportUnit->getUnitName() + "(" + transportUnit->getName() + ") to disembark " + to_string(unitIndex) + " units", true);
			answer[L"response"] = json::value(to_wstring("Disembarked " + to_string(unitIndex) + " units"));
		}
		else {
			if (transportUnit == nullptr)
				answer[L"response"] = json::value(to_wstring("Transport unit does not exist"));
			else if (!transportUnit->getAlive())
				answer[L"response"] = json::value(to_wstring("Transport unit is not alive"));
			else if (transportUnit->getOnBoardUnitsIDs().size() == 0)
				answer[L"response"] = json::value(to_wstring("Transport unit is not transporting any units"));
			else if (transportUnit->getAirborne())
				answer[L"response"] = json::value(to_wstring("Transport unit is airborne"));
			else if (transportUnit->getSpeed() >= 2)
				answer[L"response"] = json::value(to_wstring("Transport unit is moving too fast"));

			log("Error while unloading troops. Transport unit with ID " + to_string(transportID) + " does not exist, is not alive, or is not transporting any units.");
		}
	}
	/************************/
	else if (key.compare("embarkNearbyUnits") == 0) {
		// The json for the embarkNearbyUnits command is expected to be in the following format:
		// {
		//   "command": "embarkNearbyUnits",
		//   "ID": 123, // ID of the transport unit
		// }

		unsigned int transportID = value[L"ID"].as_integer();
		bool force = false;
		if (value.has_boolean_field(L"force")) {
			force = value[L"force"].as_bool();
		}
		Unit* transportUnit = unitsManager->getUnit(transportID);

		if (transportUnit != nullptr &&
			transportUnit->getCanTransportUnits() &&
			transportUnit->getAlive() &&
			transportUnit->getMaximumTransportableUnits() > transportUnit->getOnBoardUnitsIDs().size() &&
			!transportUnit->getAirborne() &&
			transportUnit->getSpeed() < 2) {

			log(username + " tasked transport unit " + transportUnit->getUnitName() + "(" + transportUnit->getName() + ") to embark nearby units", true);

			// Get the position of the transport unit
			Coords transportPosition = transportUnit->getPosition();

			// Loop on all the units and check if they are within a radius of 200 meters from the transport unit and can be transported
			unsigned int unitsToEmbarkCount = transportUnit->getMaximumTransportableUnits() - transportUnit->getOnBoardUnitsIDs().size();
			unsigned int embarkedUnits = 0;

			unsigned char transportCoalition = transportUnit->getCoalition() == 0? transportUnit->getOperateAs(): transportUnit->getCoalition();

			// Collect eligible infantry units within 200m, sort them by distance and embark the closest ones first
			std::vector<std::pair<double, Unit*>> candidates;
			for (auto& u : unitsManager->getUnits()) {
				unsigned char unitCoalition = u.second->getCoalition() == 0? u.second->getOperateAs() : u.second->getCoalition();

				if (u.second->getType() == "Infantry" && unitCoalition == transportCoalition && (u.second->getState() == State::IDLE || force) && u.second->getAlive()) {
					double dist;
					double bearing1;
					double bearing2;
					Geodesic::WGS84().Inverse(u.second->getPosition().lat, u.second->getPosition().lng, transportPosition.lat, transportPosition.lng, dist, bearing1, bearing2);

					if (dist <= 200) {
						candidates.emplace_back(dist, u.second);
					}
				}
			}

			// Sort by distance (closest first)
			std::sort(candidates.begin(), candidates.end(), [](auto& a, auto& b) { return a.first < b.first; });

			// Embark up to the available capacity, taking the closest units
			for (size_t i = 0; i < candidates.size() && embarkedUnits < unitsToEmbarkCount; ++i) {
				Unit* candidateUnit = candidates[i].second;
				candidateUnit->setTargetID(transportID);
				candidateUnit->setState(State::EMBARKING);
				embarkedUnits++;
			}

			log(username + " embarked " + to_string(embarkedUnits) + " units to transport unit " + transportUnit->getUnitName() + "(" + transportUnit->getName() + ")", true);
			answer[L"response"] = json::value(to_wstring(to_string(embarkedUnits) + " units tasked to embark"));
		}
		else {
			if (!transportUnit->getCanTransportUnits()) 
				answer[L"response"] = json::value(to_wstring("Unit is not capable of transporting troops"));
			if (!transportUnit->getAlive())
				answer[L"response"] = json::value(to_wstring("Unit is not alive"));
			if (transportUnit->getMaximumTransportableUnits() - transportUnit->getOnBoardUnitsIDs().size() == 0)
				answer[L"response"] = json::value(to_wstring("Unit has no space available"));
			if (transportUnit->getAirborne())
				answer[L"response"] = json::value(to_wstring("Unit is airborne"));
			if (transportUnit->getSpeed() >= 2)
				answer[L"response"] = json::value(to_wstring("Unit is moving too fast"));
		}
	}
	/************************/
	else if (key.compare("getTransportableUnitsNearby") == 0) {
		// The json for the getTransportableUnitsNearby command is expected to be in the following format:
		// {
		//   "command": "getTransportableUnitsNearby",
		//   "ID": 123, // ID of the transport unit
		// }

		unsigned int transportID = value[L"ID"].as_integer();
		Unit* transportUnit = unitsManager->getUnit(transportID);

		if (transportUnit != nullptr &&
			transportUnit->getCanTransportUnits() &&
			transportUnit->getAlive() &&
			!transportUnit->getAirborne() &&
			transportUnit->getSpeed() < 2) {
			// Get the position of the transport unit
			Coords transportPosition = transportUnit->getPosition();

			// Loop on all the units and check if they are within a radius of 200 meters from the transport unit and can be transported
			unsigned int unitsToEmbarkCount = transportUnit->getMaximumTransportableUnits() - transportUnit->getOnBoardUnitsIDs().size();
			unsigned int embarkableUnits = 0;

			unsigned char transportCoalition = transportUnit->getCoalition() == 0 ? transportUnit->getOperateAs() : transportUnit->getCoalition();
			for (auto& u : unitsManager->getUnits()) {
				unsigned char unitCoalition = u.second->getCoalition() == 0 ? u.second->getOperateAs() : u.second->getCoalition();

				if (u.second->getType() == "Infantry" && unitCoalition == transportCoalition && u.second->getState() == State::IDLE && u.second->getAlive() && u.second->getControlled()) {
					double dist;
					double bearing1;
					double bearing2;
					Geodesic::WGS84().Inverse(u.second->getPosition().lat, u.second->getPosition().lng, transportPosition.lat, transportPosition.lng, dist, bearing1, bearing2);

					if (dist <= 200) {
						embarkableUnits++;
					}
				}

				if (embarkableUnits >= unitsToEmbarkCount) {
					break;
				}
			}

			answer[L"response"] = json::value(to_wstring(to_string(embarkableUnits) + " units available to be embarked nearby"));
		}
		else {
			if (!transportUnit->getCanTransportUnits())
				answer[L"response"] = json::value(to_wstring("Unit is not capable of transporting troops"));
			if (!transportUnit->getAlive())
				answer[L"response"] = json::value(to_wstring("Unit is not alive"));
			if (transportUnit->getAirborne())
				answer[L"response"] = json::value(to_wstring("Unit is airborne"));
			if (transportUnit->getSpeed() >= 2)
				answer[L"response"] = json::value(to_wstring("Unit is moving too fast"));
		}
	}
	/************************/
	else if (key.compare("generatePickupPoint") == 0) {
		// The json for the generatePickupPoint command is expected to be in the following format:
		// {
		//   "command": "generatePickupPoint",
		//   "ID": 123, // ID of the transport unit
		//	 "location": {
		//		"lat": X,
		//		"lng": Y
		//		}
		// }

		unsigned int transportID = value[L"ID"].as_integer();
		Unit* transportUnit = unitsManager->getUnit(transportID);

		if (transportUnit != nullptr) {
			double lat = value[L"location"][L"lat"].as_double();
			double lng = value[L"location"][L"lng"].as_double();
			Coords pickupLocation; pickupLocation.lat = lat; pickupLocation.lng = lng;
			transportUnit->setPickupLocation(pickupLocation);
			log(username + " set pickup location for unit " + transportUnit->getUnitName() + "(" + transportUnit->getName() + ") to (" + to_string(lat) + ", " + to_string(lng) + ")", true);
		}
		answer[L"response"] = json::value(to_wstring("Pickup location set"));
	}
	/************************/
	else if (key.compare("smokePickupPoint") == 0) {
		// The json for the smokePickupPoint command is expected to be in the following format:
		// {
		//   "command": "smokePickupPoint",
		//   "ID": 123, // ID of the transport unit
		// }

		unsigned int transportID = value[L"ID"].as_integer();
		Unit* transportUnit = unitsManager->getUnit(transportID);

		if (transportUnit != nullptr) {
			Coords pickupLocation = transportUnit->getPickupLocation();

			if (pickupLocation != Coords(NULL)) {

				// Add a smoke of the coalition color at the pickup location for 30 seconds to make it visible for players in the game
				unsigned char transportCoalition = transportUnit->getCoalition() == 0 ? transportUnit->getOperateAs() : transportUnit->getCoalition();
				if (transportCoalition == 1) {
					// Red coalition
					command = dynamic_cast<Command*>(new Smoke("red", pickupLocation));
				}
				else if (transportCoalition == 2) {
					// Blue coalition
					command = dynamic_cast<Command*>(new Smoke("blue", pickupLocation));
				}
				else {
					// Neutral or unknown coalition, use white smoke
					command = dynamic_cast<Command*>(new Smoke("white", pickupLocation));
				}
				answer[L"response"] = json::value(to_wstring("Smoke added at pickup location"));
			}
			else {
				log("Transport unit with ID " + to_string(transportID) + " does not have a pickup location set.");
				answer[L"response"] = json::value(to_wstring("Transport unit does not have a pickup location set"));
			}
		}
	}
	/************************/
	else if (key.compare("requestTroopsNearPickupPoint") == 0) {
		// The json for the requestTroopsNearPickupPoint command is expected to be in the following format:
		// {
		//   "command": "requestTroopsNearPickupPoint",
		//   "ID": 123, // ID of the transport unit
		// }

		unsigned int transportID = value[L"ID"].as_integer();
		Unit* transportUnit = unitsManager->getUnit(transportID);

		if (transportUnit != nullptr) {
			Coords pickupLocation = transportUnit->getPickupLocation();

			if (pickupLocation != Coords(NULL)) {
				// Count the number of transportable units within a radius of 1000 meters from the pickup location
				unsigned int transportableUnitsCount = 0;
				double averageDistance = 0;

				unsigned char transportCoalition = transportUnit->getCoalition() == 0 ? transportUnit->getOperateAs() : transportUnit->getCoalition();
				for (auto& u : unitsManager->getUnits()) {
					unsigned char unitCoalition = u.second->getCoalition() == 0 ? u.second->getOperateAs() : u.second->getCoalition();
					if (transportCoalition == unitCoalition && u.second->getType() == "Infantry" && u.second->getAlive() && u.second->getControlled()) {
						double dist;
						double bearing1;
						double bearing2;
						Geodesic::WGS84().Inverse(u.second->getPosition().lat, u.second->getPosition().lng, pickupLocation.lat, pickupLocation.lng, dist, bearing1, bearing2);
						if (dist <= 1000) {
							transportableUnitsCount++;
							averageDistance += dist;
						}
					}
				}

				if (transportableUnitsCount > 0) {
					averageDistance /= transportableUnitsCount;
				}

				answer[L"response"] = json::value(to_wstring(to_string(transportableUnitsCount) + " units near pickup point. Average distance: " + to_string(averageDistance) + " meters"));
			}
			else {
				log("Transport unit with ID " + to_string(transportID) + " does not have a pickup location set.");
				answer[L"response"] = json::value(to_wstring("Transport unit does not have a pickup location set"));
			}
		}
	}
	/************************/
	else if (key.compare("moveTroopsToPickupPoint") == 0) {
		// The json for the moveTroopsNearPickupPoint command is expected to be in the following format:
		// {
		//   "command": "requestTroopsNearPickupPoint",
		//   "ID": 123, // ID of the transport unit
		// }

		unsigned int transportID = value[L"ID"].as_integer();
		Unit* transportUnit = unitsManager->getUnit(transportID);

		if (transportUnit != nullptr) {
			Coords pickupLocation = transportUnit->getPickupLocation();

			if (pickupLocation != Coords(NULL)) {
				// Count the number of transportable units within a radius of 1000 meters from the pickup location
				unsigned int transportableUnitsCount = 0;

				unsigned char transportCoalition = transportUnit->getCoalition() == 0 ? transportUnit->getOperateAs() : transportUnit->getCoalition();
				for (auto& u : unitsManager->getUnits()) {
					unsigned char unitCoalition = u.second->getCoalition() == 0 ? u.second->getOperateAs() : u.second->getCoalition();
					if (transportCoalition == unitCoalition && u.second->getType() == "Infantry" && u.second->getAlive() && u.second->getControlled()) {
						double dist;
						double bearing1;
						double bearing2;
						Geodesic::WGS84().Inverse(u.second->getPosition().lat, u.second->getPosition().lng, pickupLocation.lat, pickupLocation.lng, dist, bearing1, bearing2);
						if (dist <= 1000) {
							transportableUnitsCount++;
							
							// Move the unit to the pickup location by setting its target position to the pickup location and its state to MOVING_TO_PICKUP
							u.second->setActivePath({ pickupLocation });
							u.second->setState(State::REACH_DESTINATION);
						}
					}
				}

				answer[L"response"] = json::value(to_wstring(to_string(transportableUnitsCount) + " units moving to pickup point."));
			}
			else {
				log("Transport unit with ID " + to_string(transportID) + " does not have a pickup location set.");
				answer[L"response"] = json::value(to_wstring("Transport unit does not have a pickup location set"));
			}
		}
	}
	/************************/
	else if (key.compare("spawnStaticObject") == 0)
	{
		bool immediate = value[L"immediate"].as_bool();

		// Check the presence of all fields
		if (!value.has_string_field(L"type"))
			log("Missing type field for spawnStaticObject command");
		if (!value.has_object_field(L"location") || !value[L"location"].has_number_field(L"lat") || !value[L"location"].has_number_field(L"lng"))
			log("Missing or invalid location field for spawnStaticObject command");
		if (!value.has_string_field(L"shapeName"))
			log("Missing shapeName field for spawnStaticObject command");
		if (!value.has_string_field(L"coalition"))
			log("Missing coalition field for spawnStaticObject command");
		if (!value.has_number_field(L"heading"))
			log("Missing heading field for spawnStaticObject command");
		if (!value.has_boolean_field(L"canCargo"))
			log("Missing canCargo field for spawnStaticObject command");
		if (!value.has_boolean_field(L"linkOffset"))
			log("Missing linkOffset field for spawnStaticObject command");
		if (!value.has_boolean_field(L"dead"))
			log("Missing dead field for spawnStaticObject command");
		if (!value.has_number_field(L"mass"))
			log("Missing mass field for spawnStaticObject command");

		string type = to_string(value[L"type"]);
		Coords location;
		location.lat = value[L"location"][L"lat"].as_double();
		location.lng = value[L"location"][L"lng"].as_double();
		string shapeName = to_string(value[L"shapeName"]);
		string coalition = to_string(value[L"coalition"]);
		double heading = value[L"heading"].as_double();
		bool canCargo = value[L"canCargo"].as_bool();
		bool linkOffset = value[L"linkOffset"].as_bool();
		bool dead = value[L"dead"].as_bool();
		double mass = value[L"mass"].as_double();
		string name = "";

		// The name field is optional, if not present the static object will be spawned with a name generated by the script
		if (value.has_string_field(L"name")) {
			name = to_string(value[L"name"]);
		}

		log("Spawning static object of type " + type + " at (" + to_string(location.lat) + ", " + to_string(location.lng) + ") with shape " + shapeName);
		command = new SpawnStaticObject(name, type, location, shapeName, coalition, heading, canCargo, linkOffset, dead, mass, immediate);
	}
	/************************/
	else if (key.compare("deleteStaticObject") == 0)
	{
		// Check the presence of all fields
		if (!value.has_string_field(L"name"))
			log("Missing name field for deleteStaticObject command");
		if (!value.has_boolean_field(L"immediate"))
			log("Missing immediate field for deleteStaticObject command");

		string name = to_string(value[L"name"]);
		bool immediate = value[L"immediate"].as_bool();

		log("Deleting static object with name " + name);
		command = new DeleteStaticObject(name, immediate);
	}
	/************************/
	else if (key.compare("executeFile") == 0)
	{
		// Check the presence of all fields
		if (!value.has_string_field(L"filePath"))
			log("Missing filePath field for executeFile command");
		

		string filePath = to_string(value[L"filePath"]);

		log("Executing lua file at " + filePath);
		command = new ExecuteFile(filePath);
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


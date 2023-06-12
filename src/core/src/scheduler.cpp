#include "scheduler.h"
#include "logger.h"
#include "dcstools.h"
#include "unitsManager.h"
#include "utils.h"
#include "unit.h"

extern UnitsManager* unitsManager;

Scheduler::Scheduler(lua_State* L):
	load(0)
{
	LogInfo(L, "Scheduler constructor called successfully");
}

Scheduler::~Scheduler()
{

}

void Scheduler::appendCommand(Command* command)
{
	commands.push_back(command);
}

void Scheduler::execute(lua_State* L)
{
	/* Decrease the active computation load. New commands can be sent only if the load has reached 0. 
		This is needed to avoid server lag. */
	if (load > 0) {
		load--;
		return;
	}

	int priority = CommandPriority::HIGH;
	while (priority >= CommandPriority::LOW)
	{
		for (auto command : commands)
		{
			if (command->getPriority() == priority)
			{
				wstring commandString = L"Olympus.protectedCall(" + command->getString(L) + L")";
				if (dostring_in(L, "server", to_string(commandString)))
					log(L"Error executing command " + commandString);
				load = command->getLoad();
				commands.remove(command);
				return;
			}
		}
		priority--;
	}
}

void Scheduler::handleRequest(wstring key, json::value value)
{
	Command* command = nullptr;

	log(L"Received request with ID: " + key);
	if (key.compare(L"setPath") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getGroupLeader(ID);

		if (unit != nullptr)
		{
			wstring unitName = unit->getUnitName();
			json::value path = value[L"path"];
			list<Coords> newPath;
			for (int i = 1; i <= path.as_object().size(); i++)
			{
				wstring WP = to_wstring(i);
				double lat = path[WP][L"lat"].as_double();
				double lng = path[WP][L"lng"].as_double();
				log(unitName + L" set path destination " + WP + L" (" + to_wstring(lat) + L", " + to_wstring(lng) + L")");
				Coords dest; dest.lat = lat; dest.lng = lng;
				newPath.push_back(dest);
			}

			unit->setActivePath(newPath);
			unit->setState(State::REACH_DESTINATION);
			log(unitName + L" new path set successfully");
		}
	}
	else if (key.compare(L"smoke") == 0)
	{
		wstring color = value[L"color"].as_string();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		log(L"Adding " + color + L" smoke at (" + to_wstring(lat) + L", " + to_wstring(lng) + L")");
		Coords loc; loc.lat = lat; loc.lng = lng;
		command = dynamic_cast<Command*>(new Smoke(color, loc));
	}
	else if (key.compare(L"spawnGround") == 0)
	{
		wstring coalition = value[L"coalition"].as_string();
		wstring type = value[L"type"].as_string();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		log(L"Spawning " + coalition + L" ground unit of type " + type + L" at (" + to_wstring(lat) + L", " + to_wstring(lng) + L")");
		Coords loc; loc.lat = lat; loc.lng = lng;
		command = dynamic_cast<Command*>(new SpawnGroundUnit(coalition, type, loc));
	}
	else if (key.compare(L"spawnAir") == 0)
	{
		wstring coalition = value[L"coalition"].as_string();
		wstring type = value[L"type"].as_string();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		double altitude = value[L"altitude"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng; loc.alt = altitude;
		wstring payloadName = value[L"payloadName"].as_string();
		wstring airbaseName = value[L"airbaseName"].as_string();
		log(L"Spawning " + coalition + L" air unit of type " + type + L" with payload " + payloadName + L" at (" + to_wstring(lat) + L", " + to_wstring(lng) + L" " + airbaseName + L")");
		command = dynamic_cast<Command*>(new SpawnAircraft(coalition, type, loc, payloadName, airbaseName));
	}
	else if (key.compare(L"attackUnit") == 0)
	{
		int ID = value[L"ID"].as_integer();
		int targetID = value[L"targetID"].as_integer();

		Unit* unit = unitsManager->getGroupLeader(ID);
		Unit* target = unitsManager->getUnit(targetID);

		wstring unitName;
		wstring targetName;
		
		if (unit != nullptr)
			unitName = unit->getUnitName();
		else
			return;

		if (target != nullptr)
			targetName = target->getUnitName();
		else
			return;

		log(L"Unit " + unitName + L" attacking unit " + targetName);
		unit->setTargetID(targetID);
		unit->setState(State::ATTACK);
	}
	else if (key.compare(L"followUnit") == 0)
	{
		int ID = value[L"ID"].as_integer();
		int leaderID = value[L"targetID"].as_integer();
		int offsetX = value[L"offsetX"].as_integer();
		int offsetY = value[L"offsetY"].as_integer();
		int offsetZ = value[L"offsetZ"].as_integer();

		Unit* unit = unitsManager->getGroupLeader(ID);
		Unit* leader = unitsManager->getUnit(leaderID);

		wstring unitName;
		wstring leaderName;

		if (unit != nullptr)
			unitName = unit->getUnitName();
		else
			return;

		if (leader != nullptr)
			leaderName = leader->getUnitName();
		else
			return;

		log(L"Unit " + unitName + L" following unit " + leaderName);
		unit->setFormationOffset(Offset(offsetX, offsetY, offsetZ));
		unit->setLeaderID(leaderID);
		unit->setState(State::FOLLOW);
	}
	else if (key.compare(L"changeSpeed") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
			unit->changeSpeed(value[L"change"].as_string());
	}
	else if (key.compare(L"changeAltitude") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
			unit->changeAltitude(value[L"change"].as_string());
	}
	else if (key.compare(L"setSpeed") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
			unit->setTargetSpeed(value[L"speed"].as_double());
	}
	else if (key.compare(L"setSpeedType") == 0)
	{
	int ID = value[L"ID"].as_integer();
	Unit* unit = unitsManager->getGroupLeader(ID);
	if (unit != nullptr)
		unit->setTargetSpeedType(value[L"speedType"].as_string());
	}
	else if (key.compare(L"setAltitude") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
			unit->setTargetAltitude(value[L"altitude"].as_double());
	}
	else if (key.compare(L"setAltitudeType") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
			unit->setTargetAltitudeType(value[L"altitudeType"].as_string());
	}
	else if (key.compare(L"cloneUnit") == 0)
	{
		int ID = value[L"ID"].as_integer();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		command = dynamic_cast<Command*>(new Clone(ID, loc));
		log(L"Cloning unit " + to_wstring(ID));
	}
	else if (key.compare(L"setROE") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getGroupLeader(ID);
		wstring ROE = value[L"ROE"].as_string();
		unit->setROE(ROE);
	}
	else if (key.compare(L"setReactionToThreat") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getGroupLeader(ID);
		wstring reactionToThreat = value[L"reactionToThreat"].as_string();
		unit->setReactionToThreat(reactionToThreat);
	}
	else if (key.compare(L"setEmissionsCountermeasures") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getGroupLeader(ID);
		wstring emissionsCountermeasures = value[L"emissionsCountermeasures"].as_string();
		unit->setEmissionsCountermeasures(emissionsCountermeasures);
	}
	else if (key.compare(L"landAt") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getGroupLeader(ID);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		unit->landAt(loc);
	}
	else if (key.compare(L"deleteUnit") == 0)
	{
		int ID = value[L"ID"].as_integer();
		bool explosion = value[L"explosion"].as_bool();
		unitsManager->deleteUnit(ID, explosion);
	}
	else if (key.compare(L"refuel") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setState(State::REFUEL);
	}
	else if (key.compare(L"setAdvancedOptions") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getGroupLeader(ID);
		if (unit != nullptr)
		{
			/* Advanced tasking */
			unit->setIsTanker(value[L"isTanker"].as_bool());
			unit->setIsAWACS(value[L"isAWACS"].as_bool());

			/* TACAN Options */
			auto TACAN = value[L"TACAN"];
			unit->setTACAN({ TACAN[L"isOn"].as_bool(),
				TACAN[L"channel"].as_number().to_int32(),
				TACAN[L"XY"].as_string(),
				TACAN[L"callsign"].as_string()
				});

			/* Radio Options */
			auto radio = value[L"radio"];
			unit->setRadio({ radio[L"frequency"].as_number().to_int32(),
				radio[L"callsign"].as_number().to_int32(),
				radio[L"callsignNumber"].as_number().to_int32()
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
	else if (key.compare(L"setFollowRoads") == 0)
		{
		int ID = value[L"ID"].as_integer();
		bool followRoads = value[L"followRoads"].as_bool();
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setFollowRoads(followRoads);
	}
	else if (key.compare(L"setOnOff") == 0)
		{
		int ID = value[L"ID"].as_integer();
		bool onOff = value[L"onOff"].as_bool();
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setOnOff(onOff);
	}
	else if (key.compare(L"explosion") == 0)
	{
		int intensity = value[L"intensity"].as_integer();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		log(L"Adding " + to_wstring(intensity) + L" explosion at (" + to_wstring(lat) + L", " + to_wstring(lng) + L")");
		Coords loc; loc.lat = lat; loc.lng = lng;
		command = dynamic_cast<Command*>(new Explosion(intensity, loc));
	}
	else if (key.compare(L"bombPoint") == 0)
	{
		int ID = value[L"ID"].as_integer();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setState(State::BOMB_POINT);
		unit->setTargetLocation(loc);
	}
	else if (key.compare(L"carpetBomb") == 0)
	{
		int ID = value[L"ID"].as_integer();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setState(State::CARPET_BOMB);
		unit->setTargetLocation(loc);
	}
	else if (key.compare(L"bombBuilding") == 0)
	{
		int ID = value[L"ID"].as_integer();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setState(State::BOMB_BUILDING);
		unit->setTargetLocation(loc);
	}
	else if (key.compare(L"fireAtArea") == 0)
	{
		int ID = value[L"ID"].as_integer();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		Unit* unit = unitsManager->getGroupLeader(ID);
		unit->setState(State::FIRE_AT_AREA);
		unit->setTargetLocation(loc);
	}
	else
	{
		log(L"Unknown command: " + key);
	}
	
	if (command != nullptr)
	{
		appendCommand(command);
	}
}


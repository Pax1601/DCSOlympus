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
		Unit* unit = unitsManager->getUnit(ID);
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

			Unit* unit = unitsManager->getUnit(ID);
			if (unit != nullptr)
			{
				unit->setActivePath(newPath);
				unit->setState(State::REACH_DESTINATION);
				log(unitName + L" new path set successfully");
			}
			else
				log(unitName + L" not found, request will be discarded");
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
		Coords loc; loc.lat = lat; loc.lng = lng;
		wstring payloadName = value[L"payloadName"].as_string();
		wstring airbaseName = value[L"airbaseName"].as_string();
		log(L"Spawning " + coalition + L" air unit of type " + type + L" with payload " + payloadName + L" at (" + to_wstring(lat) + L", " + to_wstring(lng) + L" " + airbaseName + L")");
		command = dynamic_cast<Command*>(new SpawnAircraft(coalition, type, loc, payloadName, airbaseName));
	}
	else if (key.compare(L"attackUnit") == 0)
	{
		int ID = value[L"ID"].as_integer();
		int targetID = value[L"targetID"].as_integer();

		Unit* unit = unitsManager->getUnit(ID);
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
	else if (key.compare(L"stopAttack") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		if (unit != nullptr)
			unit->setState(State::REACH_DESTINATION);
		else
			return;
	}
	else if (key.compare(L"changeSpeed") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		if (unit != nullptr)
			unit->changeSpeed(value[L"change"].as_string());
	}
	else if (key.compare(L"changeAltitude") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		if (unit != nullptr)
			unit->changeAltitude(value[L"change"].as_string());
	}
	else if (key.compare(L"setSpeed") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		if (unit != nullptr)
			unit->setTargetSpeed(value[L"speed"].as_double());
	}
	else if (key.compare(L"setAltitude") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		if (unit != nullptr)
			unit->setTargetAltitude(value[L"altitude"].as_double());
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
	else if (key.compare(L"setLeader") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		bool isLeader = value[L"isLeader"].as_bool();
		if (isLeader)
		{
			json::value wingmenIDs = value[L"wingmenIDs"];
			vector<Unit*> wingmen;
			if (unit != nullptr)
			{
				for (auto itr = wingmenIDs.as_array().begin(); itr != wingmenIDs.as_array().end(); itr++)
				{
					Unit* wingman = unitsManager->getUnit(itr->as_integer());
					if (wingman != nullptr)
						wingmen.push_back(wingman);
				}
				unit->setFormation(L"Line abreast");
				unit->setIsLeader(true);
				unit->setWingmen(wingmen);
				log(L"Setting " + unit->getName() + L" as formation leader");
			}
		}
		else {
			unit->setIsLeader(false);
		}
	}
	else if (key.compare(L"setFormation") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		wstring formation = value[L"formation"].as_string();
		unit->setFormation(formation);
	}
	else if (key.compare(L"setROE") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		wstring ROE = value[L"ROE"].as_string();
		unit->setROE(ROE);
	}
	else if (key.compare(L"setReactionToThreat") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		wstring reactionToThreat = value[L"reactionToThreat"].as_string();
		unit->setReactionToThreat(reactionToThreat);
	}
	else if (key.compare(L"landAt") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		Coords loc; loc.lat = lat; loc.lng = lng;
		unit->landAt(loc);
	}
	else if (key.compare(L"deleteUnit") == 0)
	{
		int ID = value[L"ID"].as_integer();
		unitsManager->deleteUnit(ID);
	}
	else if (key.compare(L"refuel") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		unit->setState(State::REFUEL);
	}
	else if (key.compare(L"setAdvancedOptions") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsManager->getUnit(ID);
		if (unit != nullptr)
		{
			unit->setIsTanker(value[L"isTanker"].as_bool());
			unit->setIsAWACS(value[L"isAWACS"].as_bool());

			unit->setTACANOn(true);	// TODO Remove
			unit->setTACANChannel(value[L"TACANChannel"].as_number().to_int32());
			unit->setTACANXY(value[L"TACANXY"].as_string());
			unit->setTACANCallsign(value[L"TACANCallsign"].as_string());
			unit->setTACAN();

			unit->setRadioOn(true);	// TODO Remove
			unit->setRadioFrequency(value[L"radioFrequency"].as_number().to_int32());
			unit->setRadioCallsign(value[L"radioCallsign"].as_number().to_int32());
			unit->setRadioCallsignNumber(value[L"radioCallsignNumber"].as_number().to_int32());
			unit->setRadio();

			unit->resetActiveDestination();
		}
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


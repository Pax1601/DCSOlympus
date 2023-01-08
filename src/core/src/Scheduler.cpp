#include "scheduler.h"
#include "logger.h"
#include "dcstools.h"
#include "unitsFactory.h"
#include "utils.h"
#include "unit.h"

extern UnitsFactory* unitsFactory;

Scheduler::Scheduler(lua_State* L)
{
	LogInfo(L, "Units Factory constructor called successfully");
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
	/* Lock for thread safety */
	lock_guard<mutex> guard(mutexLock);
	int priority = CommandPriority::HIGH;
	while (priority >= CommandPriority::LOW)
	{
		for (auto command : commands)
		{
			if (command->getPriority() == priority)
			{
				wstring commandString = L"Olympus.protectedCall(" + command->getString(L) + L")";
				if (dostring_in(L, "server", to_string(commandString)))
				{
					log(L"Error executing command " + commandString);
				}
				{
					log(L"Command " + commandString + L" executed succesfully");
				}
				commands.remove(command);
				return;
			}
		}
		priority--;
	}
}

void Scheduler::handleRequest(wstring key, json::value value)
{
	/* Lock for thread safety */
	lock_guard<mutex> guard(mutexLock);
	Command* command = nullptr;

	log(L"Received request with ID: " + key);
	if (key.compare(L"setPath") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsFactory->getUnit(ID);
		if (unit != nullptr)
		{
			wstring unitName = unit->getUnitName();
			json::value path = value[L"path"];
			list<Coords> newPath;
			for (auto const& e : path.as_object())
			{
				wstring WP = e.first;
				double lat = path[WP][L"lat"].as_double();
				double lng = path[WP][L"lng"].as_double();
				log(unitName + L" set path destination " + WP + L" (" + to_wstring(lat) + L", " + to_wstring(lng) + L")");
				Coords dest; dest.lat = lat; dest.lng = lng;
				newPath.push_back(dest);
				Unit* unit = unitsFactory->getUnit(ID);
				if (unit != nullptr)
				{
					unit->setPath(newPath);
					log(unitName + L" new path set successfully");
				}
				else
				{
					log(unitName + L" not found, request will be discarded");
				}
			}
		}
	}
	else if (key.compare(L"smoke") == 0)
	{
		wstring color = value[L"color"].as_string();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		log(L"Adding " + color + L" smoke at (" + to_wstring(lat) + L", " + to_wstring(lng) + L")");
		Coords loc; loc.lat = lat; loc.lng = lng;
		command = dynamic_cast<Command*>(new SmokeCommand(color, loc));
	}
	else if (key.compare(L"spawnGround") == 0)
	{
		wstring coalition = value[L"coalition"].as_string();
		wstring type = value[L"type"].as_string();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		log(L"Spawning " + coalition + L" ground unit of type " + type + L" at (" + to_wstring(lat) + L", " + to_wstring(lng) + L")");
		Coords loc; loc.lat = lat; loc.lng = lng;
		command = dynamic_cast<Command*>(new SpawnGroundUnitCommand(coalition, type, loc));
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
		command = dynamic_cast<Command*>(new SpawnAircraftCommand(coalition, type, loc, payloadName, airbaseName));
	}
	else if (key.compare(L"attackUnit") == 0)
	{
		int ID = value[L"ID"].as_integer();
		int targetID = value[L"targetID"].as_integer();

		Unit* unit = unitsFactory->getUnit(ID);
		Unit* target = unitsFactory->getUnit(targetID);

		wstring unitName;
		wstring targetName;
		
		if (unit != nullptr)
		{
			unitName = unit->getUnitName();
		}
		else
		{
			return;
		}

		if (target != nullptr)
		{
			targetName = target->getUnitName();
		}
		else
		{
			return;
		}

		log(L"Unit " + unitName + L" attacking unit " + targetName);
		unit->setTarget(targetID);
	}
	else if (key.compare(L"changeSpeed") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsFactory->getUnit(ID);
		if (unit != nullptr)
		{
			unit->changeSpeed(value[L"change"].as_string());
		}
	}
	else if (key.compare(L"changeAltitude") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsFactory->getUnit(ID);
		if (unit != nullptr)
		{
			unit->changeAltitude(value[L"change"].as_string());
		}
	}
	else if (key.compare(L"cloneUnit") == 0)
	{
		int ID = value[L"ID"].as_integer();
		command = dynamic_cast<Command*>(new CloneCommand(ID));
		log(L"Cloning unit " + to_wstring(ID));
	}
	else if (key.compare(L"setLeader") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsFactory->getUnit(ID);
		json::value wingmenIDs = value[L"wingmenIDs"];
		vector<Unit*> wingmen;
		if (unit != nullptr)
		{
			for (auto itr = wingmenIDs.as_array().begin(); itr != wingmenIDs.as_array().end(); itr++)
			{
				Unit* wingman = unitsFactory->getUnit(itr->as_integer());
				if (wingman != nullptr)
				{
					wingman->setWingman(true);
					wingmen.push_back(wingman);
					log(L"Setting " + wingman->getName() + L" as wingman leader");
				}
			}
			unit->setWingmen(wingmen);
			unit->setLeader(true);
			unit->resetActiveDestination();
			log(L"Setting " + unit->getName() + L" as formation leader");
		}
	}
	else if (key.compare(L"setFormation") == 0)
	{
		int ID = value[L"ID"].as_integer();
		Unit* unit = unitsFactory->getUnit(ID);
		wstring formation = value[L"formation"].as_string();
		unit->setFormation(formation);
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


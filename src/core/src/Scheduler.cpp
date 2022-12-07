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
	lock.lock();
	int priority = CommandPriority::HIGH;
	while (priority >= CommandPriority::LOW)
	{
		for (auto command : commands)
		{
			if (command->getPriority() == priority)
			{
				log("Executing command");
				switch (command->getType())
				{
					case CommandType::MOVE:
					{
						MoveCommand* moveCommand = dynamic_cast<MoveCommand*>(command);
						moveCommand->execute(L);
						commands.remove(command);
						break;
					}
					case CommandType::SMOKE:
					{
						SmokeCommand* smokeCommand = dynamic_cast<SmokeCommand*>(command);
						smokeCommand->execute(L);
						commands.remove(command);
						break;
					}
					case CommandType::SPAWN_GROUND:
					{
						SpawnGroundCommand* spawnCommand = dynamic_cast<SpawnGroundCommand*>(command);
						spawnCommand->execute(L);
						commands.remove(command);
						break;
					}
					case CommandType::SPAWN_AIR:
					{
						SpawnAirCommand* spawnCommand = dynamic_cast<SpawnAirCommand*>(command);
						spawnCommand->execute(L);
						commands.remove(command);
						break;
					}
					default:
						log("Unknown command of type " + to_string(command->getType()));
						commands.remove(command);
						break;
				}
				goto exit;
			}
		}
		priority--;
	}

exit:
	lock.unlock();
	return;
}


void Scheduler::handleRequest(wstring key, json::value value)
{
	lock.lock();
	Command* command = nullptr;

	log(L"Received request with ID: " + key);
	if (key.compare(L"setPath") == 0)
	{
		int ID = value[L"ID"].as_integer();
		wstring unitName = value[L"unitName"].as_string();
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
		command = dynamic_cast<Command*>(new SpawnGroundCommand(coalition, type, loc));
	}
	else if (key.compare(L"spawnAir") == 0)
	{
		wstring coalition = value[L"coalition"].as_string();
		wstring type = value[L"type"].as_string();
		double lat = value[L"location"][L"lat"].as_double();
		double lng = value[L"location"][L"lng"].as_double();
		log(L"Spawning " + coalition + L" air unit of type " + type + L" at (" + to_wstring(lat) + L", " + to_wstring(lng) + L")");
		Coords loc; loc.lat = lat; loc.lng = lng;
		command = dynamic_cast<Command*>(new SpawnAirCommand(coalition, type, loc));
	}
	else
	{
		log(L"Unknown command: " + key);
	}
	
	if (command != nullptr)
	{
		appendCommand(command);
	}
	lock.unlock();
}


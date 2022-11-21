#include "Scheduler.h"
#include "Logger.h"
#include "DCSUtils.h"
#include "UnitsHandler.h"
#include "Utils.h"
#include "Unit.h"

extern UnitsFactory* unitsHandler;

Scheduler::Scheduler(lua_State* L)
{
	DCSUtils::LogInfo(L, "Units Factory constructor called successfully");
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
				LOGGER->Log("Executing command");
				switch (command->getType())
				{
					case CommandType::MOVE:
					{
						MoveCommand* moveCommand = dynamic_cast<MoveCommand*>(command);
						moveCommand->execute(L);
						commands.remove(command);
						break;
					}
					default:
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

	LOGGER->Log(L"Received request with ID: " + key);
	if (key.compare(L"setPath") == 0)
	{
		int ID = value[L"ID"].as_integer();
		wstring unitName = value[L"unitName"].as_string();
		LOGGER->Log(unitName);
		json::value path = value[L"path"];
		list<Coords> newPath;
		for (auto const& e : path.as_object())
		{
			wstring WP = e.first;
			double lat = path[WP][L"lat"].as_double();
			double lng = path[WP][L"lng"].as_double();
			LOGGER->Log(unitName + L" set path destination " + WP + L" (" + to_wstring(lat) + L", " + to_wstring(lng) + L")");
			Coords dest; dest.lat = lat; dest.lng = lng;
			newPath.push_back(dest);
			Unit* unit = unitsHandler->getUnit(ID);
			if (unit != nullptr)
			{
				unit->setPath(newPath);
				LOGGER->Log(unitName + L" new path set successfully");
			}
			else
			{
				LOGGER->Log(unitName + L" not found, request will be discarded");
			}
		}
	}
	
	if (command != nullptr)
	{
		appendCommand(command);
	}
	lock.unlock();
}


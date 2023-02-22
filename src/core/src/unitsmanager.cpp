#include "framework.h"
#include "unitsManager.h"
#include "logger.h"
#include "unit.h"
#include "aircraft.h"
#include "helicopter.h"
#include "groundunit.h"
#include "navyunit.h"
#include "weapon.h"
#include "commands.h"
#include "scheduler.h"

extern Scheduler* scheduler;

UnitsManager::UnitsManager(lua_State* L)
{
	LogInfo(L, "Units Factory constructor called successfully");
}

UnitsManager::~UnitsManager()
{

}

Unit* UnitsManager::getUnit(int ID)
{
	if (units.find(ID) == units.end()) {
		return nullptr;
	}
	else {
		return units[ID];
	}
}

void UnitsManager::updateExportData(lua_State* L)
{
	map<int, json::value> unitJSONs = getAllUnits(L);

	/* Update all units, create them if needed TODO: move code to get constructor in dedicated function */
	for (auto const& p : unitJSONs)
	{
		int ID = p.first;
		if (units.count(ID) == 0)
		{
			json::value type = static_cast<json::value>(p.second)[L"Type"];
			if (type.has_number_field(L"level1"))
			{
				if (type[L"level1"].as_number().to_int32() == 1)
				{
					if (type[L"level2"].as_number().to_int32() == 1)
					{
						units[ID] = dynamic_cast<Unit*>(new Aircraft(p.second, ID));
					}
					else if (type[L"level2"].as_number().to_int32() == 2)
					{
						units[ID] = dynamic_cast<Unit*>(new Helicopter(p.second, ID));
					}
				}
				else if (type[L"level1"].as_number().to_int32() == 2)
				{
					units[ID] = dynamic_cast<Unit*>(new GroundUnit(p.second, ID));
				}
				else if (type[L"level1"].as_number().to_int32() == 3)
				{
					units[ID] = dynamic_cast<Unit*>(new NavyUnit(p.second, ID));
				}
				else if (type[L"level1"].as_number().to_int32() == 4)
				{
					if (type[L"level2"].as_number().to_int32() == 4)
					{
						units[ID] = dynamic_cast<Unit*>(new Missile(p.second, ID));
					}
					else if (type[L"level2"].as_number().to_int32() == 5)
					{
						units[ID] = dynamic_cast<Unit*>(new Bomb(p.second, ID));
					}
				}
			}
		}
		/* Update the unit if present*/
		if (units.count(ID) != 0)
		{
			units[ID]->updateExportData(p.second);
		}
	}

	/* Set the units that are not present in the JSON as dead (probably have been destroyed) */
	for (auto const& unit : units)
	{
		if (unitJSONs.find(unit.first) == unitJSONs.end())
		{
			unit.second->setAlive(false);
		}
	}
}

void UnitsManager::updateMissionData(json::value missionData)
{
	/* Update all units */
	for (auto const& p : units)
	{
		int ID = p.first;
		if (missionData.has_field(to_wstring(ID)))
		{
			p.second->updateMissionData(missionData[to_wstring(ID)]);
		}
	}
}

void UnitsManager::updateAnswer(json::value& answer)
{
	// TODO THREAT SAFEY!
	auto unitsJson = json::value::object();

	for (auto const& p : units)
	{
		unitsJson[to_wstring(p.first)] = p.second->json();
	}

	answer[L"units"] = unitsJson;
}

void UnitsManager::deleteUnit(int ID)
{
	if (getUnit(ID) != nullptr)
	{
		Command* command = dynamic_cast<Command*>(new Delete(ID));
		scheduler->appendCommand(command);
	}
}


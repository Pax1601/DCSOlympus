#include "framework.h"
#include "unitsFactory.h"
#include "logger.h"
#include "unit.h"
#include "utils.h"

UnitsFactory::UnitsFactory(lua_State* L)
{
	LogInfo(L, "Units Factory constructor called successfully");
}

UnitsFactory::~UnitsFactory()
{

}

Unit* UnitsFactory::getUnit(int ID)
{
	if (units.find(ID) == units.end()) {
		return nullptr;
	}
	else {
		return units[ID];
	}
}

void UnitsFactory::update(lua_State* L)
{
	map<int, json::value> unitJSONs = getAllUnits(L);

	/* Update all units, create them if needed */
	for (auto const& p : unitJSONs)
	{
		int ID = p.first;
		if (units.count(ID) == 0)
		{
			units[ID] = new Unit(p.second, ID);
		}
		units[ID]->update(p.second);
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

void UnitsFactory::updateAnswer(json::value& answer)
{
	// TODO THREAT SAFEY!
	auto unitsJson = json::value::object();

	for (auto const& p : units)
	{
		unitsJson[to_wstring(p.first)] = p.second->json();
	}

	answer[L"units"] = unitsJson;
}

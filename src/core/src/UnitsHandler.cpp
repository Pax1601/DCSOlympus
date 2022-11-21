#include "UnitsHandler.h"
#include "Logger.h"
#include "Unit.h"
#include "framework.h"
#include "Utils.h"

UnitsFactory::UnitsFactory(lua_State* L)
{
	DCSUtils::LogInfo(L, "Units Factory constructor called successfully");
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
	//lua_getglobal(L, "net");
	//lua_getfield(L, -1, "dostring_in");
	//lua_pushstring(L, "server");
	//lua_pushstring(L, "dostring_in(\"export\", \"Olympus.OlympusDLL.test()\")");
	//lua_pcall(L, 2, 0, 0);

	map<int, json::value> unitJSONs = DCSUtils::getAllUnits(L);

	for (auto const& p : unitJSONs)
	{
		int ID = p.first;
		if (units.count(ID) == 0)
		{
			units[ID] = new Unit(p.second, ID);
		}
		units[ID]->update(p.second);
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

#pragma once
#include "framework.h"
#include "DCSUtils.h"

class Unit;

class UnitsHandler
{
public:
	UnitsHandler(lua_State* L);
	~UnitsHandler();

	Unit* getUnit(int ID);
	void getMissionDB(lua_State* L);
	void update(lua_State* L);
	void updateAnswer(json::value& answer);
	
private:
	map<int, Unit*> units;
	json::value missionDB;

};


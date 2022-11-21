#pragma once
#include "framework.h"
#include "DCSUtils.h"

class Unit;

class UnitsFactory
{
public:
	UnitsFactory(lua_State* L);
	~UnitsFactory();

	Unit* getUnit(int ID);
	void getMissionDB(lua_State* L);
	void update(lua_State* L);
	void updateAnswer(json::value& answer);
	
private:
	map<int, Unit*> units;
	json::value missionDB;

};


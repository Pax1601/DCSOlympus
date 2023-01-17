#pragma once
#include "framework.h"
#include "dcstools.h"

class Unit;

class UnitsFactory
{
public:
	UnitsFactory(lua_State* L);
	~UnitsFactory();

	Unit* getUnit(int ID);
	void updateExportData(lua_State* L);
	void updateMissionData(json::value missionData);
	void updateAnswer(json::value& answer);
	
private:
	map<int, Unit*> units;
	json::value missionDB;

};


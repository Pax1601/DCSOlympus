#pragma once
#include "framework.h"
#include "dcstools.h"

class Unit;

class UnitsManager
{
public:
	UnitsManager(lua_State* L);
	~UnitsManager();

	Unit* getUnit(int ID);
	void updateExportData(lua_State* L);
	void updateMissionData(json::value missionData);
	void getData(json::value& answer, int time);
	void deleteUnit(int ID);
	
private:
	map<int, Unit*> units;
	json::value missionDB;

};


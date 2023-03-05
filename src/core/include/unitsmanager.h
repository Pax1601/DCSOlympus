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
	void updateAnswer(json::value& answer, bool fullRefresh);
	void deleteUnit(int ID);
	
private:
	map<int, Unit*> units;
	json::value missionDB;

};


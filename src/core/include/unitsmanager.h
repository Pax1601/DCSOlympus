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
	bool isUnitInGroup(Unit* unit);
	bool isUnitGroupLeader(Unit* unit);
	Unit* getGroupLeader(int ID);
	Unit* getGroupLeader(Unit* unit);
	vector<Unit*> getGroupMembers(wstring groupName);
	void updateExportData(lua_State* L);
	void updateMissionData(json::value missionData);
	void runAILoop();
	void getData(json::value& answer, long long time);
	void deleteUnit(int ID, bool explosion);
	void acquireControl(int ID);
	
private:
	map<int, Unit*> units;
	json::value missionDB;

};


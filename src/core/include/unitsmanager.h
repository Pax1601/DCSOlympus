#pragma once
#include "framework.h"
#include "dcstools.h"

class Unit;

class UnitsManager
{
public:
	UnitsManager(lua_State* L);
	~UnitsManager();

	map<unsigned int, Unit*>& getUnits() { return units; };
	Unit* getUnit(unsigned int ID);
	bool isUnitInGroup(Unit* unit);
	bool isUnitGroupLeader(Unit* unit);
	Unit* getGroupLeader(unsigned int ID);
	Unit* getGroupLeader(Unit* unit);
	vector<Unit*> getGroupMembers(string groupName);
	void updateExportData(lua_State* L, double dt = 0);
	void updateMissionData(json::value missionData);
	void runAILoop();
	string getUnitData(stringstream &ss, unsigned long long time, bool refresh);
	void deleteUnit(unsigned int ID, bool explosion);
	void acquireControl(unsigned int ID);
	
private:
	map<unsigned int, Unit*> units;
	json::value missionDB;

};


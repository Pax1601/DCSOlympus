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
	bool isUnitGroupLeader(Unit* unit, Unit*& leader);
	Unit* getGroupLeader(unsigned int ID);
	Unit* getGroupLeader(Unit* unit);
	vector<Unit*> getGroupMembers(string groupName);
	void update(json::value& missionData, double dt);
	void runAILoop();
	void getUnitData(stringstream &ss, unsigned long long time);
	void deleteUnit(unsigned int ID, bool explosion, bool immediate);
	void acquireControl(unsigned int ID);
	void loadDatabases();
	Unit* getClosestUnit(Unit* unit, unsigned char coalition, vector<string> categories, double &distance);

private:
	map<unsigned int, Unit*> units;
	json::value missionDB;

};


#include "framework.h"
#include "unitsManager.h"
#include "logger.h"
#include "unit.h"
#include "aircraft.h"
#include "helicopter.h"
#include "groundunit.h"
#include "navyunit.h"
#include "weapon.h"
#include "commands.h"
#include "scheduler.h"

#include "base64.hpp"
using namespace base64;

extern Scheduler* scheduler;

UnitsManager::UnitsManager(lua_State* L)
{
	LogInfo(L, "Units Factory constructor called successfully");
}

UnitsManager::~UnitsManager()
{

}

Unit* UnitsManager::getUnit(unsigned int ID)
{
	if (units.find(ID) == units.end()) {
		return nullptr;
	}
	else {
		return units[ID];
	}
}

bool UnitsManager::isUnitInGroup(Unit* unit) 
{
	if (unit != nullptr) {
		string groupName = unit->getGroupName();
		if (groupName.length() == 0) return false;
		for (auto const& p : units)
		{
			if (p.second->getGroupName().compare(groupName) == 0 && p.second != unit)
				return true;
		}
	}
	return false;
}

bool UnitsManager::isUnitGroupLeader(Unit* unit) 
{
	if (unit != nullptr) {
		Unit* leader = getGroupLeader(unit);
		return leader == nullptr? false: unit == getGroupLeader(unit);
	}
	else
		return false;
}

// The group leader is the unit with the lowest ID that is part of the group. This is different from DCS's concept of leader, which will change if the leader is destroyed
Unit* UnitsManager::getGroupLeader(Unit* unit) 
{
	if (unit != nullptr) {
		string groupName = unit->getGroupName();
		if (groupName.length() == 0) return nullptr;
		/* Find the first unit that has the same groupName */
		for (auto const& p : units)
		{
			if (p.second->getGroupName().compare(groupName) == 0)
				return p.second;
		}
	}
	return nullptr;
}

vector<Unit*> UnitsManager::getGroupMembers(string groupName) 
{
	vector<Unit*> members;
	for (auto const& p : units)
	{
		if (p.second->getGroupName().compare(groupName) == 0)
			members.push_back(p.second);
	}
	return members;
}

Unit* UnitsManager::getGroupLeader(unsigned int ID)
{
	Unit* unit = getUnit(ID);
	return getGroupLeader(unit);
}

void UnitsManager::updateExportData(lua_State* L, double dt)
{
	map<unsigned int, json::value> unitJSONs = getAllUnits(L);

	/* Update all units, create them if needed TODO: move code to get constructor in dedicated function */
	for (auto const& p : unitJSONs)
	{
		unsigned int ID = p.first;
		if (units.count(ID) == 0)
		{
			json::value type = static_cast<json::value>(p.second)[L"Type"];
			if (type.has_number_field(L"level1"))
			{
				if (type[L"level1"].as_number().to_int32() == 1)
				{
					if (type[L"level2"].as_number().to_int32() == 1)
						units[ID] = dynamic_cast<Unit*>(new Aircraft(p.second, ID));
					else if (type[L"level2"].as_number().to_int32() == 2)
						units[ID] = dynamic_cast<Unit*>(new Helicopter(p.second, ID));
				}
				else if (type[L"level1"].as_number().to_int32() == 2)
					units[ID] = dynamic_cast<Unit*>(new GroundUnit(p.second, ID));
				else if (type[L"level1"].as_number().to_int32() == 3)
					units[ID] = dynamic_cast<Unit*>(new NavyUnit(p.second, ID));
				else if (type[L"level1"].as_number().to_int32() == 4)
				{
					if (type[L"level2"].as_number().to_int32() == 4)
						units[ID] = dynamic_cast<Unit*>(new Missile(p.second, ID));
					else if (type[L"level2"].as_number().to_int32() == 5)
						units[ID] = dynamic_cast<Unit*>(new Bomb(p.second, ID));
				}
			}
			/* Initialize the unit if creation was successfull */
			if (units.count(ID) != 0)
				units[ID]->initialize(p.second);
		}
		else {
			/* Update the unit if present*/
			if (units.count(ID) != 0)
				units[ID]->updateExportData(p.second, dt);
		}
	}

	/* Set the units that are not present in the JSON as dead (probably have been destroyed) */
	for (auto const& unit : units)
		unit.second->setAlive(unitJSONs.find(unit.first) != unitJSONs.end());		
}

void UnitsManager::updateMissionData(json::value missionData)
{
	/* Update all units */
	for (auto const& p : units)
	{
		unsigned int ID = p.first;
		if (missionData.has_field(to_wstring(ID)))
			p.second->updateMissionData(missionData[to_wstring(ID)]);
	}
}

void UnitsManager::runAILoop() {
	/* Run the AI Loop on all units */
	for (auto const& unit : units)
		unit.second->runAILoop();
}

string UnitsManager::getUnitData(stringstream &ss, unsigned long long time)
{
	for (auto const& p : units)
		p.second->getData(ss, time);
	return to_base64(ss.str());
}

void UnitsManager::deleteUnit(unsigned int ID, bool explosion, bool immediate)
{
	if (getUnit(ID) != nullptr)
	{
		Command* command = dynamic_cast<Command*>(new Delete(ID, explosion, immediate));
		scheduler->appendCommand(command);
	}
}

void UnitsManager::acquireControl(unsigned int ID) {
	Unit* unit = getUnit(ID);
	if (unit != nullptr) {
		for (auto const& groupMember : getGroupMembers(unit->getGroupName())) {
			if (!groupMember->getControlled()) {
				groupMember->setControlled(true);
				groupMember->setState(State::IDLE);
				groupMember->setDefaults(true);
			}
		}
	}
	
}


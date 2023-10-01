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
#include "defines.h"

#include <GeographicLib/Geodesic.hpp>
using namespace GeographicLib;

#include "base64.hpp"
using namespace base64;

extern Scheduler* scheduler;

UnitsManager::UnitsManager(lua_State* L)
{
	LogInfo(L, "Units Manager constructor called successfully");
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
			if (p.second->getGroupName().compare(groupName) == 0 && p.second != unit && p.second->getAlive())
				return true;
		}
	}
	return false;
}

/* Returns true if unit is group leader. Else, returns false, and leader will be equal to the group leader */
bool UnitsManager::isUnitGroupLeader(Unit* unit, Unit*& leader) 
{
	if (unit != nullptr) {
		leader = getGroupLeader(unit);
		return leader == nullptr? false: unit == leader;
	}
	else
		return false;
}

Unit* UnitsManager::getGroupLeader(Unit* unit) 
{
	if (unit != nullptr) {
		string groupName = unit->getGroupName();
		if (groupName.length() == 0) return nullptr;
		/* Find the first alive unit that has the same groupName */
		for (auto const& p : units)
		{
			if (p.second->getAlive() && p.second->getGroupName().compare(groupName) == 0)
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

void UnitsManager::update(json::value& json, double dt)
{
	for (auto const& p : json.as_object())
	{
		unsigned int ID = std::stoi(p.first);
		if (units.count(ID) == 0)
		{
			json::value value = p.second;
			if (value.has_string_field(L"category")) {
				string category = to_string(value[L"category"].as_string());
				if (category.compare("Aircraft") == 0)
					units[ID] = dynamic_cast<Unit*>(new Aircraft(p.second, ID));
				else if (category.compare("Helicopter") == 0)
					units[ID] = dynamic_cast<Unit*>(new Helicopter(p.second, ID));
				else if (category.compare("GroundUnit") == 0)
					units[ID] = dynamic_cast<Unit*>(new GroundUnit(p.second, ID));
				else if (category.compare("NavyUnit") == 0)
					units[ID] = dynamic_cast<Unit*>(new NavyUnit(p.second, ID));

				/* Initialize the unit if creation was successfull */
				if (units.count(ID) != 0) {
					units[ID]->update(p.second, dt);
					units[ID]->initialize(p.second);
				}
			}
		}
		else {
			/* Update the unit if present*/
			if (units.count(ID) != 0)
				units[ID]->update(p.second, dt);
		}
	}
}

void UnitsManager::runAILoop() {
	/* Run the AI Loop on all units */
	for (auto const& unit : units)
		unit.second->runAILoop();
}

void UnitsManager::getUnitData(stringstream &ss, unsigned long long time)
{
	for (auto const& p : units)
		p.second->getData(ss, time);
}

void UnitsManager::deleteUnit(unsigned int ID, bool explosion, bool immediate)
{
	if (getUnit(ID) != nullptr)
	{
		Command* command = dynamic_cast<Command*>(new Delete(ID, explosion, immediate));
		scheduler->appendCommand(command);
	}
}

Unit* UnitsManager::getClosestUnit(Unit* unit, unsigned char coalition, vector<string> categories, double &distance) {
	Unit* closestUnit = nullptr;
	distance = 0;

	for (auto const& p : units) {
		/* Check if the units category is of the correct type */
		bool requestedCategory = false;
		for (auto const& category : categories) {
			if (p.second->getCategory().compare(category) == 0) {
				requestedCategory = true;
				break;
			}
		}

		/* Check if the unit belongs to the desired coalition, is alive, and is of the category requested */
		if (requestedCategory && p.second->getCoalition() == coalition && p.second->getAlive()) {
			/* Compute the distance from the unit to the tested unit */
			double dist;
			double bearing1;
			double bearing2;
			Geodesic::WGS84().Inverse(unit->getPosition().lat, unit->getPosition().lng, p.second->getPosition().lat, p.second->getPosition().lng, dist, bearing1, bearing2);

			/* If the closest unit has not been assigned yet, assign it to this unit */
			if (closestUnit == nullptr)
			{
				closestUnit = p.second;
				distance = dist;
			
			}
			else {
				/* Check if the unit is closer than the one already selected */
				if (dist < distance) {
					closestUnit = p.second;
					distance = dist;
				}
			}
		}
	}

	return closestUnit;
}

void UnitsManager::acquireControl(unsigned int ID) {
	Unit* leader = getGroupLeader(ID);
	if (leader != nullptr) {
		if (!leader->getControlled()) {
			leader->setControlled(true);
			leader->setDefaults(true);
		}
	}	
}

void UnitsManager::loadDatabases() {
	Aircraft::loadDatabase(AIRCRAFT_DATABASE_PATH);
	Helicopter::loadDatabase(HELICOPTER_DATABASE_PATH);
	GroundUnit::loadDatabase(GROUNDUNIT_DATABASE_PATH);
	NavyUnit::loadDatabase(NAVYUNIT_DATABASE_PATH);
}
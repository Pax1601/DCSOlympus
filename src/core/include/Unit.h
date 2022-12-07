#pragma once
#include "framework.h"
#include "utils.h"
#include "dcstools.h"
#include "luatools.h"

namespace UnitCategory {
	enum UnitCategories { NO_CATEGORY, AIR, GROUND, NAVY };	// Do not edit, this codes are tied to values in DCS
};

class Unit
{
public:
	Unit(json::value json, int ID);
	~Unit();

	void update(json::value json);

	void setPath(list<Coords> path);
	void setAlive(bool newAlive) { alive = newAlive; }

	int getID() { return ID; }
	wstring getName() { return name; }
	wstring getUnitName() { return unitName; }
	wstring getGroupName() { return groupName; }
	json::value getType() { return type; }			// This functions returns the complete type of the object (Level1, Level2, Level3, Level4)
	int getCountry() { return country; }
	int getCoalitionID() { return coalitionID; }
	double getLatitude() { return latitude; }
	double getLongitude() { return longitude; }
	double getAltitude() { return altitude; }
	double getHeading() { return heading; }
	int getCategory();

	json::value json();

protected:
	int ID;
	bool alive			= true;
	wstring name		= L"undefined";
	wstring unitName	= L"undefined";
	wstring groupName	= L"undefined";
	json::value type	= json::value::null();
	int country			= 0;
	int coalitionID		= 0;
	double latitude		= 0;
	double longitude	= 0;
	double altitude		= 0;
	double heading		= 0;

	list<Coords> activePath;
	Coords activeDestination;

private:
	virtual void AIloop();
};


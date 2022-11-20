#pragma once
#include "Utils.h"
#include "DCSUtils.h"
#include "LUAUtils.h"
#include "framework.h"

class Unit
{
public:
	Unit(json::value json, int ID);
	~Unit();

	void update(json::value json);

	void setPath(list<Coords> path);

	int getID() { return ID; }
	wstring getName() { return name; }
	wstring getUnitName() { return unitName; }
	wstring getGroupName() { return groupName; }
	int getType() { return type; }
	wstring getCountry() { return country; }
	int getCoalitionID() { return coalitionID; }
	double getLatitude() { return latitude; }
	double getLongitude() { return longitude; }
	double getAltitude() { return altitude; }
	double getHeading() { return heading; }

	json::value json();

protected:
	int ID;
	wstring name		= L"undefined";
	wstring unitName	= L"undefined";
	wstring groupName	= L"undefined";
	int type			= 0;
	wstring country		= L"undefined";
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


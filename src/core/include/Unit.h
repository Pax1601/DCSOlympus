#pragma once
#include "framework.h"
#include "utils.h"
#include "dcstools.h"
#include "luatools.h"

#define GROUND_DEST_DIST_THR 100
#define AIR_DEST_DIST_THR 2000

class Unit
{
public:
	Unit(json::value json, int ID);
	~Unit();

	void update(json::value json);

	void setPath(list<Coords> path);
	void setAlive(bool newAlive) { alive = newAlive; }
	void setTarget(int targetID);
	wstring getTarget();
	wstring getCurrentTask();

	void resetActiveDestination();

	virtual void changeSpeed(wstring change) {};
	virtual void changeAltitude(wstring change) {};

	virtual double getTargetSpeed() { return targetSpeed; };
	virtual double getTargetAltitude() { return targetAltitude; };

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
	json::value getFlags() { return flags; }
	Coords getActiveDestination() { return activeDestination; }

	virtual wstring getCategory() { return L"No category"; };

	json::value json();

protected:
	int ID;
	bool AI				= false;
	bool alive			= true;
	wstring name		= L"undefined";
	wstring unitName	= L"undefined";
	wstring groupName	= L"undefined";
	json::value type	= json::value::null();
	int country			= NULL;
	int coalitionID		= NULL;
	double latitude		= NULL;
	double longitude	= NULL;
	double altitude		= NULL;
	double heading		= NULL;
	double speed		= NULL;
	json::value flags	= json::value::null();
	Coords oldPosition  = Coords(0); // Used to approximate speed
	int targetID		= NULL;
	bool holding		= false;
	bool looping		= false;

	double targetSpeed = 0;
	double targetAltitude = 0;

	list<Coords> activePath;
	Coords activeDestination = Coords(0);

	virtual void AIloop();

private:
	mutex mutexLock;
};

class AirUnit : public Unit
{
public:
	AirUnit(json::value json, int ID);

	virtual wstring getCategory() = 0;

protected:
	virtual void AIloop();
};

class Aircraft : public AirUnit
{
public:
	Aircraft(json::value json, int ID);

	virtual wstring getCategory() { return L"Aircraft"; };

	virtual void changeSpeed(wstring change);
	virtual void changeAltitude(wstring change);
	virtual double getTargetSpeed() { return targetSpeed; };
	virtual double getTargetAltitude() { return targetAltitude; };

protected:
	double targetSpeed = 150; 
	double targetAltitude = 5000;
};

class Helicopter : public AirUnit
{
public:
	Helicopter(json::value json, int ID);

	virtual wstring getCategory() { return L"Helicopter"; };

	virtual void changeSpeed(wstring change);
	virtual void changeAltitude(wstring change);
	virtual double getTargetSpeed() { return targetSpeed; };
	virtual double getTargetAltitude() { return targetAltitude; };

protected:
	double targetSpeed = 50;
	double targetAltitude = 1000;
};

class GroundUnit : public Unit
{
public:
	GroundUnit(json::value json, int ID);
	virtual void AIloop();

	virtual wstring getCategory() { return L"GroundUnit"; };
	virtual void changeSpeed(wstring change);
	virtual void changeAltitude(wstring change) {};
	virtual double getTargetSpeed() { return targetSpeed; };

protected:
	double targetSpeed = 10;
};

class NavyUnit : public Unit
{
public:
	NavyUnit(json::value json, int ID);
	virtual void AIloop();

	virtual wstring getCategory() { return L"NavyUnit"; };
	virtual void changeSpeed(wstring change);
	virtual void changeAltitude(wstring change) {};
	virtual double getTargetSpeed() { return targetSpeed; };

protected:
	double targetSpeed = 10;
};

class Weapon : public Unit
{
public:
	Weapon(json::value json, int ID);

	virtual wstring getCategory() = 0;

protected:
	/* Weapons are not controllable and have no AIloop */
	virtual void AIloop() {};
};

class Missile : public Weapon
{
public:
	Missile(json::value json, int ID);

	virtual wstring getCategory() { return L"Missile"; };
};

class Bomb : public Weapon
{
public:
	Bomb(json::value json, int ID);

	virtual wstring getCategory() { return L"Bomb"; };
};


#pragma once
#include "framework.h"
#include "utils.h"
#include "dcstools.h"
#include "luatools.h"

namespace State
{
	enum States
	{
		IDLE,
		REACH_DESTINATION,
		ATTACK,
		WINGMAN,
		FOLLOW,
		LAND,
		REFUEL,
		AWACS,
		EWR,
		TANKER,
		RUN_AWAY
	};
};

class Unit
{
public:
	Unit(json::value json, int ID);
	~Unit();

	int getID() { return ID; }

	void updateExportData(json::value json);
	void updateMissionData(json::value json);
	json::value json(bool fullRefresh);

	/********** Base data **********/
	void setAI(bool newAI) { AI = newAI; }
	bool getAI() { return AI; }
	void setName(wstring newName){name = newName};
	wstring getName() { return name; }
	void setUnitName(wstring newName){name = newName};
	wstring getUnitName() { return unitName; }
	void setGroupName(wstring newName){name = newName};
	wstring getGroupName() { return groupName; }
	void setAlive(bool newAlive) { alive = newAlive; }
	bool getAlive() { return alive; }
	void setType(json::value newType) { type = newType; }
	json::value getType() { return type; }
	void setCountry(int newCountry) { country = newCountry; }
	int getCountry() { return country; }

	/********** Flight data **********/
	void setLatitude(double newLatitude) {latitude = newLatitude;}
	double getLatitude() { return latitude; }
	void setLongitude(double newLatitude) {longitude = newLongitude;}
	double getLongitude() { return longitude; }
	void setAltitude(double newAltitude) {altitude = newAltitude;}
	double getAltitude() { return altitude; }
	void setHeading(double newHeading) {heading = newHeading;}
	double getHeading() { return heading; }
	void setSpeed(double newSpeed) {speed = newSpeed;}
	double getSpeed() {return speed; }

	/********** Mission data **********/
	void setFuel(double newFuel) { fuel = newFuel;}
	double getFuel() {return fuel;}
	void setAmmo(json::value newAmmo) { ammo = newAmmo; }
	json::value getAmmo { return ammo; }
	void setTargets(json::value newTargets) {targets = newTargets;}
	json::value getTargets() { return targets; }
	void setHasTask(bool newHasTask) { hasTask = newHasTask;}
	bool getHasTask() { return hasTask; }
	void setCoalitionID(int newCoalitionID) { coalitionID = newCoalitionID; }
	int getCoalitionID() { return coalitionID; }
	void setFlags(json::value newFlags) { flags = newFlags; }
	json::value getFlags() { return flags; }

	/********** Formation data **********/
	void setIsLeader(bool newIsLeader);
	bool getIsLeader() { return isLeader; }
	void setIsWingman(bool newIsWingman);
	bool getIsWingman() { return isWingman; }
	void setLeader(Unit *newLeader) { leader = newLeader; }
	Unit* getLeader() {return leader;}
	void setWingmen(vector<Unit *> newWingmen) { wingmen = newWingmen; }
	vector<Unit*> getWingmen() {return wingmen;}
	void setFormation(wstring newFormation) { formation = newFormation; }
	wstring getFormation() { return formation; }
	void setFormationOffset(Offset formationOffset);
	Offset getFormationoffset() {return formationOffset;}

	/********** Task data **********/
	void setCurrentTask(wstring newCurrentTask) { currentTask = newCurrentTask; } 
	wstring getCurrentTask() { return currentTask; }
	virtual void setTargetSpeed(double newSpeed) { targetSpeed = newSpeed; }
	virtual double getTargetSpeed() { return targetSpeed; };
	virtual void setTargetAltitude(double newAltitude) { targetAltitude = newAltitude; }
	virtual double getTargetAltitude() { return targetAltitude; };
	void setActiveDestination(Coords newActiveDestination) { activeDestination = newActiveDestination; }
	Coords getActiveDestination() { return activeDestination; }
	void setActivePath(list<Coords> newActivePath);
	list<Coords> getPath() {return activePath}
	void setActiveDestination(Coords newActiveDestination) { activeDestination = newActiveDestination; }
	Coords getActiveDestination() { return activeDestination; }
	void setTarget(int targetID);
	wstring getTarget();
	
	/********** Options data **********/
	void setROE(wstring newROE);
	wstring getROE() {return ROE;}
	void setReactionToThreat(wstring newReactionToThreat);
	wstring getReactionToThreat() {return reactionToThreat;}

	/********** Control functions **********/
	void landAt(Coords loc);
	virtual void changeSpeed(wstring change){};
	virtual void changeAltitude(wstring change){};
	void resetActiveDestination();
	virtual void setState(int newState) { state = newState; };
	void resetTask();

	/********** Other functions **********/
	void setHasNewData(bool newHasNewData) { hasNewData = newHasNewData; }
	virtual wstring getCategory() { return L"No category"; };
	bool isTargetAlive();	
	bool getHasNewData() { return hasNewData; }

protected:
	int ID;

	/********** Base data **********/
	bool AI = false;
	wstring name = L"undefined";
	wstring unitName = L"undefined";
	wstring groupName = L"undefined";
	bool alive = true;
	json::value type = json::value::null();
	int country = NULL;

	/********** Flight data **********/
	double latitude = NULL;
	double longitude = NULL;
	double altitude = NULL;
	double speed = NULL;
	double heading = NULL;

	/********** Mission data **********/
	double fuel = 0;
	json::value ammo = json::value::null();
	json::value targets = json::value::null();
	bool hasTask = false;
	int coalitionID = NULL; // TODO: save coalition directly
	json::value flags = json::value::null();

	/********** Formation data **********/
	bool isLeader = false;
	bool isWingman = false;
	wstring formation = L"";
	Unit *leader = nullptr;
	vector<Unit *> wingmen;
	Offset formationOffset = Offset(NULL);

	/********** Task data **********/
	wstring currentTask = L"";
	double targetSpeed = 0;
	double targetAltitude = 0;
	list<Coords> activePath;
	Coords activeDestination = Coords(0);
	int targetID = NULL;

	/********** Options data **********/
	wstring ROE = L"";
	wstring reactionToThreat = L"";

	/********** State machine **********/
	int state = State::IDLE;

	/********** Other **********/
	Coords oldPosition = Coords(0); // Used to approximate speed
	bool hasNewData = false;
	int newDataCounter = 0;

	/********** Functions **********/
	virtual void AIloop() = 0;
};

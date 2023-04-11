#pragma once
#include "framework.h"
#include "utils.h"
#include "dcstools.h"
#include "luatools.h"
#include "measure.h"

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

	/********** Public methods **********/
	int getID() { return ID; }
	void updateExportData(json::value json);
	void updateMissionData(json::value json);
	json::value getData(long long time);

	/********** Base data **********/
	void setAI(bool newAI) { AI = newAI; addMeasure(L"AI", json::value(newAI)); }
	void setName(wstring newName) { name = newName; addMeasure(L"name", json::value(newName));}
	void setUnitName(wstring newUnitName) { unitName = newUnitName; addMeasure(L"unitName", json::value(newUnitName));}
	void setGroupName(wstring newGroupName) { groupName = newGroupName; addMeasure(L"groupName", json::value(newGroupName));}
	void setAlive(bool newAlive) { alive = newAlive; addMeasure(L"alive", json::value(newAlive));}
	void setType(json::value newType) { type = newType; addMeasure(L"type", newType);}
	void setCountry(int newCountry) { country = newCountry; addMeasure(L"country", json::value(newCountry));}
	bool getAI() { return AI; }
	wstring getName() { return name; }
	wstring getUnitName() { return unitName; }
	wstring getGroupName() { return groupName; }
	bool getAlive() { return alive; }
	json::value getType() { return type; }
	int getCountry() { return country; }

	/********** Flight data **********/
	void setLatitude(double newLatitude) {latitude = newLatitude; addMeasure(L"latitude", json::value(newLatitude));}
	void setLongitude(double newLongitude) {longitude = newLongitude; addMeasure(L"longitude", json::value(newLongitude));}
	void setAltitude(double newAltitude) {altitude = newAltitude; addMeasure(L"altitude", json::value(newAltitude));}
	void setHeading(double newHeading) {heading = newHeading; addMeasure(L"heading", json::value(newHeading));}
	void setSpeed(double newSpeed) {speed = newSpeed; addMeasure(L"speed", json::value(newSpeed));}
	double getLatitude() { return latitude; }
	double getLongitude() { return longitude; }
	double getAltitude() { return altitude; }
	double getHeading() { return heading; }
	double getSpeed() { return speed; }

	/********** Mission data **********/
	void setFuel(double newFuel) { fuel = newFuel; addMeasure(L"fuel", json::value(newFuel));}
	void setAmmo(json::value newAmmo) { ammo = newAmmo; addMeasure(L"ammo", json::value(newAmmo));}
	void setTargets(json::value newTargets) {targets = newTargets; addMeasure(L"targets", json::value(newTargets));}
	void setHasTask(bool newHasTask) { hasTask = newHasTask; addMeasure(L"hasTask", json::value(newHasTask));}
	void setCoalitionID(int newCoalitionID);
	void setFlags(json::value newFlags) { flags = newFlags; addMeasure(L"flags", json::value(newFlags));}
	double getFuel() { return fuel; }
	json::value getAmmo() { return ammo; }
	json::value getTargets() { return targets; }
	bool getHasTask() { return hasTask; }
	wstring getCoalition() { return coalition; }
	int getCoalitionID();
	json::value getFlags() { return flags; }

	/********** Formation data **********/
	void setIsLeader(bool newIsLeader);
	void setIsWingman(bool newIsWingman);
	void setLeader(Unit* newLeader);
	void setWingmen(vector<Unit*> newWingmen);
	void setFormation(wstring newFormation) { formation = newFormation; addMeasure(L"formation", json::value(formation));}
	void setFormationOffset(Offset formationOffset);
	bool getIsLeader() { return isLeader; }
	bool getIsWingman() { return isWingman; }
	Unit* getLeader() { return leader; }
	vector<Unit*> getWingmen() { return wingmen; }
	wstring getFormation() { return formation; }
	Offset getFormationoffset() { return formationOffset; }
	
	/********** Task data **********/
	void setCurrentTask(wstring newCurrentTask) { currentTask = newCurrentTask;addMeasure(L"currentTask", json::value(newCurrentTask)); } 
	virtual void setTargetSpeed(double newTargetSpeed) { targetSpeed = newTargetSpeed; addMeasure(L"targetSpeed", json::value(newTargetSpeed));}
	virtual void setTargetAltitude(double newTargetAltitude) { targetAltitude = newTargetAltitude; addMeasure(L"targetAltitude", json::value(newTargetAltitude));} //TODO fix, double definition
	void setActiveDestination(Coords newActiveDestination) { activeDestination = newActiveDestination; addMeasure(L"activeDestination", json::value("")); } // TODO fix
	void setActivePath(list<Coords> newActivePath);
	void clearActivePath();
	void pushActivePathFront(Coords newActivePathFront);
	void pushActivePathBack(Coords newActivePathBack);
	void popActivePathFront();
	void setTargetID(int newTargetID) { targetID = newTargetID; addMeasure(L"targetID", json::value(newTargetID));}
	void setIsTanker(bool newIsTanker) { isTanker = newIsTanker; addMeasure(L"isTanker", json::value(newIsTanker));}
	void setIsAWACS(bool newIsAWACS) { isAWACS = newIsAWACS; addMeasure(L"isAWACS", json::value(newIsAWACS));}
	wstring getCurrentTask() { return currentTask; }
	virtual double getTargetSpeed() { return targetSpeed; };
	virtual double getTargetAltitude() { return targetAltitude; };
	Coords getActiveDestination() { return activeDestination; }
	list<Coords> getActivePath() { return activePath; }
	int getTargetID() { return targetID; }
	bool getIsTanker() { return isTanker; }
	bool getIsAWACS() { return isAWACS; }
	
	/********** Options data **********/
	void setROE(wstring newROE);
	void setReactionToThreat(wstring newReactionToThreat);
	wstring getROE() { return ROE; }
	wstring getReactionToThreat() {return reactionToThreat;}

	/********** Control functions **********/
	void landAt(Coords loc);
	virtual void changeSpeed(wstring change){};
	virtual void changeAltitude(wstring change){};
	void resetActiveDestination();
	virtual void setState(int newState) { state = newState; };
	void resetTask();

protected:
	int ID;

	map<wstring, Measure*> measures;

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
	wstring coalition = L"";
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
	bool isTanker = false;
	bool isAWACS = false;

	/********** Options data **********/
	wstring ROE = L"";
	wstring reactionToThreat = L"";

	/********** State machine **********/
	int state = State::IDLE;

	/********** Other **********/
	Coords oldPosition = Coords(0); // Used to approximate speed

	/********** Functions **********/
	virtual wstring getCategory() { return L"No category"; };
	wstring getTargetName();
	bool isTargetAlive();
	virtual void AIloop() = 0;
	void addMeasure(wstring key, json::value value);
};

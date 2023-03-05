#pragma once
#include "framework.h"
#include "utils.h"
#include "dcstools.h"
#include "luatools.h"

namespace State {
	enum States { IDLE, REACH_DESTINATION, ATTACK, WINGMAN, FOLLOW, LAND, REFUEL, AWACS, EWR, TANKER, RUN_AWAY };
};

class Unit
{
public:
	Unit(json::value json, int ID);
	~Unit();

	void updateExportData(json::value json);
	void updateMissionData(json::value json);
	json::value json(bool fullRefresh);

	virtual void setState(int newState) { state = newState; };
	void resetTask();

	void setPath(list<Coords> path);
	void setActiveDestination(Coords newActiveDestination) { activeDestination = newActiveDestination; }
	void setAlive(bool newAlive) { alive = newAlive; }
	void setTarget(int targetID);
	void setIsLeader(bool newIsLeader);
	void setIsWingman(bool newIsWingman);
	void setLeader(Unit* newLeader) { leader = newLeader; }
	void setWingmen(vector<Unit*> newWingmen) { wingmen = newWingmen; }
	void setFormation(wstring newFormation) { formation = newFormation; }
	void setFormationOffset(Offset formationOffset);
	void setROE(wstring newROE);
	void setReactionToThreat(wstring newReactionToThreat);
	void landAt(Coords loc);

	int getID() { return ID; }
	wstring getName() { return name; }
	wstring getUnitName() { return unitName; }
	wstring getGroupName() { return groupName; }
	json::value getType() { return type; }			// This function returns the complete type of the object (Level1, Level2, Level3, Level4)
	int getCountry() { return country; }
	int getCoalitionID() { return coalitionID; }
	double getLatitude() { return latitude; }
	double getLongitude() { return longitude; }
	double getAltitude() { return altitude; }
	double getHeading() { return heading; }
	json::value getFlags() { return flags; }
	Coords getActiveDestination() { return activeDestination; }
	virtual wstring getCategory() { return L"No category"; };
	wstring getTarget();
	bool isTargetAlive();
	wstring getCurrentTask() { return currentTask; }
	bool getAlive() { return alive; }
	bool getIsLeader() { return isLeader; }
	bool getIsWingman() { return isWingman; }
	wstring getFormation() { return formation; }

	virtual double getTargetSpeed() { return targetSpeed; };
	virtual double getTargetAltitude() { return targetAltitude; };
	virtual void setTargetSpeed(double newSpeed) { targetSpeed = newSpeed; }
	virtual void setTargetAltitude(double newAltitude) { targetAltitude = newAltitude; }
	virtual void changeSpeed(wstring change) {};
	virtual void changeAltitude(wstring change) {};

	void resetActiveDestination();

protected:
	int ID;
	int state					= State::IDLE;
	bool hasTask				= false;
	bool AI						= false;
	bool alive					= true;
	wstring name				= L"undefined";
	wstring unitName			= L"undefined";
	wstring groupName			= L"undefined";
	json::value type			= json::value::null();
	int country					= NULL;
	int coalitionID				= NULL;
	double latitude				= NULL;
	double longitude			= NULL;
	double altitude				= NULL;
	double heading				= NULL;
	double speed				= NULL;
	json::value flags			= json::value::null();
	int targetID				= NULL;
	wstring currentTask			= L"";
	bool isLeader				= false;
	bool isWingman				= false;
	Offset formationOffset		= Offset(NULL);
	wstring formation			= L"";
	Unit* leader				= nullptr;
	wstring ROE					= L"";
	wstring reactionToThreat	= L"";
	vector<Unit*> wingmen;
	double targetSpeed			= 0;
	double targetAltitude		= 0;
	double fuel					= 0;
	json::value ammo;
	json::value targets;

	list<Coords> activePath;
	Coords activeDestination = Coords(0);
	Coords oldPosition = Coords(0); // Used to approximate speed

	virtual void AIloop() = 0;
};









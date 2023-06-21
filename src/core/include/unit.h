#pragma once
#include "framework.h"
#include "utils.h"
#include "dcstools.h"
#include "luatools.h"
#include "measure.h"
#include "logger.h"

#define TASK_CHECK_INIT_VALUE 10

namespace State
{
	enum States
	{
		NONE = 0,
		IDLE,
		REACH_DESTINATION,
		ATTACK,
		FOLLOW,
		LAND,
		REFUEL,
		AWACS,
		TANKER,
		BOMB_POINT,
		CARPET_BOMB,
		BOMB_BUILDING,
		FIRE_AT_AREA
	};
};

namespace Options {
	struct TACAN
	{
		bool isOn = false;
		int channel = 40;
		wstring XY = L"X";
		wstring callsign = L"TKR";
	};

	struct Radio
	{
		int frequency = 124000000;	// MHz
		int callsign = 1;
		int callsignNumber = 1;
	};

	struct GeneralSettings
	{
		bool prohibitJettison = false;
		bool prohibitAA = false;
		bool prohibitAG = false;
		bool prohibitAfterburner = false;
		bool prohibitAirWpn = false;
	};
}

class Unit
{
public:
	Unit(json::value json, int ID);
	~Unit();

	/********** Public methods **********/
	void initialize(json::value json);
	void setDefaults(bool force = false);
	int getID() { return ID; }
	void runAILoop();
	void updateExportData(json::value json, double dt = 0);
	void updateMissionData(json::value json);
	json::value getData(long long time, bool getAll = false);
	virtual wstring getCategory() { return L"No category"; };

	/********** Base data **********/
	void setControlled(bool newControlled) { controlled = newControlled; addMeasure(L"controlled", json::value(newControlled)); }
	void setName(wstring newName) { name = newName; addMeasure(L"name", json::value(newName));}
	void setUnitName(wstring newUnitName) { unitName = newUnitName; addMeasure(L"unitName", json::value(newUnitName));}
	void setGroupName(wstring newGroupName) { groupName = newGroupName; addMeasure(L"groupName", json::value(newGroupName));}
	void setAlive(bool newAlive) { alive = newAlive; addMeasure(L"alive", json::value(newAlive));}
	void setType(json::value newType) { type = newType; addMeasure(L"type", newType);}
	void setCountry(int newCountry) { country = newCountry; addMeasure(L"country", json::value(newCountry));}

	bool getControlled() { return controlled; }
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
	void setContacts(json::value newContacts) {contacts = newContacts; addMeasure(L"contacts", json::value(newContacts));}
	void setHasTask(bool newHasTask);
	void setCoalitionID(int newCoalitionID);
	void setFlags(json::value newFlags) { flags = newFlags; addMeasure(L"flags", json::value(newFlags));}

	double getFuel() { return fuel; }
	json::value getAmmo() { return ammo; }
	json::value getTargets() { return contacts; }
	bool getHasTask() { return hasTask; }
	wstring getCoalition() { return coalition; }
	int getCoalitionID();
	json::value getFlags() { return flags; }

	/********** Formation data **********/
	void setLeaderID(int newLeaderID) { leaderID = newLeaderID; addMeasure(L"leaderID", json::value(newLeaderID)); }
	void setFormationOffset(Offset formationOffset);

	int getLeaderID() { return leaderID; }
	Offset getFormationoffset() { return formationOffset; }
	
	/********** Task data **********/
	void setCurrentTask(wstring newCurrentTask) { currentTask = newCurrentTask; addMeasure(L"currentTask", json::value(newCurrentTask)); } 
	void setDesiredSpeed(double newDesiredSpeed);
	void setDesiredAltitude(double newDesiredAltitude);
	void setDesiredSpeedType(wstring newDesiredSpeedType);
	void setDesiredAltitudeType(wstring newDesiredAltitudeType);
	void setActiveDestination(Coords newActiveDestination) { activeDestination = newActiveDestination; addMeasure(L"activeDestination", json::value("")); } // TODO fix
	void setActivePath(list<Coords> newActivePath);
	void setTargetID(int newTargetID) { targetID = newTargetID; addMeasure(L"targetID", json::value(newTargetID));}
	void setTargetLocation(Coords newTargetLocation);
	void setIsTanker(bool newIsTanker);
	void setIsAWACS(bool newIsAWACS);
	virtual void setOnOff(bool newOnOff) { onOff = newOnOff; addMeasure(L"onOff", json::value(newOnOff));};
	virtual void setFollowRoads(bool newFollowRoads) { followRoads = newFollowRoads; addMeasure(L"followRoads", json::value(newFollowRoads)); };
	
	wstring getCurrentTask() { return currentTask; }
	virtual double getDesiredSpeed() { return desiredSpeed; };
	virtual double getDesiredAltitude() { return desiredAltitude; };
	virtual wstring getDesiredSpeedType() { return desiredSpeedType; };
	virtual wstring getDesiredAltitudeType() { return desiredAltitudeType; };
	Coords getActiveDestination() { return activeDestination; }
	list<Coords> getActivePath() { return activePath; }
	int getTargetID() { return targetID; }
	Coords getTargetLocation() { return targetLocation; }
	bool getIsTanker() { return isTanker; }
	bool getIsAWACS() { return isAWACS; }
	bool getOnOff() { return onOff; };
	bool getFollowRoads() { return followRoads; };

	/********** Options data **********/
	void setROE(wstring newROE, bool force = false);
	void setReactionToThreat(wstring newReactionToThreat, bool force = false);
	void setEmissionsCountermeasures(wstring newEmissionsCountermeasures, bool force = false);
	void setTACAN(Options::TACAN newTACAN, bool force = false);
	void setRadio(Options::Radio newradio, bool force = false);
	void setGeneralSettings(Options::GeneralSettings newGeneralSettings, bool force = false);
	void setEPLRS(bool newEPLRS, bool force = false);

	wstring getROE() { return ROE; }
	wstring getReactionToThreat() { return reactionToThreat; }
	wstring getEmissionsCountermeasures() { return emissionsCountermeasures; };
	Options::TACAN getTACAN() { return TACAN; }
	Options::Radio getRadio() { return radio; }
	Options::GeneralSettings getGeneralSettings() { return generalSettings; }
	bool getEPLRS() { return EPLRS; }

	/********** Control functions **********/
	void landAt(Coords loc);
	virtual void changeSpeed(wstring change) {};
	virtual void changeAltitude(wstring change) {};
	void resetActiveDestination();
	virtual void setState(int newState) { state = newState; };
	void resetTask();
	void clearActivePath();
	void pushActivePathFront(Coords newActivePathFront);
	void pushActivePathBack(Coords newActivePathBack);
	void popActivePathFront();

protected:
	int ID;

	map<wstring, Measure*> measures;
	int taskCheckCounter = 0;

	/********** Base data **********/
	bool controlled = false;
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
	double initialFuel = 0; // Used internally to detect refueling completed
	json::value ammo = json::value::null();
	json::value contacts = json::value::null();
	bool hasTask = false;
	wstring coalition = L"";
	json::value flags = json::value::null();

	/********** Formation data **********/
	int leaderID = NULL;
	Offset formationOffset = Offset(NULL);

	/********** Task data **********/
	wstring currentTask = L"";
	double desiredSpeed = 0;
	double desiredAltitude = 0;
	wstring desiredSpeedType = L"GS";
	wstring desiredAltitudeType = L"AGL";
	list<Coords> activePath;
	Coords activeDestination = Coords(NULL);
	int targetID = NULL;
	Coords targetLocation = Coords(NULL);
	bool isTanker = false;
	bool isAWACS = false;
	bool onOff = true;
	bool followRoads = false;
	
	/********** Options data **********/
	wstring ROE = L"Designated";
	wstring reactionToThreat = L"Evade";
	wstring emissionsCountermeasures = L"Defend";
	Options::TACAN TACAN;
	Options::Radio radio;
	Options::GeneralSettings generalSettings;
	bool EPLRS = false;

	/********** State machine **********/
	int state = State::NONE;

	/********** Other **********/
	Coords oldPosition = Coords(0); // Used to approximate speed

	/********** Functions **********/
	wstring getTargetName();
	wstring getLeaderName();
	bool isTargetAlive();
	bool isLeaderAlive();
	virtual void AIloop() = 0;
	void addMeasure(wstring key, json::value value);
	bool isDestinationReached(double threshold);
	bool setActiveDestination();
	bool updateActivePath(bool looping);
	void goToDestination(wstring enrouteTask = L"nil");
	bool checkTaskFailed();
	void resetTaskFailedCounter();
};

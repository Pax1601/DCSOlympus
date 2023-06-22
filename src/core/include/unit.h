#pragma once
#include "framework.h"
#include "utils.h"
#include "dcstools.h"
#include "luatools.h"
#include "measure.h"
#include "logger.h"
#include "commands.h"

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

#pragma pack(push, 1)
namespace Options {
	struct TACAN
	{
		bool isOn = false;
		unsigned char channel = 40;
		char XY = 'X';
		char callsign[4];
	};

	struct Radio
	{
		unsigned int frequency = 124000000;	// MHz
		unsigned char callsign = 1;
		unsigned char callsignNumber = 1;
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

namespace DataTypes {
	struct Ammo {
		unsigned short quantity = 0;
		string name;
		unsigned char guidance = 0;
		unsigned char category = 0;
		unsigned char missileCategory = 0;
	};

	struct Contact {
		unsigned int ID = 0;
		unsigned char detectionMethod = 0;
	};

	struct DataPacket {
		unsigned int ID;
		unsigned int bitmask;
		Coords position;
		double speed;
		double heading;
		unsigned short fuel;
		double desiredSpeed;
		double desiredAltitude;
		unsigned int targetID;
		Coords targetPosition;
		unsigned char state;
		unsigned char ROE;
		unsigned char reactionToThreat;
		unsigned char emissionsCountermeasures;
		Options::TACAN TACAN;
		Options::Radio Radio;
		unsigned short pathLength;
		unsigned char nameLength;
		unsigned char unitNameLength;
		unsigned char groupNameLength;
		unsigned char categoryLength;
		unsigned char coalitionLength;
	};
}
#pragma pack(pop)

class Unit
{
public:
	Unit(json::value json, unsigned int ID);
	~Unit();

	/********** Public methods **********/
	void initialize(json::value json);
	void setDefaults(bool force = false);
	unsigned int getID() { return ID; }
	void runAILoop();
	void updateExportData(json::value json, double dt = 0);
	void updateMissionData(json::value json);
	unsigned int getUpdateData(char* &data);
	void getData(stringstream &ss, bool refresh);
	virtual string getCategory() { return "No category"; };

	/********** Base data **********/
	void setControlled(bool newControlled) { controlled = newControlled; }
	void setName(string newName) { name = newName; }
	void setUnitName(string newUnitName) { unitName = newUnitName; }
	void setGroupName(string newGroupName) { groupName = newGroupName; }
	void setAlive(bool newAlive) { alive = newAlive; }
	void setCountry(unsigned int newCountry) { country = newCountry; }
	void setHuman(bool newHuman) { human = newHuman; }

	bool getControlled() { return controlled; }
	string getName() { return name; }
	string getUnitName() { return unitName; }
	string getGroupName() { return groupName; }
	bool getAlive() { return alive; }
	unsigned int getCountry() { return country; }
	bool getHuman() { return human; }

	/********** Flight data **********/
	void setPosition(Coords newPosition) { position = newPosition; }
	void setHeading(double newHeading) {heading = newHeading; }
	void setSpeed(double newSpeed) {speed = newSpeed; }

	Coords getPosition() { return position;  }
	double getHeading() { return heading; }
	double getSpeed() { return speed; }

	/********** Mission data **********/
	void setFuel(short newFuel) { fuel = newFuel; }
	void setAmmo(vector<DataTypes::Ammo> newAmmo) { ammo = newAmmo; }
	void setContacts(vector<DataTypes::Contact> newContacts) {contacts = newContacts; }
	void setHasTask(bool newHasTask);
	void setCoalitionID(unsigned int newCoalitionID);

	double getFuel() { return fuel; }
	vector<DataTypes::Ammo> getAmmo() { return ammo; }
	vector<DataTypes::Contact> getTargets() { return contacts; }
	bool getHasTask() { return hasTask; }
	string getCoalition() { return coalition; }
	unsigned int getCoalitionID();

	/********** Formation data **********/
	void setLeaderID(unsigned int newLeaderID) { leaderID = newLeaderID; }
	void setFormationOffset(Offset formationOffset);

	unsigned int getLeaderID() { return leaderID; }
	Offset getFormationoffset() { return formationOffset; }
	
	/********** Task data **********/
	void setCurrentTask(string newCurrentTask) { currentTask = newCurrentTask; } 
	void setDesiredSpeed(double newDesiredSpeed);
	void setDesiredAltitude(double newDesiredAltitude);
	void setDesiredSpeedType(string newDesiredSpeedType);
	void setDesiredAltitudeType(string newDesiredAltitudeType);
	void setActiveDestination(Coords newActiveDestination) { activeDestination = newActiveDestination; } 
	void setActivePath(list<Coords> newActivePath);
	void setTargetID(unsigned int newTargetID) { targetID = newTargetID; }
	void setTargetPosition(Coords newTargetPosition);
	void setIsTanker(bool newIsTanker);
	void setIsAWACS(bool newIsAWACS);
	virtual void setOnOff(bool newOnOff) { onOff = newOnOff; };
	virtual void setFollowRoads(bool newFollowRoads) { followRoads = newFollowRoads; };
	
	string getCurrentTask() { return currentTask; }
	virtual double getDesiredSpeed() { return desiredSpeed; };
	virtual double getDesiredAltitude() { return desiredAltitude; };
	virtual bool getDesiredSpeedType() { return desiredSpeedType; };
	virtual bool getDesiredAltitudeType() { return desiredAltitudeType; };
	Coords getActiveDestination() { return activeDestination; }
	list<Coords> getActivePath() { return activePath; }
	unsigned int getTargetID() { return targetID; }
	Coords getTargetPosition() { return targetPosition; }
	bool getIsTanker() { return isTanker; }
	bool getIsAWACS() { return isAWACS; }
	bool getOnOff() { return onOff; };
	bool getFollowRoads() { return followRoads; };

	/********** Options data **********/
	void setROE(unsigned char newROE, bool force = false);
	void setReactionToThreat(unsigned char newReactionToThreat, bool force = false);
	void setEmissionsCountermeasures(unsigned char newEmissionsCountermeasures, bool force = false);
	void setTACAN(Options::TACAN newTACAN, bool force = false);
	void setRadio(Options::Radio newradio, bool force = false);
	void setGeneralSettings(Options::GeneralSettings newGeneralSettings, bool force = false);
	void setEPLRS(bool newEPLRS, bool force = false);

	unsigned char getROE() { return ROE; }
	unsigned char getReactionToThreat() { return reactionToThreat; }
	unsigned char getEmissionsCountermeasures() { return emissionsCountermeasures; };
	Options::TACAN getTACAN() { return TACAN; }
	Options::Radio getRadio() { return radio; }
	Options::GeneralSettings getGeneralSettings() { return generalSettings; }
	bool getEPLRS() { return EPLRS; }

	/********** Control functions **********/
	void landAt(Coords loc);
	virtual void changeSpeed(string change) {};
	virtual void changeAltitude(string change) {};
	void resetActiveDestination();
	virtual void setState(unsigned char newState) { state = newState; };
	void resetTask();
	void clearActivePath();
	void pushActivePathFront(Coords newActivePathFront);
	void pushActivePathBack(Coords newActivePathBack);
	void popActivePathFront();

protected:
	unsigned int ID;

	map<string, Measure*> measures;
	unsigned int taskCheckCounter = 0;

	/********** Base data **********/
	bool controlled = false;
	string name = "undefined";
	string unitName = "undefined";
	string groupName = "undefined";
	bool alive = true;
	bool human = false;
	unsigned int country = NULL;

	/********** Flight data **********/
	Coords position = Coords(NULL);
	double speed = NULL;
	double heading = NULL;

	/********** Mission data **********/
	unsigned short fuel = 0;
	double initialFuel = 0; // Used internally to detect refueling completed
	vector<DataTypes::Ammo> ammo;
	vector<DataTypes::Contact> contacts;
	bool hasTask = false;
	string coalition = "";

	/********** Formation data **********/
	unsigned int leaderID = NULL;
	Offset formationOffset = Offset(NULL);

	/********** Task data **********/
	string currentTask = "";
	double desiredSpeed = 0;
	double desiredAltitude = 0;
	bool desiredSpeedType = 0;
	bool desiredAltitudeType = 0;
	list<Coords> activePath;
	Coords activeDestination = Coords(NULL);
	unsigned int targetID = NULL;
	Coords targetPosition = Coords(NULL);
	bool isTanker = false;
	bool isAWACS = false;
	bool onOff = true;
	bool followRoads = false;
	
	/********** Options data **********/
	unsigned char ROE = ROE::OPEN_FIRE_WEAPON_FREE;
	unsigned char reactionToThreat = ReactionToThreat::EVADE_FIRE;
	unsigned char emissionsCountermeasures = EmissionCountermeasure::DEFEND;
	Options::TACAN TACAN;
	Options::Radio radio;
	Options::GeneralSettings generalSettings;
	bool EPLRS = false;

	/********** State machine **********/
	unsigned char state = State::NONE;

	/********** Other **********/
	Coords oldPosition = Coords(0); // Used to approximate speed

	/********** Functions **********/
	string getTargetName();
	string getLeaderName();
	bool isTargetAlive();
	bool isLeaderAlive();
	virtual void AIloop() = 0;
	bool isDestinationReached(double threshold);
	bool setActiveDestination();
	bool updateActivePath(bool looping);
	void goToDestination(string enrouteTask = "nil");
	bool checkTaskFailed();
	void resetTaskFailedCounter();
};

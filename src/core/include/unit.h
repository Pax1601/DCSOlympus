#pragma once
#include "framework.h"
#include "utils.h"
#include "dcstools.h"
#include "luatools.h"
#include "measure.h"
#include "logger.h"
#include "commands.h"

#include <chrono>
using namespace std::chrono;

#define TASK_CHECK_INIT_VALUE 10

namespace DataIndex {
	enum DataIndexes {
		startOfData = 0,
		category,
		alive,
		human,
		controlled,
		coalition,
		country,
		name,
		unitName,
		groupName,
		state,
		task,
		hasTask,
		position,
		speed,
		heading,
		isTanker,
		isAWACS,
		onOff,
		followRoads,
		fuel,
		desiredSpeed,
		desiredSpeedType,
		desiredAltitude,
		desiredAltitudeType,
		leaderID,
		formationOffset,
		targetID,
		targetPosition,
		ROE,
		reactionToThreat,
		emissionsCountermeasures,
		TACAN,
		radio,
		generalSettings,
		ammo,
		contacts,
		activePath,
		endOfData = 255
	};
}

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
namespace DataTypes {
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

	struct Ammo {
		unsigned short quantity = 0;
		char name[32];
		unsigned char guidance = 0;
		unsigned char category = 0;
		unsigned char missileCategory = 0;
	};

	struct Contact {
		unsigned int ID = 0;
		unsigned char detectionMethod = 0;
	};
}
#pragma pack(pop)

class Unit
{
public:
	Unit(json::value json, unsigned int ID);
	~Unit();

	/********** Methods **********/
	void initialize(json::value json);
	void setDefaults(bool force = false);

	void runAILoop();

	void updateExportData(json::value json, double dt = 0);
	void updateMissionData(json::value json);

	unsigned int getDataPacket(char*& data);
	unsigned int getID() { return ID; }
	void getData(stringstream& ss, unsigned long long time, bool refresh);
	Coords getActiveDestination() { return activeDestination; }

	virtual void changeSpeed(string change) {};
	virtual void changeAltitude(string change) {};
	bool setActiveDestination();
	void resetActiveDestination();
	void landAt(Coords loc);

	bool updateActivePath(bool looping);
	void clearActivePath();
	void pushActivePathFront(Coords newActivePathFront);
	void pushActivePathBack(Coords newActivePathBack);
	void popActivePathFront();
	void goToDestination(string enrouteTask = "nil");
	bool isDestinationReached(double threshold);

	string getTargetName();
	string getLeaderName();
	bool isTargetAlive();
	bool isLeaderAlive();

	void resetTask();
	bool checkTaskFailed();
	void resetTaskFailedCounter();

	void triggerUpdate(unsigned char datumIndex);

	/********** Setters **********/
	virtual void setCategory(string newValue) { updateValue(category, newValue, DataIndex::category); }
	virtual void setAlive(bool newValue) { updateValue(alive, newValue, DataIndex::alive); }
	virtual void setHuman(bool newValue) { updateValue(human, newValue, DataIndex::human); }
	virtual void setControlled(bool newValue) { updateValue(controlled, newValue, DataIndex::controlled); }
	virtual void setCoalition(unsigned char newValue) { updateValue(coalition, newValue, DataIndex::coalition); }
	virtual void setCountry(unsigned int newValue) { updateValue(country, newValue, DataIndex::country); }
	virtual void setName(string newValue) { updateValue(name, newValue, DataIndex::name); }
	virtual void setUnitName(string newValue) { updateValue(unitName, newValue, DataIndex::unitName); }
	virtual void setGroupName(string newValue) { updateValue(groupName, newValue, DataIndex::groupName); }
	virtual void setState(unsigned char newValue) { updateValue(state, newValue, DataIndex::state); };
	virtual void setTask(string newValue) { updateValue(task, newValue, DataIndex::task); }
	virtual void setHasTask(bool newValue) { updateValue(hasTask, newValue, DataIndex::hasTask); }
	virtual void setPosition(Coords newValue) { updateValue(position, newValue, DataIndex::position); }
	virtual void setSpeed(double newValue) { updateValue(speed, newValue, DataIndex::speed); }
	virtual void setHeading(double newValue) { updateValue(heading, newValue, DataIndex::heading); }
	virtual void setIsTanker(bool newValue);
	virtual void setIsAWACS(bool newValue);
	virtual void setOnOff(bool newValue) { updateValue(onOff, newValue, DataIndex::onOff); };
	virtual void setFollowRoads(bool newValue) { updateValue(followRoads, newValue, DataIndex::followRoads); };
	virtual void setFuel(unsigned short newValue) { updateValue(fuel, newValue, DataIndex::fuel); }
	virtual void setDesiredSpeed(double newValue);
	virtual void setDesiredSpeedType(string newValue);
	virtual void setDesiredAltitude(double newValue);
	virtual void setDesiredAltitudeType(string newValue);
	virtual void setLeaderID(unsigned int newValue) { updateValue(leaderID, newValue, DataIndex::leaderID); }
	virtual void setFormationOffset(Offset formationOffset);
	virtual void setTargetID(unsigned int newValue) { updateValue(targetID, newValue, DataIndex::targetID); }
	virtual void setTargetPosition(Coords newValue) { updateValue(targetPosition, newValue, DataIndex::targetPosition); }
	virtual void setROE(unsigned char newValue, bool force = false);
	virtual void setReactionToThreat(unsigned char newValue, bool force = false);
	virtual void setEmissionsCountermeasures(unsigned char newValue, bool force = false);
	virtual void setTACAN(DataTypes::TACAN newValue, bool force = false);
	virtual void setRadio(DataTypes::Radio newValue, bool force = false);
	virtual void setGeneralSettings(DataTypes::GeneralSettings newValue, bool force = false);
	virtual void setAmmo(vector<DataTypes::Ammo> newAmmo) { ammo = newAmmo; }
	virtual void setContacts(vector<DataTypes::Contact> newContacts) { contacts = newContacts; }
	virtual void setActivePath(list<Coords> newValue);

	/********** Getters **********/
	virtual string getCategory() { return category; };
	virtual bool getAlive() { return alive; }
	virtual bool getHuman() { return human; }
	virtual bool getControlled() { return controlled; }
	virtual unsigned int getCoalition() { return coalition; }
	virtual unsigned int getCountry() { return country; }
	virtual string getName() { return name; }
	virtual string getUnitName() { return unitName; }
	virtual string getGroupName() { return groupName; }
	virtual unsigned char getState() { return state; }
	virtual string getTask() { return task; }
	virtual bool getHasTask() { return hasTask; }
	virtual Coords getPosition() { return position; }
	virtual double getSpeed() { return speed; }
	virtual double getHeading() { return heading; }
	virtual bool getIsTanker() { return isTanker; }
	virtual bool getIsAWACS() { return isAWACS; }
	virtual bool getOnOff() { return onOff; };
	virtual bool getFollowRoads() { return followRoads; };
	virtual double getFuel() { return fuel; }
	virtual double getDesiredSpeed() { return desiredSpeed; };
	virtual bool getDesiredSpeedType() { return desiredSpeedType; };
	virtual double getDesiredAltitude() { return desiredAltitude; };
	virtual bool getDesiredAltitudeType() { return desiredAltitudeType; };
	virtual unsigned int getLeaderID() { return leaderID; }
	virtual Offset getFormationoffset() { return formationOffset; }
	virtual unsigned int getTargetID() { return targetID; }
	virtual Coords getTargetPosition() { return targetPosition; }
	virtual unsigned char getROE() { return ROE; }
	virtual unsigned char getReactionToThreat() { return reactionToThreat; }
	virtual unsigned char getEmissionsCountermeasures() { return emissionsCountermeasures; };
	virtual DataTypes::TACAN getTACAN() { return TACAN; }
	virtual DataTypes::Radio getRadio() { return radio; }
	virtual DataTypes::GeneralSettings getGeneralSettings() { return generalSettings; }
	virtual vector<DataTypes::Ammo> getAmmo() { return ammo; }
	virtual vector<DataTypes::Contact> getTargets() { return contacts; }
	virtual list<Coords> getActivePath() { return activePath; }

protected:
	unsigned int ID;

	string category;
	bool alive = true;
	bool human = false;
	bool controlled = false;
	unsigned char coalition;
	unsigned int country = NULL;
	string name = "undefined";
	string unitName = "undefined";
	string groupName = "undefined";
	unsigned char state = State::NONE;
	string task = "";
	bool hasTask = false;
	Coords position = Coords(NULL);
	double speed = NULL;
	double heading = NULL;
	bool isTanker = false;
	bool isAWACS = false;
	bool onOff = true;
	bool followRoads = false;
	unsigned short fuel = 0;
	double desiredSpeed = 0;
	bool desiredSpeedType = 1;
	double desiredAltitude = 0;
	bool desiredAltitudeType = 1;
	unsigned int leaderID = NULL;
	Offset formationOffset = Offset(NULL);
	unsigned int targetID = NULL;
	Coords targetPosition = Coords(NULL);
	unsigned char ROE = ROE::OPEN_FIRE_WEAPON_FREE;
	unsigned char reactionToThreat = ReactionToThreat::EVADE_FIRE;
	unsigned char emissionsCountermeasures = EmissionCountermeasure::DEFEND;
	DataTypes::TACAN TACAN;
	DataTypes::Radio radio;
	DataTypes::GeneralSettings generalSettings;
	vector<DataTypes::Ammo> ammo;
	vector<DataTypes::Contact> contacts;
	list<Coords> activePath;

	/********** Other **********/
	unsigned int taskCheckCounter = 0;
	Coords activeDestination = Coords(NULL);
	double initialFuel = 0;
	Coords oldPosition = Coords(0);
	map<unsigned char, unsigned long long> updateTimeMap;

	/********** Private methods **********/
	virtual void AIloop() = 0;

	/********** Template methods **********/
	template <typename T>
	void updateValue(T& value, T& newValue, unsigned char datumIndex)
	{
		if (newValue != value)
		{
			triggerUpdate(datumIndex);
			*(&value) = newValue;
		}
	}

	template <typename T>
	void appendNumeric(stringstream& ss, const unsigned char& datumIndex, T& datumValue) {
		ss.write((const char*)&datumIndex, sizeof(unsigned char));
		ss.write((const char*)&datumValue, sizeof(T));
	}

	void appendString(stringstream& ss, const unsigned char& datumIndex, string& datumValue) {
		const unsigned short size = datumValue.size();
		ss.write((const char*)&datumIndex, sizeof(unsigned char));
		ss.write((const char*)&size, sizeof(unsigned short));
		ss << datumValue;
	}

	template <typename T>
	void appendVector(stringstream& ss, const unsigned char& datumIndex, vector<T>& datumValue) {
		const unsigned short size = datumValue.size();
		ss.write((const char*)&datumIndex, sizeof(unsigned char));
		ss.write((const char*)&size, sizeof(unsigned short));
		ss.write((const char*)&datumValue, size * sizeof(T));
	}

	template <typename T>
	void appendList(stringstream& ss, const unsigned char& datumIndex, list<T>& datumValue) {
		const unsigned short size = datumValue.size();
		ss.write((const char*)&datumIndex, sizeof(unsigned char));
		ss.write((const char*)&size, sizeof(unsigned short));

		for (auto el: datumValue)
			ss.write((const char*)&el, sizeof(T));
	}
};

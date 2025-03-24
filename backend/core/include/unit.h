#pragma once
#include "framework.h"
#include "utils.h"
#include "dcstools.h"
#include "luatools.h"
#include "logger.h"
#include "commands.h"
#include "datatypes.h"

#include <chrono>
using namespace std::chrono;

#define TASK_CHECK_INIT_VALUE 10

class Unit
{
public:
	Unit(json::value json, unsigned int ID);
	~Unit();

	/********** Methods **********/
	virtual void initialize(json::value json) final;
	virtual void setDefaults(bool force = false);

	void runAILoop();

	virtual void update(json::value json, double dt) final;
	void refreshLeaderData(unsigned long long time);

	unsigned int getID() { return ID; }
	void getData(stringstream& ss, unsigned long long time);
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
	void setHasTaskAssigned(bool newHasTaskAssigned);
	void setEnableTaskCheckFailed(bool newEnableTaskCheckFailed) { enableTaskFailedCheck = newEnableTaskCheckFailed; }
	bool getEnableTaskCheckFailed() { return enableTaskFailedCheck; }

	void triggerUpdate(unsigned char datumIndex);

	bool hasFreshData(unsigned long long time);
	bool checkFreshness(unsigned char datumIndex, unsigned long long time);

	unsigned int computeTotalAmmo();

	/********** Setters **********/
	virtual void setCategory(string newValue) { updateValue(category, newValue, DataIndex::category); }
	virtual void setAlive(bool newValue) { updateValue(alive, newValue, DataIndex::alive); }
	virtual void setAlarmState(unsigned char newValue, bool force = false);
	virtual void setHuman(bool newValue) { updateValue(human, newValue, DataIndex::human); }
	virtual void setControlled(bool newValue) { updateValue(controlled, newValue, DataIndex::controlled); }
	virtual void setCoalition(unsigned char newValue) { updateValue(coalition, newValue, DataIndex::coalition); }
	virtual void setCountry(unsigned char newValue) { updateValue(country, newValue, DataIndex::country); }
	virtual void setName(string newValue) { updateValue(name, newValue, DataIndex::name); }
	virtual void setUnitName(string newValue) { updateValue(unitName, newValue, DataIndex::unitName); }
	virtual void setCallsign(string newValue) { updateValue(callsign, newValue, DataIndex::callsign); }
	virtual void setGroupName(string newValue) { updateValue(groupName, newValue, DataIndex::groupName); }
	virtual void setState(unsigned char newValue) { updateValue(state, newValue, DataIndex::state); };
	virtual void setTask(string newValue) { updateValue(task, newValue, DataIndex::task); }
	virtual void setHasTask(bool newValue);
	virtual void setPosition(Coords newValue) { updateValue(position, newValue, DataIndex::position); }
	virtual void setSpeed(double newValue) { updateValue(speed, newValue, DataIndex::speed); }
	virtual void setHorizontalVelocity(double newValue) { updateValue(horizontalVelocity, newValue, DataIndex::horizontalVelocity); }
	virtual void setVerticalVelocity(double newValue) { updateValue(verticalVelocity, newValue, DataIndex::verticalVelocity); }
	virtual void setHeading(double newValue) { updateValue(heading, newValue, DataIndex::heading); }
	virtual void setTrack(double newValue) { updateValue(track, newValue, DataIndex::track); }
	virtual void setIsActiveTanker(bool newValue);
	virtual void setIsActiveAWACS(bool newValue);
	virtual void setOnOff(bool newValue, bool force = false) { updateValue(onOff, newValue, DataIndex::onOff); };
	virtual void setFollowRoads(bool newValue, bool force = false) { updateValue(followRoads, newValue, DataIndex::followRoads); };
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
	virtual void setAmmo(vector<DataTypes::Ammo> newValue);
	virtual void setContacts(vector<DataTypes::Contact> newValue);
	virtual void setActivePath(list<Coords> newValue);
	virtual void setIsLeader(bool newValue) { updateValue(isLeader, newValue, DataIndex::isLeader); }
	virtual void setOperateAs(unsigned char newValue) { updateValue(operateAs, newValue, DataIndex::operateAs); }
	virtual void setShotsScatter(unsigned char newValue) { updateValue(shotsScatter, newValue, DataIndex::shotsScatter); }
	virtual void setShotsIntensity(unsigned char newValue) { updateValue(shotsIntensity, newValue, DataIndex::shotsIntensity); }
	virtual void setHealth(unsigned char newValue) { updateValue(health, newValue, DataIndex::health); }
	virtual void setRacetrackLength(double newValue) { updateValue(racetrackLength, newValue, DataIndex::racetrackLength); }
	virtual void setRacetrackAnchor(Coords newValue) { updateValue(racetrackAnchor, newValue, DataIndex::racetrackAnchor); }
	virtual void setRacetrackBearing(double newValue) { updateValue(racetrackBearing, newValue, DataIndex::racetrackBearing); }
	virtual void setTimeToNextTasking(double newValue) { updateValue(timeToNextTasking, newValue, DataIndex::timeToNextTasking); }
	virtual void setBarrelHeight(double newValue) { updateValue(barrelHeight, newValue, DataIndex::barrelHeight); }
	virtual void setMuzzleVelocity(double newValue) { updateValue(muzzleVelocity, newValue, DataIndex::muzzleVelocity); }
	virtual void setAimTime(double newValue) { updateValue(aimTime, newValue, DataIndex::aimTime); }
	virtual void setShotsToFire(unsigned int newValue) { updateValue(shotsToFire, newValue, DataIndex::shotsToFire); }
	virtual void setShotsBaseInterval(double newValue) { updateValue(shotsBaseInterval, newValue, DataIndex::shotsBaseInterval); }
	virtual void setShotsBaseScatter(double newValue) { updateValue(shotsBaseScatter, newValue, DataIndex::shotsBaseScatter); }
	virtual void setEngagementRange(double newValue) { updateValue(engagementRange, newValue, DataIndex::engagementRange); }
	virtual void setTargetingRange(double newValue) { updateValue(targetingRange, newValue, DataIndex::targetingRange); }
	virtual void setAimMethodRange(double newValue) { updateValue(aimMethodRange, newValue, DataIndex::aimMethodRange); }
	virtual void setAcquisitionRange(double newValue) { updateValue(acquisitionRange, newValue, DataIndex::acquisitionRange); }
	virtual void setRadarState(bool newValue) { updateValue(radarState, newValue, DataIndex::radarState); }

	/********** Getters **********/
	virtual string getCategory() { return category; };
	virtual bool getAlive() { return alive; }
	virtual unsigned char getAlarmState() { return alarmState; }
	virtual bool getHuman() { return human; }
	virtual bool getControlled() { return controlled; }
	virtual unsigned char getCoalition() { return coalition; }
	virtual unsigned char getCountry() { return country; }
	virtual string getName() { return name; }
	virtual string getCallsign() { return callsign; }
	virtual string getUnitName() { return unitName; }
	virtual string getGroupName() { return groupName; }
	virtual unsigned char getState() { return state; }
	virtual string getTask() { return task; }
	virtual bool getHasTask() { return hasTask; }
	virtual Coords getPosition() { return position; }
	virtual double getSpeed() { return speed; }
	virtual double getHorizontalVelocity() { return horizontalVelocity; }
	virtual double getVerticalVelocity() { return verticalVelocity; }
	virtual double getHeading() { return heading; }
	virtual double getTrack() { return track; }
	virtual bool getIsActiveTanker() { return isActiveTanker; }
	virtual bool getIsActiveAWACS() { return isActiveAWACS; }
	virtual bool getOnOff() { return onOff; };
	virtual bool getFollowRoads() { return followRoads; };
	virtual unsigned short getFuel() { return fuel; }
	virtual double getDesiredSpeed() { return desiredSpeed; };
	virtual bool getDesiredSpeedType() { return desiredSpeedType; };
	virtual double getDesiredAltitude() { return desiredAltitude; };
	virtual bool getDesiredAltitudeType() { return desiredAltitudeType; };
	virtual unsigned int getLeaderID() { return leaderID; }
	virtual Offset getFormationOffset() { return formationOffset; }
	virtual unsigned int getTargetID() { return targetID; }
	virtual Coords getTargetPosition() { return targetPosition; }
	virtual unsigned char getROE() { return ROE; }
	virtual unsigned char getReactionToThreat() { return reactionToThreat; }
	virtual unsigned char getEmissionsCountermeasures() { return emissionsCountermeasures; };
	virtual DataTypes::TACAN getTACAN() { return TACAN; }
	virtual DataTypes::Radio getRadio() { return radio; }
	virtual DataTypes::GeneralSettings getGeneralSettings() { return generalSettings; }
	virtual vector<DataTypes::Ammo> getAmmo() { return ammo; }
	virtual vector<DataTypes::Contact> getContacts() { return contacts; }
	virtual list<Coords> getActivePath() { return activePath; }
	virtual bool getIsLeader() { return isLeader; }
	virtual unsigned char getOperateAs() { return operateAs;  }
	virtual unsigned char getShotsScatter() { return shotsScatter; }
	virtual unsigned char getShotsIntensity() { return shotsIntensity; }
	virtual unsigned char getHealth() { return health; }
	virtual double getRacetrackLength() { return racetrackLength; }
	virtual Coords getRacetrackAnchor() { return racetrackAnchor; }
	virtual double getRacetrackBearing() { return racetrackBearing; }
	virtual double getTimeToNextTasking() { return timeToNextTasking; }
	virtual double getBarrelHeight() { return barrelHeight; }
	virtual double getMuzzleVelocity() { return muzzleVelocity; }
	virtual double getAimTime() { return aimTime; }
	virtual unsigned int getShotsToFire() { return shotsToFire; }
	virtual double getShotsBaseInterval() { return shotsBaseInterval; }
	virtual double getShotsBaseScatter() { return shotsBaseScatter; }
	virtual double getEngagementRange() { return engagementRange; }
	virtual double getTargetingRange() { return targetingRange; }
	virtual double getAimMethodRange() { return aimMethodRange; }
	virtual double getAcquisitionRange() { return acquisitionRange; }
	virtual bool getRadarState() { return radarState; }

protected:
	unsigned int ID;

	string category;
	bool alive = false;
	bool human = false;
	bool controlled = false;
	unsigned char coalition = NULL;
	unsigned char country = NULL;
	string name = "";
	string unitName = "";
	string callsign = "";
	string groupName = "";
	unsigned char state = State::NONE;
	unsigned char alarmState = AlarmState::AUTO;
	bool radarState = false;
	string task = "";
	bool hasTask = false;
	Coords position = Coords(NULL);
	double speed = NULL;
	double horizontalVelocity = NULL;
	double verticalVelocity = NULL;
	double heading = NULL;
	double track = NULL;
	bool isActiveTanker = false;
	bool isActiveAWACS = false;
	bool onOff = true;
	bool followRoads = false;
	unsigned short fuel = 0;
	double desiredSpeed = 0;
	bool desiredSpeedType = 0;	/* CAS */
	double desiredAltitude = 1;
	bool desiredAltitudeType = 0; /* ASL */
	unsigned int leaderID = NULL;
	double racetrackLength = NULL;
	Coords racetrackAnchor = Coords(NULL);
	double racetrackBearing = NULL;
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
	bool isLeader = false;
	unsigned char operateAs = 2;
	Coords activeDestination = Coords(NULL);
	unsigned char shotsScatter = 2;
	unsigned char shotsIntensity = 2;
	unsigned char health = 100;
	double timeToNextTasking = 0;
	double barrelHeight = 0; 
	double muzzleVelocity = 0; 
	double aimTime = 0;
	unsigned int shotsToFire = 0;
	double shotsBaseInterval = 0;
	double shotsBaseScatter = 0; 
	double engagementRange = 0;
	double targetingRange = 0;
	double aimMethodRange = 0; 
	double acquisitionRange = 0; 

	/********** Other **********/
	unsigned int taskCheckCounter = 0;
	Unit* missOnPurposeTarget = nullptr;
	bool hasTaskAssigned = false;
	double initialFuel = 0;
	map<unsigned char, unsigned long long> updateTimeMap;
	unsigned long long lastLoopTime = 0;
	bool enableTaskFailedCheck = false;
	unsigned long nextTaskingMilliseconds = 0;
	unsigned int totalShellsFired = 0;
	unsigned int shellsFiredAtTasking = 0;
	unsigned int oldAmmo = 0;

	/********** Private methods **********/
	virtual void AIloop() = 0;

	void appendString(stringstream& ss, const unsigned char& datumIndex, const string& datumValue) {
		const unsigned short size = static_cast<unsigned short>(datumValue.size());
		ss.write((const char*)&datumIndex, sizeof(unsigned char));
		ss.write((const char*)&size, sizeof(unsigned short));
		ss << datumValue;
	}

	/********** Template methods **********/
	template <typename T>
	void updateValue(T& value, T& newValue, unsigned char datumIndex)
	{
		if (newValue != value)
		{
			triggerUpdate(datumIndex);
			value = newValue;
		}
	}

	template <typename T>
	void appendNumeric(stringstream& ss, const unsigned char& datumIndex, T& datumValue) {
		ss.write((const char*)&datumIndex, sizeof(unsigned char));
		ss.write((const char*)&datumValue, sizeof(T));
	}

	template <typename T>
	void appendVector(stringstream& ss, const unsigned char& datumIndex, vector<T>& datumValue) {
		const unsigned short size = static_cast<unsigned short>(datumValue.size());
		ss.write((const char*)&datumIndex, sizeof(unsigned char));
		ss.write((const char*)&size, sizeof(unsigned short));

		for (auto& el : datumValue)
			ss.write((const char*)&el, sizeof(T));
	}

	template <typename T>
	void appendList(stringstream& ss, const unsigned char& datumIndex, list<T>& datumValue) {
		const unsigned short size = static_cast<unsigned short>(datumValue.size());;
		ss.write((const char*)&datumIndex, sizeof(unsigned char));
		ss.write((const char*)&size, sizeof(unsigned short));

		for (auto& el: datumValue)
			ss.write((const char*)&el, sizeof(T));
	}
};

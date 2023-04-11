#include "unit.h"
#include "utils.h"
#include "logger.h"
#include "commands.h"
#include "scheduler.h"
#include "defines.h"
#include "unitsManager.h"

#include <chrono>
using namespace std::chrono;

#include <GeographicLib/Geodesic.hpp>
using namespace GeographicLib;

extern Scheduler* scheduler;
extern UnitsManager* unitsManager;

Unit::Unit(json::value json, int ID) :
	ID(ID)
{
	log("Creating unit with ID: " + to_string(ID));
}

Unit::~Unit()
{

}

void Unit::addMeasure(wstring key, json::value value)
{
	milliseconds ms = duration_cast<milliseconds>(system_clock::now().time_since_epoch());
	if (measures.find(key) == measures.end())
		measures[key] = new Measure(value, ms.count());
	else
	{
		if (measures[key]->getValue() != value)
		{
			measures[key]->setValue(value);
			measures[key]->setTime(ms.count());
		}
	}
}

void Unit::updateExportData(json::value json)
{
	/* Compute speed (loGetWorldObjects does not provide speed, we compute it for better performance instead of relying on many lua calls) */
	if (oldPosition != NULL)
	{
		double dist = 0;
		Geodesic::WGS84().Inverse(latitude, longitude, oldPosition.lat, oldPosition.lng, dist);
		setSpeed(getSpeed() * 0.95 + (dist / UPDATE_TIME_INTERVAL) * 0.05);
	}
	oldPosition = Coords(latitude, longitude, altitude);

	if (json.has_string_field(L"Name"))
		setName(json[L"Name"].as_string());
	if (json.has_string_field(L"UnitName"))
		setUnitName(json[L"UnitName"].as_string());
	if (json.has_string_field(L"GroupName"))
		setGroupName(json[L"GroupName"].as_string());
	if (json.has_object_field(L"Type"))
		setType(json[L"Type"]);
	if (json.has_number_field(L"Country"))
		setCountry(json[L"Country"].as_number().to_int32());
	if (json.has_number_field(L"CoalitionID"))
		setCoalitionID(json[L"CoalitionID"].as_number().to_int32());
	if (json.has_object_field(L"LatLongAlt"))
	{
		setLatitude(json[L"LatLongAlt"][L"Lat"].as_number().to_double());
		setLongitude(json[L"LatLongAlt"][L"Long"].as_number().to_double());
		setAltitude(json[L"LatLongAlt"][L"Alt"].as_number().to_double());
	}
	if (json.has_number_field(L"Heading"))
		setHeading(json[L"Heading"].as_number().to_double());
	if (json.has_object_field(L"Flags"))
		setFlags(json[L"Flags"]);

	/* All units which contain the name "Olympus" are automatically under AI control */
	/* TODO: I don't really like using this method */
	setAI(getUnitName().find(L"Olympus") != wstring::npos);

	/* If the unit is alive and it is not a human, run the AI Loop that performs the requested commands and instructions (moving, attacking, etc) */
	if (getAI() && getAlive() && getFlags()[L"Human"].as_bool() == false)
		AIloop();
}

void Unit::updateMissionData(json::value json)
{
	if (json.has_number_field(L"fuel"))
		setFuel(int(json[L"fuel"].as_number().to_double() * 100));
	if (json.has_object_field(L"ammo"))
		setAmmo(json[L"ammo"]);
	if (json.has_object_field(L"targets"))
		setTargets(json[L"targets"]);
	if (json.has_boolean_field(L"hasTask"))
		setHasTask(json[L"hasTask"].as_bool());
}

json::value Unit::getData(long long time)
{
	auto json = json::value::object();

	/********** Base data **********/
	json[L"baseData"] = json::value::object();
	for (auto key : { L"AI", L"name", L"unitName", L"groupName", L"alive", L"category"})
	{
		if (measures.find(key) != measures.end() && measures[key]->getTime() > time)
			json[L"baseData"][key] = measures[key]->getValue();
	}

	/********** Flight data **********/
	json[L"flightData"] = json::value::object();
	for (auto key : { L"latitude", L"longitude", L"altitude", L"speed", L"heading"})
	{
		if (measures.find(key) != measures.end() && measures[key]->getTime() > time)
			json[L"flightData"][key] = measures[key]->getValue();
	}

	/********** Mission data **********/
	json[L"missionData"] = json::value::object();
	for (auto key : { L"fuel", L"ammo", L"targets", L"hasTask", L"coalition", L"flags"})
	{
		if (measures.find(key) != measures.end() && measures[key]->getTime() > time)
			json[L"missionData"][key] = measures[key]->getValue();
	}

	/********** Formation data **********/
	json[L"formationData"] = json::value::object();
	for (auto key : { L"isLeader", L"isWingman", L"formation", L"wingmenIDs", L"leaderID" })
	{
		if (measures.find(key) != measures.end() && measures[key]->getTime() > time)
			json[L"missionData"][key] = measures[key]->getValue();
	}

	/********** Task data **********/
	json[L"taskData"] = json::value::object();
	for (auto key : { L"currentTask", L"targetSpeed", L"targetAltitude", L"activePath"})
	{
		if (measures.find(key) != measures.end() && measures[key]->getTime() > time)
			json[L"taskData"][key] = measures[key]->getValue();
	}

	/********** Options data **********/
	json[L"optionsData"] = json::value::object();
	for (auto key : { L"ROE", L"reactionToThreat" })
	{
		if (measures.find(key) != measures.end() && measures[key]->getTime() > time)
			json[L"optionsData"][key] = measures[key]->getValue();
	}

	return json;
}

void Unit::setActivePath(list<Coords> newPath)
{
	if (state != State::WINGMAN && state != State::FOLLOW)
	{
		activePath = newPath;
		resetActiveDestination();
	}

	auto path = json::value::object();
	if (activePath.size() > 0) {
		int count = 1;
		for (auto& destination : activePath)
		{
			auto json = json::value::object();
			json[L"lat"] = destination.lat;
			json[L"lng"] = destination.lng;
			json[L"alt"] = destination.alt;
			path[to_wstring(count++)] = json;
		}
	}
	addMeasure(L"activePath", path); 
}

void Unit::clearActivePath()
{
	list<Coords> newPath;
	setActivePath(newPath);
}

void Unit::pushActivePathFront(Coords newActivePathFront)
{
	list<Coords> path = activePath;
	path.push_front(newActivePathFront);
	setActivePath(path);
}

void Unit::pushActivePathBack(Coords newActivePathBack)
{
	list<Coords> path = activePath;
	path.push_back(newActivePathBack);
	setActivePath(path);
}

void Unit::popActivePathFront()
{
	list<Coords> path = activePath;
	path.pop_front();
	setActivePath(path);
}

void Unit::setCoalitionID(int newCoalitionID) 
{ 
	if (newCoalitionID == 0)
		coalition = L"neutral";
	else if (newCoalitionID == 1)
		coalition = L"red";
	else
		coalition = L"blue";
	addMeasure(L"coalition", json::value(coalition));
} 

int Unit::getCoalitionID()
{
	if (coalition == L"neutral")
		return 0;
	else if (coalition == L"red")
		return 1;
	else
		return 2;
}

void Unit::setLeader(Unit* newLeader) 
{ 
	leader = newLeader; 
	if (leader != nullptr)
		addMeasure(L"leaderID", json::value(leader->getID()));
} 

void Unit::setWingmen(vector<Unit*> newWingmen) {
	wingmen = newWingmen; 
	auto wingmenIDs = json::value::object();
	int i = 0;
	for (auto itr = wingmen.begin(); itr != wingmen.end(); itr++)
		wingmenIDs[i++] = (*itr)->getID();
	addMeasure(L"wingmen", wingmenIDs);
} 

wstring Unit::getTargetName()
{
	if (isTargetAlive())
	{
		Unit* target = unitsManager->getUnit(targetID);
		if (target != nullptr)
			return target->getUnitName();
	}
	return L"";
}

bool Unit::isTargetAlive()
{
	if (targetID == NULL)
		return false;

	Unit* target = unitsManager->getUnit(targetID);
	if (target != nullptr)
		return target->alive;
	else
		return false;
}

void Unit::resetActiveDestination()
{
	activeDestination = Coords(NULL);
}

void Unit::resetTask()
{
	Command* command = dynamic_cast<Command*>(new ResetTask(ID));
	scheduler->appendCommand(command);
}

void Unit::setIsLeader(bool newIsLeader) {
	isLeader = newIsLeader;
	if (!isLeader) {
		for (auto wingman : wingmen)
		{
			wingman->setFormation(L"");
			wingman->setIsWingman(false);
			wingman->setLeader(nullptr);
		}
	}
	addMeasure(L"isLeader", json::value(newIsLeader));
}

void Unit::setIsWingman(bool newIsWingman)
{
	isWingman = newIsWingman;
	if (isWingman)
		setState(State::WINGMAN);
	else
		setState(State::IDLE);

	addMeasure(L"isWingman", json::value(isWingman));
}

void Unit::setFormationOffset(Offset newFormationOffset)
{
	formationOffset = newFormationOffset;
	resetTask();
}

void Unit::setROE(wstring newROE) {
	ROE = newROE;
	int ROEEnum;
	if (newROE.compare(L"Free") == 0)
		ROEEnum = ROE::WEAPON_FREE;
	else if (newROE.compare(L"Designated free") == 0)
		ROEEnum = ROE::OPEN_FIRE_WEAPON_FREE;
	else if (newROE.compare(L"Designated") == 0)
		ROEEnum = ROE::OPEN_FIRE;
	else if (newROE.compare(L"Return") == 0)
		ROEEnum = ROE::RETURN_FIRE;
	else if (newROE.compare(L"Hold") == 0)
		ROEEnum = ROE::WEAPON_HOLD;
	else
		return;
	Command* command = dynamic_cast<Command*>(new SetOption(ID, SetCommandType::ROE, ROEEnum));
	scheduler->appendCommand(command);
	addMeasure(L"ROE", json::value(newROE));
}

void Unit::setReactionToThreat(wstring newReactionToThreat) {
	reactionToThreat = newReactionToThreat;
	int reactionToThreatEnum;
	if (newReactionToThreat.compare(L"None") == 0)
		reactionToThreatEnum = ReactionToThreat::NO_REACTION;
	else if (newReactionToThreat.compare(L"Passive") == 0)
		reactionToThreatEnum = ReactionToThreat::PASSIVE_DEFENCE;
	else if (newReactionToThreat.compare(L"Evade") == 0)
		reactionToThreatEnum = ReactionToThreat::EVADE_FIRE;
	else if (newReactionToThreat.compare(L"Escape") == 0)
		reactionToThreatEnum = ReactionToThreat::BYPASS_AND_ESCAPE;
	else if (newReactionToThreat.compare(L"Abort") == 0)
		reactionToThreatEnum = ReactionToThreat::ALLOW_ABORT_MISSION;
	else
		return;
	Command* command = dynamic_cast<Command*>(new SetOption(ID, SetCommandType::REACTION_ON_THREAT, reactionToThreatEnum));
	scheduler->appendCommand(command);
	addMeasure(L"reactionToThreat", json::value(newReactionToThreat));
}

void Unit::landAt(Coords loc) {
	clearActivePath();
	pushActivePathBack(loc);
	setState(State::LAND);
}
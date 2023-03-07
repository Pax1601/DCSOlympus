#include "unit.h"
#include "utils.h"
#include "logger.h"
#include "commands.h"
#include "scheduler.h"
#include "defines.h"
#include "unitsManager.h"

#include <GeographicLib/Geodesic.hpp>
using namespace GeographicLib;

extern Scheduler* scheduler;
extern UnitsManager* unitsManager;

Unit::Unit(json::value json, int ID) :
	ID(ID)
{
	log("Creating unit with ID: " + to_string(ID));
	newDataCounter = 1.0 / UPDATE_TIME_INTERVAL > 0? 1.0 / UPDATE_TIME_INTERVAL: 1; // Mark the unit has hasNewData for 1 second
}

Unit::~Unit()
{

}

void Unit::updateExportData(json::value json)
{
	if (newDataCounter > 0)
		newDataCounter--;
	setHasNewData(newDataCounter);

	/* Compute speed (loGetWorldObjects does not provide speed, we compute it for better performance instead of relying on many lua calls) */
	if (oldPosition != NULL)
	{
		double dist = 0;
		Geodesic::WGS84().Inverse(latitude, longitude, oldPosition.lat, oldPosition.lng, dist);
		speed = speed * 0.95 + (dist / UPDATE_TIME_INTERVAL) * 0.05;
	}
	oldPosition = Coords(latitude, longitude, altitude);

	if (json.has_string_field(L"Name"))
		name = json[L"Name"].as_string();
	if (json.has_string_field(L"UnitName"))
		unitName = json[L"UnitName"].as_string();
	if (json.has_string_field(L"GroupName"))
		groupName = json[L"GroupName"].as_string();
	if (json.has_object_field(L"Type"))
		type = json[L"Type"];
	if (json.has_number_field(L"Country"))
		country = json[L"Country"].as_number().to_int32();
	if (json.has_number_field(L"CoalitionID"))
		coalitionID = json[L"CoalitionID"].as_number().to_int32();
	if (json.has_object_field(L"LatLongAlt"))
	{
		latitude = json[L"LatLongAlt"][L"Lat"].as_number().to_double();
		longitude = json[L"LatLongAlt"][L"Long"].as_number().to_double();
		altitude = json[L"LatLongAlt"][L"Alt"].as_number().to_double();
	}
	if (json.has_number_field(L"Heading"))
		heading = json[L"Heading"].as_number().to_double();
	if (json.has_object_field(L"Flags"))
		flags = json[L"Flags"];

	/* All units which contain the name "Olympus" are automatically under AI control */
	/* TODO: I don't really like using this method */
	if (unitName.find(L"Olympus") != wstring::npos)
		AI = true;

	/* If the unit is alive and it is not a human, run the AI Loop that performs the requested commands and instructions (moving, attacking, etc) */
	if (AI && alive && flags[L"Human"].as_bool() == false)
		AIloop();
}

void Unit::updateMissionData(json::value json)
{
	newDataCounter = 1.0 / UPDATE_TIME_INTERVAL > 0 ? 1.0 / UPDATE_TIME_INTERVAL : 1; // Mark the unit has hasNewData for 1 second
	if (json.has_number_field(L"fuel"))
		fuel = int(json[L"fuel"].as_number().to_double() * 100);
	if (json.has_object_field(L"ammo"))
		ammo = json[L"ammo"];
	if (json.has_object_field(L"targets"))
		targets = json[L"targets"];
	if (json.has_boolean_field(L"hasTask"))
		hasTask = json[L"hasTask"].as_bool();
}

json::value Unit::json(bool fullRefresh)
{
	auto json = json::value::object();

	/********** Base data **********/
	json[L"AI"] = AI;
	json[L"name"] = json::value::string(name);
	json[L"unitName"] = json::value::string(unitName);
	json[L"groupName"] = json::value::string(groupName);
	json[L"alive"] = alive;
	json[L"category"] = json::value::string(getCategory());

	/********** Flight data **********/
	json[L"flightData"] = json::value::object();
	json[L"flightData"][L"latitude"] = latitude;
	json[L"flightData"][L"longitude"] = longitude;
	json[L"flightData"][L"altitude"] = altitude;
	json[L"flightData"][L"speed"] = speed;
	json[L"flightData"][L"heading"] = heading;

	if (fullRefresh || getHasNewData())
	{
		/********** Mission data **********/
		json[L"missionData"] = json::value::object();
		json[L"missionData"][L"fuel"] = fuel;
		json[L"missionData"][L"ammo"] = ammo;
		json[L"missionData"][L"targets"] = targets;
		json[L"missionData"][L"hasTask"] = hasTask;
		if (coalitionID == 0)
			json[L"missionData"][L"coalition"] = json::value::string(L"neutral");
		else if (coalitionID == 1)
			json[L"missionData"][L"coalition"] = json::value::string(L"red");
		else
			json[L"missionData"][L"coalition"] = json::value::string(L"blue");
		json[L"missionData"][L"flags"] = flags;

		/********** Formation data **********/
		json[L"formationData"] = json::value::object();
		json[L"formationData"][L"isLeader"] = isLeader;
		json[L"formationData"][L"isWingman"] = isWingman;
		json[L"formationData"][L"formation"] = json::value::string(formation);
		int i = 0;
		for (auto itr = wingmen.begin(); itr != wingmen.end(); itr++)
			json[L"formationData"][L"wingmenIDs"][i++] = (*itr)->getID();

		if (leader != nullptr)
			json[L"formationData"][L"leaderID"] = leader->getID();

		/********** Task data **********/
		json[L"taskData"] = json::value::object();
		json[L"taskData"][L"currentTask"] = json::value::string(getCurrentTask());
		json[L"taskData"][L"targetSpeed"] = getTargetSpeed();
		json[L"taskData"][L"targetAltitude"] = getTargetAltitude();
		/* Send the active path as a json object */
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
		json[L"taskData"][L"activePath"] = path;

		/********** Options data **********/
		json[L"optionsData"] = json::value::object();
		json[L"optionsData"][L"ROE"] = json::value::string(ROE);
		json[L"optionsData"][L"reactionToThreat"] = json::value::string(reactionToThreat);
	}

	return json;
}

void Unit::setPath(list<Coords> path)
{
	if (state != State::WINGMAN && state != State::FOLLOW)
	{
		activePath = path;
		resetActiveDestination();
	}
}

void Unit::setTarget(int newTargetID)
{
	targetID = newTargetID;
}

wstring Unit::getTarget()
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
}

void Unit::setIsWingman(bool newIsWingman)
{
	isWingman = newIsWingman;
	if (isWingman)
		setState(State::WINGMAN);
	else
		setState(State::IDLE);
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
}

void Unit::landAt(Coords loc) {
	activePath.clear();
	activePath.push_back(loc);
	setState(State::LAND);
}
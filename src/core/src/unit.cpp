#include "unit.h"
#include "utils.h"
#include "logger.h"
#include "commands.h"
#include "scheduler.h"
#include "defines.h"
#include "unitsmanager.h"

#include <chrono>
using namespace std::chrono;

#include <GeographicLib/Geodesic.hpp>
using namespace GeographicLib;

extern Scheduler* scheduler;
extern UnitsManager* unitsManager;

Unit::Unit(json::value json, unsigned int ID) :
	ID(ID)
{
	log("Creating unit with ID: " + to_string(ID));
}

Unit::~Unit()
{

}

void Unit::initialize(json::value json)
{
	if (json.has_string_field(L"Name"))
		setName(to_string(json[L"Name"]));
	if (json.has_string_field(L"UnitName"))
		setUnitName(to_string(json[L"UnitName"]));
	if (json.has_string_field(L"GroupName"))
		setGroupName(to_string(json[L"GroupName"]));
	if (json.has_number_field(L"Country"))
		setCountry(json[L"Country"].as_number().to_int32());
	if (json.has_number_field(L"CoalitionID"))
		setCoalition(json[L"CoalitionID"].as_number().to_int32());

	if (json.has_object_field(L"Flags"))
		setHuman(json[L"Flags"][L"Human"].as_bool());

	/* All units which contain the name "Olympus" are automatically under AI control */
	if (getUnitName().find("Olympus") != string::npos)
		setControlled(true);

	updateExportData(json);
	setDefaults();
}

void Unit::setDefaults(bool force)
{
	if (!getControlled()) return;
	if (!unitsManager->isUnitGroupLeader(this)) return;
	if (!(getAlive() || unitsManager->isUnitInGroup(this) && unitsManager->isUnitGroupLeader(this))) return;
	if (getHuman()) return;

	/* Set the default IDLE state */
	setState(State::IDLE);

	/* Set desired altitude to be equal to current altitude so the unit does not climb/descend after spawn */
	setDesiredAltitude(position.alt);

	/* Set the default options */
	setROE(ROE::OPEN_FIRE_WEAPON_FREE, force);
	setReactionToThreat(ReactionToThreat::EVADE_FIRE, force);
	setEmissionsCountermeasures(EmissionCountermeasure::DEFEND, force);
	strcpy_s(TACAN.callsign, 4, "TKR");
	setTACAN(TACAN, force);
	setRadio(radio, force);
	setGeneralSettings(generalSettings, force);
}

void Unit::runAILoop() {
	/* If the unit is alive, controlled and it is not a human, run the AI Loop that performs the requested commands and instructions (moving, attacking, etc) */
	if (!getControlled()) return;
	if (!unitsManager->isUnitGroupLeader(this)) return;
	if (human) return;

	/* Keep running the AI loop even if the unit is dead if it is the leader of a group which has other members in it */
	const bool isUnitAlive = getAlive();
	const bool isUnitLeaderOfAGroupWithOtherUnits = unitsManager->isUnitInGroup(this) && unitsManager->isUnitGroupLeader(this);
	if (!(isUnitAlive || isUnitLeaderOfAGroupWithOtherUnits)) return;

	if (checkTaskFailed() && state != State::IDLE && State::LAND)
		setState(State::IDLE);

	AIloop();
}

void Unit::updateExportData(json::value json, double dt)
{
	Coords newPosition = Coords(NULL);
	double newHeading = 0;
	double newSpeed = 0;

	if (json.has_object_field(L"LatLongAlt"))
	{
		setPosition({
			json[L"LatLongAlt"][L"Lat"].as_number().to_double(),
			json[L"LatLongAlt"][L"Long"].as_number().to_double(),
			json[L"LatLongAlt"][L"Alt"].as_number().to_double()
			});
	}
	if (json.has_number_field(L"Heading"))
		setHeading(json[L"Heading"].as_number().to_double());

	/* Compute speed (loGetWorldObjects does not provide speed, we compute it for better performance instead of relying on many lua calls) */
	if (oldPosition != NULL)
	{
		double dist = 0;
		Geodesic::WGS84().Inverse(getPosition().lat, getPosition().lng, oldPosition.lat, oldPosition.lng, dist);
		if (dt > 0)
			setSpeed(getSpeed() * 0.95 + (dist / dt) * 0.05);
	}

	oldPosition = position;
}

void Unit::updateMissionData(json::value json)
{
	if (json.has_number_field(L"fuel")) {
		setFuel(short(json[L"fuel"].as_number().to_double() * 100));
	}
	
	if (json.has_object_field(L"ammo")) {	
		vector<DataTypes::Ammo> ammo;
		for (auto const& el : json[L"ammo"].as_object()) {
			DataTypes::Ammo ammoItem;
			auto ammoJson = el.second;
			ammoItem.quantity = ammoJson[L"count"].as_number().to_uint32();
			string name = to_string(ammoJson[L"desc"][L"displayName"].as_string()).substr(0, sizeof(ammoItem.name) - 1);
			strcpy_s(ammoItem.name, sizeof(ammoItem.name), name.c_str());

			if (ammoJson[L"desc"].has_number_field(L"guidance"))
				ammoItem.guidance = ammoJson[L"desc"][L"guidance"].as_number().to_uint32();

			if (ammoJson[L"desc"].has_number_field(L"category"))
				ammoItem.category = ammoJson[L"desc"][L"category"].as_number().to_uint32();

			if (ammoJson[L"desc"].has_number_field(L"missileCategory"))
				ammoItem.missileCategory = ammoJson[L"desc"][L"missileCategory"].as_number().to_uint32();
			ammo.push_back(ammoItem);
		}
		setAmmo(ammo);
	}
		
	if (json.has_object_field(L"contacts")) {
		vector<DataTypes::Contact> contacts;
		for (auto const& el : json[L"contacts"].as_object()) {
			DataTypes::Contact contactItem;
			auto contactJson = el.second;
			contactItem.ID = contactJson[L"object"][L"id_"].as_number().to_uint32();
	
			string detectionMethod = to_string(contactJson[L"detectionMethod"]);
			if		(detectionMethod.compare("VISUAL") == 0)	contactItem.detectionMethod = 1;
			else if (detectionMethod.compare("OPTIC") == 0)		contactItem.detectionMethod = 2;
			else if (detectionMethod.compare("RADAR") == 0)		contactItem.detectionMethod = 4;
			else if (detectionMethod.compare("IRST") == 0)		contactItem.detectionMethod = 8;
			else if (detectionMethod.compare("RWR") == 0)		contactItem.detectionMethod = 16;
			else if (detectionMethod.compare("DLINK") == 0)		contactItem.detectionMethod = 32;
			contacts.push_back(contactItem);
		}
		setContacts(contacts);
	}

	if (json.has_boolean_field(L"hasTask"))
		setHasTask(json[L"hasTask"].as_bool());
}

bool Unit::checkFreshness(unsigned char datumIndex, unsigned long long time) {
	auto it = updateTimeMap.find(datumIndex);
	if (it == updateTimeMap.end())
		return false;
	else
		return it->second > time;
}

bool Unit::hasFreshData(unsigned long long time) {
	for (auto it : updateTimeMap)
		if (it.second > time)
			return true;
	return false;
}

void Unit::getData(stringstream& ss, unsigned long long time)
{
	Unit* leader = this;
	if (unitsManager->isUnitInGroup(this) && !unitsManager->isUnitGroupLeader(this))
		leader = unitsManager->getGroupLeader(this);

	if (!leader->hasFreshData(time)) return;

	const unsigned char endOfData = DataIndex::endOfData;
	ss.write((const char*)&ID, sizeof(ID));
	for (unsigned char datumIndex = DataIndex::startOfData + 1; datumIndex < DataIndex::lastIndex; datumIndex++)
	{
		/* When units are in a group, most data comes from the group leader */
		switch (datumIndex) {
		case DataIndex::category:					if (checkFreshness(datumIndex, time)) appendString(ss, datumIndex, category); break;
		case DataIndex::alive:						if (checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, alive); break;
		case DataIndex::human:						if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->human); break;
		case DataIndex::controlled:					if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->controlled); break;
		case DataIndex::coalition:					if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->coalition); break;
		case DataIndex::country:					if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->country); break;
		case DataIndex::name:						if (checkFreshness(datumIndex, time)) appendString(ss, datumIndex, name); break;
		case DataIndex::unitName:					if (checkFreshness(datumIndex, time)) appendString(ss, datumIndex, unitName); break;
		case DataIndex::groupName:					if (leader->checkFreshness(datumIndex, time)) appendString(ss, datumIndex, leader->groupName); break;
		case DataIndex::state:						if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->state); break;
		case DataIndex::task:						if (leader->checkFreshness(datumIndex, time)) appendString(ss, datumIndex, leader->task); break;
		case DataIndex::hasTask:					if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->hasTask); break;
		case DataIndex::position:					if (checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, position); break;
		case DataIndex::speed:						if (checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, speed); break;
		case DataIndex::heading:					if (checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, heading); break;
		case DataIndex::isTanker:					if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->isTanker); break;
		case DataIndex::isAWACS:					if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->isAWACS); break;
		case DataIndex::onOff:						if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->onOff); break;
		case DataIndex::followRoads:				if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->followRoads); break;
		case DataIndex::fuel:						if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, fuel); break;
		case DataIndex::desiredSpeed:				if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->desiredSpeed); break;
		case DataIndex::desiredSpeedType:			if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->desiredSpeedType); break;
		case DataIndex::desiredAltitude:			if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->desiredAltitude); break;
		case DataIndex::desiredAltitudeType:		if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->desiredAltitudeType); break;
		case DataIndex::leaderID:					if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->leaderID); break;
		case DataIndex::formationOffset:			if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->formationOffset); break;
		case DataIndex::targetID:					if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->targetID); break;
		case DataIndex::targetPosition:				if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->targetPosition); break;
		case DataIndex::ROE:						if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->ROE); break;
		case DataIndex::reactionToThreat:			if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->reactionToThreat); break;
		case DataIndex::emissionsCountermeasures:	if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->emissionsCountermeasures); break;
		case DataIndex::TACAN:						if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->TACAN); break;
		case DataIndex::radio:						if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->radio); break;
		case DataIndex::generalSettings:			if (leader->checkFreshness(datumIndex, time)) appendNumeric(ss, datumIndex, leader->generalSettings); break;
		case DataIndex::ammo:						if (checkFreshness(datumIndex, time)) appendVector(ss, datumIndex, ammo); break;
		case DataIndex::contacts:					if (checkFreshness(datumIndex, time)) appendVector(ss, datumIndex, contacts); break;
		case DataIndex::activePath:					if (leader->checkFreshness(datumIndex, time)) appendList(ss, datumIndex, leader->activePath); break;
		}
	}
	ss.write((const char*)&endOfData, sizeof(endOfData));
}

void Unit::setAmmo(vector<DataTypes::Ammo> newValue) 
{ 
	if (ammo.size() == newValue.size()) {
		bool equal = true;
		for (int i = 0; i < ammo.size(); i++) {
			if (ammo.at(i) != newValue.at(i))
			{
				equal = false;
				break;
			}
		}
		if (equal)
			return;
	}
	ammo = newValue;
	triggerUpdate(DataIndex::ammo);
}

void Unit::setContacts(vector<DataTypes::Contact> newValue) 
{ 
	if (contacts.size() == newValue.size()) {
		bool equal = true;
		for (int i = 0; i < contacts.size(); i++) {
			if (contacts.at(i) != newValue.at(i))
			{
				equal = false;
				break;
			}
		}
		if (equal)
			return;
	}
	contacts = newValue;
	triggerUpdate(DataIndex::contacts);
}

void Unit::setActivePath(list<Coords> newPath)
{
	activePath = newPath;
	resetActiveDestination();
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

string Unit::getTargetName()
{
	if (isTargetAlive())
	{
		Unit* target = unitsManager->getUnit(targetID);
		if (target != nullptr)
			return target->getUnitName();
	}
	return "";
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

string Unit::getLeaderName()
{
	if (isLeaderAlive())
	{
		Unit* leader = unitsManager->getUnit(leaderID);
		if (leader != nullptr)
			return leader->getUnitName();
	}
	return "";
}

bool Unit::isLeaderAlive()
{
	if (leaderID == NULL)
		return false;

	Unit* leader = unitsManager->getUnit(leaderID);
	if (leader != nullptr)
		return leader->alive;
	else
		return false;
}

void Unit::resetActiveDestination()
{
	activeDestination = Coords(NULL);
}

void Unit::resetTask()
{
	Command* command = dynamic_cast<Command*>(new ResetTask(groupName));
	scheduler->appendCommand(command);
	setHasTask(false);
	resetTaskFailedCounter();
}

void Unit::setFormationOffset(Offset newFormationOffset)
{
	formationOffset = newFormationOffset;
	resetTask();

	triggerUpdate(DataIndex::formationOffset);
}

void Unit::setROE(unsigned char newROE, bool force)
{
	if (ROE != newROE || force) {
		ROE = newROE;
		Command* command = dynamic_cast<Command*>(new SetOption(groupName, SetCommandType::ROE, static_cast<unsigned int>(ROE)));
		scheduler->appendCommand(command);

		triggerUpdate(DataIndex::ROE);
	}
}

void Unit::setReactionToThreat(unsigned char newReactionToThreat, bool force)
{
	if (reactionToThreat != newReactionToThreat || force) {
		reactionToThreat = newReactionToThreat;

		Command* command = dynamic_cast<Command*>(new SetOption(groupName, SetCommandType::REACTION_ON_THREAT, static_cast<unsigned int>(reactionToThreat)));
		scheduler->appendCommand(command);

		triggerUpdate(DataIndex::reactionToThreat);
	}
}

void Unit::setEmissionsCountermeasures(unsigned char newEmissionsCountermeasures, bool force)
{
	if (emissionsCountermeasures != newEmissionsCountermeasures || force) {
		emissionsCountermeasures = newEmissionsCountermeasures;

		unsigned int radarEnum;
		unsigned int flareEnum;
		unsigned int ECMEnum;
		if (emissionsCountermeasures == EmissionCountermeasure::SILENT)
		{
			radarEnum = RadarUse::NEVER;
			flareEnum = FlareUse::NEVER;
			ECMEnum = ECMUse::NEVER_USE;
		}
		else if (emissionsCountermeasures == EmissionCountermeasure::ATTACK)
		{
			radarEnum = RadarUse::FOR_ATTACK_ONLY;
			flareEnum = FlareUse::AGAINST_FIRED_MISSILE;
			ECMEnum = ECMUse::USE_IF_ONLY_LOCK_BY_RADAR;
		}
		else if (emissionsCountermeasures == EmissionCountermeasure::DEFEND)
		{
			radarEnum = RadarUse::FOR_SEARCH_IF_REQUIRED;
			flareEnum = FlareUse::WHEN_FLYING_IN_SAM_WEZ;
			ECMEnum = ECMUse::USE_IF_DETECTED_LOCK_BY_RADAR;
		}
		else if (emissionsCountermeasures == EmissionCountermeasure::FREE)
		{
			radarEnum = RadarUse::FOR_CONTINUOUS_SEARCH;
			flareEnum = FlareUse::WHEN_FLYING_NEAR_ENEMIES;
			ECMEnum = ECMUse::ALWAYS_USE;
		}
		else
			return;

		Command* command;

		command = dynamic_cast<Command*>(new SetOption(groupName, SetCommandType::RADAR_USING, radarEnum));
		scheduler->appendCommand(command);

		command = dynamic_cast<Command*>(new SetOption(groupName, SetCommandType::FLARE_USING, flareEnum));
		scheduler->appendCommand(command);

		command = dynamic_cast<Command*>(new SetOption(groupName, SetCommandType::ECM_USING, ECMEnum));
		scheduler->appendCommand(command);

		triggerUpdate(DataIndex::emissionsCountermeasures);
	}
}

void Unit::landAt(Coords loc)
{
	clearActivePath();
	pushActivePathBack(loc);
	setState(State::LAND);
}

void Unit::setIsTanker(bool newIsTanker)
{
	if (isTanker != newIsTanker) {
		isTanker = newIsTanker;
		resetTask();

		triggerUpdate(DataIndex::isTanker);
	}
}

void Unit::setIsAWACS(bool newIsAWACS)
{
	if (isAWACS != newIsAWACS) {
		isAWACS = newIsAWACS;
		resetTask();

		triggerUpdate(DataIndex::isAWACS);
	}
}

void Unit::setTACAN(DataTypes::TACAN newTACAN, bool force)
{
	if (TACAN != newTACAN || force)
	{
		TACAN = newTACAN;
		if (TACAN.isOn) {
			std::ostringstream commandSS;
			commandSS << "{"
				<< "id = 'ActivateBeacon',"
				<< "params = {"
				<< "type = " << ((TACAN.XY == 'X' == 0) ? 4 : 5) << ","
				<< "system = 3,"
				<< "name = \"Olympus_TACAN\","
				<< "callsign = \"" << TACAN.callsign << "\", "
				<< "frequency = " << TACANChannelToFrequency(TACAN.channel, TACAN.XY) << ","
				<< "}"
				<< "}";
			Command* command = dynamic_cast<Command*>(new SetCommand(groupName, commandSS.str()));
			scheduler->appendCommand(command);
		}
		else {
			std::ostringstream commandSS;
			commandSS << "{"
				<< "id = 'DeactivateBeacon',"
				<< "params = {"
				<< "}"
				<< "}";
			Command* command = dynamic_cast<Command*>(new SetCommand(groupName, commandSS.str()));
			scheduler->appendCommand(command);
		}

		triggerUpdate(DataIndex::TACAN);
	}
}

void Unit::setRadio(DataTypes::Radio newRadio, bool force)
{
	if (radio != newRadio || force)
	{
		radio = newRadio;

		std::ostringstream commandSS;
		Command* command;

		commandSS << "{"
			<< "id = 'SetFrequency',"
			<< "params = {"
			<< "modulation = 0,"	// TODO Allow selection
			<< "frequency = " << radio.frequency << ","
			<< "}"
			<< "}";
		command = dynamic_cast<Command*>(new SetCommand(groupName, commandSS.str()));
		scheduler->appendCommand(command);

		// Clear the stringstream
		commandSS.str(string(""));

		commandSS << "{"
			<< "id = 'SetCallsign',"
			<< "params = {"
			<< "callname = " << radio.callsign << ","
			<< "number = " << radio.callsignNumber << ","
			<< "}"
			<< "}";
		command = dynamic_cast<Command*>(new SetCommand(groupName, commandSS.str()));
		scheduler->appendCommand(command);

		triggerUpdate(DataIndex::radio);
	}
}

void Unit::setGeneralSettings(DataTypes::GeneralSettings newGeneralSettings, bool force)
{
	if (generalSettings != newGeneralSettings)
	{
		generalSettings = newGeneralSettings;

		Command* command;
		command = dynamic_cast<Command*>(new SetOption(groupName, SetCommandType::PROHIBIT_AA, generalSettings.prohibitAA));
		scheduler->appendCommand(command);
		command = dynamic_cast<Command*>(new SetOption(groupName, SetCommandType::PROHIBIT_AG, generalSettings.prohibitAG));
		scheduler->appendCommand(command);
		command = dynamic_cast<Command*>(new SetOption(groupName, SetCommandType::PROHIBIT_JETT, generalSettings.prohibitJettison));
		scheduler->appendCommand(command);
		command = dynamic_cast<Command*>(new SetOption(groupName, SetCommandType::PROHIBIT_AB, generalSettings.prohibitAfterburner));
		scheduler->appendCommand(command);
		command = dynamic_cast<Command*>(new SetOption(groupName, SetCommandType::ENGAGE_AIR_WEAPONS, !generalSettings.prohibitAirWpn));
		scheduler->appendCommand(command);

		triggerUpdate(DataIndex::generalSettings);
	}
}

void Unit::setDesiredSpeed(double newDesiredSpeed)
{
	desiredSpeed = newDesiredSpeed;
	if (state == State::IDLE)
		resetTask();
	else
		goToDestination();		/* Send the command to reach the destination */

	triggerUpdate(DataIndex::desiredSpeed);
}

void Unit::setDesiredAltitude(double newDesiredAltitude)
{
	desiredAltitude = newDesiredAltitude;
	if (state == State::IDLE)
		resetTask();
	else
		goToDestination();		/* Send the command to reach the destination */

	triggerUpdate(DataIndex::desiredAltitude);
}

void Unit::setDesiredSpeedType(string newDesiredSpeedType)
{
	desiredSpeedType = newDesiredSpeedType.compare("GS") == 0;
	if (state == State::IDLE)
		resetTask();
	else
		goToDestination();		/* Send the command to reach the destination */

	triggerUpdate(DataIndex::desiredSpeedType);
}

void Unit::setDesiredAltitudeType(string newDesiredAltitudeType)
{
	desiredAltitudeType = newDesiredAltitudeType.compare("AGL") == 0;
	if (state == State::IDLE)
		resetTask();
	else
		goToDestination();		/* Send the command to reach the destination */

	triggerUpdate(DataIndex::desiredAltitudeType);
}

void Unit::goToDestination(string enrouteTask)
{
	if (activeDestination != NULL)
	{
		Command* command = dynamic_cast<Command*>(new Move(groupName, activeDestination, getDesiredSpeed(), getDesiredSpeedType() ? "GS" : "CAS", getDesiredAltitude(), getDesiredAltitudeType() ? "AGL" : "ASL", enrouteTask, getCategory()));
		scheduler->appendCommand(command);
		setHasTask(true);
	}
}

bool Unit::isDestinationReached(double threshold)
{
	if (activeDestination != NULL)
	{
		/* Check if any unit in the group has reached the point */
		for (auto const& p : unitsManager->getGroupMembers(groupName))
		{
			double dist = 0;
			Geodesic::WGS84().Inverse(p->getPosition().lat, p->getPosition().lng, activeDestination.lat, activeDestination.lng, dist);
			if (dist < threshold)
			{
				log(unitName + " destination reached");
				return true;
			}
			else {
				return false;
			}
		}
		return false;
	}
	else
		return true;
}

bool Unit::setActiveDestination()
{
	if (activePath.size() > 0)
	{
		activeDestination = activePath.front();
		log(unitName + " active destination set to queue front");

		triggerUpdate(DataIndex::activePath);
		return true;
	}
	else
	{
		activeDestination = Coords(0);
		log(unitName + " active destination set to NULL");

		triggerUpdate(DataIndex::activePath);
		return false;
	}
}

bool Unit::updateActivePath(bool looping)
{
	if (activePath.size() > 0)
	{
		/* Push the next destination in the queue to the front */
		if (looping)
			pushActivePathBack(activePath.front());
		popActivePathFront();
		log(unitName + " active path front popped");
		return true;
	}
	else {
		return false;
	}
}

bool Unit::checkTaskFailed()
{
	if (getHasTask())
		return false;
	else {
		if (taskCheckCounter > 0)
			taskCheckCounter--;
		return taskCheckCounter == 0;
	}
}

void Unit::resetTaskFailedCounter() {
	taskCheckCounter = TASK_CHECK_INIT_VALUE;
}

void Unit::triggerUpdate(unsigned char datumIndex) {
	updateTimeMap[datumIndex] = duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
}

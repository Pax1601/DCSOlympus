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
	if (json.has_string_field(L"name"))
		setName(to_string(json[L"name"]));

	if (json.has_string_field(L"unitName"))
		setUnitName(to_string(json[L"unitName"]));

	if (json.has_string_field(L"groupName"))
		setGroupName(to_string(json[L"groupName"]));

	if (json.has_number_field(L"coalitionID"))
		setCoalition(json[L"coalitionID"].as_number().to_int32());

	//if (json.has_number_field(L"Country"))
	//	setCountry(json[L"Country"].as_number().to_int32());

	/* All units which contain the name "Olympus" are automatically under AI control */
	if (getUnitName().find("Olympus") != string::npos)
		setControlled(true);

	update(json, 0);
	setDefaults();
}


void Unit::update(json::value json, double dt)
{
	if (json.has_object_field(L"position"))
	{
		setPosition({
			json[L"position"][L"lat"].as_number().to_double(),
			json[L"position"][L"lng"].as_number().to_double(),
			json[L"position"][L"alt"].as_number().to_double()
			});
	}

	if (json.has_number_field(L"heading"))
		setHeading(json[L"heading"].as_number().to_double());

	if (json.has_number_field(L"speed"))
		setSpeed(json[L"speed"].as_number().to_double());

	if (json.has_boolean_field(L"isAlive"))
		setAlive(json[L"isAlive"].as_bool());

	if (json.has_object_field(L"isHuman"))
		setHuman(json[L"isHuman"].as_bool());

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
			if (detectionMethod.compare("VISUAL") == 0)	contactItem.detectionMethod = 1;
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

	runAILoop();
}

void Unit::setDefaults(bool force)
{

}

void Unit::runAILoop() {
	/* Set isLeader */
	Unit* leader = nullptr;
	setIsLeader(unitsManager->isUnitGroupLeader(this, leader));

	/* If the unit is alive, controlled, is the leader of the group and it is not a human, run the AI Loop that performs the requested commands and instructions (moving, attacking, etc) */
	if (getAlive() && getControlled() && !getHuman() && getIsLeader()) {
		if (checkTaskFailed() && state != State::IDLE && state != State::LAND)
			setState(State::IDLE);
		AIloop();
	}

	refreshLeaderData(lastLoopTime);

	milliseconds ms = duration_cast<milliseconds>(system_clock::now().time_since_epoch());
	lastLoopTime = ms.count();
}

void Unit::refreshLeaderData(unsigned long long time) {
	/* When units are in a group, most data comes from the group leader. If new data is available, align it from the leader */
	if (!getIsLeader()) {
		Unit* leader = unitsManager->getGroupLeader(this);
		if (leader != nullptr) {
			for (unsigned char datumIndex = DataIndex::startOfData + 1; datumIndex < DataIndex::lastIndex; datumIndex++)
			{
				if (leader->checkFreshness(datumIndex, time)) {
					switch (datumIndex) {
					case DataIndex::controlled:					updateValue(controlled, leader->controlled, datumIndex); break;
					case DataIndex::state:						updateValue(state, leader->state, datumIndex); break;
					case DataIndex::task:						updateValue(task, leader->task, datumIndex); break;
					case DataIndex::hasTask:					updateValue(hasTask, leader->hasTask, datumIndex); break;
					case DataIndex::isTanker:					updateValue(isTanker, leader->isTanker, datumIndex); break;
					case DataIndex::isAWACS:					updateValue(isAWACS, leader->isAWACS, datumIndex); break;
					case DataIndex::onOff:						updateValue(onOff, leader->onOff, datumIndex); break;
					case DataIndex::followRoads:				updateValue(followRoads, leader->followRoads, datumIndex); break;
					case DataIndex::desiredSpeed:				updateValue(desiredSpeed, leader->desiredSpeed, datumIndex); break;
					case DataIndex::desiredSpeedType:			updateValue(desiredSpeedType, leader->desiredSpeedType, datumIndex); break;
					case DataIndex::desiredAltitude:			updateValue(desiredAltitude, leader->desiredAltitude, datumIndex); break;
					case DataIndex::desiredAltitudeType:		updateValue(desiredAltitudeType, leader->desiredAltitudeType, datumIndex); break;
					case DataIndex::leaderID:					updateValue(leaderID, leader->leaderID, datumIndex); break;
					case DataIndex::formationOffset:			updateValue(formationOffset, leader->formationOffset, datumIndex); break;
					case DataIndex::targetID:					updateValue(targetID, leader->targetID, datumIndex); break;
					case DataIndex::targetPosition:				updateValue(targetPosition, leader->targetPosition, datumIndex); break;
					case DataIndex::ROE:						updateValue(ROE, leader->ROE, datumIndex); break;
					case DataIndex::reactionToThreat:			updateValue(reactionToThreat, leader->reactionToThreat, datumIndex); break;
					case DataIndex::emissionsCountermeasures:	updateValue(emissionsCountermeasures, leader->emissionsCountermeasures, datumIndex); break;
					case DataIndex::TACAN:						updateValue(TACAN, leader->TACAN, datumIndex); break;
					case DataIndex::radio:						updateValue(radio, leader->radio, datumIndex); break;
					case DataIndex::generalSettings:			updateValue(generalSettings, leader->generalSettings, datumIndex); break;
					case DataIndex::activePath:					updateValue(activePath, leader->activePath, datumIndex); break;
					}
				}
			}
		}
	}
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
	/* When an update is requested, make sure data is refreshed */
	if (time == 0)
		refreshLeaderData(0);

	const unsigned char endOfData = DataIndex::endOfData;
	ss.write((const char*)&ID, sizeof(ID));
	for (unsigned char datumIndex = DataIndex::startOfData + 1; datumIndex < DataIndex::lastIndex; datumIndex++)
	{
		if (checkFreshness(datumIndex, time)) {
			switch (datumIndex) {
			case DataIndex::category:					appendString(ss, datumIndex, category); break;
			case DataIndex::alive:						appendNumeric(ss, datumIndex, alive); break;
			case DataIndex::human:						appendNumeric(ss, datumIndex, human); break;
			case DataIndex::controlled:					appendNumeric(ss, datumIndex, controlled); break;
			case DataIndex::coalition:					appendNumeric(ss, datumIndex, coalition); break;
			case DataIndex::country:					appendNumeric(ss, datumIndex, country); break;
			case DataIndex::name:						appendString(ss, datumIndex, name); break;
			case DataIndex::unitName:					appendString(ss, datumIndex, unitName); break;
			case DataIndex::groupName:					appendString(ss, datumIndex, groupName); break;
			case DataIndex::state:						appendNumeric(ss, datumIndex, state); break;
			case DataIndex::task:						appendString(ss, datumIndex, task); break;
			case DataIndex::hasTask:					appendNumeric(ss, datumIndex, hasTask); break;
			case DataIndex::position:					appendNumeric(ss, datumIndex, position); break;
			case DataIndex::speed:						appendNumeric(ss, datumIndex, speed); break;
			case DataIndex::heading:					appendNumeric(ss, datumIndex, heading); break;
			case DataIndex::isTanker:					appendNumeric(ss, datumIndex, isTanker); break;
			case DataIndex::isAWACS:					appendNumeric(ss, datumIndex, isAWACS); break;
			case DataIndex::onOff:						appendNumeric(ss, datumIndex, onOff); break;
			case DataIndex::followRoads:				appendNumeric(ss, datumIndex, followRoads); break;
			case DataIndex::fuel:						appendNumeric(ss, datumIndex, fuel); break;
			case DataIndex::desiredSpeed:				appendNumeric(ss, datumIndex, desiredSpeed); break;
			case DataIndex::desiredSpeedType:			appendNumeric(ss, datumIndex, desiredSpeedType); break;
			case DataIndex::desiredAltitude:			appendNumeric(ss, datumIndex, desiredAltitude); break;
			case DataIndex::desiredAltitudeType:		appendNumeric(ss, datumIndex, desiredAltitudeType); break;
			case DataIndex::leaderID:					appendNumeric(ss, datumIndex, leaderID); break;
			case DataIndex::formationOffset:			appendNumeric(ss, datumIndex, formationOffset); break;
			case DataIndex::targetID:					appendNumeric(ss, datumIndex, targetID); break;
			case DataIndex::targetPosition:				appendNumeric(ss, datumIndex, targetPosition); break;
			case DataIndex::ROE:						appendNumeric(ss, datumIndex, ROE); break;
			case DataIndex::reactionToThreat:			appendNumeric(ss, datumIndex, reactionToThreat); break;
			case DataIndex::emissionsCountermeasures:	appendNumeric(ss, datumIndex, emissionsCountermeasures); break;
			case DataIndex::TACAN:						appendNumeric(ss, datumIndex, TACAN); break;
			case DataIndex::radio:						appendNumeric(ss, datumIndex, radio); break;
			case DataIndex::generalSettings:			appendNumeric(ss, datumIndex, generalSettings); break;
			case DataIndex::ammo:						appendVector(ss, datumIndex, ammo); break;
			case DataIndex::contacts:					appendVector(ss, datumIndex, contacts); break;
			case DataIndex::activePath:					appendList(ss, datumIndex, activePath); break;
			case DataIndex::isLeader:					appendNumeric(ss, datumIndex, isLeader); break;
			}
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
			<< "callname = " << to_string(radio.callsign) << ","
			<< "number = " << to_string(radio.callsignNumber) << ","
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
	if (desiredSpeed != newDesiredSpeed) {
		desiredSpeed = newDesiredSpeed;
		if (state == State::IDLE)
			resetTask();
		else
			goToDestination();		/* Send the command to reach the destination */

		triggerUpdate(DataIndex::desiredSpeed);
	}
}

void Unit::setDesiredAltitude(double newDesiredAltitude)
{
	if (desiredAltitude != newDesiredAltitude) {
		desiredAltitude = newDesiredAltitude;
		if (state == State::IDLE)
			resetTask();
		else
			goToDestination();		/* Send the command to reach the destination */

		triggerUpdate(DataIndex::desiredAltitude);
	}
}

void Unit::setDesiredSpeedType(string newDesiredSpeedType)
{
	if (desiredSpeedType != (newDesiredSpeedType.compare("GS") == 0)) {
		desiredSpeedType = newDesiredSpeedType.compare("GS") == 0;
		if (state == State::IDLE)
			resetTask();
		else
			goToDestination();		/* Send the command to reach the destination */

		triggerUpdate(DataIndex::desiredSpeedType);
	}
}

void Unit::setDesiredAltitudeType(string newDesiredAltitudeType)
{
	if (desiredAltitudeType != (newDesiredAltitudeType.compare("AGL") == 0)) {
		desiredAltitudeType = newDesiredAltitudeType.compare("AGL") == 0;
		if (state == State::IDLE)
			resetTask();
		else
			goToDestination();		/* Send the command to reach the destination */

		triggerUpdate(DataIndex::desiredAltitudeType);
	}
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

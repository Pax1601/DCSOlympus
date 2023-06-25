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

// TODO: Make dedicated file
bool operator==(const Options::TACAN& lhs, const Options::TACAN& rhs)
{
	return lhs.isOn == rhs.isOn && lhs.channel == rhs.channel && lhs.XY == rhs.XY && lhs.callsign == rhs.callsign;
}

bool operator==(const Options::Radio& lhs, const Options::Radio& rhs)
{
	return lhs.frequency == rhs.frequency && lhs.callsign == rhs.callsign && lhs.callsignNumber == rhs.callsignNumber;
}

bool operator==(const Options::GeneralSettings& lhs, const Options::GeneralSettings& rhs)
{
	return	lhs.prohibitAA == rhs.prohibitAA && lhs.prohibitAfterburner == rhs.prohibitAfterburner && lhs.prohibitAG == rhs.prohibitAG &&
			lhs.prohibitAirWpn == rhs.prohibitAirWpn && lhs.prohibitJettison == rhs.prohibitJettison;
}

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
	setEPLRS(EPLRS, force);
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
	//if (json.has_number_field(L"fuel"))
	//	setFuel(short(json[L"fuel"].as_number().to_double() * 100));
	//
	//if (json.has_object_field(L"ammo")) {
	//	vector<DataTypes::Ammo> ammo;
	//	for (auto const& el : json[L"ammo"].as_object()) {
	//		DataTypes::Ammo ammoItem;
	//		auto ammoJson = el.second;
	//		ammoItem.quantity = ammoJson[L"count"].as_number().to_uint32();
	//		ammoItem.name = to_string(ammoJson[L"desc"][L"displayName"]);
	//		ammoItem.guidance = ammoJson[L"desc"][L"guidance"].as_number().to_uint32();
	//		ammoItem.category = ammoJson[L"desc"][L"category"].as_number().to_uint32();
	//		ammoItem.missileCategory = ammoJson[L"desc"][L"missileCategory"].as_number().to_uint32();
	//		ammo.push_back(ammoItem);
	//	}
	//	setAmmo(ammo);
	//}
	//	
	//if (json.has_object_field(L"contacts")) {
	//	vector<DataTypes::Contact> contacts;
	//	for (auto const& el : json[L"ammo"].as_object()) {
	//		DataTypes::Contact contactItem;
	//		auto contactJson = el.second;
	//		contactItem.ID = contactJson[L"object"][L"id_"].as_number().to_uint32();
	//
	//		string detectionMethod = to_string(contactJson[L"detectionMethod"]);
	//		if		(detectionMethod.compare("VISUAL"))	contactItem.detectionMethod = 1;
	//		else if (detectionMethod.compare("OPTIC"))	contactItem.detectionMethod = 2;
	//		else if (detectionMethod.compare("RADAR"))	contactItem.detectionMethod = 4;
	//		else if (detectionMethod.compare("IRST"))	contactItem.detectionMethod = 8;
	//		else if (detectionMethod.compare("RWR"))	contactItem.detectionMethod = 16;
	//		else if (detectionMethod.compare("DLINK"))	contactItem.detectionMethod = 32;
	//		contacts.push_back(contactItem);
	//	}
	//	setContacts(contacts);
	//}

	if (json.has_boolean_field(L"hasTask"))
		setHasTask(json[L"hasTask"].as_bool());
}

unsigned int Unit::getDataPacket(char* &data)
{
	/* Reserve data for:
		1) DataPacket;
		2) Active path;
		3) Ammo vector;
		4) Contacts vector;
	*/
	data = (char*)malloc(sizeof(DataTypes::DataPacket) + 
		activePath.size() * sizeof(Coords) +
		ammo.size() * sizeof(Coords) + 
		contacts.size() * sizeof(Coords));
	unsigned int offset = 0;

	/* Prepare the data packet and copy it to  memory */
	unsigned int bitmask = 0;
	bitmask |= alive << 0;
	bitmask |= human << 1;
	bitmask |= controlled << 2;
	bitmask |= hasTask << 3;
	bitmask |= desiredAltitudeType << 16;
	bitmask |= desiredSpeedType << 17;
	bitmask |= isTanker << 18;
	bitmask |= isAWACS << 19;
	bitmask |= onOff << 20;
	bitmask |= followRoads << 21;
	bitmask |= EPLRS << 22;
	bitmask |= generalSettings.prohibitAA << 23;
	bitmask |= generalSettings.prohibitAfterburner << 24;
	bitmask |= generalSettings.prohibitAG << 25;
	bitmask |= generalSettings.prohibitAirWpn << 26;
	bitmask |= generalSettings.prohibitJettison << 27;

	DataTypes::DataPacket dataPacket{
		ID,
		bitmask,
		position,
		speed,
		heading,
		fuel,
		desiredSpeed,
		desiredAltitude,
		leaderID,
		targetID,
		targetPosition,
		state,
		ROE,
		reactionToThreat,
		emissionsCountermeasures,
		coalition,
		TACAN,
		radio,
		activePath.size(),
		ammo.size(),
		contacts.size(),
		task.size()
	};

	memcpy(data + offset, &dataPacket, sizeof(dataPacket));
	offset += sizeof(dataPacket);

	/* Prepare the path vector and copy it to memory */
	for (const Coords& c : activePath) {
		memcpy(data + offset, &c, sizeof(Coords));
		offset += sizeof(Coords);
	}
	
	/* Copy the ammo vector to memory */
	memcpy(data + offset, &ammo, ammo.size() * sizeof(DataTypes::Ammo));
	offset += ammo.size() * sizeof(DataTypes::Ammo);

	/* Copy the contacts vector to memory */
	memcpy(data + offset, &contacts, contacts.size() * sizeof(DataTypes::Contact));
	offset += contacts.size() * sizeof(DataTypes::Contact);

	return offset;
}

void Unit::getData(stringstream &ss, unsigned long long time, bool refresh)
{
	if (time > lastUpdateTime && !refresh) return;

	char* data;
	unsigned int size = getDataPacket(data);

	/* Prepare the data packet and copy it to  memory */
	/* If the unit is in a group, get the update data from the group leader and only replace the position, speed and heading */
	if (unitsManager->isUnitInGroup(this) && !unitsManager->isUnitGroupLeader(this)) {
		DataTypes::DataPacket* p = (DataTypes::DataPacket*)data;
		p->position = position;
		p->speed = speed;
		p->heading = heading;
	}
	
	ss.write(data, size);
	ss << task;

	unsigned short nameLength = name.length();
	unsigned short unitNameLength = unitName.length();
	unsigned short groupNameLength = groupName.length();
	unsigned short categoryLength = getCategory().length();

	ss.write((char*)&nameLength, sizeof(nameLength));
	ss.write((char*)&unitNameLength, sizeof(unitNameLength));
	ss.write((char*)&groupNameLength, sizeof(groupNameLength));
	ss.write((char*)&categoryLength, sizeof(categoryLength));
	
	ss << name;
	ss << unitName;
	ss << groupName;
	ss << getCategory();
	

	delete data;
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

	triggerUpdate();
}

void Unit::setROE(unsigned char newROE, bool force) 
{
	if (ROE != newROE || force) {
		ROE = newROE;
		Command* command = dynamic_cast<Command*>(new SetOption(groupName, SetCommandType::ROE, static_cast<unsigned int>(ROE)));
		scheduler->appendCommand(command);

		triggerUpdate();
	}
}

void Unit::setReactionToThreat(unsigned char newReactionToThreat, bool force)
{
	if (reactionToThreat != newReactionToThreat || force) {
		reactionToThreat = newReactionToThreat;

		Command* command = dynamic_cast<Command*>(new SetOption(groupName, SetCommandType::REACTION_ON_THREAT, static_cast<unsigned int>(reactionToThreat)));
		scheduler->appendCommand(command);

		triggerUpdate();
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

		triggerUpdate();
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

		triggerUpdate();
	}
}

void Unit::setIsAWACS(bool newIsAWACS)
{ 
	if (isAWACS != newIsAWACS) {
		isAWACS = newIsAWACS;
		resetTask();
		setEPLRS(isAWACS);

		triggerUpdate();
	}
}

void Unit::setTACAN(Options::TACAN newTACAN, bool force) 
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

		triggerUpdate();
	}
}

void Unit::setRadio(Options::Radio newRadio, bool force) 
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

		triggerUpdate();
	}
}

void Unit::setEPLRS(bool newEPLRS, bool force)
{
	//addMeasure("EPLRS", json::value(newEPLRS)); 
	//
	//if (EPLRS != newEPLRS || force) {
	//	EPLRS = newEPLRS;
	//
	//	std::ostringstream commandSS;
	//	commandSS << "{"
	//		<< "id = 'EPLRS',"
	//		<< "params = {"
	//		<< "value = " << (EPLRS ? "true" : "false") << ", "
	//		<< "}"
	//		<< "}";
	//	Command* command = dynamic_cast<Command*>(new SetCommand(ID, commandSS.str()));
	//	scheduler->appendCommand(command);
	//}
}

void Unit::setGeneralSettings(Options::GeneralSettings newGeneralSettings, bool force) 
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

		triggerUpdate();
	}
}

void Unit::setDesiredSpeed(double newDesiredSpeed) 
{
	desiredSpeed = newDesiredSpeed; 
	if (state == State::IDLE)
		resetTask();
	else
		goToDestination();		/* Send the command to reach the destination */

	triggerUpdate();
}

void Unit::setDesiredAltitude(double newDesiredAltitude) 
{
	desiredAltitude = newDesiredAltitude;
	if (state == State::IDLE)
		resetTask();
	else
		goToDestination();		/* Send the command to reach the destination */

	triggerUpdate();
}

void Unit::setDesiredSpeedType(string newDesiredSpeedType) 
{
	desiredSpeedType = newDesiredSpeedType.compare("GS") == 0;
	if (state == State::IDLE)
		resetTask();
	else
		goToDestination();		/* Send the command to reach the destination */

	triggerUpdate();
}

void Unit::setDesiredAltitudeType(string newDesiredAltitudeType) 
{
	desiredAltitudeType = newDesiredAltitudeType.compare("AGL") == 0;
	if (state == State::IDLE)
		resetTask();
	else
		goToDestination();		/* Send the command to reach the destination */

	triggerUpdate();
}

void Unit::goToDestination(string enrouteTask)
{
	if (activeDestination != NULL)
	{
		Command* command = dynamic_cast<Command*>(new Move(groupName, activeDestination, getDesiredSpeed(), getDesiredSpeedType()? "GS": "CAS", getDesiredAltitude(), getDesiredAltitudeType()? "AGL" : "ASL", enrouteTask, getCategory()));
		scheduler->appendCommand(command);
		setHasTask(true);
	}
}

bool Unit::isDestinationReached(double threshold)
{
	if (activeDestination != NULL)
	{
		/* Check if any unit in the group has reached the point */
		for (auto const& p: unitsManager->getGroupMembers(groupName))
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

		triggerUpdate();
		return true;
	}
	else
	{
		activeDestination = Coords(0);
		log(unitName + " active destination set to NULL");

		triggerUpdate();
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

#include "aircraft.h"
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
json::value Aircraft::database = json::value();
extern string instancePath;

void Aircraft::loadDatabase(string path) {
	std::ifstream ifstream(instancePath + path);
	std::stringstream ss;
	ss << ifstream.rdbuf();
	std::error_code errorCode;
	database = json::value::parse(ss.str(), errorCode);
	if (database.is_object())
		log("Aircrafts database loaded correctly from " + instancePath + path);
	else
		log("Error reading Aircrafts database file");
}

/* Aircraft */
Aircraft::Aircraft(json::value json, unsigned int ID) : AirUnit(json, ID)
{
	log("New Aircraft created with ID: " + to_string(ID));

	setCategory("Aircraft");
	setDesiredSpeed(knotsToMs(300));
	setDesiredAltitude(ftToM(20000));
};

void Aircraft::setDefaults(bool force)
{
	AirUnit::setDefaults(force);
	/* Load values from database */
	if (database.has_object_field(to_wstring(name))) {
		json::value databaseEntry = database[to_wstring(name)];
		
		// Iterate on all the loadouts
		if (databaseEntry.has_array_field(L"loadouts")) {
			json::array loadouts = databaseEntry[L"loadouts"].as_array();
			for (auto& loadout : loadouts) {
				// Check in the roles if the world "Transport" is present. If so, set canTransportUnits to true
				if (loadout.has_array_field(L"roles")) {
					json::array roles = loadout[L"roles"].as_array();
					for (auto const& role : roles) {
						if (role.as_string().compare(L"Transport") == 0)
							setCanTransportUnits(true, force);
					}
				}
			}
		}

		// If it can transport units, set the maximum transport capacity from the database
		if (getCanTransportUnits() && databaseEntry.has_number_field(L"maximumTransportableUnits")) {
			setMaximumTransportableUnits(databaseEntry[L"maximumTransportableUnits"].as_number().to_uint32(), force);

			// If available, read the length of the unit
			if (databaseEntry.has_double_field(L"length"))
				length = databaseEntry[L"length"].as_number().to_double() * 0.3048; // Its stored in feet in the database

			if (databaseEntry.has_boolean_field(L"dropUnitsFromTheRear"))
				dropUnitsFromTheRear = databaseEntry[L"dropUnitsFromTheRear"].as_bool();
		}
	}
}

void Aircraft::changeSpeed(string change)
{
	if (change.compare("stop") == 0)
		setState(State::IDLE);
	else if (change.compare("slow") == 0)
		setDesiredSpeed(getDesiredSpeed() - knotsToMs(25));
	else if (change.compare("fast") == 0)
		setDesiredSpeed(getDesiredSpeed() + knotsToMs(25));

	if (getDesiredSpeed() < knotsToMs(50))
		setDesiredSpeed(knotsToMs(50));
}

void Aircraft::changeAltitude(string change)
{
	if (change.compare("descend") == 0)
	{
		if (getDesiredAltitude() > 5000)
			setDesiredAltitude(getDesiredAltitude() - ftToM(2500));
		else if (getDesiredAltitude() > 0)
			setDesiredAltitude(getDesiredAltitude() - ftToM(500));
	}
	else if (change.compare("climb") == 0)
	{
		if (getDesiredAltitude() > 5000)
			setDesiredAltitude(getDesiredAltitude() + ftToM(2500));
		else if (getDesiredAltitude() >= 0)
			setDesiredAltitude(getDesiredAltitude() + ftToM(500));
	}

	if (getDesiredAltitude() < 0)
		setDesiredAltitude(0);
}
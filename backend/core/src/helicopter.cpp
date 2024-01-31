#include "helicopter.h"
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
json::value Helicopter::database = json::value();
extern string instancePath;

void Helicopter::loadDatabase(string path) {
	std::ifstream ifstream(instancePath + path);
	std::stringstream ss;
	ss << ifstream.rdbuf();
	std::error_code errorCode;
	database = json::value::parse(ss.str(), errorCode);
	if (database.is_object())
		log("Helicopters database loaded correctly from " + instancePath + path);
	else
		log("Error reading Helicopters database file");
}

/* Helicopter */
Helicopter::Helicopter(json::value json, unsigned int ID) : AirUnit(json, ID)
{
	log("New Helicopter created with ID: " + to_string(ID));

	setCategory("Helicopter");
	setDesiredSpeed(knotsToMs(100));
	setDesiredAltitude(ftToM(5000));
};

void Helicopter::changeSpeed(string change)
{
	if (change.compare("stop") == 0)
		setState(State::IDLE);
	else if (change.compare("slow") == 0)
		setDesiredSpeed(getDesiredSpeed() - knotsToMs(10));
	else if (change.compare("fast") == 0)
		setDesiredSpeed(getDesiredSpeed() + knotsToMs(10));

	if (getDesiredSpeed() < knotsToMs(0))
		setDesiredSpeed(knotsToMs(0));
}

void Helicopter::changeAltitude(string change)
{
	if (change.compare("descend") == 0)
	{
		if (getDesiredAltitude() > 100)
			setDesiredAltitude(getDesiredAltitude() - ftToM(100));
		else if (getDesiredAltitude() > 0)
			setDesiredAltitude(getDesiredAltitude() - ftToM(10));
	}
	else if (change.compare("climb") == 0)
	{
		if (getDesiredAltitude() > 100)
			setDesiredAltitude(getDesiredAltitude() + ftToM(100));
		else if (getDesiredAltitude() >= 0)
			setDesiredAltitude(getDesiredAltitude() + ftToM(10));
	}

	if (getDesiredAltitude() < 0)
		setDesiredAltitude(0);
}
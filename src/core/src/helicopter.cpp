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
extern string modLocation;
json::value Helicopter::database = json::value();

void Helicopter::loadDatabase(string path) 
{
	std::ifstream ifstream(modLocation + path);
	std::stringstream ss;
	ss << ifstream.rdbuf();
	std::error_code errorCode;
	database = json::value::parse(ss.str(), errorCode);
	if (database.is_object())
		log("Helicopters database loaded correctly");
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
		desiredSpeed -= knotsToMs(10);
	else if (change.compare("fast") == 0)
		desiredSpeed += knotsToMs(10);
	if (desiredSpeed < 0)
		desiredSpeed = 0;

	goToDestination();		/* Send the command to reach the destination */
}

void Helicopter::changeAltitude(string change)
{
	if (change.compare("descend") == 0)
	{
		if (desiredAltitude > 100)
			desiredAltitude -= ftToM(100);
		else if (desiredAltitude > 0)
			desiredAltitude -= ftToM(10);
	}
	else if (change.compare("climb") == 0)
	{
		if (desiredAltitude > 100)
			desiredAltitude += ftToM(100);
		else if (desiredAltitude >= 0)
			desiredAltitude += ftToM(10);
	}
	if (desiredAltitude < 0)
		desiredAltitude = 0;

	goToDestination();		/* Send the command to reach the destination */
}

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

/* Helicopter */
Helicopter::Helicopter(json::value json, int ID) : AirUnit(json, ID)
{
	log("New Helicopter created with ID: " + to_string(ID));
	addMeasure(L"category", json::value(getCategory()));

	double desiredSpeed = knotsToMs(100);
	double desiredAltitude = ftToM(5000);
	setDesiredSpeed(desiredSpeed);
	setDesiredAltitude(desiredAltitude);
};

void Helicopter::changeSpeed(wstring change)
{
	if (change.compare(L"stop") == 0)
	{
		/* Air units can't hold a position, so we can only set them to hold. At the moment, this will erase any other command. TODO: helicopters should be able to hover in place */
		clearActivePath();
	}
	else if (change.compare(L"slow") == 0)
		desiredSpeed -= knotsToMs(10);
	else if (change.compare(L"fast") == 0)
		desiredSpeed += knotsToMs(10);
	if (desiredSpeed < 0)
		desiredSpeed = 0;

	goToDestination();		/* Send the command to reach the destination */
}

void Helicopter::changeAltitude(wstring change)
{
	if (change.compare(L"descend") == 0)
	{
		if (desiredAltitude > 100)
			desiredAltitude -= ftToM(100);
		else if (desiredAltitude > 0)
			desiredAltitude -= ftToM(10);
	}
	else if (change.compare(L"climb") == 0)
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

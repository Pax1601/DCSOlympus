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

	double targetSpeed = knotsToMs(100);
	double targetAltitude = ftToM(5000);
	setTargetSpeed(targetSpeed);
	setTargetAltitude(targetAltitude);
};

void Helicopter::changeSpeed(wstring change)
{
	if (change.compare(L"stop") == 0)
	{
		/* Air units can't hold a position, so we can only set them to hold. At the moment, this will erase any other command. TODO: helicopters should be able to hover in place */
		clearActivePath();
	}
	else if (change.compare(L"slow") == 0)
		targetSpeed -= knotsToMs(10);
	else if (change.compare(L"fast") == 0)
		targetSpeed += knotsToMs(10);
	if (targetSpeed < 0)
		targetSpeed = 0;

	goToDestination();		/* Send the command to reach the destination */
}

void Helicopter::changeAltitude(wstring change)
{
	if (change.compare(L"descend") == 0)
	{
		if (targetAltitude > 100)
			targetAltitude -= ftToM(100);
		else if (targetAltitude > 0)
			targetAltitude -= ftToM(10);
	}
	else if (change.compare(L"climb") == 0)
	{
		if (targetAltitude > 100)
			targetAltitude += ftToM(100);
		else if (targetAltitude >= 0)
			targetAltitude += ftToM(10);
	}
	if (targetAltitude < 0)
		targetAltitude = 0;

	goToDestination();		/* Send the command to reach the destination */
}

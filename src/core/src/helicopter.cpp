#include "helicopter.h"
#include "utils.h"
#include "logger.h"
#include "commands.h"
#include "scheduler.h"
#include "defines.h"
#include "unitsFactory.h"

#include <GeographicLib/Geodesic.hpp>
using namespace GeographicLib;

extern Scheduler* scheduler;
extern UnitsFactory* unitsFactory;

/* Helicopter */
Helicopter::Helicopter(json::value json, int ID) : AirUnit(json, ID)
{
	log("New Helicopter created with ID: " + to_string(ID));
};

void Helicopter::changeSpeed(wstring change)
{
	if (change.compare(L"stop") == 0)
	{
		/* Air units can't hold a position, so we can only set them to hold. At the moment, this will erase any other command. TODO: helicopters should be able to hover in place */
		activePath.clear();
	}
	else if (change.compare(L"slow") == 0)
		targetSpeed -= 10 / 1.94384;
	else if (change.compare(L"fast") == 0)
		targetSpeed += 10 / 1.94384;
	if (targetSpeed < 0)
		targetSpeed = 0;

	goToDestination();		/* Send the command to reach the destination */
}

void Helicopter::changeAltitude(wstring change)
{
	if (change.compare(L"descend") == 0)
	{
		if (targetAltitude > 100)
			targetAltitude -= 100 / 3.28084;
		else if (targetAltitude > 0)
			targetAltitude -= 10 / 3.28084;
	}
	else if (change.compare(L"climb") == 0)
	{
		if (targetAltitude > 100)
			targetAltitude += 100 / 3.28084;
		else if (targetAltitude >= 0)
			targetAltitude += 10 / 3.28084;
	}
	if (targetAltitude < 0)
		targetAltitude = 0;

	goToDestination();		/* Send the command to reach the destination */
}


void Helicopter::setTargetSpeed(double newTargetSpeed) {
	targetSpeed = newTargetSpeed;
	goToDestination();
}

void Helicopter::setTargetAltitude(double newTargetAltitude) {
	targetAltitude = newTargetAltitude;
	goToDestination();
}
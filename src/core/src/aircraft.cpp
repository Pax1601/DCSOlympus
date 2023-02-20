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

/* Aircraft */
Aircraft::Aircraft(json::value json, int ID) : AirUnit(json, ID)
{
	log("New Aircraft created with ID: " + to_string(ID));
};

void Aircraft::changeSpeed(wstring change)
{
	if (change.compare(L"stop") == 0)
	{
		setState(State::IDLE);
	}
	else if (change.compare(L"slow") == 0)
		targetSpeed -= 25 / 1.94384;
	else if (change.compare(L"fast") == 0)
		targetSpeed += 25 / 1.94384;

	if (targetSpeed < 50 / 1.94384)
		targetSpeed = 50 / 1.94384;

	goToDestination();		/* Send the command to reach the destination */
}

void Aircraft::changeAltitude(wstring change)
{
	if (change.compare(L"descend") == 0)
	{
		if (targetAltitude > 5000)
			targetAltitude -= 2500 / 3.28084;
		else if (targetAltitude > 0)
			targetAltitude -= 500 / 3.28084;
	}
	else if (change.compare(L"climb") == 0)
	{
		if (targetAltitude > 5000)
			targetAltitude += 2500 / 3.28084;
		else if (targetAltitude >= 0)
			targetAltitude += 500 / 3.28084;
	}
	if (targetAltitude < 0)
		targetAltitude = 0;

	goToDestination();		/* Send the command to reach the destination */
}

void Aircraft::setTargetSpeed(double newTargetSpeed) {
	targetSpeed = newTargetSpeed;
	goToDestination();
}

void Aircraft::setTargetAltitude(double newTargetAltitude) {
	targetAltitude = newTargetAltitude;
	goToDestination();
}
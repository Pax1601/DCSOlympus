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
	addMeasure(L"category", json::value(getCategory()));

	double targetSpeed = knotsToMs(300);
	double targetAltitude = ftToM(20000);
	setTargetSpeed(targetSpeed);
	setTargetAltitude(targetAltitude);
};

void Aircraft::changeSpeed(wstring change)
{
	if (change.compare(L"stop") == 0)
		setState(State::IDLE);
	else if (change.compare(L"slow") == 0)
		setTargetSpeed(getTargetSpeed() - knotsToMs(25));
	else if (change.compare(L"fast") == 0)
		setTargetSpeed(getTargetSpeed() + knotsToMs(25));

	if (getTargetSpeed() < knotsToMs(50))
		setTargetSpeed(knotsToMs(50));

	goToDestination();		/* Send the command to reach the destination */
}

void Aircraft::changeAltitude(wstring change)
{
	if (change.compare(L"descend") == 0)
	{
		if (getTargetAltitude() > 5000)
			setTargetAltitude(getTargetAltitude() - ftToM(2500));
		else if (getTargetAltitude() > 0)
			setTargetAltitude(getTargetAltitude() - ftToM(500));
	}
	else if (change.compare(L"climb") == 0)
	{
		if (getTargetAltitude() > 5000)
			setTargetAltitude(getTargetAltitude() + ftToM(2500));
		else if (getTargetAltitude() >= 0)
				setTargetAltitude(getTargetAltitude() + ftToM(500));
	}
	if (getTargetAltitude() < 0)
		setTargetAltitude(0);

	goToDestination();		/* Send the command to reach the destination */
}
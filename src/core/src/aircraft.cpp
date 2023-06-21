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

	double desiredSpeed = knotsToMs(300);
	double desiredAltitude = ftToM(20000);
	setDesiredSpeed(desiredSpeed);
	setDesiredAltitude(desiredAltitude);
};

void Aircraft::changeSpeed(wstring change)
{
	if (change.compare(L"stop") == 0)
		setState(State::IDLE);
	else if (change.compare(L"slow") == 0)
		setDesiredSpeed(getDesiredSpeed() - knotsToMs(25));
	else if (change.compare(L"fast") == 0)
		setDesiredSpeed(getDesiredSpeed() + knotsToMs(25));

	if (getDesiredSpeed() < knotsToMs(50))
		setDesiredSpeed(knotsToMs(50));

	if (state == State::IDLE)
		resetTask();
	else
		goToDestination();		/* Send the command to reach the destination */
}

void Aircraft::changeAltitude(wstring change)
{
	if (change.compare(L"descend") == 0)
	{
		if (getDesiredAltitude() > 5000)
			setDesiredAltitude(getDesiredAltitude() - ftToM(2500));
		else if (getDesiredAltitude() > 0)
			setDesiredAltitude(getDesiredAltitude() - ftToM(500));
	}
	else if (change.compare(L"climb") == 0)
	{
		if (getDesiredAltitude() > 5000)
			setDesiredAltitude(getDesiredAltitude() + ftToM(2500));
		else if (getDesiredAltitude() >= 0)
				setDesiredAltitude(getDesiredAltitude() + ftToM(500));
	}

	if (getDesiredAltitude() < 0)
		setDesiredAltitude(0);

	if (state == State::IDLE)
		resetTask();
	else 
		goToDestination();		/* Send the command to reach the destination */
}
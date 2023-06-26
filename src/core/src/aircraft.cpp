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
Aircraft::Aircraft(json::value json, unsigned int ID) : AirUnit(json, ID)
{
	log("New Aircraft created with ID: " + to_string(ID));

	setCategory("Aircraft");
	setDesiredSpeed(knotsToMs(300));
	setDesiredAltitude(ftToM(20000));
	
};

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

	if (state == State::IDLE)
		resetTask();
	else
		goToDestination();		/* Send the command to reach the destination */
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

	if (state == State::IDLE)
		resetTask();
	else 
		goToDestination();		/* Send the command to reach the destination */
}
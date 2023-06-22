#include "navyunit.h"
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

/* Navy Unit */
NavyUnit::NavyUnit(json::value json, unsigned int ID) : Unit(json, ID)
{
	log("New Navy Unit created with ID: " + to_string(ID));

	double desiredSpeed = 10;
	setDesiredSpeed(desiredSpeed);
};

void NavyUnit::AIloop()
{
	/* TODO */
}

void NavyUnit::changeSpeed(string change)
{
	if (change.compare("stop") == 0)
	{

	}
	else if (change.compare("slow") == 0)
	{

	}
	else if (change.compare("fast") == 0)
	{

	}
}
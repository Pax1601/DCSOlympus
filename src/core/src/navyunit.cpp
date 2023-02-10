#include "navyunit.h"
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

/* Navy Unit */
NavyUnit::NavyUnit(json::value json, int ID) : Unit(json, ID)
{
	log("New Navy Unit created with ID: " + to_string(ID));
};

void NavyUnit::AIloop()
{
	/* TODO */
}

void NavyUnit::changeSpeed(wstring change)
{
	if (change.compare(L"stop") == 0)
	{

	}
	else if (change.compare(L"slow") == 0)
	{

	}
	else if (change.compare(L"fast") == 0)
	{

	}
}
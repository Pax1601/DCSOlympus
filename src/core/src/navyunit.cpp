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
NavyUnit::NavyUnit(json::value json, int ID) : Unit(json, ID)
{
	log("New Navy Unit created with ID: " + to_string(ID));
	addMeasure(L"category", json::value(getCategory()));
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
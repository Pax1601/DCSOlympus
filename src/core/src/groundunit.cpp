#include "groundunit.h"
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

/* Ground unit */
GroundUnit::GroundUnit(json::value json, int ID) : Unit(json, ID)
{
	log("New Ground Unit created with ID: " + to_string(ID));
};

void GroundUnit::AIloop()
{
	/* Set the active destination to be always equal to the first point of the active path. This is in common with all AI units */
	if (activePath.size() > 0)
	{
		if (activeDestination != activePath.front())
		{
			activeDestination = activePath.front();
			Command* command = dynamic_cast<Command*>(new Move(ID, activeDestination, getTargetSpeed(), getTargetAltitude(), getCategory(), L"nil"));
			scheduler->appendCommand(command);
		}
	}
	else
	{
		if (activeDestination != NULL)
		{
			log(unitName + L" no more points in active path");
			activeDestination = Coords(0); // Set the active path to NULL
			currentTask = L"Idle";
		}
	}

	/* Ground unit AI Loop */
	if (activeDestination != NULL)
	{
		double newDist = 0;
		Geodesic::WGS84().Inverse(latitude, longitude, activeDestination.lat, activeDestination.lng, newDist);
		if (newDist < GROUND_DEST_DIST_THR)
		{
			/* Destination reached */
			activePath.pop_front();
			log(unitName + L" destination reached");
		}
	}
}

void GroundUnit::changeSpeed(wstring change)
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
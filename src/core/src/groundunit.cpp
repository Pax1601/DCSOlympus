#include "groundunit.h"
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

/* Ground unit */
GroundUnit::GroundUnit(json::value json, int ID) : Unit(json, ID)
{
	log("New Ground Unit created with ID: " + to_string(ID));
	addMeasure(L"category", json::value(getCategory()));

	double targetSpeed = 10;
	setTargetSpeed(targetSpeed);
};

void GroundUnit::setState(int newState)
{
	/************ Perform any action required when LEAVING a state ************/
	if (newState != state) {
		switch (state) {
		case State::IDLE: {
			break;
		}
		case State::REACH_DESTINATION: {
			break;
		}
		default:
			break;
		}
	}

	/************ Perform any action required when ENTERING a state ************/
	switch (newState) {
	case State::IDLE: {
		clearActivePath();
		resetActiveDestination();
		addMeasure(L"currentState", json::value(L"Idle"));
		break;
	}
	case State::REACH_DESTINATION: {
		resetActiveDestination();
		addMeasure(L"currentState", json::value(L"Reach destination"));
		break;
	}
	default:
		break;
	}

	resetTask();

	log(unitName + L" setting state from " + to_wstring(state) + L" to " + to_wstring(newState));
	state = newState;
}

void GroundUnit::AIloop()
{

	switch (state) {
	case State::IDLE: {
		currentTask = L"Idle";
		if (getHasTask())
			resetTask();
		break;
	}
	case State::REACH_DESTINATION: {
		wstring enrouteTask = L"";
		bool looping = false;

		std::wostringstream taskSS;
		taskSS << "{ id = 'FollowRoads', value = " << (getFollowRoads() ? "true" : "false") << " }";
		enrouteTask = taskSS.str();

		if (activeDestination == NULL || !getHasTask())
		{
			if (!setActiveDestination())
				setState(State::IDLE);
			else
				goToDestination(enrouteTask);
		}
		else {
			if (isDestinationReached(GROUND_DEST_DIST_THR)) {
				if (updateActivePath(looping) && setActiveDestination())
					goToDestination(enrouteTask);
				else
					setState(State::IDLE);
			}
		}
		break;
	}
	default:
		break;
	}

	addMeasure(L"currentTask", json::value(currentTask));
}

void GroundUnit::changeSpeed(wstring change)
{
	if (change.compare(L"stop") == 0)
		setState(State::IDLE);
	else if (change.compare(L"slow") == 0)
		setTargetSpeed(getTargetSpeed() - knotsToMs(5));
	else if (change.compare(L"fast") == 0)
		setTargetSpeed(getTargetSpeed() + knotsToMs(5));

	if (getTargetSpeed() < 0)
		setTargetSpeed(0);
}

void GroundUnit::setOnOff(bool newOnOff) 
{
	Unit::setOnOff(newOnOff);
	Command* command = dynamic_cast<Command*>(new SetOnOff(ID, onOff));
	scheduler->appendCommand(command);
}

void GroundUnit::setFollowRoads(bool newFollowRoads) 
{
	Unit::setFollowRoads(newFollowRoads);
	resetActiveDestination(); /* Reset active destination to apply option*/
}
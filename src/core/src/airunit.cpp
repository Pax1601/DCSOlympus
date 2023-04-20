#include "airunit.h"
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

/* Air unit */
AirUnit::AirUnit(json::value json, int ID) : Unit(json, ID)
{
	
};

void AirUnit::setState(int newState) 
{
	if (state != newState)
	{
		/* Perform any action required when LEAVING a certain state */
		switch (state) {
		case State::IDLE: {
			break;
		}
		case State::REACH_DESTINATION: {
			break;
		}
		case State::ATTACK: {
			setTargetID(NULL);
			break;
		}
		case State::FOLLOW: {
			break;
		}
		case State::LAND: {
			break;
		}
		case State::REFUEL: {
			break;
		}
		default:
			break;
		}

		/* Perform any action required when ENTERING a certain state */
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
		case State::ATTACK: {
			if (isTargetAlive()) {
				Unit* target = unitsManager->getUnit(targetID);
				Coords targetPosition = Coords(target->getLatitude(), target->getLongitude(), 0);
				clearActivePath();
				pushActivePathFront(targetPosition);
				resetActiveDestination();
				addMeasure(L"currentState", json::value(L"Attack"));
			}
			break;
		}
		case State::FOLLOW: {
			clearActivePath();
			resetActiveDestination();
			addMeasure(L"currentState", json::value(L"Follow"));
			break;
		}
		case State::LAND: {
			resetActiveDestination();
			addMeasure(L"currentState", json::value(L"Land"));
			break;
		}
		case State::REFUEL: {
			initialFuel = fuel;
			clearActivePath();
			resetActiveDestination();
			addMeasure(L"currentState", json::value(L"Refuel"));
			break;
		}
		default:
			break;
		}

		resetTask();

		log(unitName + L" setting state from " + to_wstring(state) + L" to " + to_wstring(newState));
		state = newState;
	}
}

bool AirUnit::isDestinationReached()
{
	if (activeDestination != NULL)
	{
		double dist = 0;
		Geodesic::WGS84().Inverse(latitude, longitude, activeDestination.lat, activeDestination.lng, dist);
		if (dist < AIR_DEST_DIST_THR)
		{
			log(unitName + L" destination reached");
			return true;
		}
		else {
			return false;
		}
	}
	else
		return true;
}

bool AirUnit::setActiveDestination()
{
	if (activePath.size() > 0)
	{
		activeDestination = activePath.front();
		log(unitName + L" active destination set to queue front");
		return true;
	}
	else
	{
		activeDestination = Coords(0);
		log(unitName + L" active destination set to NULL");
		return false;
	}
}

void AirUnit::createHoldingPattern()
{
	/* Air units must ALWAYS have a destination or they will RTB and become uncontrollable */
	clearActivePath();
	Coords point1;
	Coords point2;
	Coords point3;
	Geodesic::WGS84().Direct(latitude, longitude, 45, 10000, point1.lat, point1.lng);
	Geodesic::WGS84().Direct(point1.lat, point1.lng, 135, 10000, point2.lat, point2.lng);
	Geodesic::WGS84().Direct(point2.lat, point2.lng, 225, 10000, point3.lat, point3.lng);
	pushActivePathBack(point1);
	pushActivePathBack(point2);
	pushActivePathBack(point3);
	pushActivePathBack(Coords(latitude, longitude));
	log(unitName + L" holding pattern created");
}

bool AirUnit::updateActivePath(bool looping)
{
	if (activePath.size() > 0)
	{
		/* Push the next destination in the queue to the front */
		if (looping)
			pushActivePathBack(activePath.front());
		popActivePathFront();
		log(unitName + L" active path front popped");
		return true;
	}
	else {
		return false;
	}
}

void AirUnit::goToDestination(wstring enrouteTask)
{
	if (activeDestination != NULL)
	{
		Command* command = dynamic_cast<Command*>(new Move(ID, activeDestination, getTargetSpeed(), getTargetAltitude(), getCategory(), enrouteTask));
		scheduler->appendCommand(command);
		hasTask = true;
	}
	else
		log(unitName + L" error, no active destination!");
}

void AirUnit::AIloop()
{
	/* State machine */
	switch (state) {
		case State::IDLE: {
			currentTask = L"Idle";
			
			if (!hasTask)
			{
				std::wostringstream taskSS;
				if (isTanker) {
					taskSS << "{ [1] = { id = 'Tanker' }, [2] = { id = 'Orbit', pattern = 'Race-Track' } }";
				}
				else if (isAWACS) {
					taskSS << "{ [1] = { id = 'AWACS' }, [2] = { id = 'Orbit', pattern = 'Circle' } }";
				}
				else {
					taskSS << "{ id = 'Orbit', pattern = 'Circle' }";
				}
				Command* command = dynamic_cast<Command*>(new SetTask(ID, taskSS.str()));
				scheduler->appendCommand(command);
				hasTask = true;
			}
			break;
		}
		case State::REACH_DESTINATION: {
			wstring enrouteTask = L"";
			bool looping = false;

			if (isTanker)
			{
				enrouteTask = L"{ id = 'Tanker' }";
				currentTask = L"Tanker";
			}
			else if (isAWACS)
			{
				enrouteTask = L"{ id = 'AWACS' }";
				currentTask = L"AWACS";
			}
			else
			{
				enrouteTask = L"nil";
				currentTask = L"Reaching destination";
			}
			
			if (activeDestination == NULL || !hasTask)
			{
				setActiveDestination();
				goToDestination(enrouteTask);
			}
			else {
				if (isDestinationReached()) {
					if (updateActivePath(looping) && setActiveDestination())
						goToDestination(enrouteTask);
					else {
						setState(State::IDLE);
						break;
					}
				}
			}			
			break;
		}
		case State::LAND: {
			wstring enrouteTask = L"{ id = 'Land' }";
			currentTask = L"Landing";

			if (activeDestination == NULL)
			{
				setActiveDestination();
				goToDestination(enrouteTask);
			}
			break;
		}
		case State::ATTACK: {
			/* If the target is not alive (either not set or was succesfully destroyed) go back to REACH_DESTINATION */
			if (!isTargetAlive()) {
				setState(State::REACH_DESTINATION);
				break;
			}

			/* Attack state is an "enroute" task, meaning the unit will keep trying to attack even if a new destination is set. This is useful to 
			   manoeuvre the unit so that it can detect and engage the target. */
			std::wostringstream enrouteTaskSS;
			enrouteTaskSS << "{"
				<< "id = 'EngageUnit'" << ","
				<< "targetID = " << targetID << ","
				<< "}";
			wstring enrouteTask = enrouteTaskSS.str();
			currentTask = L"Attacking " + getTargetName();
			
			if (!hasTask)
			{
				setActiveDestination();
				goToDestination(enrouteTask);
			}

			break;
		}
		case State::FOLLOW: {
			clearActivePath();
			activeDestination = Coords(NULL);

			/* If the target is not alive (either not set or was destroyed) go back to IDLE */
			if (!isTargetAlive()) {
				setState(State::IDLE);
				break;
			}

			currentTask = L"Following " + getTargetName();

			Unit* target = unitsManager->getUnit(targetID);
			if (!hasTask) {
				if (target != nullptr && target->getAlive() && formationOffset != NULL)
				{
					std::wostringstream taskSS;
					taskSS << "{"
						<< "id = 'FollowUnit'" << ", "
						<< "leaderID = " << target->getID() << ","
						<< "offset = {" 
						<< "x = " << formationOffset.x << ","
						<< "y = " << formationOffset.y << ","
						<< "z = " << formationOffset.z 
						<< "},"
						<< "}";
					Command* command = dynamic_cast<Command*>(new SetTask(ID, taskSS.str()));
					scheduler->appendCommand(command);
					hasTask = true;
				}
			}
			break;
		}
		case State::REFUEL: {
			currentTask = L"Refueling";

			if (!hasTask) {
				if (fuel <= initialFuel) {
					std::wostringstream taskSS;
					taskSS << "{"
						<< "id = 'Refuel'"
						<< "}";
					Command* command = dynamic_cast<Command*>(new SetTask(ID, taskSS.str()));
					scheduler->appendCommand(command);
					hasTask = true;
				}
				else {
					setState(State::IDLE);
				}
			}
		}
		default:
			break;
	}
	addMeasure(L"currentTask", json::value(currentTask));
}

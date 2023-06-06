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
	/************ Perform any action required when LEAVING a state ************/
	if (newState != state) {
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
			setLeaderID(NULL);
			break;
		}
		case State::LAND: {
			break;
		}
		case State::REFUEL: {
			break;
		}
		case State::BOMB_POINT:
		case State::CARPET_BOMB: 
		case State::BOMB_BUILDING: {
			setTargetLocation(Coords(NULL));
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
	case State::BOMB_POINT: {
		addMeasure(L"currentState", json::value(L"Bombing point"));
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::CARPET_BOMB: {
		addMeasure(L"currentState", json::value(L"Carpet bombing"));
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::BOMB_BUILDING: {
		addMeasure(L"currentState", json::value(L"Bombing building"));
		clearActivePath();
		resetActiveDestination();
		break;
	}
	default:
		break;
	}

	resetTask();

	log(unitName + L" setting state from " + to_wstring(state) + L" to " + to_wstring(newState));
	state = newState;
}

void AirUnit::AIloop()
{
	/* State machine */
	switch (state) {
		case State::IDLE: {
			currentTask = L"Idle";
			
			if (!getHasTask())
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
				setHasTask(true);
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
			
			if (activeDestination == NULL || !getHasTask())
			{
				if (!setActiveDestination())
					setState(State::IDLE);
				else
					goToDestination(enrouteTask);
			}
			else {
				if (isDestinationReached(AIR_DEST_DIST_THR)) {
					if (updateActivePath(looping) && setActiveDestination())
						goToDestination(enrouteTask);
					else 
						setState(State::IDLE);
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
			
			if (!getHasTask())
			{
				setActiveDestination();
				goToDestination(enrouteTask);
			}

			break;
		}
		case State::FOLLOW: {
			clearActivePath();
			activeDestination = Coords(NULL);

			/* If the leader is not alive (either not set or was destroyed) go back to IDLE */
			if (!isLeaderAlive()) {
				setState(State::IDLE);
				break;
			}

			currentTask = L"Following " + getTargetName();

			Unit* leader = unitsManager->getUnit(leaderID);
			if (!getHasTask()) {
				if (leader != nullptr && leader->getAlive() && formationOffset != NULL)
				{
					std::wostringstream taskSS;
					taskSS << "{"
						<< "id = 'FollowUnit'" << ", "
						<< "leaderID = " << leader->getID() << ","
						<< "offset = {" 
						<< "x = " << formationOffset.x << ","
						<< "y = " << formationOffset.y << ","
						<< "z = " << formationOffset.z 
						<< "},"
						<< "}";
					Command* command = dynamic_cast<Command*>(new SetTask(ID, taskSS.str()));
					scheduler->appendCommand(command);
					setHasTask(true);
				}
			}
			break;
		}
		case State::REFUEL: {
			currentTask = L"Refueling";

			if (!getHasTask()) {
				if (fuel <= initialFuel) {
					std::wostringstream taskSS;
					taskSS << "{"
						<< "id = 'Refuel'"
						<< "}";
					Command* command = dynamic_cast<Command*>(new SetTask(ID, taskSS.str()));
					scheduler->appendCommand(command);
					setHasTask(true);
				}
				else {
					setState(State::IDLE);
				}
			}
		}
		case State::BOMB_POINT: {
			currentTask = L"Bombing point";

			if (!getHasTask()) {
				std::wostringstream taskSS;
				taskSS << "{id = 'Bombing', lat = " << targetLocation.lat << ", lng = " << targetLocation.lng << "}";
				Command* command = dynamic_cast<Command*>(new SetTask(ID, taskSS.str()));
				scheduler->appendCommand(command);
				setHasTask(true);
			}
		}
		case State::CARPET_BOMB: {
			currentTask = L"Carpet bombing";

			if (!getHasTask()) {
				std::wostringstream taskSS;
				taskSS << "{id = 'CarpetBombing', lat = " << targetLocation.lat << ", lng = " << targetLocation.lng << "}";
				Command* command = dynamic_cast<Command*>(new SetTask(ID, taskSS.str()));
				scheduler->appendCommand(command);
				setHasTask(true);
			}
		}
		case State::BOMB_BUILDING: {
			currentTask = L"Bombing building";

			if (!getHasTask()) {
				std::wostringstream taskSS;
				taskSS << "{id = 'AttackMapObject', lat = " << targetLocation.lat << ", lng = " << targetLocation.lng << "}";
				Command* command = dynamic_cast<Command*>(new SetTask(ID, taskSS.str()));
				scheduler->appendCommand(command);
				setHasTask(true);
			}
		}
		default:
			break;
	}

	addMeasure(L"currentTask", json::value(currentTask));
}
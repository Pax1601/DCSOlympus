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
AirUnit::AirUnit(json::value json, unsigned int ID) : Unit(json, ID)
{
	
};

void AirUnit::setDefaults(bool force)
{
	if (!getAlive() || !getControlled() || getHuman() || !getIsLeader()) return;
	
	/* Set the default IDLE state */
	setState(State::IDLE);

	/* Set desired altitude to be equal to current altitude so the unit does not climb/descend after spawn */
	setDesiredAltitude(position.alt);

	/* Set the default options */
	setROE(ROE::OPEN_FIRE_WEAPON_FREE, force);
	setReactionToThreat(ReactionToThreat::EVADE_FIRE, force);
	setEmissionsCountermeasures(EmissionCountermeasure::DEFEND, force);
	strcpy_s(TACAN.callsign, 4, "TKR");
	setTACAN(TACAN, force);
	setRadio(radio, force);
	setGeneralSettings(generalSettings, force);
}

void AirUnit::setState(unsigned char newState)
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
			setTargetPosition(Coords(NULL));
			break;
		}
		case State::LAND_AT_POINT: {
			break;
		}
		default:
			break;
		}
	}

	/************ Perform any action required when ENTERING a state ************/
	switch (newState) {
	case State::IDLE: {
		setEnableTaskCheckFailed(false);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::REACH_DESTINATION: {
		setEnableTaskCheckFailed(true);
		resetActiveDestination();
		break;
	}
	case State::ATTACK: {
		setEnableTaskCheckFailed(true);
		if (isTargetAlive()) {
			Unit* target = unitsManager->getUnit(targetID);
			Coords targetPosition = Coords(target->getPosition().lat, target->getPosition().lng, 0);
			clearActivePath();
			pushActivePathFront(targetPosition);
			resetActiveDestination();
		}
		break;
	}
	case State::FOLLOW: {
		setEnableTaskCheckFailed(true);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::LAND: {
		setEnableTaskCheckFailed(false);
		resetActiveDestination();
		break;
	}
	case State::REFUEL: {
		setEnableTaskCheckFailed(true);
		initialFuel = fuel;
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::BOMB_POINT: {
		setEnableTaskCheckFailed(true);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::CARPET_BOMB: {
		setEnableTaskCheckFailed(true);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::BOMB_BUILDING: {
		setEnableTaskCheckFailed(true);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::LAND_AT_POINT:  {
		setEnableTaskCheckFailed(true);
		resetActiveDestination();
		break;
	}
	default:
		break;
	}

	resetTask();

	log(unitName + " setting state from " + to_string(state) + " to " + to_string(newState));
	state = newState;

	triggerUpdate(DataIndex::state);
}

void AirUnit::AIloop()
{
	/* State machine */
	switch (state) {
		case State::IDLE: {
			if (isActiveTanker)
				setTask("Tanker racetrack");
			else if (isActiveAWACS)
				setTask("AWACS racetrack");
			else
				setTask("Idle");
			
			if (!getHasTask())
			{
				std::ostringstream taskSS;
				if (isActiveTanker) {
					taskSS << "{ [1] = { id = 'Tanker' }, [2] = { id = 'Orbit', pattern = 'Race-Track', altitude = " << 
						desiredAltitude << ", speed = " << desiredSpeed << ", altitudeType = '" << 
						(desiredAltitudeType ? "AGL" : "ASL") << "', speedType = '" << (desiredSpeedType ? "GS" : "CAS") << "' }}";
				}
				else if (isActiveAWACS) {
					taskSS << "{ [1] = { id = 'AWACS' }, [2] = { id = 'Orbit', pattern = 'Circle', altitude = " << 
						desiredAltitude << ", speed = " << desiredSpeed << ", altitudeType = '" << 
						(desiredAltitudeType ? "AGL" : "ASL") << "', speedType = '" << (desiredSpeedType ? "GS" : "CAS") << "' }}";
				}
				else {
					taskSS << "{ id = 'Orbit', pattern = 'Circle', altitude = " << 
						desiredAltitude << ", speed = " << desiredSpeed << ", altitudeType = '" << 
						(desiredAltitudeType ? "AGL" : "ASL") << "', speedType = '" << (desiredSpeedType ? "GS" : "CAS") << "'}";
				}
				Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
				scheduler->appendCommand(command);
				setHasTask(true);
			}
			break;
		}
		case State::REACH_DESTINATION: {
			string enrouteTask = "";
			bool looping = false;

			if (isActiveTanker)
			{
				enrouteTask = "{ id = 'Tanker' }";
				setTask("Tanker");
			}
			else if (isActiveAWACS)
			{
				enrouteTask = "{ id = 'AWACS' }";
				setTask("AWACS");
			}
			else
			{
				enrouteTask = "nil";
				setTask("Reaching destination");
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
			string enrouteTask = "{ id = 'Land' }";
			setTask("Landing");

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
			std::ostringstream enrouteTaskSS;
			enrouteTaskSS << "{"
				<< "id = 'EngageUnit'" << ","
				<< "targetID = " << targetID << ","
				<< "}";
			string enrouteTask = enrouteTaskSS.str();
			setTask("Attacking " + getTargetName());
			
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

			setTask("Following " + getTargetName());

			Unit* leader = unitsManager->getUnit(leaderID);
			if (!getHasTask()) {
				if (leader != nullptr && leader->getAlive() && formationOffset != NULL)
				{
					std::ostringstream taskSS;
					taskSS << "{"
						<< "id = 'FollowUnit'" << ", "
						<< "leaderID = " << leader->getID() << ","
						<< "offset = {" 
						<< "x = " << formationOffset.x << ","
						<< "y = " << formationOffset.y << ","
						<< "z = " << formationOffset.z 
						<< "},"
						<< "}";
					Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
					scheduler->appendCommand(command);
					setHasTask(true);
				}
			}
			break;
		}
		case State::REFUEL: {
			setTask("Refueling");

			if (!getHasTask()) {
				if (fuel <= initialFuel) {
					std::ostringstream taskSS;
					taskSS << "{"
						<< "id = 'Refuel'"
						<< "}";
					Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
					scheduler->appendCommand(command);
					setHasTask(true);
				}
				else {
					setState(State::IDLE);
				}
			}
			break;
		}
		case State::BOMB_POINT: {
			setTask("Bombing point");

			if (!getHasTask()) {
				std::ostringstream taskSS;
				taskSS.precision(10);

				taskSS << "{id = 'Bombing', lat = " << targetPosition.lat << ", lng = " << targetPosition.lng << "}";
				Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
				scheduler->appendCommand(command);
				setHasTask(true);
			}
			break;
		}
		case State::CARPET_BOMB: {
			setTask("Carpet bombing");

			if (!getHasTask()) {
				std::ostringstream taskSS;
				taskSS.precision(10);

				taskSS << "{id = 'CarpetBombing', lat = " << targetPosition.lat << ", lng = " << targetPosition.lng << "}";
				Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
				scheduler->appendCommand(command);
				setHasTask(true);
			}
			break;
		}
		case State::BOMB_BUILDING: {
			setTask("Bombing building");

			if (!getHasTask()) {
				std::ostringstream taskSS;
				taskSS.precision(10);

				taskSS << "{id = 'AttackMapObject', lat = " << targetPosition.lat << ", lng = " << targetPosition.lng << "}";
				Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
				scheduler->appendCommand(command);
				setHasTask(true);
			}
			break;
		}
		case State::LAND_AT_POINT: {
			setTask("Landing at point");

			if (!getHasTask()) {
				setActiveDestination();
				std::ostringstream taskSS;
				taskSS.precision(10),
				taskSS << "{"
					<< "id = 'LandAtPoint', "
					<< "lat = " << activeDestination.lat << ", "
					<< "lng = " << activeDestination.lng 
					<< "}";
				Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
				scheduler->appendCommand(command);
				setHasTask(true);
			}
			break;
		}
		default:
			break;
	}
}
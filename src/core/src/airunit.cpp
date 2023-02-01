#include "airunit.h"
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

/* Air unit */
AirUnit::AirUnit(json::value json, int ID) : Unit(json, ID)
{

};

void AirUnit::setState(int newState) 
{
	if (state != newState)
	{
		switch (state) {
		case State::IDLE: {
			break;
		}
		case State::REACH_DESTINATION: {
			break;
		}
		case State::ATTACK: {
			setTarget(NULL);
			break;
		}
		case State::FOLLOW: {
			break;
		}
		case State::WINGMAN: {
			if (isWingman)
				return;
			break;
		}
		default:
			break;
		}

		switch (newState) {
		case State::IDLE: {
			resetActiveDestination();
			break;
		}
		case State::REACH_DESTINATION: {
			resetActiveDestination();
			break;
		}
		case State::ATTACK: {
			if (isTargetAlive()) {
				Unit* target = unitsFactory->getUnit(targetID);
				Coords targetPosition = Coords(target->getLatitude(), target->getLongitude(), 0);
				activePath.clear();
				activePath.push_front(targetPosition);
				resetActiveDestination();
			}
			break;
		}
		case State::FOLLOW: {
			resetActiveDestination();
			break;
		}
		case State::WINGMAN: {
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
	activePath.clear();
	Coords point1;
	Coords point2;
	Coords point3;
	Geodesic::WGS84().Direct(latitude, longitude, 45, 10000, point1.lat, point1.lng);
	Geodesic::WGS84().Direct(point1.lat, point1.lng, 135, 10000, point2.lat, point2.lng);
	Geodesic::WGS84().Direct(point2.lat, point2.lng, 225, 10000, point3.lat, point3.lng);
	activePath.push_back(point1);
	activePath.push_back(point2);
	activePath.push_back(point3);
	activePath.push_back(Coords(latitude, longitude));
	log(unitName + L" holding pattern created");
}

bool AirUnit::updateActivePath(bool looping)
{
	if (activePath.size() > 0)
	{
		/* Push the next destination in the queue to the front */
		if (looping)
			activePath.push_back(activePath.front());
		activePath.pop_front();
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

void AirUnit::taskWingmen()
{
	switch (state) {
		case State::IDLE:
		case State::REACH_DESTINATION:
		case State::ATTACK:{
			int idx = 1;
			for (auto const& wingman : wingmen)
			{
				if (!wingman->getIsWingman())
				{
					wingman->setIsWingman(true);
					wingman->setLeader(this);
				}

				if (wingman->getFormation().compare(formation) != 0)
				{
					wingman->resetTask();
					wingman->setFormation(formation);
					if (formation.compare(L"Line abreast") == 0)
						wingman->setFormationOffset(Offset(0 * idx, 0 * idx, 1852 * idx));
					idx++;
				}
			}
			break;
		}
		default:
			break;
	}
}

void AirUnit::AIloop()
{
	/* State machine */
	switch (state) {
		case State::IDLE: {
			wstring enrouteTask = L"nil";
			currentTask = L"Idle";
			
			if (activeDestination == NULL || !hasTask)
			{
				createHoldingPattern();		
				setActiveDestination();		
				goToDestination(enrouteTask);
			}
			else {
				if (isDestinationReached() && updateActivePath(true) && setActiveDestination()) 
					goToDestination(enrouteTask);	
			}

			if (isLeader)
				taskWingmen();
			break;
		}
		case State::REACH_DESTINATION: {
			wstring enrouteTask = L"nil";
			currentTask = L"Reaching destination";
			
			if (activeDestination == NULL || !hasTask)
			{
				setActiveDestination();
				goToDestination(enrouteTask);
			}
			else {
				if (isDestinationReached()) {
					if (updateActivePath(false) && setActiveDestination())
						goToDestination(enrouteTask);
					else {
						setState(State::IDLE);
						break;
					}
				}
			}

			if (isLeader)
				taskWingmen();
			
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
			currentTask = L"Attacking " + getTarget();
			
			if (activeDestination == NULL || !hasTask)
			{
				setActiveDestination();
				goToDestination(enrouteTask);
			}
			else {
				if (isDestinationReached()) {
					if (updateActivePath(false) && setActiveDestination())
						goToDestination(enrouteTask);
					else {
						setState(State::IDLE);
						break;
					}
				}
			}

			if (isLeader)
				taskWingmen();

			break;
		}
		case State::FOLLOW: {
			/* TODO */
			setState(State::IDLE);
			break;
		}
		case State::WINGMAN: {
			/* In the WINGMAN state, the unit relinquishes control to the leader */
			activePath.clear();
			activeDestination = Coords(NULL);
			if (leader == nullptr || !leader->getAlive())
			{
				this->setFormation(L"");
				this->setIsWingman(false);
				break;
			}
			if (!hasTask) {
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
					hasTask = true;
				}
			}
			break;
		}
		default:
			break;
	}
}

void AirUnit::setTargetSpeed(double newTargetSpeed) {
	targetSpeed = newTargetSpeed;
	goToDestination();
}

void AirUnit::setTargetAltitude(double newTargetAltitude) {
	targetAltitude = newTargetAltitude;
	goToDestination();
}
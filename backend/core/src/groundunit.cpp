#include "groundunit.h"
#include "utils.h"
#include "logger.h"
#include "commands.h"
#include "scheduler.h"
#include "defines.h"
#include "unitsmanager.h"

#include <GeographicLib/Geodesic.hpp>
using namespace GeographicLib;

extern Scheduler* scheduler;
extern UnitsManager* unitsManager;
json::value GroundUnit::database = json::value();
extern string instancePath;

#define RANDOM_ZERO_TO_ONE (double)(rand()) / (double)(RAND_MAX)
#define RANDOM_MINUS_ONE_TO_ONE (((double)(rand()) / (double)(RAND_MAX) - 0.5) * 2)

void GroundUnit::loadDatabase(string path) {
	std::ifstream ifstream(instancePath + path);
	std::stringstream ss;
	ss << ifstream.rdbuf();
	std::error_code errorCode;
	database = json::value::parse(ss.str(), errorCode);
	if (database.is_object())
		log("GroundUnits database loaded correctly from " + instancePath + path);
	else
		log("Error reading GroundUnits database file");
}

/* Ground unit */
GroundUnit::GroundUnit(json::value json, unsigned int ID) : Unit(json, ID)
{
	log("New Ground Unit created with ID: " + to_string(ID));

	setCategory("GroundUnit");
	setDesiredSpeed(10);
};

void GroundUnit::setDefaults(bool force)
{
	if (!getAlive() || !getControlled() || getHuman() || !getIsLeader()) return;

	/* Set the default IDLE state */
	setState(State::IDLE);

	/* Set the default options */
	setROE(ROE::WEAPON_FREE, force);
	setOnOff(onOff, force);
	setFollowRoads(followRoads, force);
}

void GroundUnit::setState(unsigned char newState)
{
	Coords currentTargetPosition = getTargetPosition();

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
		case State::FIRE_AT_AREA: 
		case State::SIMULATE_FIRE_FIGHT: 
		case State::SCENIC_AAA:
		case State::MISS_ON_PURPOSE: {
			setTargetPosition(Coords(NULL));
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
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::FIRE_AT_AREA: {
		setTargetPosition(currentTargetPosition);
		setEnableTaskCheckFailed(true);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::SIMULATE_FIRE_FIGHT: {
		setTargetPosition(currentTargetPosition);
		setEnableTaskCheckFailed(false);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::SCENIC_AAA: {
		setEnableTaskCheckFailed(false);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::MISS_ON_PURPOSE: {
		setEnableTaskCheckFailed(false);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	default:
		break;
	}

	setHasTask(false);
	resetTaskFailedCounter();

	log(unitName + " setting state from " + to_string(state) + " to " + to_string(newState));
	state = newState;

	triggerUpdate(DataIndex::state);

	AIloop();
}

void GroundUnit::AIloop()
{
	srand(static_cast<unsigned int>(time(NULL)) + ID);

	switch (state) {
	case State::IDLE: {
		setTask("Idle");
		if (getHasTask())
			resetTask();
		break;
	}
	case State::REACH_DESTINATION: {
		setTask("Reaching destination");

		string enrouteTask = "";
		bool looping = false;

		std::ostringstream taskSS;
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
	case State::ATTACK: {
		Unit* target = unitsManager->getUnit(getTargetID());
		if (target != nullptr) {
			setTask("Attacking " + target->getUnitName());

			if (!getHasTask()) {
				/* Send the command */
				std::ostringstream taskSS;
				taskSS.precision(10);
				taskSS << "{id = 'AttackUnit', unitID = " << target->getID() << " }";
				Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
				scheduler->appendCommand(command);
				setHasTask(true);
			}
		}
		else {
			setState(State::IDLE);
		}

		break;
	}
	case State::FIRE_AT_AREA: {
		setTask("Firing at area");

		if (!getHasTask()) {
			std::ostringstream taskSS;
			taskSS.precision(10);
			taskSS << "{id = 'FireAtPoint', lat = " << targetPosition.lat << ", lng = " << targetPosition.lng << ", radius = 100}";
			Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
			scheduler->appendCommand(command);
			setHasTask(true);
		}

		break;
	}
	case State::SIMULATE_FIRE_FIGHT: {
		setTask("Simulating fire fight");

		if (internalCounter == 0 && targetPosition != Coords(NULL) && scheduler->getLoad() < 30) {
			/* Get the distance and bearing to the target */
			Coords scatteredTargetPosition = targetPosition;
			double distance;
			double bearing1;
			double bearing2;
			Geodesic::WGS84().Inverse(getPosition().lat, getPosition().lng, scatteredTargetPosition.lat, scatteredTargetPosition.lng, distance, bearing1, bearing2);

			/* Compute the scattered position applying a random scatter to the shot */
			double scatterDistance = distance * tan(10 /* degs */ * (ShotsScatter::LOW - shotsScatter) / 57.29577 + 2 / 57.29577 /* degs */) * RANDOM_MINUS_ONE_TO_ONE;
			Geodesic::WGS84().Direct(scatteredTargetPosition.lat, scatteredTargetPosition.lng, bearing1 + 90, scatterDistance, scatteredTargetPosition.lat, scatteredTargetPosition.lng);
			
			/* Recover the data from the database */
			double aimTime = 2; /* s */
			bool indirectFire = false;
			double shotsBaseInterval = 15; /* s */
			if (database.has_object_field(to_wstring(name))) {
				json::value databaseEntry = database[to_wstring(name)];
				if (databaseEntry.has_number_field(L"aimTime"))
					aimTime = databaseEntry[L"aimTime"].as_number().to_double();
				if (databaseEntry.has_boolean_field(L"indirectFire"))
					indirectFire = databaseEntry[L"indirectFire"].as_bool();
				if (databaseEntry.has_number_field(L"shotsBaseInterval"))
					shotsBaseInterval = databaseEntry[L"shotsBaseInterval"].as_number().to_double();
			}

			/* If the unit is of the indirect fire type, like a mortar, simply shoot at the target */
			if (indirectFire) {
				log(unitName + "(" + name + ")" + " simulating fire fight with indirect fire");
				std::ostringstream taskSS;
				taskSS.precision(10);
				taskSS << "{id = 'FireAtPoint', lat = " << scatteredTargetPosition.lat << ", lng = " << scatteredTargetPosition.lng << ", radius = 100}";
				Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
				scheduler->appendCommand(command);
				setHasTask(true);
			}
			/* Otherwise use the aim method */
			else {
				log(unitName + "(" + name + ")" + " simulating fire fight with aim at point method");
				aimAtPoint(scatteredTargetPosition);
			}

			/* Wait an amout of time depending on the shots intensity */
			internalCounter = static_cast<unsigned int>(((ShotsIntensity::HIGH - shotsIntensity) * shotsBaseInterval + aimTime) / FRAMERATE_TIME_INTERVAL);
		}

		if (targetPosition == Coords(NULL))
			setState(State::IDLE);

		/* Fallback if something went wrong */
		if (internalCounter == 0)
			internalCounter = static_cast<unsigned int>(3 / FRAMERATE_TIME_INTERVAL);
		internalCounter--;

		break;
	}
	case State::SCENIC_AAA: {
		setTask("Scenic AAA");

		/* Only perform scenic functions when the scheduler is "free" */
		if (((!getHasTask() && scheduler->getLoad() < 30) || internalCounter == 0)) {
			double distance = 0;
			unsigned char unitCoalition = coalition == 0 ? getOperateAs() : coalition;
			unsigned char targetCoalition = unitCoalition == 2 ? 1 : 2;
			Unit* target = unitsManager->getClosestUnit(this, targetCoalition, { "Aircraft", "Helicopter" }, distance);

			/* Recover the data from the database */
			double aimTime = 2; /* s */
			double shotsBaseInterval = 15; /* s */
			if (database.has_object_field(to_wstring(name))) {
				json::value databaseEntry = database[to_wstring(name)];
				if (databaseEntry.has_number_field(L"aimTime"))
					aimTime = databaseEntry[L"aimTime"].as_number().to_double();
				if (databaseEntry.has_number_field(L"shotsBaseInterval"))
					shotsBaseInterval = databaseEntry[L"shotsBaseInterval"].as_number().to_double();
			}

			/* Only run if an enemy air unit is closer than 20km to avoid useless load */
			if (target != nullptr && distance < 20000 /* m */) {
				double r = 15; /* m */
				double barrelElevation = r * tan(acos(((double)(rand()) / (double)(RAND_MAX))));

				double lat = 0;
				double lng = 0;
				double randomBearing = ((double)(rand()) / (double)(RAND_MAX)) * 360;
				Geodesic::WGS84().Direct(position.lat, position.lng, randomBearing, r, lat, lng);

				std::ostringstream taskSS;
				taskSS.precision(10);
				taskSS << "{id = 'FireAtPoint', lat = " << lat << ", lng = " << lng << ", alt = " << position.alt + barrelElevation << ", radius = 0.001}";
				Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
				scheduler->appendCommand(command);
				setHasTask(true);

				/* Wait an amout of time depending on the shots intensity */
				internalCounter = static_cast<unsigned int>(((ShotsIntensity::HIGH - shotsIntensity) * shotsBaseInterval + aimTime) / FRAMERATE_TIME_INTERVAL);
			}
		}

		if (internalCounter == 0)
			internalCounter = static_cast<unsigned int>(3 / FRAMERATE_TIME_INTERVAL);
		internalCounter--;

		break;
	}
	case State::MISS_ON_PURPOSE: {
		setTask("Missing on purpose");

		/* Check that the unit can perform AAA duties */
		bool canAAA = false;
		if (database.has_object_field(to_wstring(name))) {
			json::value databaseEntry = database[to_wstring(name)];
			if (databaseEntry.has_boolean_field(L"canAAA"))
				canAAA = databaseEntry[L"canAAA"].as_bool();
		}

		if (canAAA) {
			/* Only perform scenic functions when the scheduler is "free" */
			/* Only run this when the internal counter reaches 0 to avoid excessive computations when no nearby target */
			if (scheduler->getLoad() < 30 && internalCounter == 0) {
				double distance = 0;
				unsigned char unitCoalition = coalition == 0 ? getOperateAs() : coalition;
				unsigned char targetCoalition = unitCoalition == 2 ? 1 : 2;
				
				/* Default gun values */
				double barrelHeight = 1.0; /* m */
				double muzzleVelocity = 860; /* m/s */
				double aimTime = 10; /* s */
				unsigned int shotsToFire = 10;
				double shotsBaseInterval = 15; /* s */
				double shotsBaseScatter = 2; /* degs */
				double engagementRange = 10000; /* m */
				double targetingRange = 0; /* m */
				double aimMethodRange = 0; /* m */
				double acquisitionRange = 0; /* m */

				/* Load gun values from database */
				if (database.has_object_field(to_wstring(name))) {
					json::value databaseEntry = database[to_wstring(name)];
					if (databaseEntry.has_number_field(L"barrelHeight"))
						barrelHeight = databaseEntry[L"barrelHeight"].as_number().to_double();
					if (databaseEntry.has_number_field(L"muzzleVelocity"))
						muzzleVelocity = databaseEntry[L"muzzleVelocity"].as_number().to_double();
					if (databaseEntry.has_number_field(L"aimTime"))
						aimTime = databaseEntry[L"aimTime"].as_number().to_double();
					if (databaseEntry.has_number_field(L"shotsToFire"))
						shotsToFire = databaseEntry[L"shotsToFire"].as_number().to_uint32();
					if (databaseEntry.has_number_field(L"engagementRange"))
						engagementRange = databaseEntry[L"engagementRange"].as_number().to_double();
					if (databaseEntry.has_number_field(L"shotsBaseInterval"))
						shotsBaseInterval = databaseEntry[L"shotsBaseInterval"].as_number().to_double();
					if (databaseEntry.has_number_field(L"shotsBaseScatter"))
						shotsBaseScatter = databaseEntry[L"shotsBaseScatter"].as_number().to_double();
					if (databaseEntry.has_number_field(L"targetingRange"))
						targetingRange = databaseEntry[L"targetingRange"].as_number().to_double();
					if (databaseEntry.has_number_field(L"aimMethodRange"))
						aimMethodRange = databaseEntry[L"aimMethodRange"].as_number().to_double();
					if (databaseEntry.has_number_field(L"acquisitionRange"))
						acquisitionRange = databaseEntry[L"acquisitionRange"].as_number().to_double();
				}

				/* Get all the units in range and select one at random */
				double range = max(max(engagementRange, aimMethodRange), acquisitionRange);
				map<Unit*, double> targets = unitsManager->getUnitsInRange(this, targetCoalition, { "Aircraft", "Helicopter" }, range);

				Unit* target = nullptr;
				unsigned int index = static_cast<unsigned int>((RANDOM_ZERO_TO_ONE * (targets.size() - 1)));
				for (auto const& p : targets) {
					if (index-- == 0) {
						target = p.first;
						distance = p.second;
					}
				}

				/* Only do if we have a valid target close enough for AAA */
				if (target != nullptr) {
					/* Approximate the flight time */
					if (muzzleVelocity != 0)
						aimTime += distance / muzzleVelocity;

					/* If the target is in targeting range and we are in highest precision mode, target it */
					if (distance < targetingRange && shotsScatter == ShotsScatter::LOW) {
						/* Send the command */
						std::ostringstream taskSS;
						taskSS.precision(10);
						taskSS << "{id = 'AttackUnit', unitID = " << target->getID() << " }";
						Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
						scheduler->appendCommand(command);
						setHasTask(true);

						internalCounter = static_cast<unsigned int>((aimTime + (ShotsIntensity::HIGH - shotsIntensity) * shotsBaseInterval + 2) / FRAMERATE_TIME_INTERVAL);
					}
					/* Else, do miss on purpose */
					else {
						/* Compute where the target will be in aimTime seconds, plus the effect of scatter. */
						double scatterDistance = distance * tan(shotsBaseScatter * (ShotsScatter::LOW - shotsScatter) / 57.29577) * (RANDOM_ZERO_TO_ONE - 0.1);
						double aimDistance = target->getHorizontalVelocity() * aimTime + scatterDistance;
						double aimLat = 0;
						double aimLng = 0;
						Geodesic::WGS84().Direct(target->getPosition().lat, target->getPosition().lng, target->getTrack() * 57.29577, aimDistance, aimLat, aimLng); /* TODO make util to convert degrees and radians function */
						double aimAlt = target->getPosition().alt + target->getVerticalVelocity() * aimTime + distance * tan(shotsBaseScatter * (ShotsScatter::LOW - shotsScatter) / 57.29577) * RANDOM_ZERO_TO_ONE; // Force to always miss high never low

						/* Send the command */
						if (distance < engagementRange) {
							/* If the unit is closer than the engagement range, use the fire at point method */
							std::ostringstream taskSS;
							taskSS.precision(10);
							taskSS << "{id = 'FireAtPoint', lat = " << aimLat << ", lng = " << aimLng << ", alt = " << aimAlt << ", radius = 0.001, expendQty = " << shotsToFire << " }";
							Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
							scheduler->appendCommand(command);
							setHasTask(true);
							setTargetPosition(Coords(aimLat, aimLng, target->getPosition().alt));
							internalCounter = static_cast<unsigned int>((aimTime + (ShotsIntensity::HIGH - shotsIntensity) * shotsBaseInterval + 2) / FRAMERATE_TIME_INTERVAL);
						}
						else if (distance < aimMethodRange) {
							/* If the unit is closer than the aim method range, use the aim method range */
							aimAtPoint(Coords(aimLat, aimLng, aimAlt));
							setTargetPosition(Coords(aimLat, aimLng, target->getPosition().alt));
							internalCounter = static_cast<unsigned int>((aimTime + (ShotsIntensity::HIGH - shotsIntensity) * shotsBaseInterval + 2) / FRAMERATE_TIME_INTERVAL);
						}
						else {
							/* Else just wake the unit up with an impossible command */
							std::ostringstream taskSS;
							taskSS.precision(10);
							taskSS << "{id = 'FireAtPoint', lat = " << 0 << ", lng = " << 0 << ", alt = " << 0 << ", radius = 0.001, expendQty = " << 0 << " }";
							Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
							scheduler->appendCommand(command);
							setHasTask(true);
							setTargetPosition(Coords(NULL));

							/* Don't wait too long before checking again */
							internalCounter = static_cast<unsigned int>(5 / FRAMERATE_TIME_INTERVAL);
						}
					}
					missOnPurposeTarget = target;
				}
				else {
					if (getHasTask())
						resetTask();
				}
			}

			/* If no valid target was detected */
			if (internalCounter == 0) {
				double alertnessTimeConstant = 10; /* s */
				if (database.has_object_field(to_wstring(name))) {
					json::value databaseEntry = database[to_wstring(name)];
					if (databaseEntry.has_number_field(L"alertnessTimeConstant"))
						alertnessTimeConstant = databaseEntry[L"alertnessTimeConstant"].as_number().to_double();
				}
				internalCounter = static_cast<unsigned int>((5 + RANDOM_ZERO_TO_ONE * alertnessTimeConstant * 0 /* TODO: remove to enable alertness again */) / FRAMERATE_TIME_INTERVAL);
				missOnPurposeTarget = nullptr;
				setTargetPosition(Coords(NULL));
			}
			internalCounter--;
		}
		else {
			setState(State::IDLE);
		}

		break;
	}
	default:
		break;
	}
}


void GroundUnit::aimAtPoint(Coords aimTarget) {
	double dist;
	double bearing1;
	double bearing2;
	Geodesic::WGS84().Inverse(position.lat, position.lng, aimTarget.lat, aimTarget.lng, dist, bearing1, bearing2);

	/* Aim point distance */
	double r = 15; /* m */

	/* Default gun values */
	double barrelHeight = 1.0; /* m */
	double muzzleVelocity = 860; /* m/s */
	double shotsBaseScatter = 5; /* degs */
	if (database.has_object_field(to_wstring(name))) {
		json::value databaseEntry = database[to_wstring(name)];
		if (databaseEntry.has_number_field(L"barrelHeight") && databaseEntry.has_number_field(L"muzzleVelocity")) {
			barrelHeight = databaseEntry[L"barrelHeight"].as_number().to_double();
			muzzleVelocity = databaseEntry[L"muzzleVelocity"].as_number().to_double();
		}
		if (databaseEntry.has_number_field(L"shotsBaseScatter"))
			shotsBaseScatter = databaseEntry[L"shotsBaseScatter"].as_number().to_double();
	}

	/* Compute the elevation angle of the gun*/
	double deltaHeight = (aimTarget.alt - (position.alt + barrelHeight));
	double alpha = 9.81 / 2 * dist * dist / (muzzleVelocity * muzzleVelocity);
	double inner = dist * dist - 4 * alpha * (alpha + deltaHeight);

	/* Check we can reach the target*/
	if (inner > 0) {
		/* Compute elevation and bearing */
		double barrelElevation = r * (dist - sqrt(inner)) / (2 * alpha);

		double lat = 0;
		double lng = 0;
		Geodesic::WGS84().Direct(position.lat, position.lng, bearing1, r, lat, lng);

		log(unitName + "(" + name + ")" + " shooting with aim at point method. Barrel elevation: " + to_string(barrelElevation * 57.29577) + "�, bearing: " + to_string(bearing1) + "�");

		std::ostringstream taskSS;
		taskSS.precision(10);
		taskSS << "{id = 'FireAtPoint', lat = " << lat << ", lng = " << lng << ", alt = " << position.alt + barrelElevation + barrelHeight << ", radius = 0.001}";
		Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
		scheduler->appendCommand(command);
		setHasTask(true);
	}
	else {
		log("Target out of range for " + unitName + "(" + name + ")");
	}
}

void GroundUnit::changeSpeed(string change)
{
	if (change.compare("stop") == 0)
		setState(State::IDLE);
	else if (change.compare("slow") == 0)
		setDesiredSpeed(getDesiredSpeed() - knotsToMs(5));
	else if (change.compare("fast") == 0)
		setDesiredSpeed(getDesiredSpeed() + knotsToMs(5));

	if (getDesiredSpeed() < 0)
		setDesiredSpeed(0);
}

void GroundUnit::setOnOff(bool newOnOff, bool force) 
{
	if (newOnOff != onOff || force) {
		Unit::setOnOff(newOnOff, force);
		Command* command = dynamic_cast<Command*>(new SetOnOff(groupName, onOff));
		scheduler->appendCommand(command);
	}
}

void GroundUnit::setFollowRoads(bool newFollowRoads, bool force)
{
	if (newFollowRoads != followRoads || force) {
		Unit::setFollowRoads(newFollowRoads, force);
		resetActiveDestination(); /* Reset active destination to apply option*/
	}
}

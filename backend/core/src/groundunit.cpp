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
	/* Load gun values from database */
	if (database.has_object_field(to_wstring(name))) {
		json::value databaseEntry = database[to_wstring(name)];
		if (databaseEntry.has_number_field(L"barrelHeight"))
			setBarrelHeight(databaseEntry[L"barrelHeight"].as_number().to_double());
		if (databaseEntry.has_number_field(L"muzzleVelocity"))
			setMuzzleVelocity(databaseEntry[L"muzzleVelocity"].as_number().to_double());
		if (databaseEntry.has_number_field(L"aimTime"))
			setAimTime(databaseEntry[L"aimTime"].as_number().to_double());
		if (databaseEntry.has_number_field(L"shotsToFire"))
			setShotsToFire(databaseEntry[L"shotsToFire"].as_number().to_uint32());
		if (databaseEntry.has_number_field(L"engagementRange"))
			setEngagementRange(databaseEntry[L"engagementRange"].as_number().to_double());
		if (databaseEntry.has_number_field(L"shotsBaseInterval"))
			setShotsBaseInterval(databaseEntry[L"shotsBaseInterval"].as_number().to_double());
		if (databaseEntry.has_number_field(L"shotsBaseScatter"))
			setShotsBaseScatter(databaseEntry[L"shotsBaseScatter"].as_number().to_double());
		if (databaseEntry.has_number_field(L"targetingRange"))
			setTargetingRange(databaseEntry[L"targetingRange"].as_number().to_double());
		if (databaseEntry.has_number_field(L"aimMethodRange"))
			setAimMethodRange(databaseEntry[L"aimMethodRange"].as_number().to_double());
		if (databaseEntry.has_number_field(L"acquisitionRange"))
			setAcquisitionRange(databaseEntry[L"acquisitionRange"].as_number().to_double());
	}
	
	if (!getAlive() || !getControlled() || getHuman() || !getIsLeader()) return;

	/* Set the default IDLE state */
	setState(State::IDLE);

	/* Set the default options */
	setROE(ROE::OPEN_FIRE_WEAPON_FREE, force);
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
		case State::EMBARKING:
		case State::DISEMBARKING: {
			setTargetID(NULL);
			break;
		}
		case State::ATTACK: {
			setTargetID(NULL);
			break;
		}
		case State::FIRE_AT_AREA: 
		case State::SIMULATE_FIRE_FIGHT: 
		case State::SIMULATE_ENGAGEMENT:
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
		setTask("Idle");
		setEnableTaskCheckFailed(false);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::REACH_DESTINATION: {
		setTask("Reaching destination");
		setEnableTaskCheckFailed(true);
		resetActiveDestination();
		break;
	}
	case State::EMBARKING: {
		if (targetID == NULL) {
			log("Cannot set state to EMBARKING for unit " + unitName + " because it has no targetID");
		}
		else {
			computePathToEmbark();
			log("Computing path to embark for unit " + unitName);
		}
		break;
	}
	case State::ATTACK: {
		setEnableTaskCheckFailed(true);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::FIRE_AT_AREA: {
		setTask("Firing at area");
		setTargetPosition(currentTargetPosition);
		setEnableTaskCheckFailed(true);
		clearActivePath();
		resetActiveDestination();
		shellsFiredAtTasking = totalShellsFired;
		break;
	}
	case State::SIMULATE_FIRE_FIGHT: {
		setTask("Simulating fire fight");
		setTargetPosition(currentTargetPosition);
		setEnableTaskCheckFailed(false);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::SIMULATE_ENGAGEMENT: {
		setTask("Simulating engagement");
		setEnableTaskCheckFailed(false);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::SCENIC_AAA: {
		setTask("Scenic AAA");
		setEnableTaskCheckFailed(false);
		clearActivePath();
		resetActiveDestination();
		break;
	}
	case State::MISS_ON_PURPOSE: {
		setTask("Miss on purpose");
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
	nextTaskingMilliseconds = 0;

	unsigned long timeNow = std::chrono::system_clock::now().time_since_epoch() / std::chrono::milliseconds(1);

	/* For scenic modes we add some variability to the initial tasking milliseconds to avoid all units acting at the same time */
	if (newState == State::SCENIC_AAA || newState == State::MISS_ON_PURPOSE || newState == State::SIMULATE_ENGAGEMENT || newState == State::SIMULATE_FIRE_FIGHT) {
		nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(aimTime * 1000 * RANDOM_ZERO_TO_ONE);
	}

	/* In embarking mode we set a timer to check if the unit is stuck */
	if (newState == State::EMBARKING || newState == State::REACH_DESTINATION) {
		nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(20 * 1000);
	}

	log(unitName + " setting state from " + to_string(state) + " to " + to_string(newState));
	state = newState;

	triggerUpdate(DataIndex::state);

	/* Reset the stuck counter when entering a new state to avoid getting stuck indefinitely in case we transition back to reaching destination after being stuck */ 
	stuckCounter = 0;

	AIloop();
}

void GroundUnit::AIloop()
{
	unsigned long timeNow = std::chrono::system_clock::now().time_since_epoch() / std::chrono::milliseconds(1);

	/* Update the suppression level value */
	updateSuppressionLevel();

	double currentAmmo = computeTotalAmmo();
	/* Out of ammo */
	if (shotsToFire > 0 && currentAmmo < shotsToFire && state != State::IDLE && state != State::REACH_DESTINATION && state != State::FIRE_AT_AREA)
		setState(State::IDLE);
	
	/* Account for unit reloading */
	if (currentAmmo < oldAmmo)
		totalShellsFired += oldAmmo - currentAmmo;
	oldAmmo = currentAmmo;

	/* Get the coalition of the unit.If the unit is neutral, we use the "operate as" coalition to determine the behavior in scenic modes */
	unsigned char unitEffectiveCoalition = coalition == 0 ? getOperateAs() : coalition;

	/* If we are moving, reset the stuck counter */
	if (getSpeed() > 0.1) {
		stuckCounter = 0;
	}

	switch (state) {
	case State::IDLE: {
		if (getHasTask())
			resetTask();

		break;
	}
	case State::REACH_DESTINATION:
	case State::EMBARKING: {
		string enrouteTask = "";
		bool looping = false;

		std::ostringstream taskSS;
		taskSS << "{ id = 'FollowRoads', value = " << (getFollowRoads() ? "true" : "false") << " }";
		enrouteTask = taskSS.str();

		/* If we don't have an active destination, try to set it. 
		If we can't set it, transition to idle. If we can set it, go to the destination. 
		If we already have an active destination, check if we have reached it. 
		If we have reached it, try to update the active path. 
		If we can update the active path and set a new active destination, go to the new destination. 
		Otherwise, transition to idle */
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

		/* If we are in embarking state, check if the transporter is still eligible. If yes, embark on it */
		if (state == State::EMBARKING) {
			Unit* transport = unitsManager->getUnit(getTargetID());
			if (transport == nullptr || !transport->getAlive() || transport->getOnBoardUnitsIDs().size() == transport->getMaximumTransportableUnits() || transport->getAirborne() || transport->getSpeed() > 2) {
				setState(State::IDLE);
			}
			else {
				embarkOnTransport(transport);
			}
		}

		/* If we are in reaching destination state check if the unit is stuck */
		if (state == State::REACH_DESTINATION) {
			// If the unit is not moving after timeToNextTasking, reset the destination to try and get it unstuck
			// If the unit is still not moving after 3 tries, stop trying to reach the destination to avoid getting stuck indefinitely
			if (timeNow >= nextTaskingMilliseconds && getSpeed() < 0.1) {
				if (stuckCounter < 3) {
					log(unitName + " seems to be stuck, resetting destination");
					resetActiveDestination();

					// Set the next tasking time to a bit in the future to give time for the unit to move after resetting the destination. We don't want to reset the destination again immediately if the unit is still stuck after resetting it.
					nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(10 * 1000);
					setTimeToNextTasking(((nextTaskingMilliseconds - timeNow) / 1000.0));
					stuckCounter++;
				}
				else if (stuckCounter == 3) {
					log(unitName + " seems to be stuck and has already tried resetting the destination 3 times, giving up on reaching the destination");
					setState(State::IDLE);
					
				}
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
		/* Transition to idle after firing the shots to avoid firing indefinitely 
			Keep this BEFORE so that if the expendQty option in DCS works and the task is removed from the unit it does not reissue it uselessly. */
		if (totalShellsFired - shellsFiredAtTasking >= artilleryShotsToFire)
			setState(State::IDLE);

		if (targetPosition != Coords(NULL)) {
			setTask("Firing at area");
			if (!getHasTask()) {
				fireAtArea(targetPosition);
			}
		}
		else {
			setState(State::IDLE);
		}

		break;
	}
	case State::SIMULATE_ENGAGEMENT:
	case State::SIMULATE_FIRE_FIGHT: {
		string taskString = "";

		/* Compute the target position. */
		double distance = 0;
		Unit* target = nullptr;

		/* If we are in simulate engagement mode we compute the target position dinamically depending on the position of the clostest "enemy" */
		if (state == State::SIMULATE_ENGAGEMENT) {
			/* Do nothing if true neutral unit, but don't transition to IDLE */
			if (unitEffectiveCoalition == 0) {
				setTargetID(NULL);
				setTargetPosition(Coords(NULL));
				return;
			}

			unsigned char targetCoalition = unitEffectiveCoalition == 2 ? 1 : 2;
			target = unitsManager->getClosestUnit(this, targetCoalition, { "GroundUnit" }, distance, false);

			/* Set the target position as the target unit position */
			if (target != nullptr && distance < 3 * engagementRange)
				setTargetPosition(target->getPosition());
			else
				setTargetPosition(Coords(NULL));
		}

		/* Only perform scenic functions when the scheduler is "free" */
		if (timeNow >= nextTaskingMilliseconds && targetPosition != Coords(NULL)) {
			if (scheduler->getLoad() > 100) {
				taskString = "Excessive load, skipping tasking of unit";
				setTargetPosition(Coords(NULL));
				if (getHasTask())
					resetTask();
			}
			else {
				updateScenicFunctionProbability();

				/* Randomly choose if we want to shoot */
				/* If the target is in targeting range and we are in highest precision mode, target it */
				if (distance < targetingRange && shotsScatter == ShotsScatter::LOW && target != nullptr) {
					taskString += "Range is less than targeting range (" + to_string((int)round(targetingRange)) + "m) and scatter is LOW, aiming at target.";

					/* Send the command */
					std::ostringstream taskSS;
					taskSS.precision(10);
					taskSS << "{id = 'AttackUnit', unitID = " << target->getID() << " }";
					Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
					scheduler->appendCommand(command);
					shellsFiredAtTasking = totalShellsFired;
					setHasTask(true);

					nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(2 * aimTime * 1000);
				}
				else {
					if ((RANDOM_ZERO_TO_ONE > (1 - scenicFunctionProbability)))
						/* Shoot at the target. Indirect fire or aim point method will be used depending on the unit type */
						taskString += scenicShootAtCoordinates(applyScatterToTarget(targetPosition, true));

					/* Randomly choose if we want to throw a grenade */
					if (RANDOM_ZERO_TO_ONE < (1 - scenicFunctionProbability) * 0.05)
						taskString += scenicThrowGranadeAtCoordinates(targetPosition);
				}
				
			}
		}

		/* Reset the task if we have shot the shotsToFire to avoid shooting indefinitely */
		if (totalShellsFired - shellsFiredAtTasking >= shotsToFire && getHasTask())
			resetTask();

		/* If the target position is NULL for some reason drop out of the state, but only if not in simulate engagment
		In that case we keep waiting in case some "enemy" comes into range
		*/
		if (state == State::SIMULATE_FIRE_FIGHT) {
			if (targetPosition == Coords(NULL))
				setState(State::IDLE);
		}

		/* Fallback if something went wrong */
		if (timeNow >= nextTaskingMilliseconds)
			nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(3 * 1000);

		/* Update the time to next tasking for debugging purposes */
		setTimeToNextTasking(((nextTaskingMilliseconds - timeNow) / 1000.0));

		/* Update the task string if it has been changed */
		if (taskString.length() > 0)
			setTask(taskString);

		break;
	}							    
	case State::SCENIC_AAA: {
		string taskString = "";

		/* Only perform scenic functions when the scheduler is "free" */
		if (timeNow >= nextTaskingMilliseconds) {
			if (scheduler->getLoad() > 100) {
				taskString = "Excessive load, skipping tasking of unit";
				setTargetPosition(Coords(NULL));
				if (getHasTask())
					resetTask();
			}
			else {
				updateScenicFunctionProbability();

				// Randomly choose if we want to shoot
				if (RANDOM_ZERO_TO_ONE > (1 - scenicFunctionProbability)) 
					taskString += scenicAAA();
				
			}
		}

		/* Reset the task if we have shot the shotsToFire to avoid shooting indefinitely */
		if (totalShellsFired - shellsFiredAtTasking >= shotsToFire && getHasTask())
			resetTask();
		
		/* Fallback if something went wrong */
		if (timeNow >= nextTaskingMilliseconds)
			nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(3 * 1000);

		/* Update the time to next tasking for debugging purposes */
		setTimeToNextTasking(((nextTaskingMilliseconds - timeNow) / 1000.0));

		/* Update the task string if it has been changed */
		if (taskString.length() > 0)
			setTask(taskString);

		break;
	}
	case State::MISS_ON_PURPOSE: {
		string taskString = "";

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
			if (timeNow >= nextTaskingMilliseconds) {
				if (scheduler->getLoad() > 100) {
					taskString = "Excessive load, skipping tasking of unit";
					setTargetPosition(Coords(NULL));
					if (getHasTask())
						resetTask();
				}
				else {
					updateScenicFunctionProbability();

					// Randomly choose if we want to shoot
					if (RANDOM_ZERO_TO_ONE > (1 - scenicFunctionProbability)) {
						double distance = 0;
						unsigned char targetCoalition = unitEffectiveCoalition == 2 ? 1 : 2;

						/* Get all the units in range and select one at random. Don't always go for the closest one. */
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
							taskString += missOnPurposeAAA(target);
						}
						else {
							taskString += "Missing on purpose. No target in range.";
							setTargetPosition(Coords(NULL));
							if (getHasTask())
								resetTask();
						}
					}
				}
			}

			// Reset the task if we have shot the shotsToFire to avoid shooting indefinitely
			if (totalShellsFired - shellsFiredAtTasking >= shotsToFire && getHasTask())
				resetTask();

			/* If no valid target was detected */
			if (timeNow >= nextTaskingMilliseconds) {
				double alertnessTimeConstant = 10; /* s */
				if (database.has_object_field(to_wstring(name))) {
					json::value databaseEntry = database[to_wstring(name)];
					if (databaseEntry.has_number_field(L"alertnessTimeConstant"))
						alertnessTimeConstant = databaseEntry[L"alertnessTimeConstant"].as_number().to_double();
				}
				nextTaskingMilliseconds = timeNow + static_cast<unsigned long>((5 + RANDOM_ZERO_TO_ONE * alertnessTimeConstant) * 1000L);
				missOnPurposeTarget = nullptr;
				setTargetPosition(Coords(NULL));
			}
			
		}
		else {
			setState(State::IDLE);
		}

		setTimeToNextTasking((nextTaskingMilliseconds - timeNow) / 1000.0);

		if (taskString.length() > 0)
			setTask(taskString);

		break;
	}
	default:
		break;
	}
}

void GroundUnit::fireAtArea(Coords aimTarget) {
	std::ostringstream taskSS;
	taskSS.precision(10);
	if (aimTarget.alt == NULL) {
		taskSS << "{id = 'FireAtPoint', lat = " << aimTarget.lat << ", lng = " << aimTarget.lng << ", radius = " << artilleryRadius << ", expendQty = " << artilleryShotsToFire << " }";
	}
	else {
		taskSS << "{id = 'FireAtPoint', lat = " << aimTarget.lat << ", lng = " << aimTarget.lng << ", alt = " << aimTarget.alt << ", radius = " << artilleryRadius << " expendQty = " << artilleryShotsToFire << "}";
	}
	Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
	scheduler->appendCommand(command);
	setHasTask(true);
}

Coords GroundUnit::applyScatterToTarget(Coords aimTarget, bool scatterVertically) {
	/* Get the distance and bearing to the target */
	Coords scatteredTargetPosition = aimTarget;
	double distance;
	double bearing1;
	double bearing2;
	Geodesic::WGS84().Inverse(getPosition().lat, getPosition().lng, scatteredTargetPosition.lat, scatteredTargetPosition.lng, distance, bearing1, bearing2);

	/* Apply a scatter to the aim */
	bearing1 += RANDOM_MINUS_ONE_TO_ONE * (ShotsScatter::LOW - shotsScatter + 1) * 10;

	/* Compute the scattered position applying a random scatter to the shot */
	double scatterDistance = distance * tan(10 /* degs */ * (ShotsScatter::LOW - shotsScatter) / 57.29577 + 2 / 57.29577 /* degs */) * RANDOM_MINUS_ONE_TO_ONE;
	Geodesic::WGS84().Direct(scatteredTargetPosition.lat, scatteredTargetPosition.lng, bearing1, scatterDistance, scatteredTargetPosition.lat, scatteredTargetPosition.lng);

	/* Scatter the altitude of the target by increasing by a random amount between 0% and 5% of the distance */
	if (scatterVertically && scatteredTargetPosition.alt != NULL) {
		double scatterAltitude = distance * 0.05 * RANDOM_ZERO_TO_ONE;
		scatteredTargetPosition.alt += scatterAltitude;
	}

	return scatteredTargetPosition;
}

string GroundUnit::aimAtPointMethod(Coords aimTarget) {
	string taskString = "";
	double dist;
	double bearing1;
	double bearing2;
	Geodesic::WGS84().Inverse(position.lat, position.lng, aimTarget.lat, aimTarget.lng, dist, bearing1, bearing2);

	/* Aim point distance */
	double r = 15; /* m */

	/* Compute the elevation angle of the gun*/
	double deltaHeight = (aimTarget.alt - (position.alt + barrelHeight)) + 2;
	double alpha = 9.81 / 2 * dist * dist / (muzzleVelocity * muzzleVelocity);
	double inner = dist * dist - 4 * alpha * (alpha + deltaHeight);

	/* Check we can reach the target*/
	if (inner > 0) {
		/* Compute elevation and bearing */
		double barrelElevation = r * (dist - sqrt(inner)) / (2 * alpha);

		double lat = 0;
		double lng = 0;
		Geodesic::WGS84().Direct(position.lat, position.lng, bearing1, r, lat, lng);

		taskString = "Barrel elevation: " + to_string((int) round(barrelElevation)) + "m, bearing: " + to_string((int) round(bearing1)) + "deg";
		log(unitName + "(" + name + ")" + " shooting with aim at point method. Barrel elevation: " + to_string(barrelElevation) + "m, bearing: " + to_string(bearing1) + "�");

		std::ostringstream taskSS;
		taskSS.precision(10);
		taskSS << "{id = 'FireAtPoint', lat = " << lat << ", lng = " << lng << ", alt = " << position.alt + barrelElevation + barrelHeight << ", radius = 0.001}";
		Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
		scheduler->appendCommand(command);
		shellsFiredAtTasking = totalShellsFired;
		setHasTask(true);
	}
	else {
		log("Target out of range for " + unitName + "(" + name + ")");
		taskString = "Target out of range";
	}

	return taskString;
}

void GroundUnit::indirectFireMethod(Coords aimTarget) {
	std::ostringstream taskSS;
	taskSS.precision(10);
	taskSS << "{id = 'FireAtPoint', lat = " << aimTarget.lat << ", lng = " << aimTarget.lng << ", radius = 0.01}";
	Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
	scheduler->appendCommand(command);
	shellsFiredAtTasking = totalShellsFired;
	setHasTask(true);
}

string GroundUnit::scenicShootAtCoordinates(Coords aimTarget) {
	string taskString = "";

	unsigned long timeNow = std::chrono::system_clock::now().time_since_epoch() / std::chrono::milliseconds(1);

	/* Recover the data from the database */
	bool indirectFire = false;
	if (database.has_object_field(to_wstring(name))) {
		json::value databaseEntry = database[to_wstring(name)];
		if (databaseEntry.has_boolean_field(L"indirectFire"))
			indirectFire = databaseEntry[L"indirectFire"].as_bool();
	}

	/* If the unit is of the indirect fire type, like a mortar, simply shoot at the target */
	if (indirectFire) {
		taskString += "Simulating fire fight with indirect fire";
		log(unitName + "(" + name + ")" + " simulating fire fight with indirect fire");
		indirectFireMethod(aimTarget);
	}
	/* Otherwise use the aim method */
	else {
		taskString += "Simulating fire fight with aim point method. ";
		log(unitName + "(" + name + ")" + " simulating fire fight with aim at point method");
		string aimTaskString = aimAtPointMethod(aimTarget);
		taskString += aimTaskString;
	}

	/* Wait an amout of time depending on the aim time */
	nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(2 * aimTime * 1000);

	return taskString;
}

string GroundUnit::scenicThrowGranadeAtCoordinates(Coords aimTarget) {
	string taskString = "";

	/* Randomly throw a grenade at the closest enemy position */
	if (aimTarget != Coords(NULL)) {
		taskString += "Throwing grenade at closest enemy to simulate chaotic engagement. ";
		log(unitName + "(" + name + ")" + " throwing grenade at closest enemy to simulate chaotic engagement");

		// Compute a point 30 meters from the closest enemy position in a random direction to simulate a grenade throw. The scatter of the throw is higher than the scatter of the shots to simulate the inaccuracy of throwing a grenade compared to shooting.
		Coords grenadeTargetPosition = aimTarget;
		double randomBearing = RANDOM_ZERO_TO_ONE * 360;
		double scatterDistance = 30;
		Geodesic::WGS84().Direct(grenadeTargetPosition.lat, grenadeTargetPosition.lng, randomBearing, scatterDistance, grenadeTargetPosition.lat, grenadeTargetPosition.lng);

		// Use the explosion command 
		Command* command = dynamic_cast<Command*>(new Explosion(0.1, "normal", grenadeTargetPosition));
		scheduler->appendCommand(command);
	}
	else {
		taskString += "Random grenade throw skipped because there is no enemy. ";
		log(unitName + "(" + name + ")" + " random grenade throw skipped because there is no enemy");
	}

	return taskString;
}

string GroundUnit::scenicAAA() {
	string taskString = "";

	unsigned long timeNow = std::chrono::system_clock::now().time_since_epoch() / std::chrono::milliseconds(1);

	double distance = 0;
	unsigned char unitCoalition = coalition == 0 ? getOperateAs() : coalition;
	unsigned char targetCoalition = unitCoalition == 2 ? 1 : 2;
	Unit* target = unitsManager->getClosestUnit(this, targetCoalition, { "Aircraft", "Helicopter" }, distance);

	/* Recover the data from the database */
	bool flak = false;
	if (database.has_object_field(to_wstring(name))) {
		json::value databaseEntry = database[to_wstring(name)];
		if (databaseEntry.has_boolean_field(L"flak"))
			flak = databaseEntry[L"flak"].as_bool();
	}

	/* Only run if an enemy air unit is closer than 20km to avoid useless load */
	double activationDistance = 20000;
	if (2 * engagementRange > activationDistance)
		activationDistance = 2 * engagementRange;

	if (target != nullptr && distance < activationDistance /* m */) {
		double r = 15; /* m */
		double barrelElevation = position.alt + barrelHeight + r * tan(acos(((double)(rand()) / (double)(RAND_MAX))));

		double lat = 0;
		double lng = 0;
		double randomBearing = ((double)(rand()) / (double)(RAND_MAX)) * 360;
		Geodesic::WGS84().Direct(position.lat, position.lng, randomBearing, r, lat, lng);

		if (flak) {
			lat = position.lat + RANDOM_MINUS_ONE_TO_ONE * (1 + (ShotsScatter::LOW - shotsScatter)) * 0.01;
			lng = position.lng + RANDOM_MINUS_ONE_TO_ONE * (1 + (ShotsScatter::LOW - shotsScatter)) * 0.01;
			barrelElevation = target->getPosition().alt + RANDOM_MINUS_ONE_TO_ONE * (ShotsScatter::LOW - shotsScatter) * 1000;
			taskString += "Flak box mode";
		}
		else {
			taskString += "Scenic AAA. Bearing: " + to_string((int)round(randomBearing)) + "deg";
		}

		taskString += ". Aim point elevation " + to_string((int)round(barrelElevation - position.alt)) + "m AGL";

		std::ostringstream taskSS;
		taskSS.precision(10);
		taskSS << "{id = 'FireAtPoint', lat = " << lat << ", lng = " << lng << ", alt = " << barrelElevation << ", radius = 0.001 }";
		Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
		scheduler->appendCommand(command);
		shellsFiredAtTasking = totalShellsFired;
		setHasTask(true);

		nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(2 * aimTime * 1000);
	}
	else {
		setTargetPosition(Coords(NULL));
		if (target == nullptr)
			taskString += "Scenic AAA. No valid target.";
		else
			taskString += "Scenic AAA. Target outside max range: " + to_string((int)round(distance)) + "m.";

		if (getHasTask())
			resetTask();

		nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(3 * 1000);
	}

	return taskString;
}

string GroundUnit::missOnPurposeAAA(Unit* target) {
	string taskString = "";

	unsigned long timeNow = std::chrono::system_clock::now().time_since_epoch() / std::chrono::milliseconds(1);

	/* Compute distance to target */
	double distance = 0;
	Geodesic::WGS84().Inverse(position.lat, position.lng, target->getPosition().lat, target->getPosition().lng, distance);

	taskString = "Missing on purpose. Valid target at range: " + to_string((int)round(distance)) + "m";

	/* Recover the data from the database */
	bool flak = false;
	if (database.has_object_field(to_wstring(name))) {
		json::value databaseEntry = database[to_wstring(name)];
		if (databaseEntry.has_boolean_field(L"flak"))
			flak = databaseEntry[L"flak"].as_bool();
	}

	/* Very simplified algorithm ignoring drag */
	double correctedAimTime = aimTime + distance / muzzleVelocity;

	/* If the target is in targeting range and we are in highest precision mode, target it */
	if (distance < targetingRange && shotsScatter == ShotsScatter::LOW) {
		taskString += ". Range is less than targeting range (" + to_string((int)round(targetingRange)) + "m) and scatter is LOW, aiming at target.";

		/* Send the command */
		std::ostringstream taskSS;
		taskSS.precision(10);
		taskSS << "{id = 'AttackUnit', unitID = " << target->getID() << " }";
		Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
		scheduler->appendCommand(command);
		shellsFiredAtTasking = totalShellsFired;
		setHasTask(true);

		nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(2 * aimTime * 1000);
	}
	/* Else, do miss on purpose */
	else {
		/* Compute where the target will be in aimTime seconds. */
		double aimDistance = target->getHorizontalVelocity() * correctedAimTime;
		double aimLat = 0;
		double aimLng = 0;
		Geodesic::WGS84().Direct(target->getPosition().lat, target->getPosition().lng, target->getTrack() * 57.29577, aimDistance, aimLat, aimLng); /* TODO make util to convert degrees and radians function */
		double aimAlt = target->getPosition().alt + target->getVerticalVelocity();

		/* In flak mode, apply a "box" scatter */
		if (flak) {
			aimLat += RANDOM_MINUS_ONE_TO_ONE * (1 + (ShotsScatter::LOW - shotsScatter)) * 0.01;
			aimLng += RANDOM_MINUS_ONE_TO_ONE * (1 + (ShotsScatter::LOW - shotsScatter)) * 0.01;
			aimAlt += RANDOM_MINUS_ONE_TO_ONE * (1 + (ShotsScatter::LOW - shotsScatter)) * 1000;
		}

		/* Send the command */
		if (distance < engagementRange) {
			taskString += ". Range is less than engagement range (" + to_string((int)round(engagementRange)) + "m), using FIRE AT POINT method";

			/* If the unit is closer than the engagement range, use the fire at point method */
			std::ostringstream taskSS;
			taskSS.precision(10);
			taskSS << "{id = 'FireAtPoint', lat = " << aimLat << ", lng = " << aimLng << ", alt = " << aimAlt << ", radius = 0.001 }";

			taskString += ". Aiming altitude " + to_string((int)round((aimAlt - position.alt) / 0.3048)) + "ft AGL";
			Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
			scheduler->appendCommand(command);
			shellsFiredAtTasking = totalShellsFired;
			setHasTask(true);
			setTargetPosition(Coords(aimLat, aimLng, target->getPosition().alt));
			nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(2 * aimTime * 1000);
		}
		else if (distance < aimMethodRange) {
			taskString += ". Range is less than aim method range (" + to_string((int)round(aimMethodRange / 0.3048)) + "ft), using AIM method.";

			/* If the unit is closer than the aim method range, use the aim method range */
			taskString += aimAtPointMethod(Coords(aimLat, aimLng, aimAlt));

			setTargetPosition(Coords(aimLat, aimLng, target->getPosition().alt));
			nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(2 * aimTime * 1000);
		}
		else {
			taskString += ". Target is not in range of weapon, waking up unit to get ready for tasking.";

			/* Else just wake the unit up with an impossible command */
			std::ostringstream taskSS;
			taskSS.precision(10);
			taskSS << "{id = 'FireAtPoint', lat = " << 0 << ", lng = " << 0 << ", alt = " << 0 << ", radius = 0.001, expendQty = " << 0 << " }";
			Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
			scheduler->appendCommand(command);
			shellsFiredAtTasking = totalShellsFired;
			setHasTask(true);
			setTargetPosition(Coords(NULL));

			/* Don't wait too long before checking again */
			nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(5 * 1000);
		}
	}
	missOnPurposeTarget = target;
	return taskString;
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

string GroundUnit::getType() {
	// Get the unit type from the database if it exists, otherwise return "GroundUnit" as default
	if (database.has_object_field(to_wstring(name))) {
		json::value databaseEntry = database[to_wstring(name)];
		if (databaseEntry.has_string_field(L"type"))
			return to_string(databaseEntry[L"type"].as_string());
	}
	else {
		return "GroundUnit";
	}
}

void GroundUnit::computePathToEmbark() {
	Unit* target = unitsManager->getUnit(targetID);
	setTask("Embarking on unit " + target->getName());
	setEnableTaskCheckFailed(true);
	clearActivePath();
	resetActiveDestination();
	setFollowRoads(false);

	// Compute the path to reach the target. 
	list<Coords> path;
	Coords targetPosition = target->getPosition();

	// Make the unit go to a point 10 meters in front of the target, then 20 meters behind
	Coords point0, point1, point2;

	// Check if the unit is to the left or to the right of the target, i.e. check if it left or right of the line defined by the target heading.
	double dist;
	double bearing1;
	double bearing2;
	bool left = false;
	bool right = false;

	Geodesic::WGS84().Inverse(targetPosition.lat, targetPosition.lng, position.lat, position.lng, dist, bearing1, bearing2);

	if (bearing1 < 0)
		bearing1 += 360;

	double rotatedBearing = bearing1 - target->getHeading() * 57.29577;

	// Normalize the rotated bearing to be between 0 and 360
	if (rotatedBearing < 0)
		rotatedBearing += 360;
	else if (rotatedBearing >= 360)
		rotatedBearing -= 360;

	if (rotatedBearing > 0 && rotatedBearing < 180)
		right = true;
	else if (rotatedBearing >= 180 && rotatedBearing < 360)
		left = true;

	double deltaAngle = left ? -10 : right ? 10 : 0;

	// Compute the coordinates of the points in front and behind the target based on its heading
	Geodesic::WGS84().Direct(targetPosition.lat, targetPosition.lng, target->getHeading() * 57.29577 + deltaAngle, 20, point1.lat, point1.lng);
	Geodesic::WGS84().Direct(targetPosition.lat, targetPosition.lng, (target->getHeading() * 57.29577 + 180) - deltaAngle, 20, point2.lat, point2.lng);

	// Compute the distance between the unit and point1
	Geodesic::WGS84().Inverse(getPosition().lat, getPosition().lng, point1.lat, point2.lng, dist);

	// If the distance is less than 10 meters, have the unit first go to another position to avoid deadlocking
	if (dist < 10) {
		Geodesic::WGS84().Direct(getPosition().lat, getPosition().lng, target->getHeading() * 57.29577, 15, point0.lat, point0.lng);
		path.push_back(point0);
	}

	// Set a threshold of 3 meters for both points to avoid precision issues when reaching the target
	point1.threshold = 3;
	point2.threshold = 3;

	path.push_back(point1);
	path.push_back(point2);

	setActivePath(path);
}

void GroundUnit::embarkOnTransport(Unit* transport) {
	unsigned long timeNow = std::chrono::system_clock::now().time_since_epoch() / std::chrono::milliseconds(1);

	// If the unit is not moving after timeToNextTasking, add a destination to try and unlock it
	if (timeNow >= nextTaskingMilliseconds && getSpeed() < 0.1) {
		// Start by computing a new point to try and unlock the unit
		Coords newPoint;
		Geodesic::WGS84().Direct(getPosition().lat, getPosition().lng, transport->getHeading() * 57.29577, 15, newPoint.lat, newPoint.lng);

		// Put the new point in front of the path
		activePath.push_front(newPoint);

		// Reset the active destination to reissue the command
		resetActiveDestination();

		nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(10 * 1000);
		setTimeToNextTasking(((nextTaskingMilliseconds - timeNow) / 1000.0));
	}

	// Check that:
	// - The transport unit is alive
	// - The transport unit is capable of transporting units
	// - The transport unit is on the ground
	// - The transport unit speed is less than 2 m/s
	// - The transport is not full
	double dist;
	double bearing1;
	double bearing2;
	Geodesic::WGS84().Inverse(transport->getPosition().lat, transport->getPosition().lng, getPosition().lat, getPosition().lng, dist, bearing1, bearing2);

	// Make the unit disappear if it is behind the "9-3" line of the transport
	// To determine if the unit is behind the "9-3" line of the transport, we can compute the bearing between the transport and the unit and compare it with the bearing of the transport. 
	// If the difference between the two bearings is between 90 and 270 degrees, then the unit is behind the "9-3" line of the transport.

	bool behindNineThreeLine = false;
	double bearingDiff = fabs(bearing1 - transport->getHeading() * 57.29577);
	if (bearingDiff > 180)
		bearingDiff = 360 - bearingDiff;
	if (bearingDiff > 90 && bearingDiff < 270)
		behindNineThreeLine = true;

	if (dist < 10 &&
		behindNineThreeLine &&
		transport->getAlive() &&
		transport->getCanTransportUnits() &&
		!transport->getAirborne() &&
		transport->getSpeed() < 2 &&
		transport->getOnBoardUnitsIDs().size() < transport->getMaximumTransportableUnits()
		) {

		// Add the unit ID to the transport on-board units list (do it this way to trigger an update)
		auto newOnBoardUnitsIDs = transport->getOnBoardUnitsIDs();
		newOnBoardUnitsIDs.push_back(ID);
		transport->setOnBoardUnitsIDs(newOnBoardUnitsIDs);

		// Remove the unit from the map
		unitsManager->deleteUnit(ID, false, "", true);

		// Increase the weight of the transport by 100 kg
		transport->setCargoWeight(transport->getCargoWeight() + 100);

		log("Loaded unit " + getUnitName() + "(" + getName() + ") into transport " + transport->getUnitName() + "(" + transport->getName() + ")", true);
	}
}

void GroundUnit::updateSuppressionLevel() {
	/* Start by decreasing the suppression level by a constant */
	suppressionLevel -= 0.01;

	// Iterate over all the aircraft and heliocopter units and get their shootingProjectionLocation. Limit the search to 10km. 0xFF coalition means we search for all coalitions.
	map<Unit*, double> airUnits = unitsManager->getUnitsInRange(this, 0xFF, { "Aircraft", "Helicopter" }, 10000, false);

	for (auto const& p : airUnits) {
		Unit* airUnit = p.first;

		// Get the shooting projection location of the air unit. This is the point on the ground where the unit is shooting at. If the unit is not shooting, this will be Coords(NULL).
		Coords shootingProjectionLocation = airUnit->getShootingProjectionLocation();

		// If the shooting projection location is not NULL and is within 5km, increase the suppression level. The closer it is, the more we increase the suppression level. We can use a simple linear function for this.
		if (shootingProjectionLocation != Coords(NULL)) {
			// Get the distance between the unit and the shooting projection location
			double distance = 0;
			Geodesic::WGS84().Inverse(position.lat, position.lng, shootingProjectionLocation.lat, shootingProjectionLocation.lng, distance);

			/* Compute the change in suppression level */
			double bulletMass = airUnit->getShootingProjectionWeaponMass();
			double suppressionIncrease = 100000 * bulletMass / (distance * distance); /* The suppression increase is proportional to the kinetic energy of the bullet and inversely proportional to the square of the distance. The constant 0.1 is just a tuning parameter to get reasonable values. */

			suppressionLevel += suppressionIncrease;
		}
	}
	setSuppressionLevel(min(max(suppressionLevel, 0.0), 1.0));
}

void GroundUnit::updateScenicFunctionProbability() {
	// Get the coalition of the unit. If the unit is neutral, we use the "operate as" coalition to determine the behavior in scenic modes
	unsigned char unitEffectiveCoalition = coalition == 0 ? getOperateAs() : coalition;

	float randomThreshold = 0.66;
	// The next tasking time depends on how many units are present in the area so that a constant "volume" of fire is maintained independently from the number of units engaging.
	// Start by counting how many friendly units are present in 3*engagementRange so that we can adjust the aim time accordingly. This is a very basic way to simulate a more complex behavior where units would coordinate to maintain a certain volume of fire on the target.
	map<Unit*, double> friendliesInRange = unitsManager->getUnitsInRange(this, unitEffectiveCoalition, { "GroundUnit" }, 3 * engagementRange, false);

	// If we are in the lowest intesity mode, adjust the chances that the unit will shoot depending on the number of friendlies in range. The more friendlies, the less chances to shoot to maintain a constant volume of fire.
	if (shotsIntensity == ShotsIntensity::LOW)
		randomThreshold = 1.0 / (1.0 + static_cast<float>(friendliesInRange.size()));

	// Multiply the random value depending on the shots intensity to simulate a more aggressive behavior when the shots intensity is higher
	randomThreshold *= (1.0 + (shotsIntensity - ShotsIntensity::MEDIUM) * 0.5);

	// The more suppressed the unit is, the less chances it has to shoot
	randomThreshold *= (1.0 - suppressionLevel);

	setScenicFunctionProbability(randomThreshold);
}
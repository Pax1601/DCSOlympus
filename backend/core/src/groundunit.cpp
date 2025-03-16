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
	unsigned long timeNow = std::chrono::system_clock::now().time_since_epoch() / std::chrono::milliseconds(1);

	double currentAmmo = computeTotalAmmo();
	/* Out of ammo */
	if (currentAmmo <= shotsToFire && state != State::IDLE) {
		setState(State::IDLE);
	}

	/* Account for unit reloading */
	if (currentAmmo < oldAmmo)
		totalShellsFired += oldAmmo - currentAmmo;
	oldAmmo = currentAmmo;

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
			if (targetPosition.alt == NULL) {
				taskSS << "{id = 'FireAtPoint', lat = " << targetPosition.lat << ", lng = " << targetPosition.lng << ", radius = 100}";
			}
			else {
				taskSS << "{id = 'FireAtPoint', lat = " << targetPosition.lat << ", lng = " << targetPosition.lng << ", alt = " << targetPosition.alt << ", radius = 100}";
			}
			Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
			scheduler->appendCommand(command);
			setHasTask(true);
		}

		break;
	}
	case State::SIMULATE_FIRE_FIGHT: {
		string taskString = "";

		if (
			(totalShellsFired - shellsFiredAtTasking >= shotsToFire || timeNow >= nextTaskingMilliseconds) &&
			targetPosition != Coords(NULL) && 
			scheduler->getLoad() < 30
			) {
			/* Get the distance and bearing to the target */
			Coords scatteredTargetPosition = targetPosition;
			double distance;
			double bearing1;
			double bearing2;
			Geodesic::WGS84().Inverse(getPosition().lat, getPosition().lng, scatteredTargetPosition.lat, scatteredTargetPosition.lng, distance, bearing1, bearing2);

			/* Apply a scatter to the aim */
			bearing1 += RANDOM_MINUS_ONE_TO_ONE * (ShotsScatter::LOW - shotsScatter + 1) * 10;

			/* Compute the scattered position applying a random scatter to the shot */
			double scatterDistance = distance * tan(10 /* degs */ * (ShotsScatter::LOW - shotsScatter) / 57.29577 + 2 / 57.29577 /* degs */) * RANDOM_MINUS_ONE_TO_ONE;
			Geodesic::WGS84().Direct(scatteredTargetPosition.lat, scatteredTargetPosition.lng, bearing1, scatterDistance, scatteredTargetPosition.lat, scatteredTargetPosition.lng);
			
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
				std::ostringstream taskSS;
				taskSS.precision(10);
				taskSS << "{id = 'FireAtPoint', lat = " << scatteredTargetPosition.lat << ", lng = " << scatteredTargetPosition.lng << ", radius = 0.01}";
				Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
				scheduler->appendCommand(command);
				shellsFiredAtTasking = totalShellsFired;
				setHasTask(true);
			}
			/* Otherwise use the aim method */
			else {
				taskString += "Simulating fire fight with aim point method. ";
				log(unitName + "(" + name + ")" + " simulating fire fight with aim at point method");
				string aimTaskString = aimAtPoint(scatteredTargetPosition);
				taskString += aimTaskString;
			}

			/* Wait an amout of time depending on the shots intensity */
			nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(2 * aimTime * 1000);
		}

		if (targetPosition == Coords(NULL))
			setState(State::IDLE);

		/* Fallback if something went wrong */
		if (timeNow >= nextTaskingMilliseconds)
			nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(3 * 1000);

		setTimeToNextTasking(((nextTaskingMilliseconds - timeNow) / 1000.0));

		if (taskString.length() > 0)
			setTask(taskString);

		break;
	}
	case State::SCENIC_AAA: {
		string taskString = "";

		/* Only perform scenic functions when the scheduler is "free" */
		if ((totalShellsFired - shellsFiredAtTasking >= shotsToFire || timeNow >= nextTaskingMilliseconds) &&
			scheduler->getLoad() < 30) {
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
					lat = position.lat + RANDOM_MINUS_ONE_TO_ONE * (ShotsScatter::LOW - shotsScatter) * 0.01;
					lng = position.lng + RANDOM_MINUS_ONE_TO_ONE * (ShotsScatter::LOW - shotsScatter) * 0.01;
					barrelElevation = target->getPosition().alt + RANDOM_MINUS_ONE_TO_ONE * (ShotsScatter::LOW - shotsScatter) * 1000;
					taskString += "Flak box mode.";
				}
				else {
					taskString += "Scenic AAA. Bearing: " + to_string((int)round(randomBearing)) + "deg";
				}
				
				taskString += ". Aim point elevation " + to_string((int) round(barrelElevation - position.alt)) + "m AGL";

				std::ostringstream taskSS;
				taskSS.precision(10);
				taskSS << "{id = 'FireAtPoint', lat = " << lat << ", lng = " << lng << ", alt = " << barrelElevation << ", radius = 0.001 }";
				Command* command = dynamic_cast<Command*>(new SetTask(groupName, taskSS.str(), [this]() { this->setHasTaskAssigned(true); }));
				scheduler->appendCommand(command);
				shellsFiredAtTasking = totalShellsFired;
				setHasTask(true);

				/* Wait an amout of time depending on the shots intensity */
				nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(2 * aimTime * 1000);
			}
			else {
				if (target == nullptr)
					taskString += "Scenic AAA. No valid target.";
				else
					taskString += "Scenic AAA. Target outside max range: " + to_string((int)round(distance)) + "m.";
			}
		}

		if (timeNow >= nextTaskingMilliseconds)
			nextTaskingMilliseconds = timeNow + static_cast<unsigned long>(3 * 1000);

		setTimeToNextTasking((nextTaskingMilliseconds - timeNow) / 1000.0);
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
			if ((totalShellsFired - shellsFiredAtTasking >= shotsToFire || timeNow >= nextTaskingMilliseconds) &&
				scheduler->getLoad() < 30) {
				double distance = 0;
				unsigned char unitCoalition = coalition == 0 ? getOperateAs() : coalition;
				unsigned char targetCoalition = unitCoalition == 2 ? 1 : 2;
				
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
					taskString += "Missing on purpose. Valid target at range: " + to_string((int) round(distance)) + "m";

					double correctedAimTime = aimTime;
					double dstep = 0;
					double vstep = muzzleVelocity;
					double dt = 0.1;
					double k = 0.0086;
					double gdelta = 9.81;

					/* Approximate the flight time */
					unsigned int stepCount = 0;
					if (muzzleVelocity != 0) {
						while (dstep < distance && stepCount < 1000) {
							dstep += vstep * dt;
							vstep -= (k * vstep + gdelta) * dt;
							stepCount++;
						}
						correctedAimTime += stepCount * dt;
					}

					/* If the target is in targeting range and we are in highest precision mode, target it */
					if (distance < targetingRange && shotsScatter == ShotsScatter::LOW) {
						taskString += ". Range is less than targeting range (" + to_string((int) round(targetingRange)) + "m) and scatter is LOW, aiming at target.";

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
						/* Compute where the target will be in aimTime seconds, plus the effect of scatter. */
						double scatterDistance = distance * tan(shotsBaseScatter * (ShotsScatter::LOW - shotsScatter) / 57.29577) * (RANDOM_ZERO_TO_ONE - 0.1);
						double aimDistance = target->getHorizontalVelocity() * correctedAimTime + scatterDistance;
						double aimLat = 0;
						double aimLng = 0;
						Geodesic::WGS84().Direct(target->getPosition().lat, target->getPosition().lng, target->getTrack() * 57.29577, aimDistance, aimLat, aimLng); /* TODO make util to convert degrees and radians function */
						double aimAlt = target->getPosition().alt + target->getVerticalVelocity() * correctedAimTime + distance * tan(shotsBaseScatter * (ShotsScatter::LOW - shotsScatter) / 57.29577) * RANDOM_ZERO_TO_ONE; // Force to always miss high never low

						/* Send the command */
						if (distance < engagementRange) {
							taskString += ". Range is less than engagement range (" + to_string((int) round(engagementRange)) + "m), using FIRE AT POINT method";

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
							string aimMethodTask = aimAtPoint(Coords(aimLat, aimLng, aimAlt));
							taskString += aimMethodTask;

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
				}
				else {
					taskString += "Missing on purpose. No target in range.";
					if (getHasTask())
						resetTask();
				}
			}

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


string GroundUnit::aimAtPoint(Coords aimTarget) {
	string taskString = "";
	double dist;
	double bearing1;
	double bearing2;
	Geodesic::WGS84().Inverse(position.lat, position.lng, aimTarget.lat, aimTarget.lng, dist, bearing1, bearing2);

	/* Aim point distance */
	double r = 15; /* m */

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

		taskString = +"Barrel elevation: " + to_string((int) round(barrelElevation)) + "m, bearing: " + to_string((int) round(bearing1)) + "deg";
		log(unitName + "(" + name + ")" + " shooting with aim at point method. Barrel elevation: " + to_string(barrelElevation) + "m, bearing: " + to_string(bearing1) + "°");

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
		taskString = +"Target out of range";
	}

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

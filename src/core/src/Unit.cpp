#include "unit.h"
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

const Geodesic& geod = Geodesic::WGS84();

Unit::Unit(json::value json, int ID) :
	ID(ID)
{
	log("Creating unit with ID: " + to_string(ID));
}

Unit::~Unit()
{

}

void Unit::updateExportData(json::value json)
{
	/* Lock for thread safety */
	lock_guard<mutex> guard(mutexLock);

	/* Compute speed (loGetWorldObjects does not provide speed, we compute it for better performance instead of relying on many lua calls) */
	if (oldPosition != NULL)
	{
		double dist = 0;
		geod.Inverse(latitude, longitude, oldPosition.lat, oldPosition.lng, dist);
		speed = speed * 0.95 + (dist / UPDATE_TIME_INTERVAL) * 0.05;
	}
	oldPosition = Coords(latitude, longitude, altitude);

	/* Update all the internal fields from the input json file */
	if (json.has_string_field(L"Name"))
		name = json[L"Name"].as_string();
	if (json.has_string_field(L"UnitName"))
		unitName = json[L"UnitName"].as_string();
	if (json.has_string_field(L"GroupName"))
		groupName = json[L"GroupName"].as_string();
	if (json.has_object_field(L"Type"))
		type = json[L"Type"];
	if (json.has_number_field(L"Country"))
		country = json[L"Country"].as_number().to_int32();
	if (json.has_number_field(L"CoalitionID"))
		coalitionID = json[L"CoalitionID"].as_number().to_int32();
	if (json.has_object_field(L"LatLongAlt"))
	{
		latitude = json[L"LatLongAlt"][L"Lat"].as_number().to_double();
		longitude = json[L"LatLongAlt"][L"Long"].as_number().to_double();
		altitude = json[L"LatLongAlt"][L"Alt"].as_number().to_double();
	}
	if (json.has_number_field(L"Heading"))
		heading = json[L"Heading"].as_number().to_double();
	if (json.has_object_field(L"Flags"))
		flags = json[L"Flags"];

	/* All units which contain the name "Olympus" are automatically under AI control */
	/* TODO: I don't really like using this method */
	if (unitName.find(L"Olympus") != wstring::npos)
	{
		AI = true;
	}

	/* If the unit is alive and it is not a human, run the AI Loop that performs the requested commands and instructions (moving, attacking, etc) */
	if (AI && alive && flags[L"Human"].as_bool() == false)
	{
		AIloop();
	}
}

void Unit::updateMissionData(json::value json)
{
	if (json.has_number_field(L"fuel"))
		fuel = json[L"fuel"].as_number().to_int32();
	if (json.has_object_field(L"ammo"))
		ammo = json[L"ammo"];
	if (json.has_object_field(L"targets"))
		targets = json[L"targets"];
}

void Unit::setPath(list<Coords> path)
{
	activePath = path;
	holding = false;
}

void Unit::setTarget(int newTargetID)
{
	targetID = newTargetID;
	resetActiveDestination();
}

wstring Unit::getTarget()
{
	if (targetID == NULL)
	{
		return L"";
	}

	Unit* target = unitsFactory->getUnit(targetID);
	if (target != nullptr)
	{
		if (target->alive)
		{
			return target->getUnitName();
		}
		else
		{
			targetID = NULL;
			return L"";
		}
	}
	else
	{
		targetID = NULL;
		return L"";
	}
}

void Unit::AIloop()
{
	// For wingman units, the leader decides the active destination
	if (!wingman)
	{
		/* Set the active destination to be always equal to the first point of the active path. This is in common with all AI units */
		if (activePath.size() > 0)
		{
			if (activeDestination != activePath.front())
			{
				activeDestination = activePath.front();
				Command* command = dynamic_cast<Command*>(new MoveCommand(ID, activeDestination, getTargetSpeed(), getTargetAltitude(), getCategory(), taskOptions));
				scheduler->appendCommand(command);

				if (leader)
				{
					for (auto itr = wingmen.begin(); itr != wingmen.end(); itr++)
					{
						// Manually set the path and the active destination of the wingmen
						(*itr)->setPath(activePath);
						(*itr)->setActiveDestination(activeDestination);
						Command* command = dynamic_cast<Command*>(new FollowCommand(ID, (*itr)->getID()));
						scheduler->appendCommand(command);
					}
				}
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
	}
}

/* This function reset the activation so that the AI lopp will call again the MoveCommand. This is useful to change speed and altitude, for example */
void Unit::resetActiveDestination()
{
	log(unitName + L" resetting active destination");
	activeDestination = Coords(0);
}

json::value Unit::json()
{
	/* Lock for thread safety */
	lock_guard<mutex> guard(mutexLock);

	auto json = json::value::object();

	json[L"alive"] = alive;
	json[L"name"] = json::value::string(name);
	json[L"unitName"] = json::value::string(unitName);
	json[L"groupName"] = json::value::string(groupName);
	json[L"type"] = type;
	json[L"country"] = country;
	json[L"coalitionID"] = coalitionID;
	json[L"latitude"] = latitude;
	json[L"longitude"] = longitude;
	json[L"altitude"] = altitude;
	json[L"speed"] = speed; 
	json[L"heading"] = heading;
	json[L"flags"] = flags;
	json[L"category"] = json::value::string(getCategory());
	json[L"currentTask"] = json::value::string(getCurrentTask());
	json[L"leader"] = leader;
	json[L"wingman"] = wingman;
	json[L"formation"] = json::value::string(formation);
	json[L"fuel"] = fuel;
	json[L"ammo"] = ammo;
	json[L"targets"] = targets;

	int i = 0;
	for (auto itr = wingmen.begin(); itr != wingmen.end(); itr++)
	{
		json[L"wingmenIDs"][i++] = (*itr)->getID();
	}

	/* Send the active path as a json object */
	if (activePath.size() > 0) {
		auto path = json::value::object();
		int count = 1;
		for (auto& destination : activePath)
		{
			auto json = json::value::object();
			json[L"lat"] = destination.lat;
			json[L"lng"] = destination.lng;
			json[L"alt"] = destination.alt;
			path[to_wstring(count++)] = json;
		}
		json[L"activePath"] = path;
	}

	return json;
}

/* Air unit */
AirUnit::AirUnit(json::value json, int ID) : Unit(json, ID)
{

};

void AirUnit::AIloop()
{
	if (targetID != 0)
	{
		std::wostringstream taskOptionsSS;
		taskOptionsSS << "{"
			<< "id = 'EngageUnit'" << ","
			<< "targetID = " << targetID << ","
			<< "}";
		taskOptions = taskOptionsSS.str();
		currentTask = L"Attacking " + getTarget();
	}
	else
	{
		currentTask = L"Reaching destination";
	}

	/* Call the common AI loop */
	Unit::AIloop();

	/* Air unit AI Loop */
	if (activeDestination != NULL)
	{
		double newDist = 0;
		geod.Inverse(latitude, longitude, activeDestination.lat, activeDestination.lng, newDist);
		if (newDist < AIR_DEST_DIST_THR)
		{
			/* Destination reached */
			if (holding || looping)
			{
				activePath.push_back(activePath.front());
			}
			activePath.pop_front();
			log(name + L" destination reached");
		}
	}
	else
	{
		/* Air units must ALWAYS have a destination or they will RTB and may become uncontrollable */
		Coords point1;
		Coords point2;
		Coords point3;
		geod.Direct(latitude, longitude, 45, 10000, point1.lat, point1.lng);
		geod.Direct(point1.lat, point1.lng, 135, 10000, point2.lat, point2.lng);
		geod.Direct(point2.lat, point2.lng, 225, 10000, point3.lat, point3.lng);
		activePath.push_back(point1);
		activePath.push_back(point2);
		activePath.push_back(point3);
		activePath.push_back(Coords(latitude, longitude));
		holding = true;
		currentTask = L"Holding";
	}
}

/* Aircraft */
Aircraft::Aircraft(json::value json, int ID) : AirUnit(json, ID)
{
	log("New Aircraft created with ID: " + to_string(ID));
};

void Aircraft::changeSpeed(wstring change)
{
	if (change.compare(L"stop") == 0)
	{
		/* Air units can't hold a position, so we can only set them to hold. At the moment, this will erase any other command. TODO: helicopters should be able to hover in place */
		activePath.clear();
	}
	else if (change.compare(L"slow") == 0)
	{
		targetSpeed *= 0.9;
		resetActiveDestination();
	}
	else if (change.compare(L"fast") == 0)
	{
		targetSpeed *= 1.1;
		resetActiveDestination();
	}
}

void Aircraft::changeAltitude(wstring change)
{
	if (change.compare(L"descend") == 0)
	{
		targetAltitude *= 0.9;
	}
	else if (change.compare(L"climb") == 0)
	{
		targetAltitude *= 1.1;
	}
	resetActiveDestination();
}

/* Helicopter */
Helicopter::Helicopter(json::value json, int ID) : AirUnit(json, ID)
{
	log("New Helicopter created with ID: " + to_string(ID));
};

void Helicopter::changeSpeed(wstring change)
{
	if (change.compare(L"stop") == 0)
	{
		/* Air units can't hold a position, so we can only set them to hold. At the moment, this will erase any other command. TODO: helicopters should be able to hover in place */
		activePath.clear();
	}
	else if (change.compare(L"slow") == 0)
	{
		targetSpeed *= 0.9;
		resetActiveDestination();
	}
	else if (change.compare(L"fast") == 0)
	{
		targetSpeed *= 1.1;
		resetActiveDestination();
	}
}

void Helicopter::changeAltitude(wstring change)
{
	if (change.compare(L"descend") == 0)
	{
		targetAltitude *= 0.9;
	}
	else if (change.compare(L"climb") == 0)
	{
		targetAltitude *= 1.1;
	}
	resetActiveDestination();
}


/* Ground unit */
GroundUnit::GroundUnit(json::value json, int ID) : Unit(json, ID)
{
	log("New Ground Unit created with ID: " + to_string(ID));
};

void GroundUnit::AIloop()
{
	/* Call the common AI loop */
	Unit::AIloop();

	/* Ground unit AI Loop */
	if (activeDestination != NULL)
	{
		double newDist = 0;
		geod.Inverse(latitude, longitude, activeDestination.lat, activeDestination.lng, newDist);
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

/* Navy Unit */
NavyUnit::NavyUnit(json::value json, int ID) : Unit(json, ID)
{
	log("New Navy Unit created with ID: " + to_string(ID));
};

void NavyUnit::AIloop()
{
	/* Call the common AI loop */
	Unit::AIloop();

	/* Navy unit AI Loop */
	if (activeDestination != NULL)
	{
		double newDist = 0;
		geod.Inverse(latitude, longitude, activeDestination.lat, activeDestination.lng, newDist);
		if (newDist < GROUND_DEST_DIST_THR)
		{
			/* Destination reached */
			activePath.pop_front();
			log(unitName + L" destination reached");
		}
	}
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

/* Weapon */
Weapon::Weapon(json::value json, int ID) : Unit(json, ID)
{

};

/* Missile */
Missile::Missile(json::value json, int ID) : Weapon(json, ID)
{
	log("New Missile created with ID: " + to_string(ID));
};

/* Bomb */
Bomb::Bomb(json::value json, int ID) : Weapon(json, ID)
{
	log("New Bomb created with ID: " + to_string(ID));
};

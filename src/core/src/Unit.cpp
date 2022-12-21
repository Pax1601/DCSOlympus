#include "unit.h"
#include "utils.h"
#include "logger.h"
#include "commands.h"
#include "scheduler.h"

#include <GeographicLib/Geodesic.hpp>
using namespace GeographicLib;

extern Scheduler* scheduler;

const Geodesic& geod = Geodesic::WGS84();

Unit::Unit(json::value json, int ID) :
	ID(ID)
{
	log("Creating unit with ID: " + to_string(ID));
	update(json);
}

Unit::~Unit()
{

}

int Unit::getCategory()
{
	if (type.has_number_field(L"level1"))
	{
		return type[L"level1"].as_number().to_int32();
	}
	else
	{
		return UnitCategory::NO_CATEGORY;
	}
}

void Unit::update(json::value json)
{
	/* Lock for thread safety */
	lock_guard<mutex> guard(mutexLock);

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

void Unit::setPath(list<Coords> path)
{
	activePath = path;
}

void Unit::AIloop()
{
	/* Set the active destination to be always equal to the first point of the active path */
	if (activePath.size() > 0)
	{
		if (activeDestination != activePath.front())
		{
			activeDestination = activePath.front();
			Command* command = dynamic_cast<Command*>(new MoveCommand(ID, unitName, activeDestination, getCategory()));
			scheduler->appendCommand(command);
		}
	}
	else
	{
		if (activeDestination != NULL)
		{
			log(unitName + L" no more points in active path");
			activeDestination = Coords(0); // Set the active path to NULL
		}
	}

	/* Ground unit AI Loop */
	if (getCategory() == UnitCategory::GROUND)
	{
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

	/* Air unit AI Loop */
	if (getCategory() == UnitCategory::AIR)
	{
		if (activeDestination != NULL)
		{
			double newDist = 0;
			geod.Inverse(latitude, longitude, activeDestination.lat, activeDestination.lng, newDist);
			if (newDist < AIR_DEST_DIST_THR)
			{
				/* Destination reached */
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
			geod.Direct(latitude, longitude, 45, 18520, point1.lat, point1.lng);
			geod.Direct(point1.lat, point1.lng, 135, 18520, point2.lat, point2.lng);
			geod.Direct(point2.lat, point2.lng, 225, 18520, point3.lat, point3.lng);
			activePath.push_back(point1);
			activePath.push_back(point2);
			activePath.push_back(point3);
			activePath.push_back(Coords(latitude, longitude));
		}
	}
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
	json[L"heading"] = heading;
	json[L"flags"] = flags;

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



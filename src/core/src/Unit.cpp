#include "unit.h"
#include "utils.h"
#include "logger.h"
#include "commands.h"
#include "scheduler.h"

extern Scheduler* scheduler;

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
		return type[L"level1"].as_number().is_int32();
	}
	else
	{
		return UnitCategory::NO_CATEGORY;
	}
}

void Unit::update(json::value json)
{
	name = json[L"Name"].as_string();
	unitName = json[L"UnitName"].as_string();
	groupName = json[L"GroupName"].as_string();
	type = json[L"Type"];
	country = json[L"Country"].as_number().to_int32();
	coalitionID = json[L"CoalitionID"].as_number().to_int32();
	latitude = json[L"LatLongAlt"][L"Lat"].as_number().to_double();
	longitude = json[L"LatLongAlt"][L"Long"].as_number().to_double();
	altitude = json[L"LatLongAlt"][L"Alt"].as_number().to_double();
	heading = json[L"Heading"].as_number().to_double();

	/* If the unit is alive, run the AI Loop that performs the requested commands and instructions (moving, attacking, etc) */
	if (alive)
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
	if (activePath.size() > 0)
	{
		if (activeDestination != activePath.front())
		{
			activeDestination = activePath.front();
			Command* command = dynamic_cast<Command*>(new MoveCommand(ID, unitName, activeDestination, getCategory()));
			scheduler->appendCommand(command);
		}
	}
}

json::value Unit::json()
{
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



#include "Unit.h"
#include "Utils.h"
#include "Logger.h"
#include "Commands.h"
#include "Scheduler.h"

extern Scheduler* scheduler;

Unit::Unit(json::value json, int ID) :
	ID(ID)
{
	LOGGER->Log("Creating unit with ID: " + to_string(ID));
	update(json);
}

Unit::~Unit()
{

}

void Unit::update(json::value json)
{
	name = json[L"Name"].as_string();
	unitName = json[L"UnitName"].as_string();
	groupName = json[L"GroupName"].as_string();
	//type = json[L"Type"].as_number().to_int32();
	//country = json[L"Country"].as_string();
	//coalitionID = json[L"CoalitionID"].as_number().to_int32();
	latitude = json[L"LatLongAlt"][L"Lat"].as_number().to_double();
	longitude = json[L"LatLongAlt"][L"Long"].as_number().to_double();
	altitude = json[L"LatLongAlt"][L"Alt"].as_number().to_double();
	heading = json[L"Heading"].as_number().to_double();

	AIloop();
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
			Command* command = dynamic_cast<Command*>(new MoveCommand(ID, unitName, activeDestination));
			scheduler->appendCommand(command);
		}
	}
}

json::value Unit::json()
{
	auto json = json::value::object();

	json[L"name"] = json::value::string(name);
	json[L"unitName"] = json::value::string(unitName);
	json[L"groupName"] = json::value::string(groupName);
	//json[L"type"] = type;
	//json[L"country"] = json::value::string(country);
	json[L"coalitionID"] = type;
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



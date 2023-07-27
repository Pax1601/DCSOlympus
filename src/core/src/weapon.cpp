#include "weapon.h"
#include "utils.h"
#include "logger.h"
#include "commands.h"
#include "scheduler.h"
#include "defines.h"

#include <chrono>
using namespace std::chrono;

Weapon::Weapon(json::value json, unsigned int ID) :
	ID(ID)
{
	log("Creating weapon with ID: " + to_string(ID));
}

Weapon::~Weapon()
{

}

void Weapon::initialize(json::value json)
{
	if (json.has_string_field(L"name"))
		setName(to_string(json[L"name"]));


	if (json.has_number_field(L"coalitionID"))
		setCoalition(json[L"coalitionID"].as_number().to_int32());

	update(json, 0);
}


void Weapon::update(json::value json, double dt)
{
	if (json.has_object_field(L"position"))
	{
		setPosition({
			json[L"position"][L"lat"].as_number().to_double(),
			json[L"position"][L"lng"].as_number().to_double(),
			json[L"position"][L"alt"].as_number().to_double()
			});
	}

	if (json.has_number_field(L"heading"))
		setHeading(json[L"heading"].as_number().to_double());

	if (json.has_number_field(L"speed"))
		setSpeed(json[L"speed"].as_number().to_double());

	if (json.has_boolean_field(L"isAlive"))
		setAlive(json[L"isAlive"].as_bool());
}

bool Weapon::checkFreshness(unsigned char datumIndex, unsigned long long time) {
	auto it = updateTimeMap.find(datumIndex);
	if (it == updateTimeMap.end())
		return false;
	else
		return it->second > time;
}

bool Weapon::hasFreshData(unsigned long long time) {
	for (auto it : updateTimeMap)
		if (it.second > time)
			return true;
	return false;
}

void Weapon::getData(stringstream& ss, unsigned long long time)
{
	const unsigned char endOfData = DataIndex::endOfData;
	ss.write((const char*)&ID, sizeof(ID));
	for (unsigned char datumIndex = DataIndex::startOfData + 1; datumIndex < DataIndex::lastIndex; datumIndex++)
	{
		if (checkFreshness(datumIndex, time)) {
			switch (datumIndex) {
			case DataIndex::category:					appendString(ss, datumIndex, category); break;
			case DataIndex::alive:						appendNumeric(ss, datumIndex, alive); break;
			case DataIndex::coalition:					appendNumeric(ss, datumIndex, coalition); break;
			case DataIndex::name:						appendString(ss, datumIndex, name); break;
			case DataIndex::position:					appendNumeric(ss, datumIndex, position); break;
			case DataIndex::speed:						appendNumeric(ss, datumIndex, speed); break;
			case DataIndex::heading:					appendNumeric(ss, datumIndex, heading); break;
			}
		}
	}
	ss.write((const char*)&endOfData, sizeof(endOfData));
}

void Weapon::triggerUpdate(unsigned char datumIndex) {
	updateTimeMap[datumIndex] = duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
}

/* Missile */
Missile::Missile(json::value json, unsigned int ID) : Weapon(json, ID)
{
	log("New Missile created with ID: " + to_string(ID));
	setCategory("Missile");
};

/* Bomb */
Bomb::Bomb(json::value json, unsigned int ID) : Weapon(json, ID)
{
	log("New Bomb created with ID: " + to_string(ID));
	setCategory("Bomb");
};
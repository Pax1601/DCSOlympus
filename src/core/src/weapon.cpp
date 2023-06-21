#include "weapon.h"
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

/* Weapon */
Weapon::Weapon(json::value json, int ID) : Unit(json, ID)
{

};

/* Missile */
Missile::Missile(json::value json, int ID) : Weapon(json, ID)
{
	log("New Missile created with ID: " + to_string(ID));
	addMeasure(L"category", json::value(getCategory()));
};

/* Bomb */
Bomb::Bomb(json::value json, int ID) : Weapon(json, ID)
{
	log("New Bomb created with ID: " + to_string(ID));
	addMeasure(L"category", json::value(getCategory()));
};
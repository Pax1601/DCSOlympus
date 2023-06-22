#pragma once
#include "framework.h"
#include "utils.h"
#include "dcstools.h"
#include "luatools.h"
#include "Unit.h"

#define AIR_DEST_DIST_THR 2000	// Meters

class AirUnit : public Unit
{
public:
	AirUnit(json::value json, unsigned int ID);

	virtual void setState(unsigned char newState);

	virtual string getCategory() = 0;
	virtual void changeSpeed(string change) = 0;
	virtual void changeAltitude(string change) = 0;
	
protected:
	virtual void AIloop();
};
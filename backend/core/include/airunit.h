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

	virtual void setDefaults(bool force = false);
	virtual void setState(unsigned char newState);

	virtual void changeSpeed(string change) = 0;
	virtual void changeAltitude(string change) = 0;
	virtual double getDestinationReachedThreshold() { return AIR_DEST_DIST_THR;  }

	virtual void setRacetrackLength(double newValue);
	virtual void setRacetrackAnchor(Coords newValue);
	virtual void setRacetrackBearing(double newValue);
	
protected:
	virtual void AIloop();
};
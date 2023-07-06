#pragma once
#include "unit.h"

#define GROUND_DEST_DIST_THR 100

class GroundUnit : public Unit
{
public:
	GroundUnit(json::value json, unsigned int ID);

	virtual void setState(unsigned char newState);

	virtual void changeSpeed(string change);
	virtual void setOnOff(bool newOnOff);
	virtual void setFollowRoads(bool newFollowRoads);

protected:
	virtual void AIloop();
};
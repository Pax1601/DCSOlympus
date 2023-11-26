#pragma once
#include "unit.h"

#define GROUND_DEST_DIST_THR 100

class GroundUnit : public Unit
{
public:
	GroundUnit(json::value json, unsigned int ID);

	static void loadDatabase(string path);

	virtual void setState(unsigned char newState);
	virtual void setDefaults(bool force = false);

	virtual void changeSpeed(string change);
	virtual void setOnOff(bool newOnOff, bool force = false);
	virtual void setFollowRoads(bool newFollowRoads, bool force = false);

	void aimAtPoint(Coords aimTarget);

protected:
	virtual void AIloop();
	static json::value database;
};
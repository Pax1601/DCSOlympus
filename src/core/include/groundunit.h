#pragma once
#include "unit.h"

#define GROUND_DEST_DIST_THR 100

class GroundUnit : public Unit
{
public:
	GroundUnit(json::value json, int ID);
	virtual wstring getCategory() { return L"GroundUnit"; };

	virtual void setState(int newState);

	virtual void changeSpeed(wstring change);
	virtual void setOnOff(bool newOnOff);
	virtual void setFollowRoads(bool newFollowRoads);

protected:
	virtual void AIloop();
};
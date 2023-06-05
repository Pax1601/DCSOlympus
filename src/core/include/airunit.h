#pragma once
#include "framework.h"
#include "utils.h"
#include "dcstools.h"
#include "luatools.h"
#include "Unit.h"

#define AIR_DEST_DIST_THR 2000

class AirUnit : public Unit
{
public:
	AirUnit(json::value json, int ID);

	virtual wstring getCategory() = 0;
	virtual void changeSpeed(wstring change) {};
	virtual void changeAltitude(wstring change) {};
	virtual void setTargetSpeed(double newTargetSpeed);
	virtual void setTargetAltitude(double newTargetAltitude);
	virtual void setTargetSpeedType(wstring newTargetSpeedType);
	virtual void setTargetAltitudeType(wstring newTargetAltitudeType);

protected:
	virtual void AIloop();
	virtual void setState(int newState);
	bool isDestinationReached();
	bool setActiveDestination();
	bool updateActivePath(bool looping);
	void goToDestination(wstring enrouteTask = L"nil");
};
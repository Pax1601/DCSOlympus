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
	virtual void setTargetSpeed(double newTargetSpeed) {};
	virtual void setTargetAltitude(double newTargetAltitude) {};

protected:
	virtual void AIloop();
	virtual void setState(int newState);
	bool isDestinationReached();
	bool setActiveDestination();
	void createHoldingPattern();
	bool updateActivePath(bool looping);
	void goToDestination(wstring enrouteTask = L"nil");
	void taskWingmen();
};
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

	virtual void setState(int newState);

	virtual wstring getCategory() = 0;
	virtual void changeSpeed(wstring change) = 0;
	virtual void changeAltitude(wstring change) = 0;
	
protected:
	virtual void AIloop();
};
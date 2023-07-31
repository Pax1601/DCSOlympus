#pragma once
#include "unit.h"

#define NAVY_DEST_DIST_THR 100

class NavyUnit : public Unit
{
public:
	NavyUnit(json::value json, unsigned int ID);

	virtual void setState(unsigned char newState);
	virtual void setDefaults(bool force = false);

	virtual void changeSpeed(string change);
	virtual void setOnOff(bool newOnOff, bool force = false);

protected:
	virtual void AIloop();

};
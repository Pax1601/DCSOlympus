#pragma once
#include "unit.h"

class NavyUnit : public Unit
{
public:
	NavyUnit(json::value json, unsigned int ID);
	virtual void AIloop();

	virtual void changeSpeed(string change);

};
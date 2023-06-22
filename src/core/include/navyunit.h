#pragma once
#include "unit.h"

class NavyUnit : public Unit
{
public:
	NavyUnit(json::value json, unsigned int ID);
	virtual void AIloop();

	virtual string getCategory() { return "NavyUnit"; };
	virtual void changeSpeed(string change);

};
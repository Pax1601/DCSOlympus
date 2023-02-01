#pragma once
#include "unit.h"

class NavyUnit : public Unit
{
public:
	NavyUnit(json::value json, int ID);
	virtual void AIloop();

	virtual wstring getCategory() { return L"NavyUnit"; };
	virtual void changeSpeed(wstring change);
	virtual void changeAltitude(wstring change) {};
	virtual double getTargetSpeed() { return targetSpeed; };

protected:
	double targetSpeed = 10;
};
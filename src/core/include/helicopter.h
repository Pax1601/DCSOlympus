#pragma once
#include "airunit.h"

class Helicopter : public AirUnit
{
public:
	Helicopter(json::value json, int ID);

	virtual wstring getCategory() { return L"Helicopter"; };

	virtual void changeSpeed(wstring change);
	virtual void changeAltitude(wstring change);
	virtual double getTargetSpeed() { return targetSpeed; };
	virtual double getTargetAltitude() { return targetAltitude; };

protected:
	double targetSpeed = 50;
	double targetAltitude = 1000;
};
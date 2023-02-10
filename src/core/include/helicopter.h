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
	virtual void setTargetSpeed(double newTargetSpeed);
	virtual void setTargetAltitude(double newTargetAltitude);

protected:
	double targetSpeed = 100 / 1.94384;
	double targetAltitude = 5000 * 0.3048;
};
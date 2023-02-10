#pragma once
#include "airunit.h"

class Aircraft : public AirUnit
{
public:
	Aircraft(json::value json, int ID);

	virtual wstring getCategory() { return L"Aircraft"; };

	virtual void changeSpeed(wstring change);
	virtual void changeAltitude(wstring change);
	virtual double getTargetSpeed() { return targetSpeed; };
	virtual double getTargetAltitude() { return targetAltitude; };
	virtual void setTargetSpeed(double newTargetSpeed);
	virtual void setTargetAltitude(double newTargetAltitude);

protected:
	double targetSpeed = 300 / 1.94384;
	double targetAltitude = 20000 * 0.3048;
};
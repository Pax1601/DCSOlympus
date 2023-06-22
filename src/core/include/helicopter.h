#pragma once
#include "airunit.h"

class Helicopter : public AirUnit
{
public:
	Helicopter(json::value json, unsigned int ID);

	virtual string getCategory() { return "Helicopter"; };

	virtual void changeSpeed(string change);
	virtual void changeAltitude(string change);
};
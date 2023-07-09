#pragma once
#include "airunit.h"

class Helicopter : public AirUnit
{
public:
	Helicopter(json::value json, unsigned int ID);

	virtual void changeSpeed(string change);
	virtual void changeAltitude(string change);
};
#pragma once
#include "airunit.h"

class Aircraft : public AirUnit
{
public:
	Aircraft(json::value json, unsigned int ID);

	virtual void changeSpeed(string change);
	virtual void changeAltitude(string change);
};
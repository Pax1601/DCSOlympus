#pragma once
#include "airunit.h"

class Aircraft : public AirUnit
{
public:
	Aircraft(json::value json, unsigned int ID);

	virtual string getCategory() { return "Aircraft"; };

	virtual void changeSpeed(string change);
	virtual void changeAltitude(string change);
};
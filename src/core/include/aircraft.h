#pragma once
#include "airunit.h"

class Aircraft : public AirUnit
{
public:
	Aircraft(json::value json, unsigned int ID);

	static void loadDatabase(string path);

	virtual void changeSpeed(string change);
	virtual void changeAltitude(string change);

protected:
	static json::value database;
};
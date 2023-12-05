#pragma once
#include "airunit.h"

#define HELICOPTER_DEST_DIST_THR 500	// Meters

class Helicopter : public AirUnit
{
public:
	Helicopter(json::value json, unsigned int ID);

	static void loadDatabase(string path);

	virtual void changeSpeed(string change);
	virtual void changeAltitude(string change);

	virtual double getDestinationReachedThreshold() { return HELICOPTER_DEST_DIST_THR; }

protected:
	static json::value database;
};
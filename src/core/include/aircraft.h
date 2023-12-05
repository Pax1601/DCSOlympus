#pragma once
#include "airunit.h"

#define AIRCRAFT_DEST_DIST_THR 2000	// Meters

class Aircraft : public AirUnit
{
public:
	Aircraft(json::value json, unsigned int ID);

	static void loadDatabase(string path);

	virtual void changeSpeed(string change);
	virtual void changeAltitude(string change);

	virtual double getDestinationReachedThreshold() { return AIRCRAFT_DEST_DIST_THR; }

protected:
	static json::value database;
};
#pragma once
#include "airunit.h"

class Aircraft : public AirUnit
{
public:
	Aircraft(json::value json, int ID);

	virtual wstring getCategory() { return L"Aircraft"; };

	virtual void changeSpeed(wstring change);
	virtual void changeAltitude(wstring change);
};
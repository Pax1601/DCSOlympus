#pragma once
#include "airunit.h"

class Helicopter : public AirUnit
{
public:
	Helicopter(json::value json, int ID);

	virtual wstring getCategory() { return L"Helicopter"; };

	virtual void changeSpeed(wstring change);
	virtual void changeAltitude(wstring change);
};
#pragma once
#include "unit.h"

class Weapon : public Unit
{
public:
	Weapon(json::value json, int ID);

	virtual wstring getCategory() = 0;

protected:
	/* Weapons are not controllable and have no AIloop */
	virtual void AIloop() {};
};

class Missile : public Weapon
{
public:
	Missile(json::value json, int ID);

	virtual wstring getCategory() { return L"Missile"; };
};

class Bomb : public Weapon
{
public:
	Bomb(json::value json, int ID);

	virtual wstring getCategory() { return L"Bomb"; };
};
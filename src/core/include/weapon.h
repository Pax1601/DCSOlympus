#pragma once
#include "unit.h"

class Weapon : public Unit
{
public:
	Weapon(json::value json, unsigned int ID);

	virtual string getCategory() = 0;

protected:
	/* Weapons are not controllable and have no AIloop */
	virtual void AIloop() {};
};

class Missile : public Weapon
{
public:
	Missile(json::value json, unsigned int ID);

	virtual string getCategory() { return "Missile"; };
};

class Bomb : public Weapon
{
public:
	Bomb(json::value json, unsigned int ID);

	virtual string getCategory() { return "Bomb"; };
};
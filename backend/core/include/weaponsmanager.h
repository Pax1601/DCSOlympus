#pragma once
#include "framework.h"
#include "dcstools.h"

class Weapon;

class WeaponsManager
{
public:
	WeaponsManager(lua_State* L);
	~WeaponsManager();

	map<unsigned int, Weapon*>& getWeapons() { return weapons; };
	Weapon* getWeapon(unsigned int ID);
	void update(json::value& missionData, double dt);
	void getWeaponData(stringstream& ss, unsigned long long time);

private:
	map<unsigned int, Weapon*> weapons;
};


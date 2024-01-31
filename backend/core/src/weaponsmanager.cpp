#include "framework.h"
#include "weaponsManager.h"
#include "logger.h"
#include "weapon.h"
#include "scheduler.h"

#include "base64.hpp"
using namespace base64;

WeaponsManager::WeaponsManager(lua_State* L)
{
	LogInfo(L, "Weapons Manager constructor called successfully");
}

WeaponsManager::~WeaponsManager()
{

}

Weapon* WeaponsManager::getWeapon(unsigned int ID)
{
	if (weapons.find(ID) == weapons.end()) {
		return nullptr;
	}
	else {
		return weapons[ID];
	}
}

void WeaponsManager::update(json::value& json, double dt)
{
	for (auto const& p : json.as_object())
	{
		unsigned int ID = std::stoi(p.first);
		if (weapons.count(ID) == 0)
		{
			json::value value = p.second;
			if (value.has_string_field(L"category")) {
				string category = to_string(value[L"category"].as_string());
				if (category.compare("Missile") == 0)
					weapons[ID] = dynamic_cast<Weapon*>(new Missile(p.second, ID));
				else if (category.compare("Bomb") == 0)
					weapons[ID] = dynamic_cast<Weapon*>(new Bomb(p.second, ID));

				/* Initialize the weapon if creation was successfull */
				if (weapons.count(ID) != 0) {
					weapons[ID]->update(p.second, dt);
					weapons[ID]->initialize(p.second);
				}
			}
		}
		else {
			/* Update the weapon if present*/
			if (weapons.count(ID) != 0)
				weapons[ID]->update(p.second, dt);
		}
	}
}

void WeaponsManager::getWeaponData(stringstream& ss, unsigned long long time)
{
	for (auto const& p : weapons)
		p.second->getData(ss, time);
}


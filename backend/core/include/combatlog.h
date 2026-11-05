#pragma once
#include "framework.h"
#include "dcstools.h"
#include <deque>
#include <vector>

#define COMBAT_LOG_MAX_SIZE 5000

/* Stores the combat events (shots, hits, kills, ejections, takeoffs, landings...) sent by the Lua backend.
Each event is stamped with a unique, strictly increasing logTime (in ms), used by clients as an update cursor. */
class CombatLog
{
public:
	CombatLog(lua_State* L);

	void update(json::value& combatEventsData);
	void getCombatLogJSON(json::value& json, unsigned long long time, int coalitionID = 0);
	unsigned long long getLastLogTime() { return lastLogTime; };

private:
	deque<pair<unsigned long long, json::value>> events;
	unsigned long long lastLogTime = 0;
};

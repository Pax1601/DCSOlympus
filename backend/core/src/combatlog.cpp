#include "framework.h"
#include "combatLog.h"
#include "logger.h"

#include <chrono>
using namespace std::chrono;

CombatLog::CombatLog(lua_State* L)
{
	LogInfo(L, "Combat log constructor called successfully");
}

/* Adds the events received from Lua. The Lua table is keyed by sequence number, so the events are sorted by it before being stored */
void CombatLog::update(json::value& combatEventsData)
{
	if (!combatEventsData.is_object())
		return;

	vector<pair<double, json::value>> received;
	for (auto const& p : combatEventsData.as_object())
	{
		if (!p.second.is_object())
			continue;
		double seq = p.second.has_number_field(L"seq") ? p.second.at(L"seq").as_double() : 0;
		received.push_back(make_pair(seq, p.second));
	}
	sort(received.begin(), received.end(), [](const pair<double, json::value>& a, const pair<double, json::value>& b) { return a.first < b.first; });

	unsigned long long now = duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
	for (auto& r : received)
	{
		/* Events received in the same millisecond still get different log times */
		lastLogTime = (now > lastLogTime) ? now : lastLogTime + 1;
		r.second[L"logTime"] = json::value::number(lastLogTime);
		events.push_back(make_pair(lastLogTime, r.second));
	}

	while (events.size() > COMBAT_LOG_MAX_SIZE)
		events.pop_front();
}

/* Returns true if the initiator or the target of the event belongs to the coalition (DCS coalition IDs: 1 red, 2 blue) */
static bool involvesCoalition(json::value& combatEvent, int coalitionID)
{
	for (auto const& role : { L"initiator", L"target" })
	{
		if (combatEvent.has_object_field(role) && combatEvent.at(role).has_number_field(L"coalitionID")
			&& combatEvent.at(role).at(L"coalitionID").as_integer() == coalitionID)
			return true;
	}
	return false;
}

/* Returns the events logged strictly after the provided time, oldest first. A time of 0 returns all the stored events.
If a coalition ID is provided, only the events involving that coalition are returned, so that a commander can not see what happens between other coalitions */
void CombatLog::getCombatLogJSON(json::value& json, unsigned long long time, int coalitionID)
{
	vector<json::value> selected;

	/* Loop on the events in reverse since we are usually only interested in the very last added events */
	auto itr = events.end();
	while (itr != events.begin())
	{
		--itr;
		if (itr->first <= time) break;
		if (coalitionID == 0 || involvesCoalition(itr->second, coalitionID))
			selected.push_back(itr->second);
	}
	reverse(selected.begin(), selected.end());

	json = json::value::array(selected);
}

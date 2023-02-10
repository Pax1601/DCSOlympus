#pragma once
#include "framework.h"
#include "luatools.h"
#include "utils.h"

namespace CommandPriority {
	enum CommandPriorities { LOW, MEDIUM, HIGH };
};

namespace CommandType {
	enum CommandTypes { NO_TYPE, MOVE, SMOKE, SPAWN_AIR, SPAWN_GROUND, CLONE, FOLLOW, RESET_TASK, SET_OPTION, SET_COMMAND, SET_TASK };
};

namespace SetCommandType {
	enum SetCommandTypes {
		ROE = 0,
		REACTION_ON_THREAT = 1,
		RADAR_USING = 3,
		FLARE_USING = 4,
		Formation = 5,
		RTB_ON_BINGO = 6,
		SILENCE = 7,
		RTB_ON_OUT_OF_AMMO = 10,
		ECM_USING = 13,
		PROHIBIT_AA = 14,
		PROHIBIT_JETT = 15,
		PROHIBIT_AB = 16,
		PROHIBIT_AG = 17,
		MISSILE_ATTACK = 18,
		PROHIBIT_WP_PASS_REPORT = 19,
		OPTION_RADIO_USAGE_CONTACT = 21,
		OPTION_RADIO_USAGE_ENGAGE = 22,
		OPTION_RADIO_USAGE_KILL = 23,
		JETT_TANKS_IF_EMPTY = 25,
		FORCED_ATTACK = 26
	};
}

namespace ROE {
	enum ROEs {
		WEAPON_FREE = 0,
		OPEN_FIRE_WEAPON_FREE = 1,
		OPEN_FIRE = 2,
		RETURN_FIRE = 3,
		WEAPON_HOLD = 4,
	};
}

namespace ReactionToThreat {
	enum ReactionToThreats {
		NO_REACTION = 0,
		PASSIVE_DEFENCE = 1,
		EVADE_FIRE = 2,
		BYPASS_AND_ESCAPE = 3,
		ALLOW_ABORT_MISSION = 4
	};
}




/* Base command class */
class Command
{
public:
	int getPriority() { return priority; }
	int getType() { return type; }
	virtual wstring getString(lua_State* L) = 0;

protected:
	int priority = CommandPriority::LOW;
	int type = CommandType::NO_TYPE;
};

/* Simple low priority move command (from user click) */
class Move : public Command
{
public:
	Move(int ID, Coords destination, double speed, double altitude, wstring unitCategory, wstring taskOptions):
		ID(ID),
		destination(destination),
		speed(speed),
		altitude(altitude),
		unitCategory(unitCategory),
		taskOptions(taskOptions)
	{ 
		priority = CommandPriority::HIGH; 
		type = CommandType::MOVE; 
	};
	virtual wstring getString(lua_State* L);

private:
	const int ID;
	const Coords destination;
	const wstring unitCategory;
	const double speed;
	const double altitude;
	const wstring taskOptions;
};

/* Smoke command */
class Smoke : public Command
{
public:
	Smoke(wstring color, Coords location) : 
		color(color), 
		location(location) 
	{ 
		priority = CommandPriority::LOW; 
		type = CommandType::SMOKE; 
	};
	virtual wstring getString(lua_State* L);

private:
	const wstring color;
	const Coords location;
};

/* Spawn ground unit command */
class SpawnGroundUnit : public Command
{
public:
	SpawnGroundUnit(wstring coalition, wstring unitType, Coords location) :  
		coalition(coalition), 
		unitType(unitType), 
		location(location) 
	{ 
		priority = CommandPriority::LOW; 
		type = CommandType::SPAWN_GROUND; 
	};
	virtual wstring getString(lua_State* L);

private:
	const wstring coalition;
	const wstring unitType;
	const Coords location;
};

/* Spawn air unit command */
class SpawnAircraft : public Command
{
public:
	SpawnAircraft(wstring coalition, wstring unitType, Coords location, wstring payloadName, wstring airbaseName) :
		coalition(coalition), 
		unitType(unitType), 
		location(location),
		payloadName(payloadName),
		airbaseName(airbaseName)
	{ 
		priority = CommandPriority::LOW; 
		type = CommandType::SPAWN_AIR; 
	};

	virtual wstring getString(lua_State* L);

private:
	const wstring coalition;
	const wstring unitType;
	const Coords location;
	const wstring payloadName;
	const wstring airbaseName;
};

/* Clone unit command */
class Clone : public Command
{
public:
	Clone(int ID, Coords location) :
		ID(ID),
		location(location)
	{
		priority = CommandPriority::LOW;
		type = CommandType::CLONE;
	};
	virtual wstring getString(lua_State* L);

private:
	const int ID;
	const Coords location;
};

/* Delete unit command */
class Delete : public Command
{
public:
	Delete(int ID) :
		ID(ID)
	{
		priority = CommandPriority::HIGH;
		type = CommandType::CLONE;
	};
	virtual wstring getString(lua_State* L);

private:
	const int ID;
};

/* Follow command */
class SetTask : public Command
{
public:
	SetTask(int ID, wstring task) :
		ID(ID),
		task(task)
	{
		priority = CommandPriority::MEDIUM;
		type = CommandType::FOLLOW;
	};
	virtual wstring getString(lua_State* L);

private:
	const int ID;
	const wstring task;
};

/* Reset task command */
class ResetTask : public Command
{
public:
	ResetTask(int ID) :
		ID(ID)
	{
		priority = CommandPriority::HIGH;
		type = CommandType::RESET_TASK;
	};
	virtual wstring getString(lua_State* L);

private:
	const int ID;
};

/* Set command */
class SetCommand : public Command
{
public:
	SetCommand(int ID, wstring command) :
		ID(ID),
		command(command)
	{
		priority = CommandPriority::HIGH;
		type = CommandType::RESET_TASK;
	};
	virtual wstring getString(lua_State* L);

private:
	const int ID;
	const wstring command;
};

/* Set option command */
class SetOption : public Command
{
public:
	SetOption(int ID, int optionID, int optionValue) :
		ID(ID),
		optionID(optionID),
		optionValue(optionValue)
	{
		priority = CommandPriority::HIGH;
		type = CommandType::RESET_TASK;
	};
	virtual wstring getString(lua_State* L);

private:
	const int ID;
	const int optionID;
	const int optionValue;
};
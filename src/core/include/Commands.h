#pragma once
#include "framework.h"
#include "luatools.h"
#include "utils.h"

namespace CommandPriority {
	enum CommandPriorities { LOW, MEDIUM, HIGH };
};

namespace CommandType {
	enum CommandTypes { NO_TYPE, MOVE, SMOKE, LASE, EXPLODE, SPAWN_AIR, SPAWN_GROUND, CLONE, LAND, REFUEL, FOLLOW };
};

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
class MoveCommand : public Command
{
public:
	MoveCommand(int ID, Coords destination, double speed, double altitude, wstring unitCategory, wstring taskOptions):
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
class SmokeCommand : public Command
{
public:
	SmokeCommand(wstring color, Coords location) : 
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
class SpawnGroundUnitCommand : public Command
{
public:
	SpawnGroundUnitCommand(wstring coalition, wstring unitType, Coords location) :  
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
class SpawnAircraftCommand : public Command
{
public:
	SpawnAircraftCommand(wstring coalition, wstring unitType, Coords location, wstring payloadName, wstring airbaseName) :
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
class CloneCommand : public Command
{
public:
	CloneCommand(int ID) :
		ID(ID)
	{
		priority = CommandPriority::LOW;
		type = CommandType::CLONE;
	};
	virtual wstring getString(lua_State* L);

private:
	const int ID;
};

/* Follow command */
class FollowCommand : public Command
{
public:
	FollowCommand(int leaderID, int ID) :
		leaderID(leaderID),
		ID(ID)
	{
		priority = CommandPriority::LOW;
		type = CommandType::FOLLOW;
	};
	virtual wstring getString(lua_State* L);

private:
	const int leaderID;
	const int ID;
};

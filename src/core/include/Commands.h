#pragma once
#include "framework.h"
#include "luatools.h"
#include "utils.h"

namespace CommandPriority {
	enum CommandPriorities { LOW, MEDIUM, HIGH };
};

namespace CommandType {
	enum CommandTypes { NO_TYPE, MOVE, SMOKE, LASE, EXPLODE, SPAWN_AIR, SPAWN_GROUND };
};

/* Base command class */
class Command
{
public:
	int getPriority() { return priority; }
	int getType() { return type; }
	virtual void execute(lua_State* L) {};

protected:
	int priority = CommandPriority::LOW;
	int type = CommandType::NO_TYPE;
};

/* Simple low priority move command (from user click) */
class MoveCommand : public Command
{
public:
	MoveCommand(int ID, wstring unitName, Coords destination, int unitCategory) : 
		ID(ID), 
		unitName(unitName), 
		destination(destination),
		unitCategory(unitCategory)
	{ 
		priority = CommandPriority::LOW; 
		type = CommandType::MOVE; 
	};
	virtual void execute(lua_State* L);

private:
	const int ID;
	const wstring unitName;
	const Coords destination;
	const int unitCategory;
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
	virtual void execute(lua_State* L);

private:
	const wstring color;
	const Coords location;
};

/* Spawn ground unit command */
class SpawnGroundCommand : public Command
{
public:
	SpawnGroundCommand(wstring coalition, wstring unitType, Coords location) :  
		coalition(coalition), 
		unitType(unitType), 
		location(location) 
	{ 
		priority = CommandPriority::LOW; 
		type = CommandType::SPAWN_GROUND; 
	};
	virtual void execute(lua_State* L);

private:
	const wstring coalition;
	const wstring unitType;
	const Coords location;
};

/* Spawn air unit command */
class SpawnAirCommand : public Command
{
public:
	SpawnAirCommand(wstring coalition, wstring unitType, Coords location) : 
		coalition(coalition), 
		unitType(unitType), 
		location(location) 
	{ 
		priority = CommandPriority::LOW; 
		type = CommandType::SPAWN_AIR; 
	};
	virtual void execute(lua_State* L);

private:
	const wstring coalition;
	const wstring unitType;
	const Coords location;
};
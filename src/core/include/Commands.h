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
	Clone(int ID) :
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
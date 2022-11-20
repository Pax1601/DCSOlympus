#pragma once
#include "LUAUtils.h"
#include "Utils.h"

namespace CommandPriority {
	enum CommandPriorities { LOW, MEDIUM, HIGH };
};

namespace CommandType {
	enum CommandTypes { NO_TYPE, MOVE };
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
	MoveCommand(int ID, wstring unitName, Coords destination) : ID(ID), unitName(unitName), destination(destination) { priority = CommandPriority::LOW; type = CommandType::MOVE; };
	virtual void execute(lua_State* L);

private:
	const int ID;
	const wstring unitName;
	const Coords destination;
};
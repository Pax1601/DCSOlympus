#pragma once
#include "framework.h"
#include "luatools.h"
#include "commands.h"

class Scheduler
{
public:
	Scheduler(lua_State* L);
	~Scheduler();

	void appendCommand(Command* command);
	void execute(lua_State* L);
	void handleRequest(string key, json::value value);
	
private:
	list<Command*> commands;
	unsigned int load;
};


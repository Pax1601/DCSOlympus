#pragma once
#include "LUAUtils.h"
#include "framework.h"
#include "Commands.h"

class Scheduler
{
public:
	Scheduler(lua_State* L);
	~Scheduler();

	void appendCommand(Command* command);
	void execute(lua_State* L);
	void handleRequest(wstring key, json::value value);

private:
	list<Command*> commands;
	mutex lock;
};


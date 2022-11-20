#pragma once
#include "framework.h"

namespace LUAUtils
{
	void stackUpdate(lua_State* L, int& stackDepth, int initialStack = 0);
	void stackPop(lua_State* L, int popDepth = 1);
	void stackClean(lua_State* L, int stackDepth);
	json::value tableToJSON(lua_State* L, int index);
}

#define STACK_UPDATE LUAUtils::stackUpdate(L, stackDepth, initialStack);
#define STACK_INIT int stackDepth = 0; int initialStack = 0;  LUAUtils::stackUpdate(L, initialStack);
#define STACK_POP(X) LUAUtils::stackPop(L, X); STACK_UPDATE;
#define STACK_CLEAN STACK_UPDATE; LUAUtils::stackClean(L, stackDepth);

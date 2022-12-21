#pragma once
#include "framework.h"

void DllExport stackUpdate(lua_State* L, int& stackDepth, int initialStack = 0);
void DllExport stackPop(lua_State* L, int popDepth = 1);
void DllExport stackClean(lua_State* L, int stackDepth);
json::value DllExport luaTableToJSON(lua_State* L, int index);

#define STACK_UPDATE stackUpdate(L, stackDepth, initialStack);
#define STACK_INIT int stackDepth = 0; int initialStack = 0; stackUpdate(L, initialStack);
#define STACK_POP(X) stackPop(L, X); STACK_UPDATE;
#define STACK_CLEAN STACK_UPDATE; stackClean(L, stackDepth);

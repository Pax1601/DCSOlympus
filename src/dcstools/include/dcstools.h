#pragma once
#include "framework.h"
#include "luatools.h"

void DllExport LogInfo(lua_State* L, string message);
void DllExport LogWarning(lua_State* L, string message);
void DllExport LogError(lua_State* L, string message);
void DllExport Log(lua_State* L, string message, int level);

map<int, json::value> DllExport getAllUnits(lua_State* L);


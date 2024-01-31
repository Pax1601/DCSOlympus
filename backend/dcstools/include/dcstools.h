#pragma once
#include "framework.h"
#include "luatools.h"

void DllExport LogInfo(lua_State* L, string message);
void DllExport LogWarning(lua_State* L, string message);
void DllExport LogError(lua_State* L, string message);
void DllExport Log(lua_State* L, string message, unsigned int level);
int DllExport dostring_in(lua_State* L, string target, string command);
void DllExport getAllUnits(lua_State* L, map<unsigned int, json::value>& unitJSONs);
unsigned int DllExport TACANChannelToFrequency(unsigned int channel, char XY);


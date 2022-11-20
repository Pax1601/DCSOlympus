#pragma once
#include "framework.h"
#include "LUAUtils.h"

namespace DCSUtils
{
	void LogInfo(lua_State* L, string message);
	void LogWarning(lua_State* L, string message);
	void LogError(lua_State* L, string message);
	void Log(lua_State* L, string message, int level);

	map<int, json::value> getAllUnits(lua_State* L);
}

#include "dcstools.h"

void LogInfo(lua_State* L, string message)
{
    STACK_INIT;

    lua_getglobal(L, "log");
    lua_getfield(L, -1, "INFO");
    int infoLevel = (int)lua_tointeger(L, -1);
    STACK_POP(1);

    STACK_CLEAN;

    Log(L, message, infoLevel);
}

void LogWarning(lua_State* L, string message)
{
    STACK_INIT;

    lua_getglobal(L, "log");
    lua_getfield(L, -1, "WARNING");
    int warningLevel = (int)lua_tointeger(L, -1);
    STACK_POP(1);

    STACK_CLEAN;

    Log(L, message, warningLevel);
}

void LogError(lua_State* L, string message)
{
    STACK_INIT;

    lua_getglobal(L, "log");
    lua_getfield(L, -1, "ERROR");
    int errorLevel = (int)lua_tointeger(L, -1);
    STACK_POP(1);

    STACK_CLEAN;

    Log(L, message, errorLevel);
}

void Log(lua_State* L, string message, unsigned int level)
{
    STACK_INIT;

    lua_getglobal(L, "log");
    lua_getfield(L, -1, "write");
    lua_pushstring(L, "Olympus.dll");
    lua_pushnumber(L, level);
    lua_pushstring(L, message.c_str());
    lua_pcall(L, 3, 0, 0);

    STACK_CLEAN;
}

map<unsigned int, json::value> getAllUnits(lua_State* L)
{
    unsigned int res = 0;
    map<unsigned int, json::value>  units;

    STACK_INIT;

    lua_getglobal(L, "Export");
    lua_getfield(L, -1, "LoGetWorldObjects");
    res = lua_pcall(L, 0, 1, 0);

    if (res != 0)
    {
        LogError(L, "Error retrieving World Objects");
        goto exit;
    }

    if (!lua_istable(L, 2))
    {
        LogError(L, "Error retrieving World Objects");
        goto exit;
    }
    else
    {
        lua_pushnil(L);
        while (lua_next(L, 2) != 0)
        {
            unsigned int ID = lua_tonumber(L, -2);
            // TODO more efficient method can be used, converting all the lua data to a json object may be overkill
            units[ID] = luaTableToJSON(L, -1);
            STACK_POP(1)
        }
    }

exit:
    STACK_CLEAN;
    return units;
}

int dostring_in(lua_State* L, string target, string command)
{
    lua_getglobal(L, "net");
    lua_getfield(L, -1, "dostring_in");
    lua_pushstring(L, target.c_str());
    lua_pushstring(L, command.c_str());
    return lua_pcall(L, 2, 0, 0);
}

unsigned int TACANChannelToFrequency(unsigned int channel, char XY)
{
    unsigned int basef = (XY == 'X' && channel > 63) || (XY == 'Y' && channel < 64) ? 1087 : 961;
    return (basef + channel) * 1000000;
}
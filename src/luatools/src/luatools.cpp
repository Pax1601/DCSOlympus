#include "framework.h"
#include "luaTools.h"
#include "logger.h"
#include "utils.h"

void stackUpdate(lua_State* L, int& stackDepth, int initialStack)
{
    stackDepth = lua_gettop(L) - initialStack;
}

void stackPop(lua_State* L, int popDepth)
{
    lua_pop(L, popDepth);
}

void stackClean(lua_State* L, int stackDepth)
{
    lua_pop(L, stackDepth);
}

json::value luaTableToJSON(lua_State* L, int index, bool logKeys)
{
    auto json = json::value::object();

    if (lua_istable(L, index))
    {
        STACK_INIT;

        lua_pushvalue(L, index);
        lua_pushnil(L);
        while (lua_next(L, -2))
        {
            lua_pushvalue(L, -2);
            const char* key = lua_tostring(L, -1);
            if (logKeys)
            {
                log(key);
            }
            if (lua_istable(L, -2))
            {
                json[to_wstring(key)] = luaTableToJSON(L, -2, logKeys);
            }
            else if (lua_isnumber(L, -2))
            {
                json[to_wstring(key)] = json::value::number(lua_tonumber(L, -2));
            }
            else if (lua_isboolean(L, -2))
            {
                json[to_wstring(key)] = json::value::boolean(lua_toboolean(L, -2));
            }
            else if (lua_isstring(L, -2))   // Keep last, lua_isstring only checks if it can be stringified (not if it actually IS a string)
            {
                json[to_wstring(key)] = json::value::string(to_wstring(lua_tostring(L, -2)));
            }
            lua_pop(L, 2);
        }
        lua_pop(L, 1);

        STACK_CLEAN;
    }
    return json;
}


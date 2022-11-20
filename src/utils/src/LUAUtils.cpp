#include "LUAUtils.h"
#include "Logger.h"
#include "Utils.h"

void LUAUtils::stackUpdate(lua_State* L, int& stackDepth, int initialStack)
{
	stackDepth = lua_gettop(L) - initialStack;
}

void LUAUtils::stackPop(lua_State* L, int popDepth)
{
	lua_pop(L, popDepth);
}

void LUAUtils::stackClean(lua_State* L, int stackDepth)
{
	lua_pop(L, stackDepth);
}

json::value LUAUtils::tableToJSON(lua_State* L, int index)
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
            if (lua_istable(L, -2))
            {
                json[Utils::to_wstring(key)] = tableToJSON(L, -2);
            }
            else if (lua_isnumber(L, -2))
            {
                json[Utils::to_wstring(key)] = json::value::number(lua_tonumber(L, -2));
            }
            else if (lua_isboolean(L, -2))
            {
                json[Utils::to_wstring(key)] = json::value::boolean(lua_toboolean(L, -2));
            }        
            else if (lua_isstring(L, -2))   // Keep last, only checks if it can be stringified
            {
                json[Utils::to_wstring(key)] = json::value::string(Utils::to_wstring(lua_tostring(L, -2)));
            }
            lua_pop(L, 2);
        }
        lua_pop(L, 1);

        STACK_CLEAN;
    }
    return json;
}

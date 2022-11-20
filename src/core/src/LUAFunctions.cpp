#include "LUAFunctions.h"
#include "Logger.h"

void LUAFunctions::registerLuaFunctions(lua_State* L)
{
    ifstream f("C:\\Users\\dpass\\Documents\\Olympus\\scripts\\OlympusCommand.lua"); 
    string str;
    if (f) {
        ostringstream ss;
        ss << f.rdbuf(); 
        str = ss.str();
    }

    lua_getglobal(L, "net");
    lua_getfield(L, -1, "dostring_in");
    lua_pushstring(L, "server");
    lua_pushstring(L, str.c_str());

    if (lua_pcall(L, 2, 0, 0) != 0)
    {
        LOGGER->Log("Error registering LUA functions");
    }
    else
    {
        LOGGER->Log("Lua functions registered successfully");
    }
    
}
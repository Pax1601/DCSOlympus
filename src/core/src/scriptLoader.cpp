#include "scriptLoader.h"
#include "logger.h"
#include "luatools.h"

/* Executes the "OlympusCommand.lua" file to load in the "Server" Lua space all the Lua functions necessary to perform DCS commands (like moving units) */
void registerLuaFunctions(lua_State* L)
{
    string modLocation;

    char* buf = nullptr;
    size_t sz = 0;
    if (_dupenv_s(&buf, &sz, "DCSOLYMPUS_PATH") == 0 && buf != nullptr)
    {
        modLocation = buf;
        free(buf);
    }
    else
    {
        log("DCSOLYMPUS_PATH environment variable is missing");
        return;
    }

    {
        ifstream f(modLocation + "\\Scripts\\mist_4_4_90.lua");
        string str;
        log("Reading MIST from " + modLocation + "\\Scripts\\mist_4_4_90.lua");
        if (f) {
            ostringstream ss;
            ss << f.rdbuf();
            str = ss.str();
            log("MIST read succesfully");
        }
        else
        {
            log("Error reading MIST");
            return;
        }

        lua_getglobal(L, "net");
        lua_getfield(L, -1, "dostring_in");
        lua_pushstring(L, "server");
        lua_pushstring(L, str.c_str());

        if (lua_pcall(L, 2, 0, 0) != 0)
        {
            log("Error registering MIST");
        }
        else
        {
            log("MIST registered successfully");
        }
    }

    {
        ifstream f(modLocation + "\\Scripts\\OlympusCommand.lua");
        string str;
        log("Reading OlympusCommand.lua from " + modLocation + "\\Scripts\\OlympusCommand.lua");
        if (f) {
            ostringstream ss;
            ss << f.rdbuf();
            str = ss.str();
            log("OlympusCommand.lua read succesfully");
        }
        else
        {
            log("Error reading OlympusCommand.lua");
            return;
        }

        lua_getglobal(L, "net");
        lua_getfield(L, -1, "dostring_in");
        lua_pushstring(L, "server");
        lua_pushstring(L, str.c_str());

        if (lua_pcall(L, 2, 0, 0) != 0)
        {
            log("Error registering OlympusCommand.lua");
        }
        else
        {
            log("OlympusCommand.lua registered successfully");
        }
    }
    
}
#include "LUAFunctions.h"
#include "Logger.h"

/* Executes the "OlympusCommand.lua" file to load in the "Server" Lua space all the Lua functions necessary to perform DCS commands (like moving units) */
void LUAFunctions::registerLuaFunctions(lua_State* L)
{
    string modLocation;

    char* buf = nullptr;
    size_t sz = 0;
    if (_dupenv_s(&buf, &sz, "OLYMPUS") == 0 && buf != nullptr)
    {
        modLocation = buf;
        free(buf);
    }
    else
    {
        LOGGER->Log("OLYMPUS environment variable is missing");
        return;
    }

    {
        ifstream f(modLocation + "\\Scripts\\mist_4_4_90.lua");
        string str;
        LOGGER->Log("Reading MIST from " + modLocation + "\\Scripts\\mist_4_4_90.lua");
        if (f) {
            ostringstream ss;
            ss << f.rdbuf();
            str = ss.str();
            LOGGER->Log("MIST read succesfully");
        }
        else
        {
            LOGGER->Log("Error reading MIST");
            return;
        }

        lua_getglobal(L, "net");
        lua_getfield(L, -1, "dostring_in");
        lua_pushstring(L, "server");
        lua_pushstring(L, str.c_str());

        if (lua_pcall(L, 2, 0, 0) != 0)
        {
            LOGGER->Log("Error registering MIST");
        }
        else
        {
            LOGGER->Log("MIST registered successfully");
        }
    }

    {
        ifstream f(modLocation + "\\Scripts\\OlympusCommand.lua");
        string str;
        LOGGER->Log("Reading OlympusCommand.lua from " + modLocation + "\\Scripts\\OlympusCommand.lua");
        if (f) {
            ostringstream ss;
            ss << f.rdbuf();
            str = ss.str();
            LOGGER->Log("OlympusCommand.lua read succesfully");
        }
        else
        {
            LOGGER->Log("Error reading OlympusCommand.lua");
            return;
        }

        lua_getglobal(L, "net");
        lua_getfield(L, -1, "dostring_in");
        lua_pushstring(L, "server");
        lua_pushstring(L, str.c_str());

        if (lua_pcall(L, 2, 0, 0) != 0)
        {
            LOGGER->Log("Error registering OlympusCommand.lua");
        }
        else
        {
            LOGGER->Log("OlympusCommand.lua registered successfully");
        }
    }
    
}
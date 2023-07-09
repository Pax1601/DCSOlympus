#include "scriptLoader.h"
#include "logger.h"
#include "luatools.h"
#include "dcstools.h"

#include <algorithm>

bool executeLuaScript(lua_State* L, string path)
{
    replace(path.begin(), path.end(), '\\', '/');
    // Encase the loading call in a procted call to catch any syntax errors
    string str = "Olympus.protectedCall(dofile, \"" + path + "\")";
    if (dostring_in(L, "server", str.c_str()) != 0)
    {
        log("Error registering " + path);
        return false;
    }
    else
    {
        log(path + " registered successfully");
        return true;
    }
}

/* Executes the "OlympusCommand.lua" file to load in the "Server" Lua space all the Lua functions necessary to perform DCS commands (like moving units) */
void registerLuaFunctions(lua_State* L)
{
    string modLocation;

    if (dostring_in(L, "server", PROTECTED_CALL))
    {
        log("Error registering protectedCall");
    }
    else
    {
        log("protectedCall registered successfully");
    }

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

    executeLuaScript(L, modLocation + "\\Scripts\\mist.lua");
    executeLuaScript(L, modLocation + "\\Scripts\\OlympusCommand.lua");
    executeLuaScript(L, modLocation + "\\Scripts\\unitPayloads.lua");
    executeLuaScript(L, modLocation + "\\Scripts\\templates.lua");
}

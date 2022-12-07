#include "commands.h"
#include "logger.h"

/* Move command */
void MoveCommand::execute(lua_State* L)
{
    std::ostringstream command;
    command.precision(10);
    command << "Olympus.move(\"" << to_string(unitName) << "\", " << destination.lat << ", " << destination.lng << ", " << 10 << ", " << unitCategory << ")";

    lua_getglobal(L, "net");
    lua_getfield(L, -1, "dostring_in");
    lua_pushstring(L, "server");
    lua_pushstring(L, command.str().c_str());
    if (lua_pcall(L, 2, 0, 0) != 0)
    {
        log("Error executing MoveCommand");
    }
    else
    {
        log("MoveCommand executed successfully");
    }
}

/* Smoke command */
void SmokeCommand::execute(lua_State* L)
{
    std::ostringstream command;
    command.precision(10);
    command << "Olympus.smoke(\"" << to_string(color) << "\", " << location.lat << ", " << location.lng << ")";

    lua_getglobal(L, "net");
    lua_getfield(L, -1, "dostring_in");
    lua_pushstring(L, "server");
    lua_pushstring(L, command.str().c_str());
    if (lua_pcall(L, 2, 0, 0) != 0)
    {
        log("Error executing SmokeCommand");
    }
    else
    {
        log("SmokeCommand executed successfully");
    }
}

/* Spawn ground command */
void SpawnGroundCommand::execute(lua_State* L)
{
    std::ostringstream command;
    command.precision(10);
    command << "Olympus.spawnGround(\"" << to_string(coalition) << "\", \"" << to_string(unitType) << "\", " << location.lat << ", " << location.lng << ")";

    lua_getglobal(L, "net");
    lua_getfield(L, -1, "dostring_in");
    lua_pushstring(L, "server");
    lua_pushstring(L, command.str().c_str());
    if (lua_pcall(L, 2, 0, 0) != 0)
    {
        log("Error executing SpawnGroundCommand");
    }
    else
    {
        log("SpawnGroundCommand executed successfully");
    }
}

/* Spawn air command */
void SpawnAirCommand::execute(lua_State* L)
{
    std::ostringstream command;
    command.precision(10);
    command << "Olympus.spawnAir(\"" << to_string(coalition) << "\", \"" << to_string(unitType) << "\", " << location.lat << ", " << location.lng << ")";

    lua_getglobal(L, "net");
    lua_getfield(L, -1, "dostring_in");
    lua_pushstring(L, "server");
    lua_pushstring(L, command.str().c_str());
    if (lua_pcall(L, 2, 0, 0) != 0)
    {
        log("Error executing SpawnGroundCommand");
    }
    else
    {
        log("SpawnAirCommand executed successfully");
    }
}
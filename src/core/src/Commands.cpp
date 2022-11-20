#include "Commands.h"
#include "framework.h"
#include "Logger.h"

void MoveCommand::execute(lua_State* L)
{
    std::ostringstream command;

    command << "Olympus.move(\"" << Utils::to_string(unitName) << "\"," << destination.lat << "," << destination.lng << "," << 10 << ")";

    lua_getglobal(L, "net");
    lua_getfield(L, -1, "dostring_in");
    lua_pushstring(L, "server");
    lua_pushstring(L, command.str().c_str());
    if (lua_pcall(L, 2, 0, 0) != 0)
    {
        LOGGER->Log("Error executing MoveCommand");
    }
    else
    {
        LOGGER->Log("MoveCommand executed successfully");
    }
}
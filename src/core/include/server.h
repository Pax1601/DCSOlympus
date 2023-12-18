#pragma once
#include "framework.h"
#include "luatools.h"

using namespace web::http;
using namespace web::http::experimental::listener;

class UnitsManager;
class Scheduler;

class Server
{
public:
	Server(lua_State* L);

    void start(lua_State* L);
    void stop(lua_State* L);

private:
	std::thread* serverThread;

    void handle_options(http_request request);
    void handle_get(http_request request);
    void handle_request(http_request request, function<void(json::value const&, json::value&)> action);
    void handle_put(http_request request);

    string extractUsername(http_request& request);
    string extractPassword(http_request& request);
    string getCommander(string& password, string& gameMasterPassword, string& blueCommanderPassword, string& redCommanderPassword);

    void task();

    atomic<bool> runListener;

    string gameMasterPassword = "";
    string blueCommanderPassword = "";
    string redCommanderPassword = "";
    string atcPassword = "";
    string observerPassword = "";
};


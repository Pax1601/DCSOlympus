#pragma once
#include "framework.h"
#include "luatools.h"

using namespace web::http;
using namespace web::http::experimental::listener;

class UnitsFactory;
class Scheduler;

class Server
{
public:
	Server(lua_State* L);
	~Server();

private:
	std::thread* serverThread;

    void handle_options(http_request request);
    void handle_get(http_request request);
    void handle_request(http_request request, function<void(json::value const&, json::value&)> action);
    void handle_put(http_request request);

    void task();

    atomic<bool> runListener;
};


#pragma once
#include "framework.h"
#include "LUAUtils.h"

using namespace web::http;
using namespace web::http::experimental::listener;

class UnitsHandler;
class Scheduler;

class RESTServer
{
public:
	RESTServer(lua_State* L);
	~RESTServer();

private:
	std::thread* serverThread;

    void handle_options(http_request request);
    void handle_get(http_request request);
    void handle_request(http_request request, function<void(json::value const&, json::value&)> action);
    void handle_put(http_request request);

    void task();

    atomic<bool> runListener;
};


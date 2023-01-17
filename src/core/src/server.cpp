#include "server.h"
#include "logger.h"
#include "defines.h"
#include "unitsFactory.h"
#include "scheduler.h"
#include "luatools.h"
#include <exception>
#include <stdexcept>

extern UnitsFactory* unitsFactory; 
extern Scheduler* scheduler;

void handle_eptr(std::exception_ptr eptr)
{
    try {
        if (eptr) {
            std::rethrow_exception(eptr);
        }
    }
    catch (const std::exception& e) {
        log(e.what());
    }
}

Server::Server(lua_State* L):
    runListener(true)
{
    LogInfo(L, "Starting RESTServer");
    serverThread = new thread(&Server::task, this);
}

Server::~Server()
{
    runListener = false;
}

void Server::handle_options(http_request request)
{
    http_response response(status_codes::OK);
    response.headers().add(U("Allow"), U("GET, POST, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Origin"), U("*"));
    response.headers().add(U("Access-Control-Allow-Methods"), U("GET, POST, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Headers"), U("Content-Type"));

    request.reply(response);
}

void Server::handle_get(http_request request)
{
    http_response response(status_codes::OK);
    response.headers().add(U("Allow"), U("GET, POST, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Origin"), U("*"));
    response.headers().add(U("Access-Control-Allow-Methods"), U("GET, POST, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Headers"), U("Content-Type"));

    auto answer = json::value::object();
    std::exception_ptr eptr;
    try {
        unitsFactory->updateAnswer(answer);
        response.set_body(answer);
    }
    catch (...) {
        eptr = std::current_exception(); // capture
    }
    handle_eptr(eptr);
    
    request.reply(response);
}

void Server::handle_request(http_request request, function<void(json::value const&, json::value&)> action)
{
    auto answer = json::value::object();

    request.extract_json().then([&answer, &action](pplx::task<json::value> task) 
    {
        try
        {
            auto const& jvalue = task.get();

            if (!jvalue.is_null())
            {
                action(jvalue, answer);
            }
        }
        catch (http_exception const& e)
        {
            log(e.what());
        }
    }).wait();

    http_response response(status_codes::OK);
    response.headers().add(U("Allow"), U("GET, POST, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Origin"), U("*"));
    response.headers().add(U("Access-Control-Allow-Methods"), U("GET, POST, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Headers"), U("Content-Type"));
    response.set_body(answer);
    request.reply(response);
}

void Server::handle_put(http_request request)
{
    handle_request(
    request,
    [](json::value const& jvalue, json::value& answer)
    {
        for (auto const& e : jvalue.as_object())
        {
            auto key = e.first;
            auto value = e.second;
            std::exception_ptr eptr;
            try {
                scheduler->handleRequest(key, value);
            }
            catch (...) {
                eptr = std::current_exception(); // capture
            }
            handle_eptr(eptr);
        }
    });    
}

void Server::task()
{
    http_listener listener(REST_ADDRESS);

    std::function<void(http_request)> handle_options = std::bind(&Server::handle_options, this, std::placeholders::_1);
    std::function<void(http_request)> handle_get = std::bind(&Server::handle_get, this, std::placeholders::_1);
    std::function<void(http_request)> handle_put = std::bind(&Server::handle_put, this, std::placeholders::_1);

    listener.support(methods::OPTIONS, handle_options);
    listener.support(methods::GET, handle_get);
    listener.support(methods::PUT, handle_put);

    try
    {
        listener.open()
                .then([&listener]() {log("RESTServer starting to listen"); })
                .wait();
            
        while (runListener);

        listener.close();
        log("RESTServer stopped listening");
    }
    catch (exception const& e)
    {
        log(e.what());
    }
}

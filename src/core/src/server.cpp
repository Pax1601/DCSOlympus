#include "server.h"
#include "logger.h"
#include "defines.h"
#include "unitsManager.h"
#include "scheduler.h"
#include "luatools.h"
#include <exception>
#include <stdexcept>

extern UnitsManager* unitsManager; 
extern Scheduler* scheduler;
extern json::value airbasesData;
extern json::value bullseyesData;
extern mutex mutexLock;
extern string sessionHash;

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
    serverThread(nullptr),
    runListener(true)
{
     
}

void Server::start(lua_State* L)
{
    log("Starting RESTServer");
    serverThread = new thread(&Server::task, this);
}

void Server::stop(lua_State* L)
{
    log("Stopping RESTServer");
    runListener = false;
    if (serverThread != nullptr)
        serverThread->join();
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
    /* Lock for thread safety */
    lock_guard<mutex> guard(mutexLock);

    http_response response(status_codes::OK);
    response.headers().add(U("Allow"), U("GET, POST, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Origin"), U("*"));
    response.headers().add(U("Access-Control-Allow-Methods"), U("GET, POST, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Headers"), U("Content-Type"));

    std::exception_ptr eptr;
    try {
        auto answer = json::value::object();
        auto path = uri::split_path(uri::decode(request.relative_uri().path()));

        if (path.size() > 0)
        {
            if (path[0] == UNITS_URI)
            {
                wstring fragment = uri::decode(request.relative_uri().fragment());
                log(fragment);
                //unitsManager->getData(answer);
            }
            else if (path[0] == LOGS_URI)
            {
                auto logs = json::value::object();
                getLogsJSON(logs, 100);   // By reference, for thread safety. Get the last 100 log entries
                answer[L"logs"] = logs;
            }
            else if (path[0] == AIRBASES_URI)
                answer[L"airbases"] = airbasesData;
            else if (path[0] == BULLSEYE_URI)
                answer[L"bullseyes"] = bullseyesData;

            answer[L"sessionHash"] = json::value::string(to_wstring(sessionHash));
        }

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
        /* Lock for thread safety */
        lock_guard<mutex> guard(mutexLock);

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
    http_listener listener(wstring(REST_ADDRESS) + L"/" + wstring(REST_URI));

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

        listener.close()
                .then([&listener]() {log("RESTServer stopping connections"); })
                .wait();

        log("RESTServer stopped listening");
    }
    catch (exception const& e)
    {
        log(e.what());
    }
}

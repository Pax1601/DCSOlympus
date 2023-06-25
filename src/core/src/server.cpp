#include "server.h"
#include "logger.h"
#include "defines.h"
#include "unitsManager.h"
#include "scheduler.h"
#include "luatools.h"
#include <exception>
#include <stdexcept>
#include "base64.hpp"

#include <chrono>
using namespace std::chrono;
using namespace base64;

extern UnitsManager* unitsManager; 
extern Scheduler* scheduler;
extern json::value airbases;
extern json::value bullseyes;
extern json::value mission;
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
    response.headers().add(U("Allow"), U("GET, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Origin"), U("*"));
    response.headers().add(U("Access-Control-Allow-Methods"), U("GET, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Headers"), U("Content-Type, Authorization"));

    request.reply(response);
}

void Server::handle_get(http_request request)
{
    /* Lock for thread safety */
    lock_guard<mutex> guard(mutexLock);

    milliseconds ms = duration_cast<milliseconds>(system_clock::now().time_since_epoch());

    http_response response(status_codes::OK);
    string authorization = to_base64("admin:" + password);
    if (password.length() == 0 || (request.headers().has(L"Authorization") && request.headers().find(L"Authorization")->second.compare(L"Basic " + to_wstring(authorization)) == 0))
    {
        std::exception_ptr eptr;
        try {
            auto answer = json::value::object();
            auto path = uri::split_path(uri::decode(request.relative_uri().path()));

            if (path.size() > 0)
            {
                string URI = to_string(path[0]);
                if (URI.compare(UNITS_URI) == 0)
                {
                    map<utility::string_t, utility::string_t> query = request.relative_uri().split_query(request.relative_uri().query());
                    long long time = 0;
                    if (query.find(L"time") != query.end())
                    {
                        try {
                            time = stoll((*(query.find(L"time"))).second);
                        }
                        catch (const std::exception& e) {
                            time = 0;
                        }
                    }

                    bool refresh = (time == 0);
                    unsigned long long updateTime = ms.count();

                    stringstream ss;
                    ss.write((char*)&updateTime, sizeof(updateTime));
                    unitsManager->getUnitData(ss, time, refresh);
                    response.set_body(concurrency::streams::bytestream::open_istream(ss.str()));
                }
                else {
                    if (URI.compare(LOGS_URI) == 0)
                    {
                        auto logs = json::value::object();
                        getLogsJSON(logs, 100);   // By reference, for thread safety. Get the last 100 log entries
                        answer[L"logs"] = logs;
                    }
                    else if (URI.compare(AIRBASES_URI) == 0)
                        answer[L"airbases"] = airbases;
                    else if (URI.compare(BULLSEYE_URI) == 0)
                        answer[L"bullseyes"] = bullseyes;
                    else if (URI.compare(MISSION_URI) == 0)
                        answer[L"mission"] = mission;

                    
                    answer[L"time"] = json::value::string(to_wstring(ms.count()));
                    answer[L"sessionHash"] = json::value::string(to_wstring(sessionHash));
                    response.set_body(answer);
                }
            }
        }
        catch (...) {
            eptr = std::current_exception(); // capture
        }
        handle_eptr(eptr);
    }
    else {
        response = status_codes::Unauthorized;
    }

    response.headers().add(U("Allow"), U("GET, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Origin"), U("*"));
    response.headers().add(U("Access-Control-Allow-Methods"), U("GET, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Headers"), U("Content-Type, Authorization"));
    
    request.reply(response);
}

void Server::handle_request(http_request request, function<void(json::value const&, json::value&)> action)
{
    http_response response(status_codes::OK);
    string authorization = to_base64("admin:" + password);
    if (password.length() == 0 || (request.headers().has(L"Authorization") && request.headers().find(L"Authorization")->second.compare(L"Basic " + to_wstring(authorization)) == 0))
    {
        auto answer = json::value::object();
        request.extract_json().then([&answer, &action](pplx::task<json::value> task)
        {
            try
            {
                auto const& jvalue = task.get();
                if (!jvalue.is_null())
                    action(jvalue, answer);
            }
            catch (http_exception const& e)
            {
                log(e.what());
            }
        }).wait();
        response.set_body(answer);
    }
    else {
        response = status_codes::Unauthorized;
    }

    response.headers().add(U("Allow"), U("GET, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Origin"), U("*"));
    response.headers().add(U("Access-Control-Allow-Methods"), U("GET, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Headers"), U("Content-Type, Authorization"));
    
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
                scheduler->handleRequest(to_string(key), value);
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
    string address = REST_ADDRESS;
    string modLocation;
    char* buf = nullptr;
    size_t sz = 0;
    if (_dupenv_s(&buf, &sz, "DCSOLYMPUS_PATH") == 0 && buf != nullptr)
    {
        std::ifstream ifstream(string(buf) + "\\olympus.json");
        std::stringstream ss;
        ss << ifstream.rdbuf();
        std::error_code errorCode;
        json::value config = json::value::parse(ss.str(), errorCode);
        if (config.is_object() && config.has_object_field(L"server") &&
            config[L"server"].has_string_field(L"address") && config[L"server"].has_number_field(L"port"))
        {
            address = "http://" + to_string(config[L"server"][L"address"]) + ":" + to_string(config[L"server"][L"port"].as_number().to_int32());
            log("Starting server on " + address);
        }
        else
            log("Error reading configuration file. Starting server on " + address);

        if (config.is_object() && config.has_object_field(L"authentication") &&
            config[L"authentication"].has_string_field(L"password"))
        {
            password = to_string(config[L"authentication"][L"password"]);
        }
        else
            log("Error reading configuration file. No password set.");
        free(buf);
    }
    else
    {
        log("DCSOLYMPUS_PATH environment variable is missing, starting server on " + address);
    }

    http_listener listener(to_wstring(address + "/" + REST_URI));

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

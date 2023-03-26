#include "server.h"
#include "logger.h"
#include "defines.h"
#include "unitsManager.h"
#include "scheduler.h"
#include "luatools.h"
#include <exception>
#include <stdexcept>

#include <chrono>
using namespace std::chrono;

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
                unitsManager->getData(answer, time);
            }
            else if (path[0] == LOGS_URI)
            {
                auto logs = json::value::object();
                getLogsJSON(logs, 100);   // By reference, for thread safety. Get the last 100 log entries
                answer[L"logs"] = logs;
            }
            else if (path[0] == AIRBASES_URI)
                answer[L"airbases"] = airbases;
            else if (path[0] == BULLSEYE_URI)
                answer[L"bullseyes"] = bullseyes;
            else if (path[0] == MISSION_URI)
                answer[L"mission"] = mission;

            milliseconds ms = duration_cast<milliseconds>(system_clock::now().time_since_epoch());
            answer[L"time"] = json::value::string(to_wstring(ms.count()));
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
    wstring address = wstring(REST_ADDRESS);
    wstring modLocation;
    char* buf = nullptr;
    size_t sz = 0;
    if (_dupenv_s(&buf, &sz, "DCSOLYMPUS_PATH") == 0 && buf != nullptr)
    {
        std::ifstream ifstream(string(buf) + "\\olympus.json");
        std::stringstream ss;
        ss << ifstream.rdbuf();
        std::error_code errorCode;
        json::value config = json::value::parse(to_wstring(ss.str()), errorCode);
        if (config.is_object() && config.has_object_field(L"server") &&
            config[L"server"].has_string_field(L"address") && config[L"server"].has_number_field(L"port"))
        {
            address = L"http://" + config[L"server"][L"address"].as_string() + L":" + to_wstring(config[L"server"][L"port"].as_number().to_int32());
            log(L"Starting server on " + address);
        }
        else
        {
            log(L"Error reading configuration file. Starting server on " + address);
        }
        free(buf);
    }
    else
    {
        log(L"DCSOLYMPUS_PATH environment variable is missing, starting server on " + address);
    }

    http_listener listener(address + L"/" + wstring(REST_URI));

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

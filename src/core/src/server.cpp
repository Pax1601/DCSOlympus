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
extern json::value missionData;
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
    
    string password = extractPassword(request);
    if (password.compare(gameMasterPassword) == 0 || password.compare(blueCommanderPassword) == 0 || password.compare(redCommanderPassword) == 0)
    {
        std::exception_ptr eptr;
        try {
            auto answer = json::value::object();
            auto path = uri::split_path(uri::decode(request.relative_uri().path()));

            /* If present, extract the request reference time. This is used for updates, and it specifies the last time that request has been performed */
            map<utility::string_t, utility::string_t> query = request.relative_uri().split_query(request.relative_uri().query());
            unsigned long long time = 0;
            if (query.find(L"time") != query.end())
            {
                try {
                    time = stoull((*(query.find(L"time"))).second);
                }
                catch (const std::exception& e) {
                    time = 0;
                }
            }

            if (path.size() > 0)
            {
                string URI = to_string(path[0]);
                if (URI.compare(UNITS_URI) == 0)
                {
                    unsigned long long updateTime = ms.count();
                    stringstream ss;
                    ss.write((char*)&updateTime, sizeof(updateTime));
                    unitsManager->getUnitData(ss, time);
                    response.set_body(concurrency::streams::bytestream::open_istream(ss.str()));
                }
                else {
                    if (URI.compare(LOGS_URI) == 0)
                    {
                        auto logs = json::value::object();
                        getLogsJSON(logs, time);   
                        answer[L"logs"] = logs;
                    }
                    else if (URI.compare(AIRBASES_URI) == 0 && missionData.has_object_field(L"airbases")) {
                        answer[L"airbases"] = missionData[L"airbases"];
                    }
                    else if (URI.compare(BULLSEYE_URI) == 0 && missionData.has_object_field(L"bullseyes")) {
                        answer[L"bullseyes"] = missionData[L"bullseyes"];
                    }
                    else if (URI.compare(MISSION_URI) == 0 && missionData.has_object_field(L"mission")) {
                        answer[L"mission"] = missionData[L"mission"];
                        if (password.compare(gameMasterPassword) == 0)
                            answer[L"mission"][L"visibilityMode"] = json::value(L"Game master");
                        else if (password.compare(blueCommanderPassword) == 0) 
                            answer[L"mission"][L"visibilityMode"] = json::value(L"Blue commander");
                        else if (password.compare(redCommanderPassword) == 0)
                            answer[L"mission"][L"visibilityMode"] = json::value(L"Red commander");
                    }
                    
                    answer[L"time"] = json::value::string(to_wstring(ms.count()));
                    answer[L"sessionHash"] = json::value::string(to_wstring(sessionHash));
                    answer[L"load"] = scheduler->getLoad();
                    answer[L"frameRate"] = scheduler->getFrameRate();
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

    //TODO: limit what a user can do depending on the password
    string password = extractPassword(request);
    if (password.compare(gameMasterPassword) == 0 || password.compare(blueCommanderPassword) == 0 || password.compare(redCommanderPassword) == 0)
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

string Server::extractPassword(http_request& request) {
    if (request.headers().has(L"Authorization")) {
        string authorization = to_string(request.headers().find(L"Authorization")->second);
        string s = "Basic ";
        string::size_type i = authorization.find(s);

        if (i != std::string::npos)
            authorization.erase(i, s.length());
        else
            return "";

        string decoded = from_base64(authorization);
        i = decoded.find(":");
        if (i != string::npos && i+1 < decoded.length())
            decoded.erase(0, i+1);
        else
            return "";

        return decoded;
    }
    else
        return "";
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

        if (config.is_object() && config.has_object_field(L"authentication"))
        {
            if (config[L"authentication"].has_string_field(L"gameMasterPassword")) gameMasterPassword = to_string(config[L"authentication"][L"gameMasterPassword"]);
            if (config[L"authentication"].has_string_field(L"blueCommanderPassword")) blueCommanderPassword = to_string(config[L"authentication"][L"blueCommanderPassword"]);
            if (config[L"authentication"].has_string_field(L"redCommanderPassword")) redCommanderPassword = to_string(config[L"authentication"][L"redCommanderPassword"]);
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

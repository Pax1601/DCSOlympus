#include "RESTServer.h"
#include "Logger.h"
#include "defines.h"
#include "UnitsHandler.h"
#include "Scheduler.h"
#include "LUAUtils.h"

extern UnitsFactory* unitsHandler; 
extern Scheduler* scheduler;
extern json::value missionData;

RESTServer::RESTServer(lua_State* L):
    runListener(true)
{
    DCSUtils::LogInfo(L, "Starting RESTServer");
    serverThread = new thread(&RESTServer::task, this);
}

RESTServer::~RESTServer()
{
    runListener = false;
}

void RESTServer::handle_options(http_request request)
{
    http_response response(status_codes::OK);
    response.headers().add(U("Allow"), U("GET, POST, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Origin"), U("*"));
    response.headers().add(U("Access-Control-Allow-Methods"), U("GET, POST, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Headers"), U("Content-Type"));

    request.reply(response);
}

void RESTServer::handle_get(http_request request)
{
    http_response response(status_codes::OK);
    response.headers().add(U("Allow"), U("GET, POST, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Origin"), U("*"));
    response.headers().add(U("Access-Control-Allow-Methods"), U("GET, POST, PUT, OPTIONS"));
    response.headers().add(U("Access-Control-Allow-Headers"), U("Content-Type"));

    auto answer = json::value::object();
    try 
    {
        unitsHandler->updateAnswer(answer);
        answer[L"missionData"] = missionData;
    }
    catch (http_exception const& e)
    {
        LOGGER->Log(e.what());
    }
    response.set_body(answer);

    request.reply(response);
}

void RESTServer::handle_request(http_request request, function<void(json::value const&, json::value&)> action)
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
            LOGGER->Log(e.what());
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

void RESTServer::handle_put(http_request request)
{
    handle_request(
    request,
    [](json::value const& jvalue, json::value& answer)
    {
        for (auto const& e : jvalue.as_object())
        {
            auto key = e.first;
            auto value = e.second;
            scheduler->handleRequest(key, value);
        }
    });    
}

void RESTServer::task()
{
    http_listener listener(REST_ADDRESS);

    std::function<void(http_request)> handle_options = std::bind(&RESTServer::handle_options, this, std::placeholders::_1);
    std::function<void(http_request)> handle_get = std::bind(&RESTServer::handle_get, this, std::placeholders::_1);
    std::function<void(http_request)> handle_put = std::bind(&RESTServer::handle_put, this, std::placeholders::_1);

    listener.support(methods::OPTIONS, handle_options);
    listener.support(methods::GET, handle_get);
    listener.support(methods::PUT, handle_put);

    try
    {
        listener.open()
                .then([&listener]() {LOGGER->Log("RESTServer starting to listen"); })
                .wait();
            
        while (runListener);

        listener.close();
        LOGGER->Log("RESTServer stopped listening");
    }
    catch (exception const& e)
    {
        LOGGER->Log(e.what());
    }
}

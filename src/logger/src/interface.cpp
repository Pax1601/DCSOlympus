#include "framework.h"
#include "logger.h"
#include "interface.h"

#define LOGGER Logger::GetLogger()

void log(const string& message, const string& commander, bool addToJSON)
{
	LOGGER->log(message, commander, addToJSON);
}

void log(const wstring& message, const string& commander, bool addToJSON)
{
	LOGGER->log(message, commander, addToJSON);
}

void getLogsJSON(json::value& json, unsigned long long time, const std::string& commander)
{
	LOGGER->toJSON(json, time, commander);
}
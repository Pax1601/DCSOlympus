#include "framework.h"
#include "logger.h"
#include "interface.h"

#define LOGGER Logger::GetLogger()

void log(const string& message, bool addToJSON)
{
	LOGGER->log(message, addToJSON);
}

void log(const wstring& message, bool addToJSON)
{
	LOGGER->log(message, addToJSON);
}

void getLogsJSON(json::value& json, unsigned long long time)
{
	LOGGER->toJSON(json, time);
}
#include "framework.h"
#include "logger.h"
#include "interface.h"

#define LOGGER Logger::GetLogger()

void log(const string& message)
{
	LOGGER->log(message);
}

void log(const wstring& message)
{
	LOGGER->log(message);
}

void getLogsJSON(json::value& json, unsigned long long time)
{
	LOGGER->toJSON(json, time);
}
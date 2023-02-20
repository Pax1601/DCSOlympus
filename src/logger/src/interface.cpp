#include "framework.h"
#include "logger.h"
#include "interface.h"

#define LOGGER Logger::GetLogger()

void log(const string& message)
{
	LOGGER->Log(message);
}

void log(const wstring& message)
{
	LOGGER->Log(message);
}

std::list<std::string> getLogs()
{
	return LOGGER->getLogs();
}
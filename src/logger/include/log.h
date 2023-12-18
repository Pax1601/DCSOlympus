#pragma once

#include <string>

class Log
{
private:
	std::string m_commander;
	std::string m_message;

public:
	Log(const std::string& commander, const std::string& message);
	Log();
	std::string getCommander() const;
	std::string getMessage() const;
};

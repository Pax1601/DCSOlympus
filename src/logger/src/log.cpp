#include "log.h"

Log::Log(const std::string& commander, const std::string& message) : m_commander(commander), m_message(message)
{

}

Log::Log()
{

}

std::string Log::getCommander() const {
    return m_commander;
}

std::string Log::getMessage() const {
    return m_message;
}
#include "logger.h"
#include "utils.h"
#include "defines.h"
#include <chrono>
using namespace std::chrono;

const string Logger::m_sFileName = LOG_NAME;
Logger* Logger::m_pThis = NULL;
ofstream Logger::m_Logfile;
std::map<unsigned long long, class Log> Logger::m_logs;

Logger::Logger()
{

}
Logger* Logger::GetLogger()
{
    if (m_pThis == NULL) {
        m_pThis = new Logger();
        std::filesystem::path dirPath = std::filesystem::temp_directory_path();
        m_Logfile.open((dirPath.string() + m_sFileName).c_str(), ios::out);
    }
    return m_pThis;
}

void Logger::Open()
{
    std::filesystem::path dirPath = std::filesystem::temp_directory_path();
    m_Logfile.open((dirPath.string() + m_sFileName).c_str(), ios::out | ios::app);
}

void Logger::Close()
{
    m_Logfile.close();
}

void Logger::toJSON(json::value& json, unsigned long long time, const std::string& commander)
{
    lock_guard<mutex> guard(mutexLock);
    /* Loop on the logs in reverse since we are usually only interested in the very last added logs */
    auto itr = m_logs.end();
    while (itr != m_logs.begin())
    {
        --itr;
        if (itr->first < time) return;
        auto logCommander = itr->second.getCommander();
        if (commander == "GM" || logCommander == "SYSTEM" || commander == logCommander) {
            json[to_wstring(itr->first)][L"message"] = json::value::string(to_wstring(itr->second.getMessage()));
            json[to_wstring(itr->first)][L"commander"] = json::value::string(to_wstring(logCommander));
        }
    }
}

void Logger::log(const string& message, const string& commander, bool addToJSON)
{
    lock_guard<mutex> guard(mutexLock);
    Open();
    milliseconds ms = duration_cast<milliseconds>(system_clock::now().time_since_epoch());
    m_Logfile << CurrentDateTime() << ":\t";
    m_Logfile << message << "\n";
    if (addToJSON) {
        Log newLog(commander, message);
        m_logs[static_cast<unsigned long long>(ms.count())] = newLog;
    }
    Close();
}

void Logger::log(const wstring& message, const string& commander, bool addToJSON)
{
    this->log(to_string(message), commander, addToJSON);
}

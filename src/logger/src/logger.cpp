#include "logger.h"
#include "utils.h"
#include "defines.h"
#include <chrono>
using namespace std::chrono;

const string Logger::m_sFileName = LOG_NAME;
Logger* Logger::m_pThis = NULL;
ofstream Logger::m_Logfile;
std::map<unsigned long long, std::string> Logger::m_logs;
std::string m_dirPath;

Logger::Logger()
{

}

Logger* Logger::GetLogger()
{
    if (m_pThis == NULL) {
        m_pThis = new Logger();
    }
    return m_pThis;
}

void Logger::setDirectory(string newDirPath)
{
    m_dirPath = newDirPath;
}

void Logger::Open()
{
    try {
        m_Logfile.open((m_dirPath + m_sFileName).c_str(), ios::out | ios::app);
    }
    catch (...) {
        std::filesystem::path m_dirPath = std::filesystem::temp_directory_path();
        m_Logfile.open((m_dirPath.string() + m_sFileName).c_str(), ios::out | ios::app);
    }
}

void Logger::Close()
{
    m_Logfile.close();
}

void Logger::toJSON(json::value& json, unsigned long long time)
{
    lock_guard<mutex> guard(mutexLock);
    /* Loop on the logs in reverse since we are usually only interested in the very last added logs */
    auto itr = m_logs.end();
    while (itr != m_logs.begin())
    {
        --itr;
        if (itr->first < time) return;
        json[to_wstring(itr->first)] = json::value::string(to_wstring(itr->second));
    }
}

void Logger::log(const string& message, bool addToJSON)
{
    lock_guard<mutex> guard(mutexLock);
    Open();
    milliseconds ms = duration_cast<milliseconds>(system_clock::now().time_since_epoch());
    m_Logfile << CurrentDateTime() << ":\t";
    m_Logfile << message << "\n";
    if (addToJSON)
        m_logs[static_cast<unsigned long long>(ms.count())] = message;
    Close();
}

void Logger::log(const wstring& message, bool addToJSON)
{
    lock_guard<mutex> guard(mutexLock);
    Open();
    milliseconds ms = duration_cast<milliseconds>(system_clock::now().time_since_epoch());
    m_Logfile << CurrentDateTime() << ":\t";
    m_Logfile << to_string(message) << "\n";
    if (addToJSON)
        m_logs[static_cast<unsigned long long>(ms.count())] = to_string(message);
    Close();
}

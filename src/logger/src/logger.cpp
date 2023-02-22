#include "logger.h"
#include "utils.h"
#include "defines.h"

const string Logger::m_sFileName = LOG_NAME;
Logger* Logger::m_pThis = NULL;
ofstream Logger::m_Logfile;
std::list<std::string> Logger::m_logs;

Logger::Logger()
{

}
Logger* Logger::GetLogger()
{
    if (m_pThis == NULL) {
        m_pThis = new Logger();
        std::filesystem::path dirPath = std::filesystem::temp_directory_path();
        m_Logfile.open((dirPath.string() + m_sFileName).c_str(), ios::out | ios::app);
        m_pThis->Log("**************************************************");
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

void Logger::Log(const string& message)
{
    Open();
    m_Logfile << CurrentDateTime() << ":\t";
    m_Logfile << message << "\n";
    m_logs.push_back(CurrentDateTime() + ": " + message);
    Close();
}

void Logger::Log(const wstring& message)
{
    Open();
    m_Logfile << CurrentDateTime() << ":\t";
    m_Logfile << to_string(message) << "\n";
    m_logs.push_back(CurrentDateTime() + ": " + to_string(message));
    Close();
}

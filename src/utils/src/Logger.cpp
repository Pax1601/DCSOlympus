#include "Logger.h"
#include "Utils.h"
#include "defines.h"

const string Logger::m_sFileName = LOG_NAME;
Logger* Logger::m_pThis = NULL;
ofstream Logger::m_Logfile;

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

void Logger::Log(const char* format, ...)
{
    Open();
    char* sMessage = NULL;
    int nLength = 0;
    va_list args;
    va_start(args, format);
    //  Return the number of characters in the string referenced the list of arguments.
    // _vscprintf doesn't count terminating '\0' (that's why +1)
    nLength = _vscprintf(format, args) + 1;
    sMessage = new char[nLength];
    vsprintf_s(sMessage, nLength, format, args);
    //vsprintf(sMessage, format, args);
    m_Logfile << Utils::CurrentDateTime() << ":\t";
    m_Logfile << sMessage << "\n";
    va_end(args);
    Close();

    delete[] sMessage;
}

void Logger::Log(const string& sMessage)
{
    Open();
    m_Logfile << Utils::CurrentDateTime() << ":\t";
    m_Logfile << sMessage << "\n";
    Close();
}

void Logger::Log(const wstring& sMessage)
{
    Open();
    m_Logfile << Utils::CurrentDateTime() << ":\t";
    m_Logfile << Utils::to_string(sMessage) << "\n";
    Close();
}

Logger& Logger::operator<<(const string& sMessage)
{
    Open();
    m_Logfile << "\n" << Utils::CurrentDateTime() << ":\t";
    m_Logfile << sMessage << "\n";
    return *this;
    Close();
}
#pragma once
#include "framework.h"

#define LOGGER Logger::GetLogger()
class Logger
{
public:
    void Log(const std::string& sMessage);
    void Log(const std::wstring& sMessage);
    void Log(const char* format, ...);

    Logger& operator<<(const string& sMessage);

    static Logger* GetLogger();
private:
    Logger();
    Logger(const Logger&) {};                               // copy constructor is private
    Logger& operator=(const Logger&) { return *this; };     // assignment operator is private
    
    static const std::string m_sFileName;
    static Logger* m_pThis;
    static ofstream m_Logfile;

    void Open();
    void Close();
};

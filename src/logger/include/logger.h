#pragma once
#include "framework.h"
#include "interface.h"

class Logger
{
public:
    void log(const string& sMessage);
    void log(const wstring& sMessage);
    void toJSON(json::value& json, int logsNumber = NULL);

    static Logger* GetLogger();

private:
    Logger();
    Logger(const Logger&) {};                               // copy constructor is private
    Logger& operator=(const Logger&) { return *this; };     // assignment operator is private

    static const string m_sFileName;
    static Logger* m_pThis;
    static ofstream m_Logfile;
    static std::list<std::string> m_logs;

    mutex mutexLock;

    void Open();
    void Close();
};



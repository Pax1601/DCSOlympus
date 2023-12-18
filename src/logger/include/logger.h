#pragma once
#include "log.h"
#include "framework.h"
#include "interface.h"

class Logger
{
public:
    void log(const string& sMessage, const string& commander, bool addToJSON);
    void log(const wstring& sMessage, const string& commander, bool addToJSON);
    void toJSON(json::value& json, unsigned long long time, const string& commander);

    static Logger* GetLogger();

private:
    Logger();
    Logger(const Logger&) {};                               // copy constructor is private
    Logger& operator=(const Logger&) { return *this; };     // assignment operator is private

    static const string m_sFileName;
    static Logger* m_pThis;
    static ofstream m_Logfile;
    static std::map<unsigned long long, class Log> m_logs;

    mutex mutexLock;

    void Open();
    void Close();
};



#pragma once
#include "framework.h"
#include "interface.h"

class Logger
{
public:
    void Log(const string& sMessage);
    void Log(const wstring& sMessage);

    static Logger* GetLogger();
private:
    Logger();
    Logger(const Logger&) {};                               // copy constructor is private
    Logger& operator=(const Logger&) { return *this; };     // assignment operator is private

    static const string m_sFileName;
    static Logger* m_pThis;
    static ofstream m_Logfile;

    void Open();
    void Close();
};



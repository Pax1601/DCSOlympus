#pragma once
#include "framework.h"
#include "interface.h"

class Logger
{
public:
    void log(const string& sMessage, bool addToJSON);
    void log(const wstring& sMessage, bool addToJSON);
    void toJSON(json::value& json, unsigned long long time);
    void setDirectory(string newDirPath);

    static Logger* GetLogger();

private:
    Logger();
    Logger(const Logger&) {};                               // copy constructor is private
    Logger& operator=(const Logger&) { return *this; };     // assignment operator is private

    static const string m_sFileName;
    static Logger* m_pThis;
    static ofstream m_Logfile;
    static std::map<unsigned long long, std::string> m_logs;
    static string m_dirPath;

    mutex mutexLock;

    void Clear();
    void Open();
    void Close();
};



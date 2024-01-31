#pragma once
#include "framework.h"

void DllExport setLogDirectory(std::string m_dirPath);
void DllExport log(const std::string& sMessage, bool addToJSON = false);
void DllExport log(const std::wstring& sMessage, bool addToJSON = false);
void DllExport getLogsJSON(json::value& json, unsigned long long time);

#pragma once
#include "framework.h"

void DllExport log(const std::string& sMessage, const std::string& commander = "SERVER", bool addToJSON = false);
void DllExport log(const std::wstring& sMessage, const std::string& commander, bool addToJSON = false);
void DllExport getLogsJSON(json::value& json, unsigned long long time, const std::string& commander);

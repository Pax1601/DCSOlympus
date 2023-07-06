#pragma once
#include "framework.h"

void DllExport log(const std::string& sMessage);
void DllExport log(const std::wstring& sMessage);
void DllExport getLogsJSON(json::value& json, unsigned int logsNumber = NULL);

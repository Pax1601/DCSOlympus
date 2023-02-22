#pragma once
#include "framework.h"

void DllExport log(const std::string& sMessage);
void DllExport log(const std::wstring& sMessage);
std::list<std::string> DllExport getLogs();

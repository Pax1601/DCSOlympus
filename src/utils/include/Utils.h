#pragma once
#include "framework.h"

struct Coords {
    double lat = 0;
    double lng = 0;
    double alt = 0;
};

// Get current date/time, format is YYYY-MM-DD.HH:mm:ss
const DllExport std::string CurrentDateTime();
std::wstring DllExport to_wstring(const std::string& str);
std::string DllExport to_string(const std::wstring& wstr);

bool DllExport operator== (const Coords& a, const Coords& b);
bool DllExport operator!= (const Coords& a, const Coords& b);
bool DllExport operator== (const Coords& a, const int& b);
bool DllExport operator!= (const Coords& a, const int& b);

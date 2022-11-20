#pragma once
#include "framework.h"

struct Coords {
    double lat = 0;
    double lng = 0;
    double alt = 0;
};

bool operator== (const Coords& a, const Coords& b);
bool operator!= (const Coords& a, const Coords& b);
bool operator== (const Coords& a, const int& b);
bool operator!= (const Coords& a, const int& b);

namespace Utils
{
    // Get current date/time, format is YYYY-MM-DD.HH:mm:ss
    const std::string CurrentDateTime();
    std::wstring to_wstring(const std::string& str);
    std::string to_string(const std::wstring& wstr);
}

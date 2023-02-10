#include "framework.h"
#include "utils.h"

// Get current date/time, format is YYYY-MM-DD.HH:mm:ss
const std::string CurrentDateTime()
{
    time_t     now = time(NULL);
    struct tm  tstruct;
    char       buf[80];
    localtime_s(&tstruct, &now);
    strftime(buf, sizeof(buf), "%Y-%m-%d.%X", &tstruct);
    return buf;
}

std::wstring to_wstring(const std::string& str)
{
    int size_needed = MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), NULL, 0);
    std::wstring wstrTo(size_needed, 0);
    MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), &wstrTo[0], size_needed);
    return wstrTo;
}

std::string to_string(const std::wstring& wstr)
{
    if (wstr.empty())
    {
        return "";
    }

    const auto size_needed = WideCharToMultiByte(CP_UTF8, 0, &wstr.at(0), (int)wstr.size(), nullptr, 0, nullptr, nullptr);
    if (size_needed <= 0)
    {
        throw std::runtime_error("WideCharToMultiByte() failed: " + std::to_string(size_needed));
    }

    std::string result(size_needed, 0);
    WideCharToMultiByte(CP_UTF8, 0, &wstr.at(0), (int)wstr.size(), &result.at(0), size_needed, nullptr, nullptr);
    return result;
}

bool operator== (const Coords& a, const Coords& b) { return a.lat == b.lat && a.lng == b.lng && a.alt == b.alt; }
bool operator!= (const Coords& a, const Coords& b) { return !(a == b); }
bool operator== (const Coords& a, const int& b) { return a.lat == b && a.lng == b && a.alt == b; }
bool operator!= (const Coords& a, const int& b) { return !(a == b); }

bool operator== (const Offset& a, const Offset& b) { return a.x == b.x && a.y == b.y && a.z == b.z; }
bool operator!= (const Offset& a, const Offset& b) { return !(a == b); }
bool operator== (const Offset& a, const int& b) { return a.x == b && a.y == b && a.z == b; }
bool operator!= (const Offset& a, const int& b) { return !(a == b); }

#pragma once

#define DllExport   __declspec( dllexport )

#define WIN32_LEAN_AND_MEAN             // Exclude rarely-used stuff from Windows headers
// Windows Header Files
#include <windows.h>

#include <iostream>
#include <string>
#include <time.h>
#include <chrono>
#include <map>
#include <list>
#include <fstream>
#include <cstdarg>
#include <filesystem>
#include <codecvt>
#include <cpprest/http_listener.h>
#include <cpprest/json.h>
#include <cpprest/streams.h>
#include <set>
#include <random>
#include <algorithm>

using namespace std;
using namespace web;

extern "C" {
    #include "lua.h"		  
    #include "lualib.h"
    #include "luaconf.h"
    #include "lauxlib.h"
}
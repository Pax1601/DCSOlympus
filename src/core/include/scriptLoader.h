#pragma once
#include "framework.h"

#define PROTECTED_CALL "Olympus = {}\n \
                        function Olympus.protectedCall(...)\n\n \
                            local status, retval = pcall(...)\n \
                            if not status then\n \
                                trigger.action.outText(\"ERROR: \" ..retval, 20)\n \
                            end\n \
                        end\n \
                        trigger.action.outText(\"Olympus.protectedCall registered successfully\", 10)\n"

void registerLuaFunctions(lua_State* L);

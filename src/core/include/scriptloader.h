#pragma once
#include "framework.h"

#define PROTECTED_CALL "Olympus = {}\n \
                        function Olympus.protectedCall(...)\n\n \
                            local status, retval = pcall(...)\n \
                            if not status then\n \
                                if Olympus.log ~= nil then\n \
                                    Olympus.log:error(retval)\n \
                                else\n \
                                    trigger.action.outText(\"Olympus critical error: \" ..retval, 20)\n \
                                end\n \
                            end\n \
                        end\n \
                        trigger.action.outText(\"Olympus.protectedCall registered successfully\", 10)\n"

void registerLuaFunctions(lua_State* L);

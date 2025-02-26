#pragma once

#define VERSION "{{OLYMPUS_VERSION_NUMBER}}.{{OLYMPUS_COMMIT_HASH}}"
#define LOG_NAME "..\\..\\..\\..\\Logs\\Olympus_log.txt"

#define REST_ADDRESS "http://localhost:3001"
#define REST_URI "olympus"
#define UNITS_URI "units"
#define WEAPONS_URI "weapons"
#define LOGS_URI "logs"
#define AIRBASES_URI "airbases"
#define BULLSEYE_URI "bullseyes"
#define SPOTS_URI "spots"
#define MISSION_URI "mission"
#define COMMANDS_URI "commands"
#define DRAWINGS_URI "drawings"

#define FRAMERATE_TIME_INTERVAL 0.05

#define OLYMPUS_JSON_PATH "..\\..\\..\\..\\Config\\olympus.json"
#define AIRCRAFT_DATABASE_PATH "..\\databases\\units\\aircraftdatabase.json"
#define HELICOPTER_DATABASE_PATH "..\\databases\\units\\helicopterdatabase.json"
#define GROUNDUNIT_DATABASE_PATH "..\\databases\\units\\groundunitdatabase.json"
#define NAVYUNIT_DATABASE_PATH "..\\databases\\units\\navyunitdatabase.json"

#define MIST_SCRIPT "..\\Scripts\\mist.lua"
#define OLYMPUS_COMMAND_SCRIPT "..\\Scripts\\OlympusCommand.lua"
#define UNIT_PAYLOADS_SCRIPT "..\\Scripts\\unitPayloads.lua"
#define TEMPLATES_SCRIPT "..\\Scripts\\templates.lua"
#define MODS_SCRIPT "..\\Scripts\\mods.lua"

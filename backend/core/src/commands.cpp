#include "commands.h"
#include "logger.h"
#include "dcstools.h"
#include "unit.h"
#include "unitsmanager.h"

extern UnitsManager* unitsManager;

namespace {
    bool isSpace(const char ch) {
        return ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n';
    }

    bool isDigit(const char ch) {
        return ch >= '0' && ch <= '9';
    }

    bool isAlpha(const char ch) {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch == '_';
    }

    bool isAlphaNumeric(const char ch) {
        return isAlpha(ch) || isDigit(ch);
    }

    string luaQuote(const string& value) {
        std::ostringstream result;
        result << '"';
        for (unsigned char ch : value) {
            switch (ch) {
            case '\\': result << "\\\\"; break;
            case '"': result << "\\\""; break;
            case '\n': result << "\\n"; break;
            case '\r': result << "\\r"; break;
            case '\t': result << "\\t"; break;
            case '\0': result << "\\000"; break;
            default:
                if (ch < 32 || ch == 127) {
                    result << '\\'
                        << static_cast<char>('0' + ((ch / 100) % 10))
                        << static_cast<char>('0' + ((ch / 10) % 10))
                        << static_cast<char>('0' + (ch % 10));
                }
                else {
                    result << static_cast<char>(ch);
                }
            }
        }
        result << '"';
        return result.str();
    }
}

bool isSafeLuaDataLiteral(const string& value) {
    if (value.empty()) {
        return false;
    }

    for (size_t i = 0; i < value.size();) {
        const char ch = value[i];
        if (isSpace(ch)) {
            i++;
            continue;
        }

        if (ch == '"' || ch == '\'') {
            const char quote = ch;
            bool closed = false;
            bool escaped = false;
            i++;
            while (i < value.size()) {
                const char stringCh = value[i++];
                if (escaped) {
                    escaped = false;
                }
                else if (stringCh == '\\') {
                    escaped = true;
                }
                else if (stringCh == quote) {
                    closed = true;
                    break;
                }
                else if (stringCh == '\r' || stringCh == '\n') {
                    return false;
                }
            }
            if (!closed || escaped) {
                return false;
            }
            continue;
        }

        if (isAlpha(ch)) {
            const size_t start = i++;
            while (i < value.size() && isAlphaNumeric(value[i])) {
                i++;
            }
            const string identifier = value.substr(start, i - start);
            if (identifier != "true" && identifier != "false" && identifier != "nil") {
                size_t next = i;
                while (next < value.size() && isSpace(value[next])) next++;
                if (next == value.size() || value[next] != '=') {
                    return false;
                }
            }
            continue;
        }

        if (isDigit(ch) || ch == '-' || ch == '+') {
            bool hasDigit = isDigit(ch);
            bool hasDecimal = false;
            bool hasExponent = false;
            i++;
            while (i < value.size()) {
                const char numberCh = value[i];
                if (isDigit(numberCh)) {
                    hasDigit = true;
                    i++;
                }
                else if (numberCh == '.' && !hasDecimal && !hasExponent) {
                    hasDecimal = true;
                    i++;
                }
                else if ((numberCh == 'e' || numberCh == 'E') && !hasExponent) {
                    hasExponent = true;
                    i++;
                    if (i < value.size() && (value[i] == '+' || value[i] == '-')) {
                        i++;
                    }
                }
                else {
                    break;
                }
            }
            if (!hasDigit) {
                return false;
            }
            continue;
        }

        if (ch != '{' && ch != '}' && ch != '[' && ch != ']' && ch != '=' && ch != ',') {
            return false;
        }
        i++;
    }
    return true;
}

/* Move command */
string Move::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.move, "
        << luaQuote(groupName) << ", "
        << destination.lat << ", "
        << destination.lng << ", "
        << altitude << ", "
        << luaQuote(altitudeType) << ", "
        << speed << ", "
        << luaQuote(speedType) << ", "
        << luaQuote(category) << ", "
        << taskOptions;
    return commandSS.str();
}

/* Smoke command */
string Smoke::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.smoke, " 
        << luaQuote(color) << ", "
        << location.lat << ", "
        << location.lng;
    return commandSS.str();
}

/* Spawn ground units command */
string SpawnGroundUnits::getString()
{
    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < spawnOptions.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {" 
            << "unitType = " << luaQuote(spawnOptions[i].unitType) << ", "
            << "lat = " << spawnOptions[i].location.lat << ", "
            << "lng = " << spawnOptions[i].location.lng << ", "
            << "heading = " << spawnOptions[i].heading << ", "
            << "liveryID = " << luaQuote(spawnOptions[i].liveryID) << ", "
            << "skill = " << luaQuote(spawnOptions[i].skill) << "}, ";
    }

    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.spawnUnits, {"
        << "category = " << luaQuote("GroundUnit") << ", "
        << "coalition = " << luaQuote(coalition) << ", "
        << "country = " << luaQuote(country) << ", "
        << "units = " << "{" << unitsSS.str() << "}" << "}";
    commandSS << ", " << luaQuote(this->getHash());
    return commandSS.str();
}


/* Spawn ground units command */
string SpawnNavyUnits::getString()
{
    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < spawnOptions.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {"
            << "unitType = " << luaQuote(spawnOptions[i].unitType) << ", "
            << "lat = " << spawnOptions[i].location.lat << ", "
            << "lng = " << spawnOptions[i].location.lng << ", "
            << "heading = " << spawnOptions[i].heading << ", "
            << "liveryID = " << luaQuote(spawnOptions[i].liveryID) << ", "
            << "skill = " << luaQuote(spawnOptions[i].skill) << "}, ";
    }

    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.spawnUnits, {"
        << "category = " << luaQuote("NavyUnit") << ", "
        << "coalition = " << luaQuote(coalition) << ", "
        << "country = " << luaQuote(country) << ", "
        << "units = " << "{" << unitsSS.str() << "}" << "}";
    commandSS << ", " << luaQuote(this->getHash());
    return commandSS.str();
}

/* Spawn aircrafts command */
string SpawnAircrafts::getString()
{
    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < spawnOptions.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {"
            << "unitType = " << luaQuote(spawnOptions[i].unitType) << ", "
            << "lat = " << spawnOptions[i].location.lat << ", "
            << "lng = " << spawnOptions[i].location.lng << ", "
            << "alt = " << spawnOptions[i].location.alt << ", "
            << "heading = " << spawnOptions[i].heading << ", "
            << "loadout = " << luaQuote(spawnOptions[i].loadout) << ", "
            << "payload = " << spawnOptions[i].payload << ", "
            << "liveryID = " << luaQuote(spawnOptions[i].liveryID) << ", "
            << "skill = " << luaQuote(spawnOptions[i].skill) << "}, ";
    }

    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.spawnUnits, {" 
        << "category = " << luaQuote("Aircraft") << ", "
        << "coalition = " << luaQuote(coalition) << ", "
        << "airbaseName = " << luaQuote(airbaseName) << ", "
        << "country = " << luaQuote(country) << ", "
        << "units = " << "{" << unitsSS.str() << "}" << "}";
    commandSS << ", " << luaQuote(this->getHash());
    return commandSS.str();
}


/* Spawn helicopters command */
string SpawnHelicopters::getString()
{
    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < spawnOptions.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {"
            << "unitType = " << luaQuote(spawnOptions[i].unitType) << ", "
            << "lat = " << spawnOptions[i].location.lat << ", "
            << "lng = " << spawnOptions[i].location.lng << ", "
            << "alt = " << spawnOptions[i].location.alt << ", "
            << "heading = " << spawnOptions[i].heading << ", "
            << "loadout = " << luaQuote(spawnOptions[i].loadout) << ", "
            << "payload = " << spawnOptions[i].payload << ", "
            << "liveryID = " << luaQuote(spawnOptions[i].liveryID) << ", "
            << "skill = " << luaQuote(spawnOptions[i].skill) << "}, ";
    }

    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.spawnUnits, {"
        << "category = " << luaQuote("Helicopter") << ", "
        << "coalition = " << luaQuote(coalition) << ", "
        << "airbaseName = " << luaQuote(airbaseName) << ", "
        << "country = " << luaQuote(country) << ", "
        << "units = " << "{" << unitsSS.str() << "}" << "}";
    commandSS << ", " << luaQuote(this->getHash());
    return commandSS.str();
}

/* Clone unit command */
string Clone::getString()
{
    std::ostringstream unitsSS;
    unitsSS.precision(10);
    for (int i = 0; i < cloneOptions.size(); i++) {
        unitsSS << "[" << i + 1 << "] = {"
            << "ID = " << cloneOptions[i].ID << ", "
            << "lat = " << cloneOptions[i].location.lat << ", "
            << "lng = " << cloneOptions[i].location.lng << " }, ";
    }

    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.clone, "
        << "{" << unitsSS.str() << "}" << ", "
        << (deleteOriginal ? "true" : "false");
    return commandSS.str();

}

/* Delete unit command */
string Delete::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.delete, "
        << ID << ", "
        << (explosion ? "true" : "false") << ", "
        << luaQuote(explosionType);
    return commandSS.str();
}

/* Set task command */
string SetTask::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setTask, "
        << luaQuote(groupName) << ", "
        << task;

    return commandSS.str();
}

/* Reset task command */
string ResetTask::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.resetTask, "
        << luaQuote(groupName);

    return commandSS.str();
}

/* Set command command */
string SetCommand::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setCommand, "
        << luaQuote(groupName) << ", "
        << command;

    return commandSS.str();
}

/* Set option command */
string SetOption::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);

    if (!isBoolean) {
        commandSS << "Olympus.setOption, "
            << luaQuote(groupName) << ", "
            << optionID << ", "
            << optionValue;
    } else {
        commandSS << "Olympus.setOption, "
            << luaQuote(groupName) << ", "
            << optionID << ", "
            << (optionBool? "true": "false");
    }
    return commandSS.str();
}

/* Set onOff command */
string SetOnOff::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);

    commandSS << "Olympus.setOnOff, "
        << luaQuote(groupName) << ", "
        << (onOff ? "true" : "false");
 
    return commandSS.str();
}

/* Explosion command */
string Explosion::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.explosion, "
        << intensity << ", "
        << luaQuote(explosionType) << ", "
        << location.lat << ", "
        << location.lng;
    return commandSS.str();
}

/* FireLaser command */
string FireLaser::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.fireLaser, "
        << ID << ", "
        << code << ", "
        << destination.lat << ", "
        << destination.lng;
    return commandSS.str();
}

/* FireInfrared command */
string FireInfrared::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.fireInfrared, "
        << ID << ", "
        << destination.lat << ", "
        << destination.lng;
    return commandSS.str();
}

/* SetLaserCode command */
string SetLaserCode::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setLaserCode, "
        << spotID << ", "
        << code;
    return commandSS.str();
}

/* MoveSpot command */
string MoveSpot::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.moveSpot, "
        << spotID << ", "
        << destination.lat << ", "
        << destination.lng;
    return commandSS.str();
}

/* DeleteSpot command */
string DeleteSpot::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.deleteSpot, "
        << spotID;
    return commandSS.str();
}

/* CreateMarker command */
string CreateMarker::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.createMarker, "
		<< markerID << ", "
        << position.lat << ", "
        << position.lng << ", "
		<< luaQuote(text);
    return commandSS.str();
}

/* DeleteMarker command */
string DeleteMarker::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.deleteMarker, "
        << markerID;
    return commandSS.str();
}

/* SetCargoWeight command */
string SetCargoWeight::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.setCargoWeight, "
        << ID << ", " 
        << weight;
    return commandSS.str();
}

/* RegisterDrawArgument command */
string RegisterDrawArgument::getString()
{
    std::ostringstream commandSS;
    commandSS.precision(10);
    commandSS << "Olympus.registerDrawArgument, "
        << ID << ", "
        << argument << ", "
        << active;
    return commandSS.str();
}
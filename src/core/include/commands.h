#pragma once
#include "framework.h"
#include "luatools.h"
#include "utils.h"
#include "logger.h"
#include "datatypes.h"

namespace CommandPriority {
	enum CommandPriorities { LOW, MEDIUM, HIGH, IMMEDIATE };
};

namespace SetCommandType {
	enum SetCommandTypes {
		ROE = 0,
		REACTION_ON_THREAT = 1,
		RADAR_USING = 3,
		FLARE_USING = 4,
		FORMATION = 5,
		RTB_ON_BINGO = 6,
		SILENCE = 7,
		RTB_ON_OUT_OF_AMMO = 10,
		ECM_USING = 13,
		PROHIBIT_AA = 14,
		PROHIBIT_JETT = 15,
		PROHIBIT_AB = 16,
		PROHIBIT_AG = 17,
		MISSILE_ATTACK = 18,
		PROHIBIT_WP_PASS_REPORT = 19,
		ENGAGE_AIR_WEAPONS = 20,
		OPTION_RADIO_USAGE_CONTACT = 21,
		OPTION_RADIO_USAGE_ENGAGE = 22,
		OPTION_RADIO_USAGE_KILL = 23,
		JETT_TANKS_IF_EMPTY = 25,
		FORCED_ATTACK = 26
	};
}

namespace ROE {
	enum ROEs {
		WEAPON_FREE = 0,
		OPEN_FIRE_WEAPON_FREE = 1,
		OPEN_FIRE = 2,
		RETURN_FIRE = 3,
		WEAPON_HOLD = 4,
	};
}

namespace ReactionToThreat {
	enum ReactionsToThreat {
		NO_REACTION = 0,
		PASSIVE_DEFENCE = 1,
		EVADE_FIRE = 2,
		BYPASS_AND_ESCAPE = 3,
		ALLOW_ABORT_MISSION = 4
	};
}

namespace EmissionCountermeasure {
	enum ReactionsToThreat {
		SILENT = 0,
		ATTACK = 1,
		DEFEND = 2,
		FREE = 3
	};
}

namespace RadarUse {
	enum RadarUses {
		NEVER = 0,
		FOR_ATTACK_ONLY = 1,
		FOR_SEARCH_IF_REQUIRED = 2,
		FOR_CONTINUOUS_SEARCH = 3
	};
}

namespace FlareUse {
	enum FlareUses {
		NEVER = 0,
		AGAINST_FIRED_MISSILE = 1,
		WHEN_FLYING_IN_SAM_WEZ = 2,
		WHEN_FLYING_NEAR_ENEMIES = 3
	};
}

namespace ECMUse {
	enum ECMUses {
		NEVER_USE = 0,
		USE_IF_ONLY_LOCK_BY_RADAR = 1,
		USE_IF_DETECTED_LOCK_BY_RADAR = 2,
		ALWAYS_USE = 3
	};
}

/* Base command class */
class Command
{
public:
	unsigned int getPriority() { return priority; }
	virtual string getString() = 0;
	virtual unsigned int getLoad() = 0;

protected:
	unsigned int priority = CommandPriority::LOW;
};

/* Simple low priority move command (from user click) */
class Move : public Command
{
public:
	Move(string groupName, Coords destination, double speed, string speedType, double altitude, string altitudeType, string taskOptions, string category):
		groupName(groupName),
		destination(destination),
		speed(speed),
		speedType(speedType),
		altitude(altitude),
		altitudeType(altitudeType),
		taskOptions(taskOptions),
		category(category)
	{ 
		priority = CommandPriority::HIGH; 
	};
	virtual string getString();
	virtual unsigned int getLoad() { return 2; }

private:
	const string groupName;
	const Coords destination;
	const double speed;
	const string speedType;
	const double altitude;
	const string altitudeType;
	const string taskOptions;
	const string category;
};

/* Smoke command */
class Smoke : public Command
{
public:
	Smoke(string color, Coords location) : 
		color(color), 
		location(location) 
	{ 
		priority = CommandPriority::LOW; 
	};
	virtual string getString();
	virtual unsigned int getLoad() { return 2; }

private:
	const string color;
	const Coords location;
};

/* Spawn ground unit command */
class SpawnGroundUnits : public Command
{
public:
	SpawnGroundUnits(string coalition, vector<SpawnOptions> spawnOptions, string country, bool immediate) :
		coalition(coalition), 
		spawnOptions(spawnOptions),
		country(country),
		immediate(immediate)
	{ 
		priority = immediate? CommandPriority::IMMEDIATE: CommandPriority::LOW;
	};
	virtual string getString();
	virtual unsigned int getLoad() { return immediate? 1: 30; }

private:
	const string coalition;
	const vector<SpawnOptions> spawnOptions;
	const string country;
	const bool immediate;
};

/* Spawn navy unit command */
class SpawnNavyUnits : public Command
{
public:
	SpawnNavyUnits(string coalition, vector<SpawnOptions> spawnOptions, string country, bool immediate) :
		coalition(coalition),
		spawnOptions(spawnOptions),
		country(country),
		immediate(immediate)
	{
		priority = immediate ? CommandPriority::IMMEDIATE : CommandPriority::LOW;
	};
	virtual string getString();
	virtual unsigned int getLoad() { return immediate ? 1 : 30; }

private:
	const string coalition;
	const vector<SpawnOptions> spawnOptions;
	const string country;
	const bool immediate;
};

/* Spawn aircraft command */
class SpawnAircrafts : public Command
{
public:
	SpawnAircrafts(string coalition, vector<SpawnOptions> spawnOptions, string airbaseName, string country, bool immediate) :
		coalition(coalition), 
		spawnOptions(spawnOptions),
		airbaseName(airbaseName),
		country(country),
		immediate(immediate)
	{ 
		priority = immediate ? CommandPriority::IMMEDIATE : CommandPriority::LOW;
	};
	virtual string getString();
	virtual unsigned int getLoad() { return immediate ? 1 : 30; }

private:
	const string coalition;
	const vector<SpawnOptions> spawnOptions;
	const string airbaseName;
	const string country;
	const bool immediate;
};


/* Spawn helicopter command */
class SpawnHelicopters : public Command
{
public:
	SpawnHelicopters(string coalition, vector<SpawnOptions> spawnOptions, string airbaseName, string country, bool immediate) :
		coalition(coalition),
		spawnOptions(spawnOptions),
		airbaseName(airbaseName),
		country(country),
		immediate(immediate)
	{
		priority = immediate ? CommandPriority::IMMEDIATE : CommandPriority::LOW;
	};
	virtual string getString();
	virtual unsigned int getLoad() { return immediate ? 1 : 30; }

private:
	const string coalition;
	const vector<SpawnOptions> spawnOptions;
	const string airbaseName;
	const string country;
	const bool immediate;
};

/* Clone unit command */
class Clone : public Command
{
public:
	Clone(vector<CloneOptions> cloneOptions) :
		cloneOptions(cloneOptions)
	{
		priority = CommandPriority::LOW;
	};
	virtual string getString();
	virtual unsigned int getLoad() { return 30; }

private:
	const vector<CloneOptions> cloneOptions;
};

/* Delete unit command */
class Delete : public Command
{
public:
	Delete(unsigned int ID, bool explosion, bool immediate ) :
		ID(ID), 
		explosion(explosion),
		immediate(immediate)
	{
		priority = CommandPriority::HIGH;
		immediate = immediate;
	};
	virtual string getString();
	virtual unsigned int getLoad() { return immediate? 1: 5; }

private:
	const unsigned int ID;
	const bool explosion;
	const bool immediate;
};

/* SetTask command */
class SetTask : public Command
{
public:
	SetTask(string groupName, string task) :
		groupName(groupName),
		task(task)
	{
		priority = CommandPriority::MEDIUM;
	};
	virtual string getString();
	virtual unsigned int getLoad() { return 1; }

private:
	const string groupName;
	const string task;
};

/* Reset task command */
class ResetTask : public Command
{
public:
	ResetTask(string groupName) :
		groupName(groupName)
	{
		priority = CommandPriority::HIGH;
	};
	virtual string getString();
	virtual unsigned int getLoad() { return 1; }

private:
	const string groupName;
};

/* Set command */
class SetCommand : public Command
{
public:
	SetCommand(string groupName, string command) :
		groupName(groupName),
		command(command)
	{
		priority = CommandPriority::HIGH;
	};
	virtual string getString();
	virtual unsigned int getLoad() { return 1; }

private:
	const string groupName;
	const string command;
};

/* Set option command */
class SetOption : public Command
{
public:
	SetOption(string groupName, unsigned int optionID, unsigned int optionValue) :
		groupName(groupName),
		optionID(optionID),
		optionValue(optionValue),
		optionBool(false),
		isBoolean(false)
	{
		priority = CommandPriority::HIGH;
	};

	SetOption(string groupName, unsigned int optionID, bool optionBool) :
		groupName(groupName),
		optionID(optionID),
		optionValue(0),
		optionBool(optionBool),
		isBoolean(true)
	{
		priority = CommandPriority::HIGH;
	};
	virtual string getString();
	virtual unsigned int getLoad() { return 1; }

private:
	const string groupName;
	const unsigned int optionID;
	const unsigned int optionValue;
	const bool optionBool;
	const bool isBoolean;
};

/* Set on off */
class SetOnOff : public Command
{
public:
	SetOnOff(string groupName, bool onOff) :
		groupName(groupName),
		onOff(onOff)
	{
		priority = CommandPriority::HIGH;
	};
	virtual string getString();
	virtual unsigned int getLoad() { return 1; }

private:
	const string groupName;
	const bool onOff;
};

/* Make a ground explosion */
class Explosion : public Command
{
public:
	Explosion(unsigned int intensity, Coords location) :
		location(location),
		intensity(intensity)
	{
		priority = CommandPriority::MEDIUM;
	};
	virtual string getString();
	virtual unsigned int getLoad() { return 4; }

private:
	const Coords location;
	const unsigned int intensity;
};

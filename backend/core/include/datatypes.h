#pragma once
#include "framework.h"
#include "utils.h"

namespace DataIndex {
	enum DataIndexes {
		startOfData = 0,
		category,
		alive,
		human,
		controlled,
		coalition,
		country,
		name,
		unitName,
		groupName,
		state,
		task,
		hasTask,
		position,
		speed,
		horizontalVelocity,
		verticalVelocity,
		heading,
		track,
		isActiveTanker,
		isActiveAWACS,
		onOff,
		followRoads,
		fuel,
		desiredSpeed,
		desiredSpeedType,
		desiredAltitude,
		desiredAltitudeType,
		leaderID,
		formationOffset,
		targetID,
		targetPosition,
		ROE,
		reactionToThreat,
		emissionsCountermeasures,
		TACAN,
		radio,
		generalSettings,
		ammo,
		contacts,
		activePath,
		isLeader,
		operateAs,
		shotsScatter,
		shotsIntensity,
		health,
		lastIndex,
		endOfData = 255
	};
}

namespace State
{
	enum States
	{
		NONE = 0,
		IDLE,
		REACH_DESTINATION,
		ATTACK,
		FOLLOW,
		LAND,
		REFUEL,
		AWACS,
		TANKER,
		BOMB_POINT,
		CARPET_BOMB,
		BOMB_BUILDING,
		FIRE_AT_AREA,
		SIMULATE_FIRE_FIGHT,
		SCENIC_AAA,
		MISS_ON_PURPOSE,
		LAND_AT_POINT
	};
};

namespace ShotsScatter
{
	enum ShotsScatters
	{
		NONE = 0,
		HIGH,
		MEDIUM,
		LOW
	};
};

namespace ShotsIntensity
{
	enum ShotsIntensities
	{
		NONE = 0,
		LOW,
		MEDIUM,
		HIGH
	};
};

#pragma pack(push, 1)
namespace DataTypes {
	struct TACAN
	{
		bool isOn = false;
		unsigned char channel = 40;
		char XY = 'X';
		char callsign[4];
	};

	struct Radio
	{
		unsigned int frequency = 124000000;	// MHz
		unsigned char callsign = 1;
		unsigned char callsignNumber = 1;
	};

	struct GeneralSettings
	{
		bool prohibitJettison = false;
		bool prohibitAA = false;
		bool prohibitAG = false;
		bool prohibitAfterburner = false;
		bool prohibitAirWpn = false;
	};

	struct Ammo {
		unsigned short quantity = 0;
		char name[33];
		unsigned char guidance = 0;
		unsigned char category = 0;
		unsigned char missileCategory = 0;
	};

	struct Contact {
		unsigned int ID = 0;
		unsigned char detectionMethod = 0;
	};
}
#pragma pack(pop)

bool operator==(const DataTypes::TACAN& lhs, const DataTypes::TACAN& rhs);
bool operator==(const DataTypes::Radio& lhs, const DataTypes::Radio& rhs);
bool operator==(const DataTypes::GeneralSettings& lhs, const DataTypes::GeneralSettings& rhs);
bool operator==(const DataTypes::Ammo& lhs, const DataTypes::Ammo& rhs);
bool operator==(const DataTypes::Contact& lhs, const DataTypes::Contact& rhs);

struct SpawnOptions {
	string unitType;
	Coords location;
	string loadout;
	string liveryID;
};

struct CloneOptions {
	unsigned int ID;
	Coords location;
};

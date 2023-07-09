#pragma once
#include "framework.h"

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

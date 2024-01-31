#include "datatypes.h"

bool operator==(const DataTypes::TACAN& lhs, const DataTypes::TACAN& rhs)
{
	return lhs.isOn == rhs.isOn && lhs.channel == rhs.channel && lhs.XY == rhs.XY && strcmp(lhs.callsign, rhs.callsign) == 0;
}

bool operator==(const DataTypes::Radio& lhs, const DataTypes::Radio& rhs)
{
	return lhs.frequency == rhs.frequency && lhs.callsign == rhs.callsign && lhs.callsignNumber == rhs.callsignNumber;
}

bool operator==(const DataTypes::GeneralSettings& lhs, const DataTypes::GeneralSettings& rhs) 
{
	return	lhs.prohibitAA == rhs.prohibitAA && lhs.prohibitAfterburner == rhs.prohibitAfterburner && lhs.prohibitAG == rhs.prohibitAG &&
		lhs.prohibitAirWpn == rhs.prohibitAirWpn && lhs.prohibitJettison == rhs.prohibitJettison;
}

bool operator==(const DataTypes::Ammo& lhs, const DataTypes::Ammo& rhs) 
{
	return	lhs.category == rhs.category && lhs.guidance == rhs.guidance && lhs.missileCategory == rhs.missileCategory &&
		lhs.quantity == rhs.quantity && strcmp(lhs.name, rhs.name) == 0;
}

bool operator==(const DataTypes::Contact& lhs, const DataTypes::Contact& rhs) 
{
	return	lhs.detectionMethod == rhs.detectionMethod && lhs.ID == rhs.ID;
}



-- CONFIGURATION ------------------------------------------------
-- Here the initial values are set, as well as the names of the trigger zones. Note that for persistency, this file will be edited. 
-- WARNING!!!!!!!!!!!!!!!!!!
-- Don't alter this files format and don't add other variables other than olyLink.bases. You can add other bases and change the values inside the table.
-- Any comments that are not part of this block will be deleted.
olyLink.bases = {
	["Orote"] = {
		["ammoZoneName"] = "Pickup-Weapons",
		["dropoffZoneName"] = "Dropoff",
		["frequency"] = 34000000,
		["fuel"] = 5000,
		["fuelZoneName"] = "Pickup-Oil",
		["modulation"] = 1,
		["shells"] = 0,
		["supplies"] = 0,
		["suppliesZoneName"] = "Pickup-Supplies",
		["voiceModel"] = "bm_daniel",
		["weapons"] = 	{
			["weapons.containers.M134_L"] = 0,
			["weapons.containers.M134_R"] = 0,
			["weapons.containers.M60_SIDE_L"] = 0,
			["weapons.containers.M60_SIDE_R"] = 0,
			["weapons.containers.SPRD-99"] = 0,
			["weapons.nurs.HYDRA_70_M151"] = 0,
			["weapons.nurs.HYDRA_70_M156"] = 0,
			["weapons.nurs.HYDRA_70_M257"] = 0,
			["weapons.torpedoes.LTF_5B"] = 0,
			["weapons.torpedoes.Mark_46"] = 0,
			["weapons.torpedoes.YU-6"] = 0,
			["weapons.torpedoes.mk46torp_name"] = 0
		}
	}
}
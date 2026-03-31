-- CONFIGURATION ------------------------------------------------
-- Here the initial values are set, as well as the names of the trigger zones. Note that for persistency, this file will be edited. 
-- WARNING!!!!!!!!!!!!!!!!!!
-- Don't alter this files format and don't add other variables other than olyLink.bases. You can add other bases and change the values inside the table.
-- Any comments that are not part of this block will be deleted.

olyLink.bases = {
    ["Orote"] = {
        frequency = 34000000,
        modulation = 1,
        voiceModel = "bm_daniel",
        supplies = 0,
        shells = 0,
        fuel = 0,
        weapons = {},
        fuelZoneName = "Pickup-Oil",
        ammoZoneName = "Pickup-Weapons",
        suppliesZoneName = "Pickup-Supplies",
        dropoffZoneName = "Dropoff"
    }
}
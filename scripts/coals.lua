coal = {}

function coal.notify(message, displayFor)
	 trigger.action.outText(message, displayFor)
end

function coal.listRed()
	coal.coals = env.mission.coalitions.red --solid naming this
	coal.notify(mist.utils.tableShow(coal.coals),5)
	pickOne = math.random(#coal.coals)
	countryIs = country.name[coal.coals[pickOne]]
	coal.notify(countryIs,10)
end

function coal.listBlue()
	coal.coals = env.mission.coalitions.blue --solid naming this
	coal.notify(mist.utils.tableShow(coal.coals),5)
	pickOne = math.random(#coal.coals)
	countryIs = country.name[coal.coals[pickOne]]
	coal.notify(countryIs,10)
end

function coal.listNeutrals()
	coal.coals = env.mission.coalitions.neutrals --solid naming this
	coal.notify(mist.utils.tableShow(coal.coals),5)
	pickOne = math.random(#coal.coals)
	countryIs = country.name[coal.coals[pickOne]]
	coal.notify(countryIs,10)
end


do	
	longRangeShots = missionCommands.addSubMenu("Coal check")
		missionCommands.addCommand ("List reds", longRangeShots, coal.listRed)
		missionCommands.addCommand ("List blue", longRangeShots, coal.listBlue)
		missionCommands.addCommand ("List neutrals", longRangeShots, coal.listNeutrals)

end

coal.notify("coals.lua loaded", 2)


-- env.mission.coalitions.red
-- env.mission.coalitions.blue
-- env.mission.coalitions.neutrals

--coalition.getCountryCoalition(countryID)
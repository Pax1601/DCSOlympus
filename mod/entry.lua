local self_ID = "DCS-Olympus"

declare_plugin(self_ID,
{
	image		 = "Olympus.png",
	installed	 = true, -- if false that will be place holder , or advertising
	dirName		 = current_mod_path,
	binaries	 =
	{
--		'Olympus',
	},
	load_immediately = true,

	displayName	 = "Olympus",
	shortName	 = "Olympus",
	fileMenuName = "Olympus",

	version		 = "0.0.7",
	state		 = "installed",
	developerName= "DCS Refugees 767 squadron",
	info		 = _("DCS Olympus is a mod for DCS World. It allows users to spawn, control, task, group, and remove units from a DCS World server using a real-time map interface, similarly to Real Time Strategy games. The user interface also provides useful informations units, like loadouts, fuel, tasking, and so on. In the future, more features for DCS World GCI and JTAC will be available."),

	Skins	=
	{
		{
			name	= "Olympus",
			dir		= "Theme"
		},
	},

	Options =
	{
		{
			name		= "Olympus",
			nameId		= "Olympus",
			dir			= "Options",
			CLSID		= "{Olympus-options}"
		},
	},
})

plugin_done()
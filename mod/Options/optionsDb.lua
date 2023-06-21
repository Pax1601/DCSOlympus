local DbOption = require("Options.DbOption")
local i18n = require('i18n')

-- Constants


-- Local variables

local olympusConfigDialog = nil

-- Update UI

local function UpdateOptions()

	-- Check parameters

	if olympusConfigDialog == nil then
		return
	end

	local moduleEnabled = olympusConfigDialog.olympusModuleEnabledCheckbox:getState()

end

-- Callbacks

local function OnShowDialog(dialogBox)

	-- Setup local variables

	if olympusConfigDialog ~= dialogBox then
		olympusConfigDialog = dialogBox
	end

	-- Update dialog box state

	UpdateOptions()

end

-- Module on/off

local olympusModuleEnabled = DbOption.new():setValue(true):checkbox()
:callback(function(value)
	UpdateOptions()
end)

-- Returns dialog box controls and callbacks

return
{
	-- Events

	callbackOnShowDialog  				= OnShowDialog,

	-- Module on/off

	olympusModuleEnabled				= olympusModuleEnabled,
	
}

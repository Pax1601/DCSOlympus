# Introduction

## What is Olympus?

Olympus is a program designed and created by a small group of people who love DCS. We felt there are ways of playing DCS that could be more fluid, and involve less use of Lua, and to open up mission making to a greater group of people.

This led to the creation of the Olympus program. A web-based app that does a lot of the thinking for a mission, then simplifies it and tells DCS what to do. Thus removing the mission editor (almost) entirely from the process.

The user interface is key to this experience, and we have done our best to make it clear and fun to use. We have leveraged the conventions many of you may have gotten used to via other real-time strategy games as Olympus does turn DCS into a real-time strategy game. One in which a Game Master can create as complex a mission as they like, however they like, completely on the fly. Using Olympus requires a human to play it "live" like a game master; it is not a tool for pre-game mission creation or planning. However, it will work alongside any premade mission.

## The Team

| Handle     | Contribution     |
|-------------|-------------------------------------------|
| Veltro      | Project originator and lead programmer    |
| El Tonio    | Concept originator and programmer         |
| Dogma       | Upside down UI Wizard                     |
| Peekaboo    | Programmer                                |
| Wirt        | Lua Consultant                            |
| Woods       | Programmer                                |
| Shredmetal  | Legal Eagle                               |
| Lovo        | Dog's Body                                |

# Basics

## Logging into Olympus

To login to Olympus, you need to enter a username and password.

**The username field is used for logging purposes only and can be anything you choose. The password is the one you set during the installation.**

If you forget a password or need to change them for security purposes, use ```configurator.exe``` in ```DCS.openbeta/Mods/Services/Olympus```, then restart the Olympus client and DCS mission.

Please note that at the moment, ```configurator.exe``` is a feature which is not present in local installations created via the installer, but is present when Olympus is installed via any of the other methods. In order to reset the Olympus client passwords for local installations, you will need to reinstall Olympus. This will be addressed in a future update.

You may notice there are `redCommander` and `blueCommander` passwords in the configurator. This is for missions where you would like to pit human Olympus players against one another, or have players not see everything on the other coalition. More details on this are in the "PvP Mode" section.

# User Interface

We have done our best to make the user interface (UI) as easy to understand as possible. Let's take a look at the overview.

Olympus is also most optimized for the Chrome web browser.

## Overview

![Olympus Overview](https://github.com/Pax1601/DCSOlympus/assets/55553527/0bc2a99a-3e8d-4a8e-b2c1-6589a0d1ed16)

### Map Options

- **Map Tiles:** Found in the top left. Allows you to change how the map tiles look, like switching between satellite and map mode in Google Maps. Different map sources have different looks and detail based on the zoom level, so see what works best for you.

![Map Tiles](https://github.com/Pax1601/DCSOlympus/assets/91024799/ddf28cf1-e09a-4998-a112-decd99a93cfb)

- **Map Options:** Allows you to select what information you want displayed on the map. Notice there are key commands listed for some lines in parentheses.

![Map Options](https://github.com/Pax1601/DCSOlympus/assets/66554898/36e5a729-1998-4259-a21e-1304a6ace2bb)

### Show/hide options
 Allows you to select what is displayed on the map. You can toggle visibility of human-controlled units, Olympus-controlled units, DCS-controlled units (i.e. units created using the mission editor and its triggers - note that taking control of these will break any link to the mission's logic), fixed-wing air units, rotary-wing air units, air defence units, naval units, ground units, airfield icons, and the three coalitions via these options.

![Show/Hide Options](https://github.com/Pax1601/DCSOlympus/assets/55553527/aad714b6-7413-490c-8ef5-4385dced14ac)

### The "Robot lock"
![Robot lock](https://github.com/Pax1601/DCSOlympus/assets/66554898/9af02ae4-7686-4781-8824-5fd159ad1641)

This lock protects DCS-controlled units, which we refer to as "robots".  These are the ones created and controlled by the mission editor.  If any commands are given to a robot, it will become an Olympus-controlled unit and any triggers and scripts that rely on the mission having control of that unit will be broken.  The mission may fail because of this - or even crash.  In order to stop accidental breakage, this lock is in place.

If you want to take control of a robot, unlock this control and give your command to the robot.  It's best to place the lock back on so you don't accidentally delete your aircraft carrier!

### Game Master Options
This shows the status and options for Olympus game master and coalition commander modes. These are intended for two or more people to compete using DCS Olympus and limit each side's visibility and ability to spawn certain units. More info in the PvP section.

![Game Master Options](https://github.com/Pax1601/DCSOlympus/assets/91024799/3962589e-949e-4d9c-877b-95ff0f715c5e)

### Minimap
This shows the overall theatre, an overview of units, and an orange box to represent the main map's field of view. You can click the minimap to snap to that location. 

![Minimap](https://github.com/Pax1601/DCSOlympus/assets/91024799/a21d16e4-4ccd-4ccf-9638-0600c7d99d5e)

### Airfields
Every airfield in the area is shown with an airfield symbol, the colour of the symbol shows you which side the field belongs to, grey for Neutral, blue for Blue, and red for Red. This is live and will change if the field is overtaken in DCS.

![Airfield](https://github.com/Pax1601/DCSOlympus/assets/66554898/50dc52db-3f32-4d02-966c-57be0d957293)

Right-clicking on an airfield will give you an airfield overview.  Hovering your mouse over a runway name (heading) and you will get the magnetic heading.  Hovering over the "ILS" marker will give you the ILS frequency.  You can also spawn AI hot from parking units at an airfield by clicking "Spawn".

![Airfield summary](https://github.com/Pax1601/DCSOlympus/assets/66554898/4ab6a0c7-3f58-4ba3-acda-19bcd559d730)

### Cursor Location Info:
This shows the location information of the mouse cursor in a variety of formats.  Clicking the location formats (or pressing Z) will cycle them.

| Full display | Lat-long | MGRS | Decimal |
|---|---|---|---|
| ![Cursor Location Info](https://github.com/Pax1601/DCSOlympus/assets/91024799/6931b4a8-9b2f-4a17-a69b-029e28e7bc7b) | ![Lat-long](https://github.com/Pax1601/DCSOlympus/assets/66554898/710f39c2-9f67-45c7-b9e2-39a69d96fcdf) | ![MGRS](https://github.com/Pax1601/DCSOlympus/assets/66554898/1160c85a-a028-47f3-a07e-0f07c4bd4c97) <br />[,] (comma) will reduce the accuracy<br />[.] (full stop) will increase the accuracy|  ![image](https://github.com/Pax1601/DCSOlympus/assets/66554898/1f02a75e-9ffa-4ed5-a099-4ee4b59af4c6) |

### Connection Status
This will show whether or not you have successfully connected to the server in question. This will work even if the server is paused, however, you cannot affect the game while it is paused. You will also see the Elapsed Time of the mission, which is how long the mission has been running. You can click this to toggle between that and Mission Time (local).

| State | Example |
|---|---|
| Connected with elapse timed showing | ![Connected - elapsed time](https://github.com/Pax1601/DCSOlympus/assets/66554898/6b88ecc9-1e0b-439c-b58c-c327e4b4dd47) |
| Connected with location time showing | ![Connected - mission time](https://github.com/Pax1601/DCSOlympus/assets/66554898/b26952c1-2994-42fe-82a7-cf7df1063b5c) |
| Server paused (connected) | ![Server paused](https://github.com/Pax1601/DCSOlympus/assets/66554898/d831f3c1-c995-43d6-ba1a-dd1fef76d0a6) |
| Not connected | ![No Connection Status](https://github.com/Pax1601/DCSOlympus/assets/91024799/f82669ad-ed86-4385-812c-ca9296a4983c) |

## Selected Unit Information

When we select a unit, we will see further information and options.

![Selected Unit Example](https://github.com/Pax1601/DCSOlympus/assets/91024799/ef2e70a2-d28b-4160-bfd5-0fb74d1460bc)

### Selected Units Window
This window allows you to control the unit's parameters and settings.

|     |     |
|:---------------------------------------------------------------------------:|-----|
| ![Selected Unit/s Name](https://github.com/Pax1601/DCSOlympus/assets/91024799/8dc319e6-5c8a-4078-b746-dc5bc10f8618)   |   **Selected Unit/s name** <br /> The type is also displayed. |
| ![Flight Controls](https://github.com/Pax1601/DCSOlympus/assets/91024799/5e2f7f9e-0221-452d-81bb-8cfb5dd9e69a) | **Flight Controls** <br /> Shows the instructed speed and altitude for the selected unit. You can toggle between <abbr title="Above Sea Level">ASL</abbr> and <abbr title="Above Ground Level">AGL</abbr>, as well as <abbr title="Calibrated Air Speed">CAS</abbr> and <abbr title="Ground Speed">GS</abbr>. This will grey out if multiple units are selected with differing instructed parameters. You can also see the upper and lower limits of the speed and altitude scales. |
| ![Rules of Engagement (RoE)](https://github.com/Pax1601/DCSOlympus/assets/91024799/80151289-5846-4deb-a028-c7ccbaf41d1e) | **Rules of Engagement (RoE)**                                             <br /> Shows the ways in which the unit will attack other units. The RoE options are: <ul><li>Hold (Never fire)</li><li>Return fire (attack if attacked)* </li><li>Designated (default - Attack only unit designated by user)*</li><li>Free (Attack opposing coalition units at will)</li>*unavailable for units other than aircraft.</ul>
| ![Reaction to Threat](https://github.com/Pax1601/DCSOlympus/assets/91024799/20794ba3-116f-485f-ab84-0c18e04f618f) | **Reaction to Threat**  <br /> Shows the ways in which the unit will behave when threatened. The options are:<ul><li>None (No reaction to threat)</li><li>Maneuver (Unit will not use countermeasures, and will only attempt to kinematically avoid the threat)</li><li>Passive (Unit will not deviate, and will attempt to use countermeasures to defeat missiles. Unit may make last-ditch evasion attempts)</li><li>Evade (default - Unit will use all methods available to it to attempt to evade missiles as soon as it detects them)</li> |
| ![Delete Unit](https://github.com/Pax1601/DCSOlympus/assets/91024799/1efad12a-de6f-4f54-ad9f-ebfad0bb0738) | **Delete Unit** <br /> Will open a drop-down with options for removing the selected Unit from the game. Delete here cause the unit to disappear entirely. The remaining options will destroy the unit with an explosion of the type listed in the menu. <br /> *Caution: You CAN do this to human players; they may not appreciate this.* |
| ![Further settings](https://github.com/Pax1601/DCSOlympus/assets/91024799/3e881631-f3c7-40e5-83b6-0a9e920a9cb9) ![Image](https://github.com/Pax1601/DCSOlympus/assets/91024799/89d9cd2e-bb69-4a53-84f4-0ec7567eeaa5) ![Image](https://github.com/Pax1601/DCSOlympus/assets/91024799/570ecb95-9f8a-40f7-bdd6-6d58c26a13f9) | **Further settings** <br /> Further settings allow you to set an A/A (air-to-air) TACAN, Radio frequency, and change the unit's callsign. As should be obvious, these further options will vary depending on the unit type. If the unit is a tanker or AEW capable, you will see a switch for "Enable Tanker" or "Enable Airborne Early Warning". If this is set to on, then this unit will be available for human and AI AAR (air-to-air refueling) or AI AEW. More info on this later. |

## Selected Unit
The selected unit will have a pale halo around it to show that it has been selected. You will see useful information around the icon, some of which will appear on non-selected units as well.
The Unit name appears to the left of the icon, and the unit type is seen within the icon.
The colour scheme reflects the coalition of the unit.

![Selected Unit](https://github.com/Pax1601/DCSOlympus/assets/91024799/5ad33107-a20b-4f49-8c7d-270fe8c265b9)

- **Action Icon**: Shown in the top left, this is an icon to let you know at a glance what that unit is doing. The cycling icon seen here is the idle icon. This unit is orbiting awaiting instruction.
- **Selection Halo**: A pale-coloured circle around the icon to indicate selection.
- **Velocity Vector**: The azimuth of the line shows what direction the unit is moving in, and the length of the icon grows with an increase in speed.
- **Fuel Gauge**: A blue bar with a white background, which is a simple representation of the unit's fuel state. The more blue bar, the more fuel.
- **Weapon Dots**: Shows the unit's weapon state. The dots from left to right show the presence of Fox 1s (e.g., AIM-7), Fox 2s (e.g., AIM-9), Fox 3s (e.g., AIM-120), Gun/other. A white dot means no weapon of that type, a filled dot means some weapons of that type.
- **Ground Speed**: Shows the unit's ground speed.
- **Flight Level**: Shows the unit's altitude above sea level in hundreds of feet.
- **Detection Lines**: Shows what other units the selected unit detects. Shown as a coloured dotted line emanating from the selected unit to the detected unit. This may be via RWR, IR, radar, and/or visually.

# Using the Map
Interacting with the map can be done in the following ways:

- The keyboard arrow keys - scroll the map in 2 axes
- Mouse movement with left mouse button hold - scroll the map in 2 axes
- Mouse movement with middle mouse button hold - scroll the map in 2 axes
- Left mouse button click on the mini-map - Snap to that location
- Mouse scroll wheel forward/backwards - Increase/decrease map zoom
- Keyboard or numpad +/- - Increase/decrease map zoom level
- Space will pause the view (but the mission on the server will continue)

# Spawning Units
Spawning units in Olympus is quite simple. Perform a right-click in an empty space to bring up the spawn menu. An aircraft spawned this way will be an airstart.
You can also right-click on an airfield and select "spawn" to open the spawn menu that will start an aircraft from parking hot.

![Spawn Menu](https://github.com/Pax1601/DCSOlympus/assets/91024799/0d76d69d-d15a-43e4-949b-7e2216b6f450)

## Coalition
This is a three-way toggle switch that will cycle between Red and Blue. Right click this to select Neutral. While in one of those states, the units you spawn will be in that coalition. By default, the unit options are the same regardless of what coalition you choose (you can select a MiG-31 to be blue).
## Type
From left to right there is: **Fixed Wing, Rotary Wing, Air Defence, Land Unit, Effect** <br />Selecting one of these options will allow the choices from those domains. E.g., click Land Unit, and the drop-down menus will consist of land units. The Effects menu is for naval units, smoke, explosions, and drawing.

![Spawn Menu](https://github.com/Pax1601/DCSOlympus/assets/91024799/ea6787f7-b6f1-4e23-a6a3-e68079ba5774)
## Aircraft Role/Label/Loadout
These are a series of drop-down menus that will allow you to specify what exactly you want to spawn. 
### Roles
Think of the roles as filters for unit and loadout. One unit may exist within multiple roles
|Domain     |Roles:|Domain|Roles|
|------|------|------|-----|
|Fixed Wing|<ul><li>AWACS</li><li>Antiship Strike</li><li> CAP</li><li> CAS</li><li> Escort</li><li> FAC-A</li><li> No Task</li><li> Reconnaissance</li><li> Runway Attack</li><li> SEAD</li><li> Strike</li><li> Tanker</li><li>Transport</li></ul>|Rotary Wing|<ul><li>Antiship</li><li> Strike</li><li> CAS</li><li> Escourt </li><li>FAC-A </li><li>No task</li><li> Strike</li><li> Transport</li></ul>|
|Air Defence|<ul><li>AAA </li><li>SAM Site</li><li> SAM Site Parts</li></ul>|Ground Unit|<ul><li>APC</li><li> Artillery</li><li> Infantry</li><li> RADAR (EWR)</li><li> Tactical Vehicle </li><li>Tank</li><li> Unarmed</li></ul>|
|Naval Unit|<ul><li>Aircraft Carrier</li><li>Cargo/Transport</li><li>Combatants</li><li>Fast Attack Craft</li><li>Submarine</li></ul>

## Unit Label
Clicking on the Unit Label box will open a menu to select the specific unit. 
Like an AH-64, or a Challenger 2.
## Unit Loadout
Clicking on the Unit Loadout box will open a menu to select a loadout for the unit. 
If you can't see the one you want the consider trying a different role.
## Unit Group Size
Clicking on the Unit Group Size box will open a menu to select the group size for the unit. 
You can create a group up to 4 units in strength. 
## Advanced Options
Clicking on the Advanced Options arrow will expand the menu with advanced 
spawn option for the unit. These may consist of: 
- Country of Origin
- Livery
- Spawn altitude
## Info
Clicking on the Info arrow will expand the menu with information for the unit. 
This may be useful for times when you aren't sure on the specifics of a unit, or what it can do.
## Deploy Unit
Once you are happy, press the Deploy Units button. The next chance Olympus gets 
it will place the unit as instructed.
## Tips
The spawn menu will remember the last unit spawned so to spawn another or make 
minor changes, right-click again.
Selecting unit(s) and pressing Ctrl+C then Ctrl+V will copy and paste that unit 
where the cursor is positioned. This will also work with multiple units selected.

# Selecting Units
## Single Unit
You can move your mouse cursor over a unit's icon and left click the mouse to select it. 
You will notice the unit that will be selected gets a white border while you hover your cursor.
## Multiple Units
You can hold left shit and left mouse button, then drag a box over the map. 
This will select any units within the box.
## Hot Groups
You can select unit(s) and create a hot group with them by pressing left ctrl 
and a number along the top of your keyboard. You will then notice that number above the unit, 
and at the bottom of the screen, with the unit count in the hotgroup.

You can now press the number on your keyboard, or click the hotgroup icon at the 
bottom of the screen, to select the hotgroup units collectively.

You can create up to 9 hotgroups (1-9).
## Unit type
You can double left click a unit to select all units of that type visible on screen.

# Moving Units
In its simplest state, moving a unit is done by selecting the unit, 
then right clicking somewhere on the map to set a waypoint. 
You will then see a location marker icon appear, with a line connecting the icon to the unit.

![Moving unit](https://github.com/Pax1601/DCSOlympus/assets/91024799/d47bcb36-5f2d-458e-9102-9fcd49dcbb26)

At any time you can right click again and set another waypoint
## Multiple Waypoints
If you hold left ctrl and then right click in multiple locations you will see 
that you can create a series of waypoints. This creates a route for the unit.
![Multiple waypoints](https://github.com/Pax1601/DCSOlympus/assets/91024799/459862ee-c12d-4c20-8183-1e425dd7bae6)

## Changing Speed and Altitude
If you wish for the unit to change speed or altitude you can do so with the sliders 
in the unit info panel on the left. The unit will attempt to reach those parameters by the next waypoint.
If you want the unit to quickly reach those parameters, set the desired speed and altitude, then set a waypoint close 
to the unit.

You can also use the incremental change icons next to the unit info panel. 

![Incremental changes](https://github.com/Pax1601/DCSOlympus/assets/91024799/c64f9ec4-3e45-42ca-9bd2-bacf364598e3)

## Halt
The halt button, below the incremental speed and altitude buttons, 
will remove any orders the unit has and return it to an idle state as per the unit info panel

## AAR/RTB
The final button, below the halt button, is the AAR/RTB button. 
This will instruct the unit to proceed to the nearest AAR tanker, 
and if none are available the unit will return to the nearest friendly airbase.
Note that a unit that has landed at an airbase will not be able to take off again.
This is a DCS limitation.

## Follow Roads
For ground units, you have the option to instruct them to follow roads. 
This is a toggle switch on the unit information panel. Without this on, 
the unit will attempt to move in a straight line to the waypoint given. 
With this on the unit will proceed to the nearest road and follow a route via roadways, 
then exit the road if necessary to reach the waypoint given.

This function might cause issues in-game and might not work all the time.
The issues can include lag that can cause the server to crash. We believe this is due to the AI follow road task being so intensive. We recommend not performing this with large amounts of unit (15+) and/or over long distances.

![Follow roads](https://github.com/Pax1601/DCSOlympus/assets/91024799/4d451440-197a-4088-99a8-7b23614dfb45)

## Move in Formation
If you select several units and then hold the left shift key, 
you will see waypoint setting icons appear to match the formation of the 
units as they currently are. If you then right click you can set a move command in this formation.

The units will not attempt to maintain formation, this will just set waypoints 
that are arranged in the same shape the units currently are. Should one 
unit encounter an obstical or otherwise be delayed, the other units will 
not wait and the delayed unit will not attempt to catch up.

Additionally you can rotate this formation around it's centre by holding 
left shift and moving the mouse where you want them to go, then holding 
right click and dragging the pivot arm out. You can then move the mouse around 
the clicked point to pivot the formation of the final waypoints. Releasing right 
click will set the waypoints

![Move in formation](https://github.com/Pax1601/DCSOlympus/assets/91024799/a511f94c-d547-4140-8bd7-3456cbcf8761)
![Move in formation2](https://github.com/Pax1601/DCSOlympus/assets/91024799/609c7118-d505-42a8-9f09-029eb1b3ac0e)
![Pivot formation](https://github.com/Pax1601/DCSOlympus/assets/91024799/b432ad38-ea47-49e4-8888-ff7554074309)

## Following
Following instructs the unit to move with another unit at a set distance and angle.
This currently only works for air units.

You can access the follow command by selecting the unit you want to perform the follow.
Then holding right ctrl and right clicking on the unit you wish to be followed.
This will bring up the unit action menu. Select **Follow unit.**

![Unit action menu](https://github.com/Pax1601/DCSOlympus/assets/91024799/9b605a51-58e2-43d6-9e52-c66bf0e7a83b)

You will then see the follow menu. You can select on the premade options or create a custom one.
The unit will do it's best to get in that position. Bare in mind the relative performance of the aircraft, whether the follow aircraft can catch up etc. This may take longer to arrange than you think.

![Follow options](https://github.com/Pax1601/DCSOlympus/assets/91024799/46f06b34-e962-4658-bab9-8004601ed07c)

## Land
The land command works two ways. A rotary wing aircraft can be told to attempt to land anywhere.
With interesting results. You can do this by selecting such a unit and long right clicking somewhere.
You will see a menu pop up with one option being **land here**. 
Click this and the unit will attempt to land at that location.

![land here](https://github.com/Pax1601/DCSOlympus/assets/91024799/86f9b17e-c9ed-40eb-9808-c798d720f372)

All air units can be instructed to land at an airbase provided the airbase is either
friendly or neutral to them. <br /> Select the unit and control + right click on an airfield to 
bring up it's menu. Select **Land here**. The unit will commit to landing there as per 
the DCS AI rules. Usually this means flying to the airfield, then away for a distance, 
then making an approach.

![land here](https://github.com/Pax1601/DCSOlympus/assets/91024799/31296851-ce92-4cad-8971-623e9e34460a)

## Air to Air Refueling

An important feature of Olympus is the AAR (Air-to-Air Refueling), and this has 
been made easy.

1. To refuel an aircraft, we first need a tanker. 
You can spawn it using the default spawn menu. After spawning a tanker, select it and toggle "Enable Tanker" to on.

![Unit Menu](https://github.com/Pax1601/DCSOlympus/assets/55553527/bc0626dd-f016-4fb5-9678-6fd6632edceb)

2. Click on settings, and change the TACAN, Radio Frequency, 
and the Callsign as desired. (The Callsign doesn't work yet V1.0)

![Tanker Option](https://github.com/Pax1601/DCSOlympus/assets/55553527/99a2ad02-229b-4c99-905f-7e1c454cfd76)

3. Now, you can either use the F-10 commands if a player wants to refuel or
instruct an AI to refuel with the "Send to tanker" option in Olympus.

![Flight Options](https://github.com/Pax1601/DCSOlympus/assets/55553527/1009be0b-0d6c-49b5-b68e-504fb0863c74)

When the tanker is acting as a tanker, its icon will be displayed as a fuel 
nozzle. The AI aircraft that wants to refuel will have the icon of a fuel pump. 

![AAR Icons](https://github.com/Pax1601/DCSOlympus/assets/55553527/56b27c64-9f8d-4187-9bac-48dfa2cff6ba)

### Known AAR Issues

The AAR is still not perfect and has issues due to DCS limitations.

When giving the tanker new tasks such as:

- Setting a new waypoint
- Changing speed
- Changing altitude
- Landing

While refueling, the tanker will momentarily reset its task. 
This will cause it to reject any AI or player attempting to refuel at that 
moment. This means that the "inbound" communications menu command needs to be executed 
again by any players in the process. 
In addition, you will also have to instruct the tanker to resume its role 
as a tanker in Olympus.

When players are talking to the tanker via the communications menu commands, giving Olympus commands to the tanker can cause that tanker to
become unresponsive for a short period. 

# Firing and Combat

## Combat Ranges

Ground units have preset ranges defined, these ranges can be found in 
the Database Manager and serve different purposes.
More on the database manager later.

![Combat Rings](https://github.com/Pax1601/DCSOlympus/assets/55553527/b3d32354-899d-4b0c-b4e8-f07365fa00c1)

**Acquisition range: Outer Black Circle**

The range within which the unit detects hostiles.


**Engagement range: Inner White Circle**

The range within which the unit utilizes our simple Olympus targeting logic.
Uses DCS fire at point. 
(Low Probability of Kill).

**Aim method range:**

The range within which the unit engages hostiles using an improved and 
longer ranged DCS targeting system (Medium Probability of Kill).

**Targeting range:**

The range within which the unit utilizes the normal DCS engagement logic,
only when using the small scatter option. 
(High Probability of Kill).
 
## Attacking

There are multiple ways in which a unit can attack or engage units. In this section, 
we'll take a look at the ground units and aircraft attack modes.

### Ground Units

When a ground unit is selected, you can long press the right-mouse button over location or point you'd like to 
target and then you'll then be able to see the three options. This must bare ground and not another unit.


#### Targeting a point or area

![Targeting Area](https://github.com/Pax1601/DCSOlympus/assets/55553527/cb5e6cc2-cf3c-47e1-8a8f-f7f5a3f2d02c)

- **Group ground units:** Groups the units in Olympus. When grouped, you can give a command to only one unit, 
and the all grouped units will follow it.

- **Fire at area:** Fires at a point using the DCS logic to hit the designated point. Laser accurate.

- **Simulate fire fight:** Uses Olympus logic to simulate a firefight, where the unit shoots small arms fire within the two displayed brackets.

![Simulate Fire Fight](https://github.com/Pax1601/DCSOlympus/assets/55553527/5d0c7ead-ab1d-460e-9fa4-b127436e8fdf)

For the **Simulate fire fight**, additional options can be selected.

![Simulate Fire Fight scatter](https://github.com/Pax1601/DCSOlympus/assets/55553527/2201eaa5-17fd-4815-adc3-2ccc4958fd8d)

The **Shots scatter** dictates how big the angle within the brackets should be, and the  **Shots intensity** dictates how 
many times the unit fires within a given time period.

#### Targeting a unit 

With a unit selected, and ctrl+right clicking on another unit, additional options become available. You can also access these options by ctrl+right clicking on the unit itself.

![Target Options](https://github.com/Pax1601/DCSOlympus/assets/55553527/c0e5f97f-fa6a-46c3-bcf3-4ae28a9dfc08)

Group ground units is the same as above.

- **Attack unit:** Utilizes DCS targeting logic to engage the target.

Both AAA options are only available with units that can act as AAA (mainly vehicles with guns of 30mm calibre and smaller), and these two options only work for neutral units. 
A neutral unit can act as part of the red or blue coalition.

- **Scenic AAA:**  Fires into the air when no target aircraft is present and will start to aim if the aircraft approaches. 
(Used for cinematic effects)

- **Dynamic accuracy AAA:** Fires at the closest hostile aircraft but doesn't aim precisely.

- **Center map:** Centers the target in the middle of the screen/Olympus client.

### Aircraft

Aircraft also have two engagement modes: one for Air-to-Air (A/A) and another for Air-to-Ground (A/G).

#### Air-to-Air Engagement

![air to air](https://github.com/Pax1601/DCSOlympus/assets/55553527/815acbdc-cace-463c-940a-104b8c59c42a)

- **Attack unit:** Engages the unit using DCS engagement logic (e.g., Fox 3 from afar, Fox 2 and guns from close range).

- **Follow unit:** Refer to the [Following](#following) section.

- **Refuel:** Refer to the [AAR/RTB](#aarrtb) or [Air to Air Refueling](#air-to-air-refueling) section.

- **Center map:** Refer to the previous chapter.

#### Air-to-Ground Engagement

If you target a unit on the ground, you'll get the same options as when attacking an aircraft. 
You'll also get an additional option to Group Ground Units.

However, if you decide to attack an area or point on the map, such as a static object, you get two options.

![air to ground](https://github.com/Pax1601/DCSOlympus/assets/55553527/a6355dd6-34d2-4156-b9d6-a8b568fa9954)

- **Precision bombing:** Bombs the point selected by the cursor using DCS bombing logic. Usually one bomb.

- **Carpet bombing:** Carpet bombs the point or area selected by the cursor using DCS carpet bombing logic.

There is currently an issue with carpet bombing. If the bombers are within the same flight, 
only the first bomber will carpet/bomb the target. A workaround is to spawn the bombers in separate flights; 
this will bypass the issue.

### Unit Active State

A unit can be in one of two states: active or inactive.

Active units function as normal, meaning they can perform tasks and detect what is happening around them. If a unit is inactive, the AI controlling the unit will be dormant and ignore everything happening until the unit is activated again. This feature is applicable only to surface units, including ships.

You can toggle the active state of a unit in the unit control page.

![active unit](https://github.com/Pax1601/DCSOlympus/assets/55553527/f7cb4614-e6fd-424a-86be-740193a7198b)

# Polygon Draw Mode
## Creating a Polygon
This mode is used to draw a polygon onto the map, which can either be left as a polygon or used to indicate an area to populate with air defense.

Access this mode with a right click on an empty portion of the map to bring up the create unit menu, and the select the plus symbol.

![Spawn Menu Plus](https://github.com/Pax1601/DCSOlympus/assets/91024799/87899d48-c7f1-47b9-bd22-26d28c70aa14)

This will open a lower menu, the right most icon of which is the polygon draw mode. Select this. Your cursor will become a pen icon.

![Polygon Cursor](https://github.com/Pax1601/DCSOlympus/assets/91024799/41609408-fedb-4c94-9c1a-2ecccc1c0154)

Your next left click with place a point that becomes a corner on the polygon. Each succesive click adds another corner.

![Polygon Draw](https://github.com/Pax1601/DCSOlympus/assets/91024799/66d79c98-15da-4456-abe0-da434a69b90d)

Right click when you have finished drawing your polygon.

## Editing a Polygon
Right click on the polygon to bring up a unit menu with a pen icon. Select the pen icon to enter edit mode

![Polygon Edit](https://github.com/Pax1601/DCSOlympus/assets/91024799/36f63bbb-17f4-4532-bc10-3d7096babfd4)

The large white circles on the corners can be dragged around with the left mouse button. <br> The small white circles on the edges on the polygon can be left clicked to transform them into corners.

## IADS Creation

The IADS creation tool will use your selected criteria to populate the land under the polygon with an air defence system. 

**This system is meant for larger areas. Think 40nm<sup>2</sup> areas or greater. It will also focus these around built up areas and airbases.**

While in polygon edit mode, right click within the polgyon to open the IADS creation menu. 
<br> The coalition toggle in the top left will define the coalition the spawn air defence will take (This is done after having the polygon already drawn).
<br>You can use the drop down menus to filter the types of air defence units you wish to include in the IADS spawn.
<br> The IADS Density slider will control how many units you will create. The higher the slider the more units.
<br> The IADS Distribution slider will control how clumped together the units will be. The higher the slider the less clumped together.
<br>The Force Coalition checkbox will control whether or not the units you spawn will be from all countries, or just the countries chosen in with the coalition toggle. Checking the box will enforce only units from those countries.

Select the Add Units button when complete to command Olympus to create the units. Depending on the size of the polygon this make take a minute or two. 


![IADS 1](https://github.com/Pax1601/DCSOlympus/assets/91024799/129659b0-f815-456a-b037-63bf8089324a)

# RTS Mode

You can sign into Olympus in one of three roles:

- Game Master
- Blue Commander
- Red Commander

The Game Master can set up the rules of the RTS mode and can see and control all units, regardless of coalition.

Both Blue and Red Commanders can only control their respective units and can only see hostile units if their own units detect them.

The RTS Mode is still not fully fleshed out and developed and will face major changes at a later date; smaller functions still 
need to be written and updated.

## Game Master Rules

As the Game Master, you have the ability to set rules. These rules can be found under "Game Master Settings."

![Game master setting](https://github.com/Pax1601/DCSOlympus/assets/55553527/6b32badd-8355-42d3-8e5d-d2b02de33abf)

Once you open the settings, this window will appear.

![Inside of game master settings](https://github.com/Pax1601/DCSOlympus/assets/55553527/4149fcbf-59f7-448b-8622-78a061f27a6b)

- **Restrict spawns:** The name may be misleading; this box has to be enabled for the latter settings to be applied.

- **Restrict units to coalition:** Disables the ability to spawn Redfor units for the Blue Coalition and vice versa.

- **Setup time:** The time during which coalition commanders can prepare the units in the air and on the ground until the spawn 
is restricted. For example, you can only spawn aircraft at airbases.

- **Available eras:** Only allows spawning units of a specific era.
  - Early Cold War
  - Mid Cold War
  - Late Cold War
  - Modern
  - WW2

- **Color Spawn point:** Currency for spawning units for each coalition.

The spawn point can be customized in the Database Manager and should be changed.

Once you press apply, the changes should then be applied.

As the blue or red commander you'd be able to see this

![blue coalition cost](https://github.com/Pax1601/DCSOlympus/assets/55553527/1b16f1b8-3dff-45c8-b076-0379ff88414f)

And as you spawn units, you also be able to see the cost.

![blue unit cost](https://github.com/Pax1601/DCSOlympus/assets/55553527/3db5db72-a987-4262-badb-2177bbfbff2b)

# DatabaseManager

The DatabaseManager is a part of Olympus that manages the units and their data and information, such as loadouts.

The DatabaseManager can be found under Main Menu.

![Main Menu](https://github.com/Pax1601/DCSOlympus/assets/55553527/75823f57-f6c4-4ce0-94c6-49b8981db52e)

The DatabaseManager consists of 4 databases:

- Aircraft Database
- Helicopter Database
- Ground Unit Database
- Navy Unit Database

Units are not saved in a Database directly, but in separate JSON files. These JSON files can be found at the following URLs:

- **https://SERVER_IP:3000/databases/units/AircraftDatabase.json** For aircraft
- **https://SERVER_IP:3000/databases/units/HelicopterDatabase.json** For helicopter
- **https://SERVER_IP:3000/databases/units/GroundUnitDatabase.json** For ground units
- **https://SERVER_IP:3000/databases/units/NavyUnitDatabase.json** For navy units

Let's take a look at how the DatabaseManager functions for different types and how to add new units.

## Aircraft and Helicopter Database

The aircraft and helicopter databases function the same way, as both have the same option and both are unit types with loadouts.

The loadouts are retrieved using a Python file that takes them straight from their manifest/location where they're defined.

![Aircraft Database](https://github.com/Pax1601/DCSOlympus/assets/55553527/89744d91-1d31-49cc-b99e-741ca5d583fc)

- **Unit List:** A list of all the units currently in the database.

- **Check Box:** The checkbox next to the name in the Units Lists enables or disables units to be used in Olympus

- **Name:** The name used to reference units between Olympus and DCS.

- **Label:** The label displayed in Olympus; this can be changed as desired.

- **Short label:** The label displayed on the icon once the unit is spawned.

- **Coalition:** The unit's coalition. This is used for the RTS Rule, allowing only the blue or red commander to spawn their
respective units.

- **Era:** The era when the unit is used. This is also used for the RTS Rule, where the blue and red commanders can only spawn units
from certain eras.

- **Filename:** The icon of the unit used in the spawn menu. The images are saved under 
**DCS.openbeta\Mods\Services\Olympus\client\public\images\units**.

- **Cost:**  The cost of the unit, also used for the RTS Rule.

- **Can target point:**  Allows the units to precision bomb a point or area.

- **Description:** The description of the unit; this will also be displayed in the spawn menu.

- **Tags:** Tags for the unit; these will also be displayed in the spawn menu.

- **Loadouts:** The place where the loadouts are defined.

When you click on a loadout, the **Loadout properties** will appear.

### Loadout properties

- **Name:** The name of the loadout displayed in Olympus.

- **Code:** A reference to the DCS payloads.

- **Roles:** The role for the current loadout.

- **Name** and **Quantity**: "Name" corresponds to the payload, and "Quantity" to how many of that type you carry.

## Ground Unit Database

The Ground Unit Database lacks the loadout options found in the Aircraft and Helicopter Databases, but it includes other features.

![Ground Unit Database](https://github.com/Pax1601/DCSOlympus/assets/55553527/177cc6d1-0f07-49bb-b988-5ccd97f050be)

The parameters up to  **Acquisition range [m]** are the same as in the Aircraft and Helicopter Databases.

- **Acquisition range [m]:** The distance within which the unit can detect hostiles.

- **Engagement range [m]:** The distance within which the unit engages targets using our simple Olympus targeting logic. 
It utilizes the DCS fire-at-point feature.

- **Aim method range [m]:** The range within which the unit engages hostiles using a improved and 
loger range DCS targeting system.

- **Targeting range [m]:** The range within which the unit utilizes the normal DCS engagement logic,
only when using the small scatter option. 

- **Barrel height [m]:** The height of a gun or tank barrel, used in calculating the Olympus Simulate Fire Fight logic.

- **Muzzle velocity [m/s]:** The muzzle velocity of small arms, including those mounted on tanks and APCs.

- **Aim time[s]:** The time it takes for a ground unit to aim.

- **Shots to fire:** The number of shots fired before a brief pause.

- **Shots base interval[s]:** The duration of the brief pause between shots.

- **Shots base scatter[*]:** The angle of scatter.

- **Alertness time constant[s]:** The time it takes for the unit to become active after detecting a hostile unit.

- **Can target point:** Allows the unit to target a specific point, such as for artillery strikes.

- **Can rearm:** Enables a unit to rearm if its ammunition is depleted.

- **Can operate as AAA:** Allows the unit to engage aircraft.

- **Indirect fire (e.g. mortar):** Enables the unit to conduct indirect fire, useful for simulating firefights.

- **Description:** Similar to the aircraft database.

- **Tags:** Similar to the aircraft database.

- **Marker file:** The icon displayed on ground units once spawned.

## Navy Unit Database

The naval aspect is the least modified in Olympus as of the release. Currently, the options are similar to those for ground units, but barrel height and muzzle velocity do not apply here.

![Navy Units Database](https://github.com/Pax1601/DCSOlympus/assets/55553527/3711ef3f-086e-44f8-a8b2-3d96888b77cc)

## Adding Mods to the Database

We enable users to add mods to all unit categories in Olympus.

The process for adding these mods will vary.

For all mods, they must already be installed on the server, or on your machine if you're running Olympus locally.

### Adding Ground/Navy Unit Mods

Adding Ground and/or Navy Units is relatively straightforward.

In this example, we will add the mod for the WW2 Zuikaku Japanese Aircraft Carrier to the Navy Unit Database.

1. Find the reference ID/Name for the Mod. The easiest way is to go into the DCS Mission Editor and locate the unit there.

![Mission Editor Zuikaku](https://github.com/Pax1601/DCSOlympus/assets/55553527/ac6b4f7c-9353-41a2-930a-9b37a0711a9a)

2. Navigate to the corresponding Database, enter the ID/Name in the 'Add' field, and click "Add."

![Unit List Zuikaku](https://github.com/Pax1601/DCSOlympus/assets/55553527/b590e769-6383-4e37-8651-bbfb90f31807)

3. Once the unit is added, fill in all the required information. For the type, refer to the [Unit List](#roles).

![Unit Properties Zuikaku](https://github.com/Pax1601/DCSOlympus/assets/55553527/4dfb4605-b2f3-4943-bd4b-486421e9b865)

4. After entering the information, click "Save" and refresh your browser.

![Save Button](https://github.com/Pax1601/DCSOlympus/assets/55553527/1234138a-585c-4052-add5-02f70315a15a)

5. Attempt to spawn the unit in the game. If the previous steps were correctly followed, 
you should be able to find and spawn the unit successfully.

![Create Zuikaku](https://github.com/Pax1601/DCSOlympus/assets/55553527/18c58c20-ba7e-4810-bc4b-dd7f31b119af)

### Adding Aircraft Mods

**Before editing any Olympus files, we strongly recommend that you back them up.**

This is a little more complicated due to the need to add loadouts. We strongly suggest that you do not attempt this unless if you are familiar with both using .json and .lua files to store and access data, or are otherwise proficient in at least one programming language.

1. Create a mission file with the aircraft in question. Let's use the popular and excellent A-4 as the example. Make sure to name it something that you can find with CTRL+F.

![Add A4 Skyhawk in Mission Editor](https://github.com/Pax1601/DCSOlympus/assets/131475927/3a50e780-ea8d-4dc8-b93c-8cdc2b8717fe)

2. Give it a loadout you want to add. It does not need to be a default loadout.

![Select Loadout](https://github.com/Pax1601/DCSOlympus/assets/131475927/60ea8070-aa4b-4d55-b346-b33e4f5319fc)

3. Open up the .miz file with 7zip. The file should be located in [DCS Installation Drive]:\Users\[Your Username]\Saved Games\DCS.openbeta\Missions

![miz file archive](https://github.com/Pax1601/DCSOlympus/assets/131475927/a15bf081-0786-419b-a7b1-0ef25260ade2)

4. Open up the mission file in the .miz file in a text editor and use CTRL+F to search for the aircraft you spawned using the Mission Editor.

![Text editor a4](https://github.com/Pax1601/DCSOlympus/assets/131475927/497bb3f4-2c0a-41f4-ab19-6e6b3ea5b225)

5. Go to the following file in your Olympus install: [DCS Installation Drive]:\Users\[Your Username]\Saved Games\DCS.openbeta\Mods\Services\Olympus\Scripts\unitPayloads.lua. 

Note the structure of how aircraft + payloads are stored. This file is where the loadouts get pulled from.

![Unitpayloads.lua](https://github.com/Pax1601/DCSOlympus/assets/131475927/fc4d5dc8-b36b-49a1-b4d0-3d8b7143f9d5)

6. Go to the bottom of the file, and add the loadout. Note the structure:

["Aircraft Name"]={["Name of Loadout"]={[1] = {["CLSID"]="{LAU3_FFAR_MK1HE}"},
 [2] = {["CLSID"]="{LAU3_FFAR_MK1HE}"},
 [3] = {["CLSID"]="{DFT-300gal}"},
 [4] = {["CLSID"]="{LAU3_FFAR_MK1HE}"},
 [5] = {["CLSID"]="{LAU3_FFAR_MK1HE}"}}},

The parts in the curly braces after the {["Name of Loadout"]} (the payload CLSIDs) - You need to get that from the .miz file as shown at step 4 above. The Aircraft Name MUST BE IDENTICAL to the ["Type"] in the .miz file. The added loadout should look like so:

![Add payload](https://github.com/Pax1601/DCSOlympus/assets/131475927/1ad2dc8e-bc4e-47ed-ad35-87945b91ab92)

7. Launch the Mission and open up Olympus, and like with ground units, open up the database manager, and add the unit using the exact name as what you found in the .miz file:

![Add A-4 in database manager](https://github.com/Pax1601/DCSOlympus/assets/131475927/aee0c6f6-d847-4756-a3c4-db7f00e8f97f)

8. Enter the unit details:

![A-4 Details](https://github.com/Pax1601/DCSOlympus/assets/131475927/d9e549e5-8d9d-4177-8262-40554ccc1fb9)

9. Go to [DCS Install Drive]:\Users\[Your Username]\Saved Games\DCS.openbeta\Mods\Services\Olympus\client\public\databases\units\aircraftdatabase.json and open it in a text editor. Search for your newly added aircraft, it should look like this:

![A-4 in aircraftdatabase.json](https://github.com/Pax1601/DCSOlympus/assets/131475927/c6321aed-eee4-4a5c-9f2a-09cc70c7b22c)

10. Add your loadout. The code MUST MATCH the name of loadout in unitpayloads.lua, as that is what is looked up to determine the loadout, like so:

![A-4 Added Loadout](https://github.com/Pax1601/DCSOlympus/assets/131475927/9de5570b-c9b7-4d36-abf7-a84244427507)

The payload listed under "items" does not affect what is actually on the aircraft. It is there to present to the user what weapons are loaded on the aircraft. The authoritative source on what is actually going to be on that aircraft is the payload that shares the name with what you entered under "code" in unitpayloads.lua. If there is no such loadout in unitpayloads.lua, the aircraft will spawn with no loadout.

You should now be able to spawn your aircraft mod with some weapons on it!

We recommend that you **SAVE** your modified unitpayloads.lua and aircraftdatabase.json files as Olympus updates **MAY** overwrite these. 














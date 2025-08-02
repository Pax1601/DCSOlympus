# Important notice

The latest DCS update (DCS 2.9.18.12722) introduces a new "permission" system for mods and mission scripts. You can find more info [here](https://forum.dcs.world/topic/376636-changes-to-the-behaviour-of-netdostring_in/ )
This will improve security and modularity but by default blocks Olympus and many other similar mods.

To reallow Olympus, follow these steps for every DCS instance you have installed on your system:

1) create a text file named Saved Games\DCS\Config\autoexec.cfg. The file extension .cfg is very important, make sure it is correctly set;
2) using Notepad or any similar text editor, write this content into autoexec.cfg and save:

```
if not net then net = {} end
net.allow_unsafe_api = {  -- this defines the secure zones where net.dostring_in() can be called from
  "userhooks",
}
net.allow_dostring_in = { -- and this defines the zones that should be addressed from net.dostring_in()
  "server",
}
```

That's all! Other mods/scripts may require you to further edit this file. Please refer to their specific instructions, and make sure to only enable the minimum set of permissions required by the mods you use.


# Welcome to DCS Olympus' Wiki!

Here you will find all up-to-date information about DCS Olympus.

<img src="https://github.com/Pax1601/DCSOlympus/assets/7738284/0744a6d3-ff01-4e3c-a2e2-8a92f45913fe" align="right" height="240"/>

### User guides
* [User guide](https://github.com/Pax1601/DCSOlympus/wiki/2.-User-Guide)
* [New user FAQs](https://github.com/Pax1601/DCSOlympus/wiki/3.-New-User-FAQs)

### Join in the discussion

<img align="left" width="30" src="https://github.com/Pax1601/DCSOlympus/assets/103559271/0ecff279-a87c-4e2d-a4c7-da98c74adf38" />

[**Join our Discord**](https://discord.gg/kNAQkhUHnQ)

# Quick install instructions

To learn how to install DCS Olympus please **carefully** read the instructions [here](https://github.com/Pax1601/DCSOlympus/wiki#installation-guide).

The **mandatory** steps are summarized as follows:

1. **Completely uninstall v1.0.3**, depending on your original installation method as described [in section 1.2](https://github.com/Pax1601/DCSOlympus/wiki#12-removing-v103);
2. **Remove your url reservation** using the `netsh delete` command as described [in paragraph 1.2.3](https://github.com/Pax1601/DCSOlympus/wiki#123-removing-the-net-shell-netsh-rule);
3. Download the manager version of DCS Olympus from here [DCSOlympus_v1.0.4_manager.zip](https://github.com/Pax1601/DCSOlympus/releases/download/v1.0.4/DCSOlympus_v1.0.4_manager.zip);
4. Unzip the file from the step above in your **Documents** folder;
5. In the folder you just created, execute the **installer.bat** file by double-clicking on it;
6. Follow the manager instructions as described [in section 2.4](https://github.com/Pax1601/DCSOlympus/wiki#24-run-the-olympus-manager).
7. Enjoy!

# Installation guide

A full video of this process [is available on YouTube](https://www.youtube.com/watch?v=5y7ZgRrO6Fs).

**If you have already installed v1.0.3, you must uninstall it first - see 1.0**, and *then* install 1.0.4.

If you’ve never installed Olympus before, then you can go to [2.0]. 


## [1.0] Uninstalling Olympus v1.0.3

### [1.1] Checking your units' databases
If you didn't change anything in your units databases then don't worry there is nothing to do in this step, skip ahead to the next section.

If you did make changes to the Olympus database, like adding units or mods you’ll want to make a copy of these so you don’t lose them.

For most people they live in your `Saved Games\DCS.openbeta\Mods\Services\Olympus\client\public\databases` folder

If you went really crazy and fully added some new planes, weapons and weapons loadouts make copies of any files you changed as well before we uninstall everything.

### [1.2] Removing v1.0.3
#### [1.2.1] Uninstallation method
There were two ways you could have installed v1.0.3.

A. If you installed via an installer, go to [1.2.2] Case A: Uninstalling 1.0.3 if you installed via an installer;

B. If you manually unzipped the files into the correct locations, go to [1.2.3] Case B Uninstalling 1.0.3 if you installed via a zip.

##### [1.2.2] Case A: Uninstalling 1.0.3 if you installed via an installer

You’ll need to remove it via Windows ‘installed apps’.

1. Open the Start Menu.
2. Click Settings, which looks like a cogwheel.
3. Click Apps.
4. Select Apps & features from the left-hand side menu.
5. Find the Olympus program in the list that appears.
6. Click the uninstall button that shows under the selected program or app.

If you didn’t see Olympus in your list and you were expecting it to, check very carefully before proceeding and/or consider if you maybe installed via the zip and forgot.

Once uninstalled go to [1.2.4] Removing the DCS Hooks and Scripts.

##### [1.2.3] Case B Uninstalling 1.0.3 if you installed via a zip

Olympus needs to be removed from your DCS ‘Saved Games’ folder which most commonly is found in:

`\Users\[user]\Saved Games\DCS.openbeta\Mods\Services\Olympus`

1. Remove this Olympus folder and its contents.

**Note:** The folder name and location can vary.  It needs to be correct for your system.  If you installed to a custom folder location, go there instead.

2. Check your `\Users\[user]\Saved Games\` folder.
3. Remove any duplicate folders related to Olympus if they exist here.

Once uninstalled, go to [1.2.4] Removing the DCS Hooks and Scripts

**Note:** If you installed Olympus on multiple DCS instances you will obviously have to do this step for each instance. 

### [1.2.4] Removing the DCS Hooks and Scripts
In case something went wrong during the uninstall process, we need to remove the Olympus Hook. To do this, navigate to:

`\Users\[user]\Saved Games\DCS.openbeta\Scripts\Hooks\`

You *may* have a file called ‘OlympusHook.lua’, delete this file and *only this file*.

Once done go to [1.2.3] Removing the net shell (netsh) rule.

### [1.2.3] Removing the net shell (netsh) rule
People who setup Olympus to be accessible from other machines - e.g. people using Olympus on a server, or PC acting like a server - will probably have setup a `netsh` rule. We’ve removed the requirement for this in v1.0.4, so let's tidy this up to allow Olympus to work properly and for security.

The best way to check is to open up ‘command prompt’ and enter:

`netsh http show urlacl`

You are going to see a lot of results. You are looking for things ‘Olympus related’, e.g. you may have a rule, or similar rules, which say:

`http://*:3001/olympus user=OlympusUser`

where **3001** may have a different value and **OlympusUser** will be your user.

If you see any, you should remove them using the following command:

`netsh http delete urlacl url="http://*:3001/olympus/"`

Take care to ensure you replace the relevant text with what it should say for your entry.

If you got this far, you have successfully removed Olympus v1.0.3 from your system.

## [2.0] Installing Olympus v1.0.4
**If you have jumped ahead and you haven’t already uninstalled Olympus 1.0.3, you must go back and remove it first.  Do not skip this step, otherwise... Well you’ve been warned.**

There is also a video showing you this same information which is probably a lot easier to follow, [youtube link] though this guide has a little extra information within it for more niche setups.

### [2.1] Downloading the manager

Go to the Github page and take a look at the [releases page](https://github.com/Pax1601/DCSOlympus/releases) and download the ‘manager’ version if you want to install Olympus on either your own machine or as a server.

Ignore the archive version, which is for a tiny, tiny, subset of people who automatically deploy Olympus - who shouldn’t need instructions to know what to do with it, so there aren’t any.

### [2.2] Extracting the manager

**DO NOT extract the download into your DCS Saved games folder or your actual DCS install**, that isn’t where it should go.

Find a suitable location for the file on your computer.  We recommend making a folder inside your Downloads folder, but it can be extracted anywhere really.

Once you’ve done that, take a look at the extracted files and locate the `installer.bat` script. Note, there is another filed called `install` inside the Manager folders, ignore it.

### [2.3] The installer script

Run the script by double clicking on it and follow the relevant prompts.  *Read, don't just click blindly.*   You might be keen to see this new version but you may ruin things for yourself by skipping ahead too quickly.

The install will download a few prerequisites automatically, such as Node and the Olympus application. **This might take some time**, depending on your internet connection and whether you already had any of the prerequisites.  Don’t worry if you didn’t have all the pre-requisites as the installer script will get them for you - it just takes a little longer.

### [2.4] Run the Olympus Manager

#### [2.4.1] How the manager is set up

Before we get to the manager, it is useful to understand how Olympus is set up.

Each computer with DCS installed on it has an *instance* of DCS.  Most users will have only one instance, which is the one they load when running DCS.  Some server owners run two DCS servers from one machine: e.g. they have "DCS Server 1" and "DCS Server 2" but these are installed in two different folders on that same machine.

DCS Olympus now works by having the central manager application, which manages each instance of DCS.  So, in the case where a server owner runs two servers on one machine, they will have two instances in their manager, allowing them to do things like set ports and passwords independently on each instance.  Again, most people will have only one instance and this is expected.

There are also some core important changes to how Olympus works now, so you shouldn’t need to ever run DCS as an admin for Olympus to work or do local firewall exceptions to use it on just your PC.

To install an ‘Olympus instance’, either run the shortcut on your desktop or find it and run it from within the relevant Olympus folder you made earlier.

Once that opens up, you’ll see a bunch of useful things, like User and Troubleshooting guides.

### [2.4.2] Basic or Expert Mode

We call the default install mode ‘Basic mode’ but there is nothing basic about it - it just means it’s ‘easy’ to use.  In fact, it’s what we use to install Olympus ourselves. The eagle-eyed will have noticed there is also an ‘Expert mode’ for those who need to fettle more.  This isn’t a challenge or a fun hard game mode, it just doesn’t guide you through things logically and makes it easier to pick the wrong settings. Expert mode is primarily for managing complicated setups.

So let's keep going with basic mode.  Click ‘Add Olympus’.

### [2.4.3] Detecting DCS Saved Games Folders

The manager will detect where your DCS Saved Games folders are and give you the option to install to them.  Naturally, you should pick the folder into which you want to install it. Most people likely have just one folder and not be given a choice. If you do later try install again over this folder, it’s like a factory reset of the install.

### [2.4.4] Singleplayer Olympus or multiplayer

All this really means is do you want to only use and control Olympus from this computer, if you do pick Singleplayer.

If you want others to be able to control this instance of Olympus from other computers - including other devices - pick Multiplayer.

You can always reinstall again if you change your mind.

### [2.4.5] Set port and address settings

We can now set these port settings for you, or if you want to pick different defaults, you can do that instead.

We recommend you pick ‘Auto apply settings’ and click Next.

However, by choosing Manually set the next screen will give you options to pick manually a frontend or backend port.

### [2.4.6] Manually setting Olympus port and address settings

**If you picked ‘Auto apply settings’, go to [2.4.7] Pick some passwords.**

You will be prompted to pick ports for the front and backend port.  The green tick indicates this port is *probably* free for use and not taken by another running process or Olympus instance. Note: you might have to click on the screen to see this update.

However, if a port isn't in use because the application which uses it isn't running currently, it may cause issues when it does. If you have any problems, just come back here and pick a free port.

**Leave the option unchecked** for ‘Enable direct backend API connection’ it’s no longer needed for Olympus unless you are doing some real niche custom modding things, we’ll probably tell you in Discord if you should enable this otherwise leave it unchecked.

### [2.4.7] Pick some passwords

This step is so obvious, I don’t think we are going to tell you how to do this. 

Remember to pick secure, long, passwords if you will be using this over the internet and not just on your PC. [Obligatory XKCD](https://xkcd.com/936/)

All passwords must also be different within each instance.

If you have Olympus already installed, with chosen passwords, you can click Next to keep the same passwords.

### [2.4.8] Install the new camera control plugin

We’ve got a new camera control plugin which lets you move the DCS camera around in missions to wherever you are looking within DCS, which is really neat.

Obviously, we recommend you install this because it’s cool but here you get the option if you don’t want to.

Importantly, **if you want to use the camera control functionality**, even with other people’s Olympus servers or machines, **you’ll need to install the plugin for yourself** by saying install here as it connects to your local DCS.  This isn’t a server-side thing.

For more information on the camera plugin, including troubleshooting and removal of the plugin, see [2.0] Live Camera Plugin on [4. Setup FAQ and Troubleshooting](https://github.com/Pax1601/DCSOlympus/wiki/4.-Setup-FAQ-and-Troubleshooting).

### [2.4.9] Allow GitHub’s Electron

You *might* get a prompt to Allow Electron to run - but not everyone will.  It’s something we use to build Olympus.  Electron is made by GitHub, which you can have a read about on the internet.

If you see the prompt, click ‘Allow’ and you will finish your Olympus install.

## [3.0] Enjoy Olympus

### [3.1] Getting a mission running

Okay, hopefully that worked for you and you can launch Olympus.  Follow the instructions on screen. You don’t need the manager open to run Olympus with DCS.

Remember: to load up a mission and **remember to unpause the game/server** or Olympus can’t do anything!

### [3.2] Change settings / uninstall Olympus

Once you’ve installed an Olympus instance, you’ll see it listed here.  Clicking ‘Edit Settings’ will walk you back through the wizard again to amend the relevant settings. You can also see ‘Open logs’ that will open the two logs people need to help troubleshoot issues.

It may appear that only one log window has been opened, but sometimes one log window sits over the other, so move the one you can see in case it's hiding the second.

You can also uninstall that specific Olympus instance as well.  This doesn’t remove every instance of Olympus from your machine, just that specific one.  If you want to remove them all you’ll have to repeat this process for each installed instance.

## [4.0] Troubleshooting and further steps

If you do have problems, or want to change any settings, you can ‘Return to the main window’ and instead click ‘Change settings’. This is also how you find the super important logs you must share with us if you want help from people in our [DCS Olympus Development Discord server](https://discord.gg/tuDd94xC4A). See the #troubleshooting channel.
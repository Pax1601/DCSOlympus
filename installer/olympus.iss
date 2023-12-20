#define version "{{OLYMPUS_VERSION_NUMBER}}.{{OLYMPUS_COMMIT_HASH}}"

[Setup] 
AppName=DCS Olympus 
AppVerName=DCS Olympus {#version}
DefaultDirName={usersavedgames}\DCS Olympus
DefaultGroupName=DCSOlympus  
OutputBaseFilename=DCSOlympus_{#version}
UninstallFilesDir={app}
SetupIconFile="..\img\olympus.ico"
DirExistsWarning=no
AppendDefaultDirName=no
LicenseFile="..\LEGAL.txt"
PrivilegesRequired=lowest

[Messages]
WizardSelectDir=Select the location of DCS's Saved Games folder
SelectDirDesc=Where is DCS's Saved Games folder?
SelectDirLabel3=DCS Olympus must be installed within DCS's Saved Games folder.
SelectDirBrowseLabel=This is the detected path. If this is incorrect, click Browse to set the correct folder. 
  
[Tasks] 
Name: "desktopicon"; Description: "Create desktop shortcut"; GroupDescription: "Additional icons"; Flags: unchecked
Name: "installmodules"; Description: "Install node.js modules"; GroupDescription: "Dependencies";

[Files] 
Source: "..\olympus.json"; DestDir: "{app}";

Source: "..\scripts\OlympusHook.lua"; DestDir: "{app}\Scripts"; Flags: ignoreversion 
Source: "..\scripts\OlympusCommand.lua"; DestDir: "{app}\mod\scripts"; Flags: ignoreversion 
Source: "..\scripts\unitPayloads.lua"; DestDir: "{app}\mod\scripts"; Flags: ignoreversion
Source: "..\scripts\templates.lua"; DestDir: "{app}\mod\scripts"; Flags: ignoreversion 
Source: "..\scripts\mist.lua"; DestDir: "{app}\mod\scripts"; Flags: ignoreversion 
Source: "..\scripts\mods.lua"; DestDir: "{app}\mod\scripts"; Flags: ignoreversion 

Source: "..\mod\*"; DestDir: "{app}\mod"; Flags: ignoreversion recursesubdirs;
Source: "..\bin\*.dll"; DestDir: "{app}\mod\bin"; Flags: ignoreversion;
Source: "..\client\public\databases\*"; DestDir: "{app}\mod\databases"; Flags: ignoreversion recursesubdirs;

Source: "..\client\bin\*"; DestDir: "{app}\client\bin"; Flags: ignoreversion;
Source: "..\client\public\*"; DestDir: "{app}\client\public"; Flags: ignoreversion recursesubdirs;
Source: "..\client\routes\*"; DestDir: "{app}\client\routes"; Flags: ignoreversion recursesubdirs;
Source: "..\client\views\*"; DestDir: "{app}\client\views"; Flags: ignoreversion recursesubdirs;
Source: "..\client\app.js"; DestDir: "{app}\client"; Flags: ignoreversion;
Source: "..\client\demo.js"; DestDir: "{app}\client"; Flags: ignoreversion;
Source: "..\client\client.js"; DestDir: "{app}\client"; Flags: ignoreversion;
Source: "..\client\package.json"; DestDir: "{app}\client"; Flags: ignoreversion;
Source: "..\client\configurator.js"; DestDir: "{app}\client"; Flags: ignoreversion;
Source: "..\client\install.bat"; DestDir: "{app}\client"; Flags: ignoreversion;
Source: "..\client\*.vbs"; DestDir: "{app}\client"; Flags: ignoreversion;

Source: "..\manager\icons\*"; DestDir: "{app}\manager\icons"; Flags: ignoreversion;
Source: "..\manager\ejs\*"; DestDir: "{app}\manager\ejs"; Flags: ignoreversion;
Source: "..\manager\javascripts\*"; DestDir: "{app}\manager\javascripts"; Flags: ignoreversion;
Source: "..\manager\stylesheets\*"; DestDir: "{app}\manager\stylesheets"; Flags: ignoreversion;
Source: "..\manager\*"; DestDir: "{app}\manager"; Flags: ignoreversion;

Source: "..\img\olympus.ico"; DestDir: "{app}\img"; Flags: ignoreversion;
Source: "..\img\olympus_server.ico"; DestDir: "{app}\img"; Flags: ignoreversion;
Source: "..\img\olympus_configurator.ico"; DestDir: "{app}\img"; Flags: ignoreversion;
Source: "..\img\configurator_logo.png"; DestDir: "{app}\img"; Flags: ignoreversion;
Source: "..\img\OlympusLogoFinal_4k.png"; DestDir: "{app}\img"; Flags: ignoreversion;

Source: "..\LEGAL.txt"; DestDir: "{app}"; Flags: ignoreversion;                  

[Run]
Filename: "{app}\client\install.bat"; Description: "Installing node.js modules, this may take some time..."; Tasks: installmodules;
Filename: "{app}\manager\install.bat"; Description: "Installing node.js modules, this may take some time..."; Tasks: installmodules;
Filename: "{app}\manager\manager.vbs"; WorkingDir: "{app}\manager"; Description: "Launch the Olympus manager"; Flags: postinstall shellexec;

[Icons]
Name: "{userdesktop}\DCS Olympus Manager"; Filename: "{app}\manager\manager.vbs"; Tasks: desktopicon; IconFilename: "{app}\img\olympus_configurator.ico";
Name: "{app}\DCS Olympus Manager"; Filename: "{app}\manager\manager.vbs"; IconFilename: "{app}\img\olympus_configurator.ico"; 

[UninstallDelete]
Type: filesandordirs; Name: "{app}"


#define version "{{OLYMPUS_VERSION_NUMBER}}.{{OLYMPUS_COMMIT_HASH}}"

[Setup] 
AppName=DCS Olympus 
AppVerName=DCS Olympus {#version}
DefaultDirName={usersavedgames}\DCS.openbeta
DefaultGroupName=DCSOlympus  
OutputBaseFilename=DCSOlympus_{#version}
UninstallFilesDir={app}
SetupIconFile="..\img\olympus.ico"
DirExistsWarning=no
AppendDefaultDirName=no
LicenseFile="..\LEGAL.txt"

[Messages]
WizardSelectDir=Select the location of DCS's Saved Games folder
SelectDirDesc=Where is DCS's Saved Games folder?
SelectDirLabel3=DCS Olympus must be installed within DCS's Saved Games folder.
SelectDirBrowseLabel=This is the detected path. If this is incorrect, click Browse to set the correct folder. 
  
[Tasks] 
; NOTE: The following entry contains English phrases ("Create a desktop icon" and "Additional icons"). You are free to translate them into another language if required. 
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files] 
; NOTE: Don't use "Flags: ignoreversion" on any shared system files 
Source: "..\olympus.json"; DestDir: "{app}"; Flags: onlyifdoesntexist 

Source: "..\scripts\OlympusHook.lua"; DestDir: "{app}\Scripts"; Flags: ignoreversion 
Source: "..\scripts\OlympusCommand.lua"; DestDir: "{app}\Scripts"; Flags: ignoreversion 
Source: "..\scripts\unitPayloads.lua"; DestDir: "{app}\Scripts"; Flags: ignoreversion
Source: "..\scripts\templates.lua"; DestDir: "{app}\Scripts"; Flags: ignoreversion 
Source: "..\scripts\mist.lua"; DestDir: "{app}\Scripts"; Flags: ignoreversion 
Source: "..\scripts\mods.lua"; DestDir: "{app}\Scripts"; Flags: ignoreversion 

Source: "..\mod\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs;

Source: "..\bin\*.dll"; DestDir: "{app}\bin"; Flags: ignoreversion;

Source: "..\client\bin\*"; DestDir: "{app}\client\bin"; Flags: ignoreversion;
Source: "..\client\public\*"; DestDir: "{app}\client\public"; Flags: ignoreversion recursesubdirs;
Source: "..\client\routes\*"; DestDir: "{app}\client\routes"; Flags: ignoreversion recursesubdirs;
Source: "..\client\views\*"; DestDir: "{app}\client\views"; Flags: ignoreversion recursesubdirs;
Source: "..\client\app.js"; DestDir: "{app}\client"; Flags: ignoreversion;
Source: "..\client\demo.js"; DestDir: "{app}\client"; Flags: ignoreversion;
Source: "..\client\package.json"; DestDir: "{app}\client"; Flags: ignoreversion;
Source: "..\client\run_client.js"; DestDir: "{app}\client"; Flags: ignoreversion;

Source: "..\client\configurator.js"; DestDir: "{app}\client"; Flags: ignoreversion;
Source: "..\client\install.bat"; DestDir: "{app}\client"; Flags: ignoreversion;

Source: "..\img\olympus.ico"; DestDir: "{app}\img"; Flags: ignoreversion;
Source: "..\img\olympus_server.ico"; DestDir: "{app}\img"; Flags: ignoreversion;
Source: "..\img\olympus_configurator.ico"; DestDir: "{app}\img"; Flags: ignoreversion;
Source: "..\img\configurator_logo.png"; DestDir: "{app}\img"; Flags: ignoreversion;

Source: "..\LEGAL.txt"; DestDir: "{app}"; Flags: ignoreversion;

[Run]
Filename: "{app}\client\install.bat"; WorkingDir:"{app}\client"; Flags: runhidden; StatusMsg: "Installing node.js modules, this may take some time...";
Filename: "node.exe"; WorkingDir:"{app}\client"; Parameters: configurator.js -a {code:GetAddress} -c {code:GetClientPort} -b {code:GetBackendPort} -p {code:GetPassword} --bp {code:GetBluePassword} --rp {code:GetRedPassword}; Check: CheckCallConfigurator; Flags: runhidden; StatusMsg: "Applying configuration...";

[Icons]
Name: "{userdesktop}\DCS Olympus Client"; Filename: "node.exe"; WorkingDir:"{app}\client"; Tasks: desktopicon; IconFilename: "{app}\img\olympus.ico"; Check: CheckLocalInstall; Parameters: "run_client.js"; Flags: runminimized;
Name: "{app}\DCS Olympus Client"; Filename: "node.exe"; WorkingDir:"{app}\client"; IconFilename: "{app}\img\olympus.ico"; Check: CheckLocalInstall; Parameters: "run_client.js"; Flags: runminimized;

[UninstallDelete]
Type: filesandordirs; Name: "{app}"


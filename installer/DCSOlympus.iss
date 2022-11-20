[Setup] 
AppName=DCS Olympus 
AppVerName=DCS Olympus Alpha v0.0.1 
DefaultDirName={usersavedgames}\DCS.openbeta
DefaultGroupName=DCSOlympus  
OutputBaseFilename=DCSOlympus
  
[Tasks] 
; NOTE: The following entry contains English phrases ("Create a desktop icon" and "Additional icons"). You are free to translate them into another language if required. 

[Files] 
; NOTE: Don't use "Flags: ignoreversion" on any shared system files 
Source: "..\scripts\OlympusExport.lua"; DestDir: "{app}\Scripts"; Flags: ignoreversion 
Source: "..\scripts\OlympusHook.lua"; DestDir: "{app}\Scripts\Hooks"; Flags: ignoreversion 
Source: "..\scripts\OlympusCommand.lua"; DestDir: "{app}\Mods\Services\Olympus\Scripts"; Flags: ignoreversion 
Source: "..\scripts\OlympusMission.lua"; DestDir: "{app}\Mods\Services\Olympus\Scripts"; Flags: ignoreversion 
Source: "..\bin\x64\Release\*.dll"; DestDir: "{app}\Mods\Services\Olympus\bin"; Flags: ignoreversion;

[Code]
procedure AppendExportString();
begin
  SaveStringToFile(ExpandConstant('{app}\Scripts\Export.lua'), #13#10 + 'local Olympuslfs=require(''lfs'');dofile(Olympuslfs.writedir()..''Scripts/OlympusExport.lua'')' + #13#10, True);
end;
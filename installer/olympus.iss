#define nwjsFolder "..\..\nwjs\"
#define nodejsFolder "..\..\node\"
#define version "v0.4.8-alpha"

[Setup] 
AppName=DCS Olympus 
AppVerName=DCS Olympus {#version}
DefaultDirName={usersavedgames}\DCS.openbeta
DefaultGroupName=DCSOlympus  
OutputBaseFilename=DCSOlympus_{#version}
UninstallFilesDir={app}\Mods\Services\Olympus
SetupIconFile="..\img\olympus.ico"
DirExistsWarning=no
AppendDefaultDirName=no
LicenseFile="..\LEGAL"

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
Source: "..\scripts\OlympusHook.lua"; DestDir: "{app}\Scripts\Hooks"; Flags: ignoreversion 
Source: "..\olympus.json"; DestDir: "{app}\Mods\Services\Olympus"; Flags: onlyifdoesntexist 
Source: "..\scripts\OlympusCommand.lua"; DestDir: "{app}\Mods\Services\Olympus\Scripts"; Flags: ignoreversion 
Source: "..\scripts\unitPayloads.lua"; DestDir: "{app}\Mods\Services\Olympus\Scripts"; Flags: ignoreversion
Source: "..\scripts\templates.lua"; DestDir: "{app}\Mods\Services\Olympus\Scripts"; Flags: ignoreversion 
Source: "..\scripts\mist.lua"; DestDir: "{app}\Mods\Services\Olympus\Scripts"; Flags: ignoreversion 
Source: "..\mod\*"; DestDir: "{app}\Mods\Services\Olympus"; Flags: ignoreversion recursesubdirs;
Source: "..\bin\*.dll"; DestDir: "{app}\Mods\Services\Olympus\bin"; Flags: ignoreversion;
Source: "..\client\bin\*"; DestDir: "{app}\Mods\Services\Olympus\client\bin"; Flags: ignoreversion;
Source: "..\client\node_modules\*"; DestDir: "{app}\Mods\Services\Olympus\client\node_modules"; Flags: ignoreversion recursesubdirs;
Source: "..\client\public\*"; DestDir: "{app}\Mods\Services\Olympus\client\public"; Flags: ignoreversion recursesubdirs;
Source: "..\client\routes\*"; DestDir: "{app}\Mods\Services\Olympus\client\routes"; Flags: ignoreversion recursesubdirs;
Source: "..\client\views\*"; DestDir: "{app}\Mods\Services\Olympus\client\views"; Flags: ignoreversion recursesubdirs;
Source: "..\client\*.*"; DestDir: "{app}\Mods\Services\Olympus\client"; Flags: ignoreversion;
Source: "..\img\olympus.ico"; DestDir: "{app}\Mods\Services\Olympus\img"; Flags: ignoreversion;
Source: "..\img\olympus_server.ico"; DestDir: "{app}\Mods\Services\Olympus\img"; Flags: ignoreversion;
Source: "..\img\olympus_configurator.ico"; DestDir: "{app}\Mods\Services\Olympus\img"; Flags: ignoreversion;
Source: "..\img\configurator_logo.png"; DestDir: "{app}\Mods\Services\Olympus\img"; Flags: ignoreversion;
Source: "{#nwjsFolder}\*.*"; DestDir: "{app}\Mods\Services\Olympus\client"; Flags: ignoreversion recursesubdirs; Check: CheckLocalInstall
Source: "{#nodejsFolder}\*.*"; DestDir: "{app}\Mods\Services\Olympus\client"; Flags: ignoreversion recursesubdirs; Check: CheckServerInstall
Source: "..\scripts\python\configurator\dist\configurator.exe"; DestDir: "{app}\Mods\Services\Olympus"; Flags: ignoreversion;

[Run]
Filename: "{app}\Mods\Services\Olympus\configurator.exe"; Parameters: -a {code:GetAddress} -c {code:GetClientPort} -b {code:GetBackendPort} -p {code:GetPassword} -bp {code:GetBluePassword} -rp {code:GetRedPassword}; Check: CheckCallConfigurator

[Registry]
Root: HKCU; Subkey: "Environment"; ValueType: string; ValueName: "DCSOLYMPUS_PATH"; ValueData: "{app}\Mods\Services\Olympus"; Flags: preservestringtype
Root: HKCU; Subkey: "Environment"; ValueType: expandsz; ValueName: "Path"; ValueData: "{olddata};%DCSOLYMPUS_PATH%\bin"; Check: NeedsAddPath('%DCSOLYMPUS_PATH%\bin');
	
[Setup]
; Tell Windows Explorer to reload the environment
ChangesEnvironment=yes

[Icons]
Name: "{userdesktop}\DCS Olympus Client"; Filename: "{app}\Mods\Services\Olympus\client\nw.exe"; Tasks: desktopicon; IconFilename: "{app}\Mods\Services\Olympus\img\olympus.ico"; Check: CheckLocalInstall
Name: "{userdesktop}\DCS Olympus Server"; Filename: "{app}\Mods\Services\Olympus\client\node.exe"; Tasks: desktopicon; IconFilename: "{app}\Mods\Services\Olympus\img\olympus_server.ico"; Parameters: ".\bin\www"; Check: CheckServerInstall
Name: "{userdesktop}\DCS Olympus Configurator"; Filename: "{app}\Mods\Services\Olympus\configurator.exe"; Tasks: desktopicon; IconFilename: "{app}\Mods\Services\Olympus\img\olympus_configurator.ico"; Check: CheckServerInstall

[Code]
function NeedsAddPath(Param: string): boolean;
var
  OrigPath: string;
begin
  if not RegQueryStringValue(HKCU,
    'Environment',
    'Path', OrigPath)
  then begin
    Result := True;
    exit;
  end;
  { look for the path with leading and trailing semicolon }
  { Pos() returns 0 if not found }
  Result := Pos(';' + Param + ';', ';' + OrigPath + ';') = 0;
end;

[Code]
var
  lblLocalInstall: TLabel;
  lblLocalInstallInstructions: TNewStaticText;
  lblServerInstall: TLabel;
  lblServerInstallInstructions: TNewStaticText;
  lblKeepOld: TLabel;
  lblClientPort: TLabel;
  lblBackendPort: TLabel;
  lblPassword: TLabel;
  lblBluePassword: TLabel;
  lblRedPassword: TLabel;
  radioLocalInstall: TNewRadioButton;
  radioServerInstall: TNewRadioButton;
  checkKeepOld: TNewCheckBox;
  txtClientPort: TEdit;
  txtBackendPort: TEdit;
  txtPassword: TPasswordEdit;
  txtBluePassword: TPasswordEdit;
  txtRedPassword: TPasswordEdit;
  InstallationTypePage: Integer;
  PasswordPage: Integer;
  lblPasswordInstructions: TNewStaticText;

procedure AcceptNumbersOnlyKeyPress(Sender: TObject; var Key: Char);
var
  KeyCode: Integer;
begin
  // allow only numbers
  KeyCode := Ord(Key);
  if not ((KeyCode = 8) or ((KeyCode >= 48) and (KeyCode <= 57))) then
    Key := #0;
end;

procedure frmAddress_Activate(Page: TWizardPage);
begin
end;

function frmAddress_ShouldSkipPage(Page: TWizardPage): Boolean;
begin
  Result := False;
end;

function frmAddress_BackButtonClick(Page: TWizardPage): Boolean;
begin
  Result := True;
end;

function frmAddress_NextButtonClick(Page: TWizardPage): Boolean;
begin
    Result := True;
end;

procedure frmAddress_CancelButtonClick(Page: TWizardPage; var Cancel, Confirm: Boolean);
begin
end;

function frmInstallationType_CreatePage(PreviousPageId: Integer): Integer;
var
  Page: TWizardPage;
begin
  Page := CreateCustomPage(
    PreviousPageId,
    'DCS Olympus configuration',
    'Select installation type'
  );

  { lblLocalInstall }
  lblLocalInstall := TLabel.Create(Page);
  with lblLocalInstall do
  begin
    Parent := Page.Surface;
    Left := ScaleX(30);
    Top := ScaleY(14);
    Width := ScaleX(35);
    Height := ScaleY(10);
    Font.Style := [fsBold];
    Caption := 'Local installation';
  end;

  { lblLocalInstallInstructions }
  lblLocalInstallInstructions := TNewStaticText.Create(Page);
  with lblLocalInstallInstructions do
  begin
    Parent := Page.Surface;
    Left := ScaleX(30);
    Top := ScaleY(31);
    Width := ScaleX(340);
    Height := ScaleY(23);
    WordWrap := True;
    Caption := 'Select this to install DCS Olympus locally. DCS Olympus will not be reachable by external clients (i.e. browsers running on different PCs)';
  end;

   { radioLocalInstall }
  radioLocalInstall := TNewRadioButton.Create(Page);
  with radioLocalInstall do
  begin
    Parent := Page.Surface;
    Left := ScaleX(10);
    Top := ScaleY(12);
    Width := ScaleX(185);
    Height := ScaleY(21);
    TabOrder := 0;
    Checked := True
  end;

  { lblServerInstall }
  lblServerInstall := TLabel.Create(Page);
  with lblServerInstall do
  begin
    Parent := Page.Surface;
    Left := ScaleX(30);
    Top := ScaleY(76);
    Width := ScaleX(52);
    Height := ScaleY(13);
    Font.Style := [fsBold];
    Caption := 'Dedicated server installation';
  end;

    { lblServerInstallInstructions }
  lblServerInstallInstructions := TNewStaticText.Create(Page);
  with lblServerInstallInstructions do
  begin
    Parent := Page.Surface;
    Left := ScaleX(30);
    Top := ScaleY(93);
    Width := ScaleX(340);
    Height := ScaleY(13);
    WordWrap := True;
    Caption := 'Select this to install DCS Olympus on a dedicated server. DCS Olympus will be reachable by external clients. NOTE: to enable external connections, TCP port forwarding must be enabled on the selected ports.';
  end;

    { radioServerInstall }
  radioServerInstall := TNewRadioButton.Create(Page);
  with radioServerInstall do
  begin
    Parent := Page.Surface;
    Left := ScaleX(10);
    Top := ScaleY(72);
    Width := ScaleX(185);
    Height := ScaleY(21);
    TabOrder := 1;
  end;

  with Page do
  begin
    OnActivate := @frmAddress_Activate;
    OnShouldSkipPage := @frmAddress_ShouldSkipPage;
    OnBackButtonClick := @frmAddress_BackButtonClick;
    OnNextButtonClick := @frmAddress_NextButtonClick;
    OnCancelButtonClick := @frmAddress_CancelButtonClick;
  end;

  Result := Page.ID;
end;

procedure frmPassword_Activate(Page: TWizardPage);
begin
  checkKeepOld.Enabled := FileExists(ExpandConstant('{app}\Mods\Services\Olympus\olympus.json'));
  checkKeepOld.Checked := FileExists(ExpandConstant('{app}\Mods\Services\Olympus\olympus.json'));
end;

function frmPassword_ShouldSkipPage(Page: TWizardPage): Boolean;
begin
  Result := False;
end;

function frmPassword_BackButtonClick(Page: TWizardPage): Boolean;
begin
  Result := True;
end;

function frmPassword_NextButtonClick(Page: TWizardPage): Boolean;
begin
  if checkKeepOld.Checked or ((Trim(txtClientPort.Text) <> '') and (Trim(txtBackendPort.Text) <> '') and (Trim(txtPassword.Text) <> '') and (Trim(txtBluePassword.Text) <> '') and (Trim(txtRedPassword.Text) <> '')) then begin
    Result := True;
  end else 
  begin
    MsgBox('Either keep the configuration from the previous installation (if present) or fill all the fields to continue.', mbInformation, MB_OK);
    Result := False;
  end;
end;

procedure frmPassword_CancelButtonClick(Page: TWizardPage; var Cancel, Confirm: Boolean);
begin
end;

procedure checkKeepOldOnChange(Sender: TObject);
begin
  txtPassword.Enabled := not checkKeepOld.Checked;  
  txtBluePassword.Enabled := not checkKeepOld.Checked;  
  txtRedPassword.Enabled := not checkKeepOld.Checked;  
  txtBackendPort.Enabled := not checkKeepOld.Checked;  
  txtClientPort.Enabled := not checkKeepOld.Checked;  
end;

function frmPassword_CreatePage(PreviousPageId: Integer): Integer;
var
  Page: TWizardPage;
begin
  Page := CreateCustomPage(
    PreviousPageId,
    'DCS Olympus passwords',
    'Set DCS Olympus ports and passwords'
  );

  { lblKeepOld }
  lblKeepOld := TLabel.Create(Page);
  with lblKeepOld do
  begin
    Parent := Page.Surface;
    Left := ScaleX(54);
    Top := ScaleY(0);
    Width := ScaleX(46);
    Height := ScaleY(13);
    Caption := 'Keep configuration from previous installation';
  end;

  { checkKeepOld }
  checkKeepOld := TNewCheckBox.Create(Page);
  with checkKeepOld do
  begin
    Parent := Page.Surface;
    Left := ScaleX(24);
    Top := ScaleY(0);
    Width := ScaleX(46);
    Height := ScaleY(13);
    OnClick := @checkKeepOldOnChange;
  end;

  { lblPassword }
  lblPassword := TLabel.Create(Page);
  with lblPassword do
  begin
    Parent := Page.Surface;
    Left := ScaleX(24);
    Top := ScaleY(38);
    Width := ScaleX(46);
    Height := ScaleY(13);
    Caption := 'Game Master password';
  end;

  { txtPassword }
  txtPassword := TPasswordEdit.Create(Page);
  with txtPassword do
  begin
    Parent := Page.Surface;
    Left := ScaleX(180);
    Top := ScaleY(35);
    Width := ScaleX(185);
    Height := ScaleY(21);
    TabOrder := 2;
  end;

  { lblBluePassword }
  lblBluePassword := TLabel.Create(Page);
  with lblBluePassword do
  begin
    Parent := Page.Surface;
    Left := ScaleX(24);
    Top := ScaleY(66);
    Width := ScaleX(46);
    Height := ScaleY(13);
    Caption := 'Blue Commander password';
  end;

  { txtBluePassword }
  txtBluePassword := TPasswordEdit.Create(Page);
  with txtBluePassword do
  begin
    Parent := Page.Surface;
    Left := ScaleX(180);
    Top := ScaleY(63);
    Width := ScaleX(185);
    Height := ScaleY(21);
    TabOrder := 2;
  end;
  
  { lblRedPassword }
  lblRedPassword := TLabel.Create(Page);
  with lblRedPassword do
  begin
    Parent := Page.Surface;
    Left := ScaleX(24);
    Top := ScaleY(94);
    Width := ScaleX(46);
    Height := ScaleY(13);
    Caption := 'Red Commander password';
  end;

  { txtRedPassword }
  txtRedPassword := TPasswordEdit.Create(Page);
  with txtRedPassword do
  begin
    Parent := Page.Surface;
    Left := ScaleX(180);
    Top := ScaleY(91);
    Width := ScaleX(185);
    Height := ScaleY(21);
    TabOrder := 2;
  end;

  
  { lblClientPort }
  lblClientPort := TLabel.Create(Page);
  with lblClientPort do
  begin
    Parent := Page.Surface;
    Left := ScaleX(24);
    Top := ScaleY(122);
    Width := ScaleX(46);
    Height := ScaleY(13);
    Caption := 'Webserver port';
  end;

  { txtClientPort }
  txtClientPort := TEdit.Create(Page);
  with txtClientPort do
  begin
    Parent := Page.Surface;
    Left := ScaleX(180);
    Top := ScaleY(119);
    Width := ScaleX(185);
    Height := ScaleY(21);
    Text := '3000';
    OnKeyPress := @AcceptNumbersOnlyKeyPress;
    TabOrder := 3;
  end;

  { lblBackendPort }
  lblBackendPort := TLabel.Create(Page);
  with lblBackendPort do
  begin
    Parent := Page.Surface;
    Left := ScaleX(24);
    Top := ScaleY(149);
    Width := ScaleX(46);
    Height := ScaleY(13);
    Caption := 'Backend port';
  end;

  { txtBackendPort }
  txtBackendPort := TEdit.Create(Page);
  with txtBackendPort do
  begin
    Parent := Page.Surface;
    Left := ScaleX(180);
    Top := ScaleY(147);
    Width := ScaleX(185);
    Height := ScaleY(21);
    Text := '3001';
    OnKeyPress := @AcceptNumbersOnlyKeyPress;
    TabOrder := 4;
  end;
  
  { lblPasswordInstructions }
  lblPasswordInstructions := TNewStaticText.Create(Page);
  with lblPasswordInstructions do
  begin
    Parent := Page.Surface;
    Left := ScaleX(24);
    Top := ScaleY(180);
    Width := ScaleX(340);
    Height := ScaleY(13);
    WordWrap := True;
    Caption := 'Passwords and ports can be changed in the future by using the DCS Olympus configurator. For more information, see the DCS Olympus Wiki';
  end;

  with Page do
  begin
    OnActivate := @frmPassword_Activate;
    OnShouldSkipPage := @frmPassword_ShouldSkipPage;
    OnBackButtonClick := @frmPassword_BackButtonClick;
    OnNextButtonClick := @frmPassword_NextButtonClick;
    OnCancelButtonClick := @frmPassword_CancelButtonClick;
  end;

  Result := Page.ID;
end;

procedure InitializeWizard();
begin
  {this page will come after welcome page}
  InstallationTypePage := frmInstallationType_CreatePage(wpSelectDir);
  PasswordPage := frmPassword_CreatePage(InstallationTypePage);
end;

function CheckLocalInstall(): boolean;
begin
  if radioLocalInstall.Checked then begin 
    Result := True
  end else
  begin
    Result := False
  end
end;

function CheckServerInstall(): boolean;
begin
  if radioLocalInstall.Checked then begin 
    Result := False
  end else
  begin
    Result := True
  end
end;

function CheckCallConfigurator(): boolean;
begin
  if checkKeepOld.Checked then begin 
    Result := False
  end else
  begin
    Result := True
  end
end;

function GetAddress(Value: string): string;
begin
  if radioLocalInstall.Checked then begin 
    Result := 'localhost'
  end else
  begin
    Result := '*'
  end
end;

function GetClientPort(Value: string): string;
begin
  Result := txtClientPort.Text;
end;

function GetBackendPort(Value: string): string;
begin
  Result := txtBackendPort.Text;
end;

function GetPassword(Value: string): string;
begin
  Result := txtPassword.Text;
end;

function GetBluePassword(Value: string): string;
begin
  Result := txtBluePassword.Text;
end;

function GetRedPassword(Value: string): string;
begin
  Result := txtRedPassword.Text;
end;






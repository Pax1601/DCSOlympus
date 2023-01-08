var missionData;
var settingsPanel;
var unitsManager;
var unitInfoPanel;
var unitControlPanel;
var unitActionPanel;
var formationControlPanel;
var map;
var RESTaddress = "http://localhost:30000/restdemo";

function setup()
{
    resize();
    missionData = new MissionData();
    unitsManager = new UnitsManager();

    unitInfoPanel = new UnitInfoPanel("unit-info-panel");
    unitControlPanel = new UnitControlPanel("unit-control-panel");
    formationControlPanel = new FormationControlPanel("formation-control-panel");
    settingsPanel = new SettingsPanel("settings-panel");
    actionPanel = new ActionPanel("action-panel")
    map = new Map();  

    // Main update rate. 250ms is minimum time, equal to server update time.
    setInterval(() => update(), 250);
}

function resize()
{
  var unitControlPanelHeight = document.getElementById("header").offsetHeight;
  document.getElementById("map").style.height = `${window.innerHeight - unitControlPanelHeight - 10}px`;
  document.getElementById("unit-control-panel").style.left = `${window.innerWidth / 2 - document.getElementById("unit-control-panel").offsetWidth / 2}px`
  document.getElementById("action-panel").style.top = `${window.innerHeight / 2 - document.getElementById("action-panel").offsetHeight / 2}px`
  document.getElementById("snackbar").style.left = `${window.innerWidth / 2 - document.getElementById("snackbar").offsetWidth / 2}px`
}

/* GET new data from the server */
function update()
{
    // Request the updated unit data from the server 
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", RESTaddress, true); 

    xmlHttp.onload = function(e) {
        var data = JSON.parse(xmlHttp.responseText);
        
        missionData.update(data);
        unitsManager.update(data);
        unitInfoPanel.update(unitsManager.getSelectedUnits());
        formationControlPanel.update(unitsManager.getSelectedUnits());
    };

    xmlHttp.onerror = function () {
        console.error("An error occurred during the XMLHttpRequest");
    };
    xmlHttp.send( null );
}

window.onload = setup;
window.onresize = resize;

window.console = {
  log: function(str){
    if (str !== this.lastMessage)
    {
      var node = document.createElement("div");
      node.classList.add("log-message");
      node.appendChild(document.createTextNode("> " + str));
      document.getElementById("log").appendChild(node);
      this.lastMessage = str
    }
  },

  error: function(str){
    if (str !== this.lastMessage)
    {
      var node = document.createElement("div");
      node.classList.add("error-message");
      node.appendChild(document.createTextNode("> *** " + str + "***"));
      document.getElementById("log").appendChild(node);
      this.lastMessage = str
    }
  },

  lastMessage: "none"
}

function showMessage(message)
{
  // Get the snackbar DIV
  var x = document.getElementById("snackbar");
  
  // Add the "show" class to DIV
  x.className = "show";
  x.innerHTML = message;
  
  // After 3 seconds, remove the show class from DIV
  setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
  
}
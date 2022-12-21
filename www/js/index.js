var missionData;
var unitsManager;
var leftPanel;
var topPanel;
var map;
var RESTaddress = "http://localhost:30000/restdemo";

function setup()
{
    resize();
    missionData = new MissionData();
    unitsManager = new UnitsManager();

    leftPanel = new LeftPanel("left-panel");
    topPanel = new TopPanel("top-panel");

    map = new Map();  

    // Main update rate. 250ms is minimum time, equal to server update time.
    setInterval(() => update(), 250);
}

function resize()
{
  var topPanelHeight = document.getElementById("header").offsetHeight;
  document.getElementById("map").style.height = `${window.innerHeight - topPanelHeight - 10}px`;
  document.getElementById("top-panel").style.left = `${window.innerWidth / 2 - document.getElementById("top-panel").offsetWidth / 2}px`
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
        leftPanel.update(unitsManager.getSelectedUnits());
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
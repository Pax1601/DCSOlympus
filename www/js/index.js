var missionData;
var unitsHandler;
var leftPanel;
var map;
var RESTaddress = "http://localhost:30000/restdemo";

function setup()
{
    resize();
    missionData = new MissionData();
    leftPanel = new LeftPanel();
    unitsHandler = new UnitsHandler();
    map = new Map();  
}

function resize()
{
  var topPanelHeight = document.getElementById("top-panel").offsetHeight;
  document.getElementById("map").style.height = `${window.innerHeight - topPanelHeight - 10}px`;
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
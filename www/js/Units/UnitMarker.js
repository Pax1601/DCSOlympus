L.Marker.UnitMarker = L.Marker.extend(
    {
        options: {
            unitName: "No name",
            name: "N/A",
            human: false,
            coalitionID: 2,
            iconSrc: "img/units/undefined.png"
        },

        // Marker constructor
        initialize: function(options) {
            this._latlng = new L.LatLng(0, 0);
            L.setOptions(this, options);
            var icon = new L.DivIcon({
                html: `<table class="unitmarker-container-table" id="container-table">
                        <tr>
                            <td>
                                <img class="unitmarker-selection-img" id="selection-img" src="img/selection.png">
                                <img class="unitmarker-icon-img" id="icon-img">
                                <div class="unitmarker-unitName-div" id="unitName"></div>
                                <div class="unitmarker-altitude-div" id="altitude-div"></div>
                                <div class="unitmarker-speed-div" id="speed-div"></div>
                                <div class="unitmarker-name-div" id="name"></div>
                            </td>
                        </tr>
                    </table>`, 
                className: 'action-cursor'});   // Set the unit marker, className must be set to avoid white square
            this.setIcon(icon);
        },

        // When the marker is added to the map, the source image and the style are set. This can not be done before.
        onAdd: function (map) 
        {
            L.Marker.prototype.onAdd.call(this, map);
            
            this._icon.querySelector("#icon-img").src = this.options.iconSrc;

            this._icon.style.outline = "transparent"; // Removes the rectangular outline

            // Set the unit name in the marker
            var nameDiv = this._icon.querySelector("#name");
            nameDiv.innerHTML = this.options.name;
            nameDiv.style.left = (-(nameDiv.offsetWidth - this._icon.querySelector("#icon-img").height) / 2) + "px";

            // Set the coalitionID
            var img = this._icon.querySelector("#icon-img");
            if (this.options.coalitionID == 2)
            {
                img.classList.add("unitmarker-icon-img-blue");
            }
            else
            {
                img.classList.add("unitmarker-icon-img-red");
            }
        },

        // If the unit is not alive it is drawn with darker colours
        setAlive: function(alive)
        {
            this.alive = alive
            var table = this._icon.querySelector("#container-table");
            if (alive)
            {
                table.classList.remove("unitmarker-container-table-dead");
            }
            else
            {
                table.classList.add("unitmarker-container-table-dead");
            }
        },
        
        // Set heading
        setAngle: function(angle)
        {
            var img = this._icon.querySelector("#icon-img");
            img.style.transform = "rotate(" + angle + "rad)";
        },

        // Set altitude
        setAltitude: function(altitude)
        {
            var div = this._icon.querySelector("#altitude-div");
            div.innerHTML = Math.round(altitude / 0.3048 / 100) / 10;
        },

        // Set speed
        setSpeed: function(speed)
        {
            var div = this._icon.querySelector("#speed-div");
            div.innerHTML = Math.round(speed * 1.94384);
        },

        // Set hovered (mouse cursor is over the marker)
        setHovered: function(hovered)
        {
            var img = this._icon.querySelector("#icon-img");
            if (img!== undefined) 
            {
                if (hovered) 
                {
                    img.classList.add("unitmarker-icon-img-hovered");
                }
                else
                {
                    img.classList.remove("unitmarker-icon-img-hovered");
                }
            }
        },

        // Set selected
        setSelected: function(selected)
        {
            var selectedImg = this._icon.querySelector("#selection-img");
            if (selectedImg !== undefined) 
            {
                if (selected) 
                {
                    selectedImg.style.opacity = "1";
                }
                else 
                {
                    selectedImg.style.opacity = "0";
                }
            }

            var img = this._icon.querySelector("#icon-img");
            if (img !== undefined) 
            {
                if (selected) 
                {
                    img.classList.add("unitmarker-icon-img-selected");
                }
                else
                {
                    if (img.classList.contains("unitmarker-icon-img-selected")) img.classList.remove("unitmarker-icon-img-selected");
                }
            }
        },

        setLabelsVisibility(visibility)
        {
            var unitNameDiv = this._icon.querySelector("#unitName");
            unitNameDiv.style.opacity = visibility ? "1": "0";
            var unitName = this.options.human ? `<i class="fas fa-user"></i> ${this.options.unitName}` : `${this.options.unitName}`;
            unitNameDiv.innerHTML = visibility ? unitName : "";
            unitNameDiv.style.left = (-(unitNameDiv.offsetWidth - this._icon.querySelector("#icon-img").height) / 2) + "px";
            //this._icon.querySelector("#name").style.opacity = visibility ? "1": "0";
            //this._icon.querySelector("#name").innerHTML = visibility ? this.options.name : "";
            this._icon.querySelector("#altitude-div").style.opacity = visibility ? "1": "0";
            this._icon.querySelector("#speed-div").style.opacity = visibility ? "1": "0";
        },

        // Set the icon zIndex
        setZIndex: function(zIndex)
        {
            this._icon.style.zIndex = zIndex;
        },

        // Get the icon zIndex 
        getZIndex: function()
        {
            return this._icon.style.zIndex;
        } 
    }
)

// By default markers can be hovered and clicked
L.Marker.UnitMarker.addInitHook(function()
{
    this.on('mouseover', function(e) {
        if (e.target.alive)
        {
            e.target.setHovered(true);
        }
    });

    this.on('mouseout', function(e) {
        e.target.setHovered(false);
    });
});

/* Air Units ***********************************/
L.Marker.UnitMarker.AirUnitMarker = L.Marker.UnitMarker.extend({})
L.Marker.UnitMarker.AirUnitMarker.addInitHook(function(){});

// Aircraft
L.Marker.UnitMarker.AirUnitMarker.AircraftMarker = L.Marker.UnitMarker.AirUnitMarker.extend({});
L.Marker.UnitMarker.AirUnitMarker.AircraftMarker.addInitHook(function()
{
    this.options.iconSrc = "img/units/aircraft.png";
});
    
// Helicopter
L.Marker.UnitMarker.AirUnitMarker.HelicopterMarker = L.Marker.UnitMarker.AirUnitMarker.extend({}) 
L.Marker.UnitMarker.AirUnitMarker.HelicopterMarker.addInitHook(function()
{
    this.options.iconSrc = "img/units/helicopter.png";
});

/* Ground Units ***********************************/
L.Marker.UnitMarker.GroundMarker = L.Marker.UnitMarker.extend({});
L.Marker.UnitMarker.GroundMarker.addInitHook(function()
{
    this.options.iconSrc = "img/units/ground.png";
});

/* Navy Units ***********************************/
L.Marker.UnitMarker.NavyMarker = L.Marker.UnitMarker.extend({}) 
L.Marker.UnitMarker.NavyMarker.addInitHook(function()
{
    this.options.iconSrc = "img/units/navy.png";
});

/* Weapon Units ***********************************/
L.Marker.UnitMarker.WeaponMarker = L.Marker.UnitMarker.extend({}) 
L.Marker.UnitMarker.WeaponMarker.addInitHook(function()
{
    // Weapons are not selectable
    this.on('mouseover', function(e) {
        e.target.setHovered(false);
    });
});

// Missile
L.Marker.UnitMarker.WeaponMarker.MissileMarker = L.Marker.UnitMarker.WeaponMarker.extend({}) 
L.Marker.UnitMarker.WeaponMarker.MissileMarker.addInitHook(function()
{
    this.options.iconSrc = "img/units/missile.png";
});

// Bomb
L.Marker.UnitMarker.WeaponMarker.BombMarker = L.Marker.UnitMarker.WeaponMarker.extend({}) 
L.Marker.UnitMarker.WeaponMarker.BombMarker.addInitHook(function()
{
    this.options.iconSrc = "img/units/bomb.png";
});

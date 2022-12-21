L.Marker.UnitMarker = L.Marker.extend(
    {
        // Set the unit name and unit icon
        setUnitName: function(unitName)
        {
            // TODO: move in constructor and call only once (does not work in addInitHook for some reason)
            this._icon.style.outline = "transparent"; // Removes the rectangular outline

            if (this.unitName !== unitName)
            {                
                // Set the unit name in the marker
                var unitNameDiv = this._icon.querySelector("#unitName");
                if (unitNameDiv!== undefined)
                {
                    if (this._human)
                    {
                        unitNameDiv.innerHTML = `<i class="fas fa-user"></i> ${unitName}`;
                    }
                    else
                    {
                        unitNameDiv.innerHTML = `${unitName}`;
                    }
                } 
            }
            this.unitName = unitName;
        },

        setName: function(name)
        {
            // TODO: move in constructor and call only once (does not work in addInitHook for some reason)
            this._icon.style.outline = "transparent"; // Removes the rectangular outline

            if (this.name !== name)
            {                
                // Set the unit name in the marker
                var nameDiv = this._icon.querySelector("#name");
                if (nameDiv!== undefined)
                {
                    nameDiv.innerHTML = name;
                } 
            }
            this.name = name;
        },

        setCoalitionID: function(coalitionID)
        {
            var img = this._icon.querySelector("#icon-img");
            if (img!== undefined) 
            {
                if (coalitionID == 2)
                {
                    img.classList.add("unitmarker-icon-img-blue");
                }
                else
                {
                    img.classList.add("unitmarker-icon-img-red");
                }
            }
        },

        setImage: function(icon)
        {
            // Set the unit icon
            var img = this._icon.querySelector("#icon-img");
            if (img !== undefined) 
            {
                img.src = icon;
            }
        },

        setAlive: function(alive)
        {
            var table = this._icon.querySelector("#container-table");
            if (table!== undefined) 
            {
                if (alive)
                {
                    table.classList.remove("unitmarker-container-table-dead");
                }
                else
                {
                    table.classList.add("unitmarker-container-table-dead");
                }
            }
            this.alive = alive;
        },
        
        setAngle: function(angle)
        {
            if (this._angle !== angle){
                var img = this._icon.querySelector("#icon-img");
                if (img !== undefined) 
                {
                    img.style.transform = "rotate(" + angle + "rad)";
                }
            }
            this._angle = angle;
        },

        setAltitude: function(altitude)
        {
            if (this._altitude !== altitude){
                var div = this._icon.querySelector("#altitude-div");
                if (div !== undefined) 
                {
                    div.innerHTML = Math.round(altitude / 0.3048 / 100) / 10;
                }
            }
            this._altitude = altitude;
        },

        setSpeed: function(speed)
        {

        },

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
                    if (img.classList.contains("unitmarker-icon-img-hovered")) img.classList.remove("unitmarker-icon-img-hovered");
                }
            }
        },

        setSelected: function(selected)
        {
            var selectedImg = this._icon.querySelector("#selection-img");
            if (selectedImg!== undefined) 
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

        setHuman: function(human)
        {
            this._human = human;
        },

        setZIndex: function(zIndex)
        {
            this._icon.style.zIndex = zIndex;
        },

        getZIndex: function()
        {
            return this._icon.style.zIndex;
        } 
    }
)

L.Marker.UnitMarker.addInitHook(function()
{
    var icon = new L.DivIcon({html: iconHtml, className: 'DCSUnit-marker-icon'});   // Set the unit marker, className must be set to avoid white square
    this.setIcon(icon);
    
    this.on('mouseover',function(e) {
        if (e.target.alive)
        {
            e.target.setHovered(true);
        }
    });

    this.on('mouseout',function(e) {
        e.target.setHovered(false);
    });
});

var iconHtml = `<table class="unitmarker-container-table" id="container-table">
                    <tr>
                        <td>
                            <img class="unitmarker-selection-img" id="selection-img" src="img/selection.png">
                            <img class="unitmarker-icon-img" id="icon-img">
                            <div class="unitmarker-unitName-div" id="unitName"></div>
                            <div class="unitmarker-altitude-div" id="altitude-div"></div>
                            <div class="unitmarker-name-div" id="name"></div>
                        </td>
                    </tr>
                </table>`
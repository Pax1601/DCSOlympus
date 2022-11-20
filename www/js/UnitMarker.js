L.Marker.UnitMarker = L.Marker.extend(
    {
        // Set the unit name and unit icon
        setUnitName: function(unitName)
        {
            // TODO: move in constructor and call only once (does not work in addInitHook for some reason)
            this._icon.style.outline = "transparent"; // Removes the rectangular outline

            if (this.unitName !== unitName)
            {
                // Set the unit icon
                var img = this._icon.querySelector("#icon-img");
                if (img!== undefined) 
                {
                    if (unitName in unitIcons) img.src = unitIcons[unitName];  
                    else img.src = "img/units/undefined.png";  

                    // Set image class, TODO: make fuction to change coalition
                    img.classList.add("unitmarker-icon-img-blue");
                }
                
                // Set the unit name in the marker
                var nameDiv = this._icon.querySelector("#name");
                if (nameDiv!== undefined) nameDiv.innerHTML = unitName;
            }
            this.unitName = unitName;
        },

        // Rotates the marker to show heading
        setAngle: function(angle)
        {
            if (this._angle !== angle){
                var img = this._icon.querySelector("#icon-img");
                if (img !== undefined) img.style.transform = "rotate(" + angle + "rad)";
            }
            this._angle = angle;
        },

        setHovered: function(hovered)
        {
            var img = this._icon.querySelector("#icon-img");
            if (img!== undefined) 
            {
                if (hovered) img.classList.add("unitmarker-icon-img-hovered");
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
                if (selected) selectedImg.style.opacity = "1";
                else selectedImg.style.opacity = "0";
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

        getZIndex: function()
        {
            return this._icon.style.zIndex;
        },

        setZIndex: function(zIndex)
        {
            this._icon.style.zIndex = zIndex;
        }
    }
)

L.Marker.UnitMarker.addInitHook(function()
{
    var icon = new L.DivIcon({html: iconHtml, className: 'DCSUnit-marker-icon'});   // Set the unit marker, className must be set to avoid white square
    this.setIcon(icon);
    
    this.on('mouseover',function(e) {
        e.target.setHovered(true);
    });

    this.on('mouseout',function(e) {
        e.target.setHovered(false);
    });
});

var unitIcons =
{
    "A-4E-C": "img/units/a-4.png"
}

var iconHtml = `<table class="unitmarker-container-table">
                    <tr>
                        <td>
                            <img class="unitmarker-selection-img" id="selection-img" src="img/selection.png">
                            <img class="unitmarker-icon-img" id="icon-img">
                            <div class="unitmarker-name-div" id="name"></div>
                        </td>
                    </tr>
                </table>`
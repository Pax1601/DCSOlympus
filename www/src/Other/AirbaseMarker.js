L.Marker.AirbaseMarker = L.Marker.extend(
    {
        options: {
            name: "No name",
            position: undefined,
            coalitionID: 2,
            iconSrc: "img/airbase.png"
        },

        // Marker constructor
        initialize: function(latlng, options) {
            this._latlng = latlng;
            if (options != undefined)
            {
                L.setOptions(this, options);
            }
            var icon = new L.DivIcon({
                html: `<table class="unitmarker-container-table" id="container-table">
                        <tr>
                            <td>
                                <img class="airbasemarker-icon-img" id="icon-img" src="${this.options.iconSrc}">
                                <div class="airbasemarker-name-div" id="name">${this.options.name}</div>
                            </td>
                        </tr>
                    </table>`, 
                className: 'airbase-marker-icon'});   // Set the marker, className must be set to avoid white square
            this.setIcon(icon);
        },

        setCoalitionID: function(coalitionID)
        {
            this.options.coalitionID = coalitionID;
            // Set the coalitionID
            var img = this._icon.querySelector("#icon-img");
            img.classList.remove("airbasemarker-icon-img-blue");
            img.classList.remove("airbasemarker-icon-img-red");
            if (this.options.coalitionID == 2)
            {
                img.classList.add("airbasemarker-icon-img-blue");
            }
            else if (this.options.coalitionID == 1)
            {
                img.classList.add("airbasemarker-icon-img-red");
            }
        }
    }
)

// By default markers can be hovered and clicked
L.Marker.AirbaseMarker.addInitHook(function()
{
    
});

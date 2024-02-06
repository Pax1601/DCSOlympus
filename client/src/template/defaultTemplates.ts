export const defaultTemplates = {
    "airbaseChartData": `
        <h3 id="airbase-name"><%= airbase.getName() %></h3>
        <dl id="airbase-chart-data" class="ol-data-grid">
            <dt>ICAO</dt>
            <dd data-point="ICAO"><%= airbase.getChartData().ICAO %></dd>
            <dt>Coalition</dt>
            <dd data-point="coalition"><%= airbase.getCoalition() %></dd>
            <dt>Elevation</dt>
            <dd><span data-point="elevation"><%= airbase.getChartData().elevation %></span>ft</dd>
            <dt>TACAN</dt>
            <dd data-point="TACAN"><%= airbase.getChartData().TACAN || "-" %></dd>
        </dl>
        <h4>Runways</h4>
        <div id="airbase-runways">
            <% airbase.getChartData().runways.forEach( runway => { %>
                <div class="runway">
                    <% runway.headings.forEach( heading => { %>
                        <% for( const[ name, data ] of Object.entries(heading)) { %>
                            <div class="heading"><abbr title="Mag heading: <%= data.magHeading %>"><%= name.replace("(CLOSED)", "(C)") %></abbr><% if (data.ILS) { %><abbr title="<%= data.ILS %>">ILS</abbr><% } %></div>
                        <% } %>
                    <% }) %>
                </div>
            <% }) %>
        </div>`
};
// ----------------------
// Read URL parameters
// ----------------------

const params = new URLSearchParams(window.location.search);

const kmlFile = params.get("kml") || "Norte/SE-2AGT_Circ-AL01014045.kml";
const selectedID = params.get("id");

// ----------------------
// Create map
// ----------------------

const map = L.map("map").setView([-10.25, -48.33], 10);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "© OpenStreetMap",
        maxZoom: 19
    }
).addTo(map);

// ----------------------
// Load KML
// ----------------------

const layer = omnivore.kml("kml/" + kmlFile);

layer.on("ready", function () {

    map.fitBounds(layer.getBounds());

    console.log("KML Loaded");

    if (!selectedID)
        return;

    layer.eachLayer(function (l) {

        if (!l.feature)
            return;

        if (!l.feature.properties)
            return;

        const name = l.feature.properties.name;

        if (String(name) === String(selectedID)) {

            console.log("FOUND:", selectedID);

            map.flyTo(l.getLatLng(), 19);

            L.circleMarker(l.getLatLng(), {
                radius: 14,
                color: "red",
                fillColor: "red",
                fillOpacity: 0.6,
                weight: 4
            }).addTo(map);

            l.bindPopup(
                "<b>Element</b><br>" + selectedID
            ).openPopup();

        }

    });

});

layer.addTo(map);

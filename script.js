console.log("Script started");

const map = L.map('map').setView([-10.25, -48.33], 10);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    }
).addTo(map);

console.log("Map created");

const layer = omnivore.kml('kml/Norte/SE-2AGT_Circ-AL01014045.kml');

layer.on('ready', function () {
    console.log("KML loaded");
    map.fitBounds(layer.getBounds());
});

layer.on('error', function(e){
    console.error("KML ERROR:", e);
});

layer.addTo(map);

const map = L.map('map').setView([-10.25,-48.33],10);

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
maxZoom:19,
attribution:'© OpenStreetMap'
}
).addTo(map);


// Load one KML

const layer = omnivore.kml('kml/Norte/SE-2AGT_Circ-AL01014045.kml');

layer.on('ready',function(){

map.fitBounds(layer.getBounds());

});

layer.addTo(map);

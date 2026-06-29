const map = L.map('map').setView([-10.25, -48.33], 10);

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
    maxZoom:19,
    attribution:'© OpenStreetMap'
}
).addTo(map);

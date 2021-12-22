var map_planification = L.map('mapid_planification').setView([48.358676, -4.569759], 20);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map_planification);

var DroneList={"Drone 1": {"taille_scan" : 5 , "vit" : 8} , "Drone 2" : {"taille_scan" : 10 , "vit" : 4}};


map_planification.pm.addControls({
  position: 'topleft',
  drawCircle: false,
});

var point1;
var point2;
var point3;
var point4;
var layer;

map_planification.on('pm:create', function (e) {
  layer = e.layer;
  point1 = [layer._latlngs[0][0].lat, layer._latlngs[0][0].lng];
  point2 = [layer._latlngs[0][1].lat, layer._latlngs[0][1].lng];
  point3 = [layer._latlngs[0][2].lat, layer._latlngs[0][2].lng];
  point4 = [layer._latlngs[0][3].lat, layer._latlngs[0][3].lng];
});

layer.on('pm:edit', function (e) {
  layer = e.layer;
  point1 = [layer._latlngs[0][0].lat, layer._latlngs[0][0].lng];
  point2 = [layer._latlngs[0][1].lat, layer._latlngs[0][1].lng];
  point3 = [layer._latlngs[0][2].lat, layer._latlngs[0][2].lng];
  point4 = [layer._latlngs[0][3].lat, layer._latlngs[0][3].lng];
});

function SendMissionPlane() {
  var select = document.getElementById('inputTypeDrone');
  var value = select.options[select.selectedIndex].value; 
  console.log(value);
  var taille_scan = DroneList[value ]['taille_scan'];
  var vitesse = DroneList[ value ]['vit'];
  var zone_data = [
    { "Point1": point1 },
    { "Point2": point2 },
    { "Point3": point3 },
    { "Point4": point4 },
    { "Taille": taille_scan },
    { "vit": vitesse }
  ];

  $.ajax({
    type: 'POST',
    url: '/process_mission_plane',
    data: JSON.stringify(zone_data),
    contentType: 'application/json',
    dataType: 'json',
    success: function (result) {
      mission_plan = result;
      localStorage.setItem("MissionPlan", JSON.stringify(mission_plan));
      localStorage.setItem("Carre",JSON.stringify(zone_data));
      location.href="../simulation";

    }
  });

}

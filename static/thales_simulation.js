var map_simulation = L.map('mapid_simulation')
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map_simulation);


var result = JSON.parse(localStorage.getItem("MissionPlan"));
var carre = JSON.parse(localStorage.getItem("Carre"));

var polyline = L.polyline([[carre[1]["Point2"][0], carre[1]["Point2"][1]], [carre[2]["Point3"][0], carre[2]["Point3"][1]]]).addTo(map_simulation);
var polyline = L.polyline([[carre[1]["Point2"][0], carre[1]["Point2"][1]], [carre[0]["Point1"][0], carre[0]["Point1"][1]]]).addTo(map_simulation);
var polyline = L.polyline([[carre[3]["Point4"][0], carre[3]["Point4"][1]], [carre[0]["Point1"][0], carre[0]["Point1"][1]]]).addTo(map_simulation);
var polyline = L.polyline([[carre[3]["Point4"][0], carre[3]["Point4"][1]], [carre[2]["Point3"][0], carre[2]["Point3"][1]]]).addTo(map_simulation);
map_simulation.setView([carre[2]["Point3"][0], carre[2]["Point3"][1]],20);

for (var i = 2; i < Object.values(result).length-1 ; i++) {
  var polyline = L.polyline([[result[i]["lat"], result[i]["lgt"]], [result[i + 1]["lat"], result[i + 1]["lgt"]]]).addTo(map_simulation);
}

var iconOptions = {
  iconUrl: '/static/drone1.png',
  iconSize: [25, 25]
};
var customIcon = L.icon(iconOptions);
var markerOptions = {
  title: "Drone",
  clickable: true,
  draggable: false,
  icon: customIcon
};

var distance1 = distance(result[0]['lat'], result[1]['lat'], result[0]['lgt'], result[1]['lgt']);
var missionDuration = distance1 / result[1]['vit'];
myMovingMarker = L.Marker.movingMarker([[result[0]['lat'], result[0]['lgt']], [result[1]['lat'], result[1]['lgt']]], [distance1 * 1000 / result[1]['vit']],
  markerOptions).addTo(map_simulation);
var pointstimes = new Map();
pointstimes.set(1, missionDuration);

document.getElementById("vitesse").innerHTML = "Vitesse du drone: " + result[1]['vit'] + "m/s ";

for (var i = 2; i < Object.values(result).length; i++) {
  var distance2 = distance(result[i]['lat'], result[i - 1]['lat'], result[i]['lgt'], result[i - 1]['lgt']);
  missionDuration += distance2 / result[i]['vit'];
  myMovingMarker.addLatLng([result[i]["lat"], result[i]["lgt"]], [distance2 * 1000 / result[i]['vit']], markerOptions);
  pointstimes.set(i, missionDuration);

}

var Missiondays = Math.floor(missionDuration / (60 * 60 * 24));
var Missionhours = Math.floor((missionDuration % (60 * 60 * 24)) / (60 * 60));
var Missionminutes = Math.floor((missionDuration % (60 * 60)) / (60));
var Missionseconds = Math.floor((missionDuration % (60)));


myMovingMarker.start();

var timerTime = missionDuration + 1;
var remainingTime = missionDuration;
var accelerationFactor = 1;

var x = setInterval(function () {
  timerTime = timerTime - 1;
  elapsedTime = missionDuration - timerTime;
  var days = Math.floor(timerTime / (60 * 60 * 24));
  var hours = Math.floor((timerTime % (60 * 60 * 24)) / (60 * 60));
  var minutes = Math.floor((timerTime % (60 * 60)) / (60));
  var seconds = Math.floor((timerTime % (60)));

  document.getElementById("timer").innerHTML = days + "d " + hours + "h "
    + minutes + "m " + seconds + "s  /  " + Missiondays + "d " + Missionhours + "h "
    + Missionminutes + "m " + Missionseconds + "s ";

  if (timerTime < 0) {
    console.log("true");
    clearInterval(x);
    document.getElementById("timer").innerHTML = 0 + "d " + 0 + "h "
      + 0 + "m " + 0 + "s  /  " + Missiondays + "d " + Missionhours + "h "
      + Missionminutes + "m " + Missionseconds + "s ";
  }

}, 1000 / accelerationFactor);


function distance(lat1,
  lat2, lon1, lon2) {

  // The math module contains a function
  // named toRadians which converts from
  // degrees to radians.
  lon1 = lon1 * Math.PI / 180;
  lon2 = lon2 * Math.PI / 180;
  lat1 = lat1 * Math.PI / 180;
  lat2 = lat2 * Math.PI / 180;

  // Haversine formula
  let dlon = lon2 - lon1;
  let dlat = lat2 - lat1;
  let a = Math.pow(Math.sin(dlat / 2), 2)
    + Math.cos(lat1) * Math.cos(lat2)
    * Math.pow(Math.sin(dlon / 2), 2);

  let c = 2 * Math.asin(Math.sqrt(a));

  // Radius of earth in kilometers. Use 3956
  // for miles
  let r = 6371;

  // calculate the result
  return (c * r * 1000);
}

function stop() {
  myMovingMarker.pause();
  clearInterval(x);
}

function resume() {
  myMovingMarker.resume();
  x = setInterval(function () {
    timerTime = timerTime - 1;
    elapsedTime = missionDuration - timerTime;
    var days = Math.floor(timerTime / (60 * 60 * 24));
    var hours = Math.floor((timerTime % (60 * 60 * 24)) / (60 * 60));
    var minutes = Math.floor((timerTime % (60 * 60)) / (60));
    var seconds = Math.floor((timerTime % (60)));

    document.getElementById("timer").innerHTML = days + "d " + hours + "h "
      + minutes + "m " + seconds + "s  /  " + Missiondays + "d " + Missionhours + "h "
      + Missionminutes + "m " + Missionseconds + "s ";

    if (timerTime < 0) {
      console.log("true");
      clearInterval(x);
      document.getElementById("timer").innerHTML = 0 + "d " + 0 + "h "
        + 0 + "m " + 0 + "s  /  " + Missiondays + "d " + Missionhours + "h "
        + Missionminutes + "m " + Missionseconds + "s ";
    }

  }, 1000 / accelerationFactor);


}

var elapsedTime;

function nextpoint() {
  elapsedTime = missionDuration - timerTime ;
  if (elapsedTime <= pointstimes.get(1)) {
    return 1;
  }

  else {
    for (let i = 1; i < pointstimes.size; i++) {
      if (elapsedTime > pointstimes.get(i) && elapsedTime <= pointstimes.get(i + 1)) {
        return i + 1;
      }

    }
  }
}

function speedUp() {
  accelerationFactor = accelerationFactor * 2;
  var currentPosition = myMovingMarker.getLatLng();
  var nextPoint = nextpoint();
  var distance1 = distance(currentPosition['lat'], result[nextPoint]['lat'], currentPosition['lng'], result[nextPoint]['lgt']);
  myMovingMarker.remove();

  var iconOptions = {
    iconUrl: '/static/drone1.png',
    iconSize: [25, 25]
  };
  var customIcon = L.icon(iconOptions);
  var markerOptions = {
    title: "Drone",
    clickable: true,
    draggable: false,
    icon: customIcon
  };

  myMovingMarker =L.Marker.movingMarker([[currentPosition['lat'],currentPosition['lng']],[result[nextPoint]['lat'],result[nextPoint]['lgt']]], [(distance1 * 1000) / (accelerationFactor * result[nextPoint]['vit'])],markerOptions).addTo(map_simulation);
  myMovingMarker.start();

  for (var i = nextPoint + 1; i < Object.values(result).length; i++) {
    var distance2 = distance(result[i]['lat'], result[i - 1]['lat'], result[i]['lgt'], result[i - 1]['lgt']);
    myMovingMarker.addLatLng([result[i]["lat"], result[i]["lgt"]], [(distance2 * 1000 )/ (accelerationFactor * result[i]['vit'])]);

  }
  clearInterval(x);

  x = setInterval(function () {
    timerTime = timerTime - 1;
    elapsedTime = missionDuration - timerTime;
    var days = Math.floor(timerTime / (60 * 60 * 24));
    var hours = Math.floor((timerTime % (60 * 60 * 24)) / (60 * 60));
    var minutes = Math.floor((timerTime % (60 * 60)) / (60));
    var seconds = Math.floor((timerTime % (60)));

    document.getElementById("timer").innerHTML = days + "d " + hours + "h "
      + minutes + "m " + seconds + "s  /  " + Missiondays + "d " + Missionhours + "h "
      + Missionminutes + "m " + Missionseconds + "s ";

    if (timerTime < 0) {
      console.log("true");
      clearInterval(x);
      document.getElementById("timer").innerHTML = 0 + "d " + 0 + "h "
        + 0 + "m " + 0 + "s  /  " + Missiondays + "d " + Missionhours + "h "
        + Missionminutes + "m " + Missionseconds + "s ";
    }

  }, 1000 / accelerationFactor);
}

function slowDown() {
  accelerationFactor = accelerationFactor / 2;
  var currentPosition = myMovingMarker.getLatLng();
  var nextPoint = nextpoint();
  var distance1 = distance(currentPosition['lat'], result[nextPoint]['lat'], currentPosition['lng'], result[nextPoint]['lgt']);
  myMovingMarker.remove();

  var iconOptions = {
    iconUrl: '/static/drone1.png',
    iconSize: [25, 25]
  };
  var customIcon = L.icon(iconOptions);
  var markerOptions = {
    title: "Drone",
    clickable: true,
    draggable: false,
    icon: customIcon
  };

  myMovingMarker =L.Marker.movingMarker([[currentPosition['lat'],currentPosition['lng']],[result[nextPoint]['lat'],result[nextPoint]['lgt']]], [(distance1 * 1000) / (accelerationFactor * result[nextPoint]['vit'])],markerOptions).addTo(map_simulation);
  myMovingMarker.start();

  for (var i = nextPoint + 1; i < Object.values(result).length; i++) {
    var distance2 = distance(result[i]['lat'], result[i - 1]['lat'], result[i]['lgt'], result[i - 1]['lgt']);
    myMovingMarker.addLatLng([result[i]["lat"], result[i]["lgt"]], [(distance2 * 1000 )/ (accelerationFactor * result[i]['vit'])]);

  }
  clearInterval(x);

  x = setInterval(function () {
    timerTime = timerTime - 1;
    elapsedTime = missionDuration - timerTime;
    var days = Math.floor(timerTime / (60 * 60 * 24));
    var hours = Math.floor((timerTime % (60 * 60 * 24)) / (60 * 60));
    var minutes = Math.floor((timerTime % (60 * 60)) / (60));
    var seconds = Math.floor((timerTime % (60)));

    document.getElementById("timer").innerHTML = days + "d " + hours + "h "
      + minutes + "m " + seconds + "s  /  " + Missiondays + "d " + Missionhours + "h "
      + Missionminutes + "m " + Missionseconds + "s ";

    if (timerTime < 0) {
      console.log("true");
      clearInterval(x);
      document.getElementById("timer").innerHTML = 0 + "d " + 0 + "h "
        + 0 + "m " + 0 + "s  /  " + Missiondays + "d " + Missionhours + "h "
        + Missionminutes + "m " + Missionseconds + "s ";
    }

  }, 1000 / accelerationFactor);
}

myMovingMarker.on('end', function (e) {
  alert("La simulation est terminée. LeTemps total de la simulation est : " + missionDuration +" s.");
});

var niveauDeBatterie;
y=setInterval(function(){
  niveauDeBatterie = 100 - 0.1*elapsedTime;
  document.getElementById("batterie").innerHTML = "Niveau de batterie: " + niveauDeBatterie + "% ";
}, 1000);





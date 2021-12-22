"""
Code python excécuté dans l'invite de commande
Il permet de créer le serveur local que nous appelons via les scripts html
"""
#!/usr/bin/python

# Import des librairies python
from flask import Flask
from flask import render_template
from flask import jsonify
from flask import request
import json
import requests

import os
import SimuDrones_pb2
import SimuDrones_pb2_grpc
import time
import json
import grpc


# Création du serveur flask que nous nommons "simu"

simu = Flask(__name__)

"""
Création des différentes routes pour les différentes pages de notre DASHBOARD.
Une fois que le programme python lancé dans l'invite de commande, il suffit d'ouvrir un navigateur web 
et d'entrer l'URL donné par l'invite de commande ainsi que le chemin des pages ci dessous
"""

## Page principale
@simu.route('/')
def home():
    m=render_template("home.html")
    return m

@simu.route('/planification/')
def planification():
    m=render_template("planification.html")
    return m

@simu.route('/simulation/')
def simulation():
    m=render_template("simulation.html")
    return m



## pour le moment on va créer une page pour chaque membre, comme ça chacun pourra un peu tester son code sans conflit

# Camille
@simu.route('/camille/')
def camille():
    m=render_template("home.html")
    return m

# Badr
@simu.route('/badr/')
def badr():
    m=render_template("badr.html")
    return m

@simu.route('/process_mission_plane', methods=['POST', 'GET'])
def process_mission_plane():
  if request.method == "POST":
   zone_data = request.get_json()
   print(zone_data)

  # Se connecte au serveur, lance une requête afin d'obtenir les points définissant la trajectoire du plan de mission
  # Stocke ces points dans un fichier json
  jsonString = " "

  with grpc.insecure_channel("localhost:9999") as channel:
    stub = SimuDrones_pb2_grpc.GetPlanStub(channel)
    response = stub.GetPos(SimuDrones_pb2.PlanRequest(p1lgt = zone_data[0]["Point1"][1], p1lat = zone_data[0]["Point1"][0], p2lgt = zone_data[1]["Point2"][1], p2lat = zone_data[1]["Point2"][0], p3lgt = zone_data[2]["Point3"][1], p3lat = zone_data[2]["Point3"][0], p4lgt = zone_data[3]["Point4"][1], p4lat = zone_data[3]["Point4"][0], speed = zone_data[5]["vit"], taille_scan = zone_data[4]["Taille"]))
    print(f"Nombre de packs à télécharger : {response.nb_packs}")
    
    for i in range(response.nb_packs):
      response2 = stub.GetPack(SimuDrones_pb2.NumPackRequest(num_pack = i))
      jsonString = jsonString + response2.pack
      
  print("téléchargement fini")
  print(jsonString);

  jsonString = json.loads(jsonString)


  print("Mission Plane Calculated")
  time.sleep(0.1)
  channel.unsubscribe(close)

  return jsonString

def close(channel):
  channel.close()

##on lance le serveur 
if __name__ == '__main__':
    simu.run(debug=True)
    

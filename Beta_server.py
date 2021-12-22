"""
Fichier a lancer sur le serveur
Contient 3 parties : 
  - Fonction qui renvoie le plan de mission à partir des coordonnées de la zone à traiter
  - Réception des messages de la machine et envoie de la réponse
  - Définition des caractéristiques du serveur (IP, PORT, nombre de thread, horloge)
"""

from concurrent import futures
import grpc
import SimuDrones_pb2
import SimuDrones_pb2_grpc
import time
import threading
import json
import console
import math
import numpy as np

def distance (lon1,lat1,lon2,lat2):
   
  #The math module contains a function
  #named toRadians which converts from
  #degrees to radians.
  lon1 =  lon1 * math.pi / 180;
  lon2 = lon2 * math.pi / 180;
  lat1 = lat1 * math.pi / 180;
  lat2 = lat2 * math.pi / 180;
   
  #Haversine formula
  dlon = lon2 - lon1;
  dlat = lat2 - lat1;
  a = math.pow(math.sin(dlat / 2), 2) + math.cos(lat1) * math.cos(lat2) * math.pow(math.sin(dlon / 2),2);
               
  c = 2 * math.asin(math.sqrt(a));
   
  #Radius of earth in kilometers. Use 3956
  #for miles
  r = 6371;
   
  #calculate the result
  return c * r * 1000

def vector(lgt1,lat1,lgt2,lat2,n):
  x = (lat2 - lat1)/n
  y = (lgt2 - lgt1)/n
  return y,x


#Définit les points de coordonnés de la mission (format JSON)
def definingMission(p1lgt, p1lat, p2lgt, p2lat, p3lgt, p3lat, p4lgt, p4lat, speed, taille_scan):
    #Calcul des longueurs des côtés de la zone
  d1 = distance (p1lgt,p1lat,p2lgt,p2lat)
  d2 = distance (p2lgt, p2lat, p3lgt, p3lat)
  d3 = distance (p3lgt,p3lat, p4lgt, p4lat)
  d4 = distance (p4lgt, p4lat, p1lgt, p1lat)
  distance_list = [d1,d2,d3,d4]  

  #Nomme le plus long et on prend le plus long des deux côtés adjacents, on le divise par la taille_scan
  plus_long_cote = distance_list.index(max(distance_list))
  cote_impair = plus_long_cote % 2

  if cote_impair == 0 :
    plus_long_cote_adjacent = distance_list.index(max(distance_list[0],distance_list[2]))
  else:
    plus_long_cote_adjacent = distance_list.index(max(distance_list[1],distance_list[3]))

  if distance_list[plus_long_cote_adjacent] % taille_scan == 0 :
    nb_rectangles = distance_list[plus_long_cote_adjacent] // taille_scan
  else :
    nb_rectangles = distance_list[plus_long_cote_adjacent] // taille_scan + 1
  

  #Calcul les vecteurs, qu'on normalise selon le nb de sous-zones nécessaires
  if cote_impair : 
    v1 = vector(p2lgt,p2lat,p3lgt,p3lat,nb_rectangles + 1)
    v2 = vector(p1lgt,p1lat,p4lgt,p4lat,nb_rectangles + 1)
  else : 
    v1 = vector(p1lgt,p1lat,p2lgt,p2lat,nb_rectangles + 1)
    v2 = vector(p4lgt,p4lat,p3lgt,p3lat,nb_rectangles + 1)

  print(f"Génération des listes pour {nb_rectangles} rectangles")

  #Génère 2 listes de points
  if cote_impair:
    points1 = [np.array([p2lgt,p2lat]) + np.array(v1) * i for i in range(int(nb_rectangles)+2)]
    points2 = [np.array([p1lgt,p1lat]) + np.array(v2) * i for i in range(int(nb_rectangles)+2)]
  else : 
    points1 = [np.array([p1lgt,p1lat]) + np.array(v1) * i for i in range(int(nb_rectangles)+2)]
    points2 = [np.array([p4lgt,p4lat]) + np.array(v2) * i for i in range(int(nb_rectangles)+2)]

  #On les mets dans le bon ordres pour notre trajectoire
  trajectoire = []
  for i in range(int(nb_rectangles)+2):
    if i % 2 == 0 : 
      trajectoire.append(points1[i])
      trajectoire.append(points2[i])
    else :
      trajectoire.append(points2[i])
      trajectoire.append(points1[i])
  print(len(trajectoire));
  
  #Au format JSON
  missionString = "{"
  for i in range(len(trajectoire)):
    missionString = missionString + '"' + str(i) + '"' + ': {"lgt" : ' + str(trajectoire[i][0]) + ', "lat" : '+ str(trajectoire[i][1]) + ', "vit" : ' + str(speed) + '},'
  
  
  
  missionString = missionString[:-1] + "}"
  

  pack_size = 100
  pack_list = []
  
  print("Mission String Realised")
  print(missionString)

  #diviser la mission en pack, renvoyer le nombre de packs, et une bibliothèque avec les packs numérotés
  nb_elements = len(list(missionString))
  nb_packs = nb_elements // pack_size + 1
  index_split = []

  #Crée une liste contenant les positions dans la chaine où seront réalisé les coupes
  for i in range(nb_packs):
    index_split.append(i*pack_size)
  #On ajoute le dernier plus 1, car le dernier élément n'est pas récupérer dans un slicing de chaine de caractère
  index_split.append(nb_elements+1)

  for i in range(len(index_split)-1):
    pack = missionString[index_split[i]: index_split[i+1]]
    pack_list.append(pack)


  print("Slicing achieved")
  print(pack_list[-1])
  return nb_packs, pack_list;

#Réceptionne le message Query, enregistre les données envoyées, et renvoie un message Response
class GetPlan(SimuDrones_pb2_grpc.GetPlanServicer):

  def __init__(self):
    pass

  #Fonction qui se lance lors de la réception d'une demande de Plan : On enregistre dans des variables les coordonnées des points
  #L'objectif est de décomposer le plan de missions en packs et de les envoyer 1 par 1 à la machine client
  def GetPos(self, request, context):
    print("Query received : GetPos")
    self.p1_lgt = request.p1lgt
    self.p1_lat = request.p1lat
    self.p2_lgt = request.p2lgt
    self.p2_lat = request.p2lat
    self.p3_lgt = request.p3lgt
    self.p3_lat = request.p3lat
    self.p4_lgt = request.p4lgt
    self.p4_lat = request.p4lat
    self.speed = request.speed
    self.taille_scan = request.taille_scan

    #Renvoyer le nombre de pack à télécharger
    nb_p, pack_l = definingMission(self.p1_lgt,self.p1_lat,self.p2_lgt,self.p2_lat,self.p3_lgt,self.p3_lat,self.p4_lgt,self.p4_lat, self.speed, self.taille_scan)
    self.nb_packs = nb_p
    self.pack_list = pack_l

    return SimuDrones_pb2.PlanReply(nb_packs = nb_p)


  #Fonction qui se lance lors de la réception d'une demande de pack
  def GetPack(self, request, context):
    print(f"Query received : GetPack {request.num_pack}")
    pack = self.pack_list[request.num_pack]
    return SimuDrones_pb2.PackReply(pack = pack)

# Fonction définissant le serveur (IP, port, nombre de Thread)
def serve(): 
  server = grpc.server(futures.ThreadPoolExecutor(max_workers = 1))
  SimuDrones_pb2_grpc.add_GetPlanServicer_to_server(GetPlan(), server)
  server.add_insecure_port("[::]:9999")
  server.start()

  #Horloge pour laisser tourner le fichier sur le serveur
  try:
    i = 0
    while True:
      i = i+1
      print("Server Running : threadcount %i" %(i))
      time.sleep(10)
  except KeyboardInterrupt:
    print("KeyboardInterrupt")
    server.stop(0)

if __name__ == "__main__":
    serve()
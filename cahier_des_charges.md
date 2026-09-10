# Cahier des charges — WashingMachineTracker

## Résumé

WashingMachineTracker est un système de suivi en temps réel de l'état des 8 machines (4 laveuses, 4 sèche-linge) de la buanderie de la résidence, consultable depuis un site web. Chaque machine est équipée d'un petit boîtier autonome (ESP32 + accéléromètre, sur piles) qui détecte les vibrations et transmet l'information à un boîtier central, qui la relaie ensuite au site. Budget matériel estimé : **77 à 122€** (détail dans `hardware.md`). Un premier POC du site de visualisation est déjà fonctionnel avec des données de test ; le matériel physique (ESP32, capteurs) n'a pas encore été testé.

## Besoin

Dans une résidence étudiante équipée de machines communes (4 machines à laver et 4 sèche-linge), les résidents n'ont aujourd'hui aucun moyen de savoir à distance si une machine est libre ou en cours d'utilisation, ni depuis combien de temps, ce qui les oblige à se déplacer physiquement pour vérifier la disponibilité et génère des attentes inutiles. Le projet WashingMachineTracker vise à répondre à ce besoin en proposant un site web permettant de consulter en temps réel l'état (libre / en cours) de chacune des 8 machines ainsi que la durée écoulée depuis le début du cycle en cours.

## Fréquence d'actualisation

La donnée affichée sur le site (état de la machine et durée du cycle) devra être actualisée à une fréquence comprise entre 10 secondes et 1 minute, afin d'offrir une information suffisamment récente sans surcharger inutilement le réseau ou les capteurs.

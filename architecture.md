# Architecture — WashingMachineTracker

## Vue d'ensemble

```
[ESP32 × 8] --(protocole à définir)--> [Raspberry Pi]
                                              |
                                    Script Python (agrégation)
                                              |
                                    POST JSON (1x/min, clé API)
                                              v
                                    [Serveur de prod]
                                    endpoint: /IoT/WashingMachineTracker.json
                                              |
                                    Site public de visualisation
```

Le Raspberry Pi reste un simple collecteur/émetteur de données : il n'a besoin que d'une connexion sortante vers le serveur de prod, sans exposer de port entrant. Toute la logique de présentation et le site public sont déportés sur le serveur de prod.

## Flux de données

1. Chaque ESP32 mesure les vibrations de sa machine et calcule une valeur agrégée sur une fenêtre (durée à définir, piste : 5-10s, écart-type/RMS plutôt que moyenne brute).
2. Le Raspberry Pi reçoit ces valeurs pour les 8 machines et les rassemble dans un JSON.
3. Le Raspberry Pi envoie ce JSON par **POST** vers le serveur de prod, sur l'endpoint `/IoT/WashingMachineTracker.json`, au maximum **1 fois par minute**.
4. L'appel est authentifié par une **clé API**.
5. Le serveur de prod héberge le site public qui exploite ce JSON pour l'affichage.

Le Raspberry Pi n'envoie qu'un seul point temporel par machine à chaque envoi (pas d'historique côté Pi). C'est le serveur de prod qui a la responsabilité de conserver l'historique des points reçus au fil des envois, afin de permettre l'affichage des graphes de vibration et leur historique côté site.

## Format du JSON (V1)

Premier POC : uniquement l'affichage des graphes de vibration, sans logique libre / en cours (celle-ci sera ajoutée dans un second temps).

```json
{
  "label": "IoT_WashingMachineTracker",
  "time_sent": "2026-09-10T14:32:00Z",
  "locals": {
    "machine_laver_1": 0.5,
    "machine_laver_2": 0.5,
    "machine_laver_3": 0.5,
    "machine_laver_4": 0.5,
    "machine_seche_linge_1": 0.5,
    "machine_seche_linge_2": 0.5,
    "machine_seche_linge_3": 0.5,
    "machine_seche_linge_4": 0.5
  }
}
```

- `label` : identifiant fixe du payload (`IoT_WashingMachineTracker`)
- `time_sent` : horodatage de l'envoi, heure du Raspberry Pi en UTC (format ISO 8601)
- `locals` : valeur de vibration agrégée par machine (8 machines : 4 laveuses + 4 sèche-linge)

*Format à affiner au fur et à mesure de l'avancement du POC. Le Pi envoie volontairement un seul point par machine par envoi ; l'agrégation sur une fenêtre plus large (ex. moyenne/RMS sur toute la minute plutôt qu'un échantillon ponctuel de 5-10s) pourra être ajustée si la résolution des graphes s'avère insuffisante.*

## Points restant à définir
- Protocole de communication ESP32 → Raspberry Pi (ESP-NOW envisagé, à confirmer)
- Durée de la fenêtre d'agrégation des vibrations côté ESP32
- Détail de la clé API (génération, stockage, rotation)
- Structure définitive du JSON une fois les premières données réelles disponibles
- Serveur Flask côté prod (endpoint POST + service du site) : à construire, cf. section précédente pour le squelette de code envisagé

## Avancement

Un premier POC du site de visualisation (front-end HTML/CSS/JS, sans backend) a été réalisé — cf. `frontend.md` pour son fonctionnement.

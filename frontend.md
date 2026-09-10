# Frontend — WashingMachineTracker

## Description

Premier POC du site de visualisation : HTML/CSS/JS pur, sans backend, sans dépendance externe. Affiche l'état des 8 machines (4 laveuses + 4 sèche-linge) et un historique de vibration sous forme de graphique.

Fichiers : `index.html`, `style.css`, `app.js`, dossier `data/`.

## Structure attendue du dossier `data/`

Le site lit tous les fichiers `data_<timestamp>.json` présents dans `data/`, chacun correspondant à un envoi (un point temporel, cf. `architecture.md` pour le format détaillé).

```
data/
├── data_1789042943.json
├── data_1789043003.json
├── data_1789043063.json
├── ...
└── manifest.json
```

### Pourquoi un `manifest.json` ?

Un site web ne peut pas lister le contenu d'un dossier depuis le navigateur (restriction de sécurité). Le fichier `manifest.json` liste donc explicitement les noms des fichiers `data_*.json` présents, pour que le site sache lesquels charger.

Format : un simple tableau de noms de fichiers.

```json
["data_1789042943.json", "data_1789043003.json", "data_1789043063.json"]
```

À régénérer à chaque ajout/suppression de fichier dans `data/` (à terme, ce sera le rôle du serveur de prod/Flask de le maintenir à jour automatiquement).

## Lancer le site en local

Ne pas ouvrir `index.html` en double-clic direct : le navigateur bloque la lecture des fichiers JSON locaux (CORS). Servir le dossier via un petit serveur local :

```bash
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000` dans le navigateur.

## Fonctionnement du site

- **Cartes machines** (2 rangées de 4) : icône, nom, statut LIBRE / EN COURS, durée depuis le début du cycle si en cours. Le statut est déterminé par un seuil simple sur la dernière valeur de vibration reçue (`BUSY_THRESHOLD` dans `app.js`, actuellement `0.2`) — provisoire, en attendant la vraie logique de détection (cf. `cahier_des_charges.md`, qui sera développée dans un second temps).
- **Graphique d'historique** : une courbe par machine, superposées sur un seul graphique, affichables/masquables via des checkboxes.

## Données d'exemple

Des jeux de données factices ont été générés pour tester le rendu :
- Un jeu complet (~121 fichiers, 2h d'historique simulé avec plusieurs profils de machines).
- Un jeu minimal (5 fichiers, valeurs simples et lisibles à la main) pour vérifier rapidement le comportement libre/en cours.

## Limites connues du POC actuel
- Seuil de détection libre/en cours arbitraire, à affiner avec de vraies données.
- Pas de backend : le `manifest.json` doit être régénéré manuellement pour l'instant.
- Le graphique est fait en Canvas natif (pas de librairie externe), suffisant pour ce stade mais pourra être remplacé si besoin de fonctionnalités plus avancées.

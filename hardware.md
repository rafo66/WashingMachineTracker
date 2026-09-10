# Hardware — WashingMachineTracker

## Architecture

Un boîtier par machine (8 au total), équipé d'un microcontrôleur ESP32 et d'un accéléromètre, envoie l'état de la machine à un Raspberry Pi central via ESP-NOW. Le Raspberry Pi centralise les données des 8 boîtiers et est connecté au réseau de la résidence, sur lequel il héberge le site web de consultation.

## Choix techniques

### Microcontrôleur : ESP32
L'ESP32 ne dispose pas d'accéléromètre intégré, un capteur externe est donc nécessaire. Sa consommation est plus élevée que certaines alternatives (ex. nRF52), mais son écosystème et sa documentation en font un choix adapté pour un premier POC. L'usage d'ESP-NOW (plutôt que du WiFi classique) permet de limiter fortement l'impact de cette consommation sur l'autonomie des piles.

### Capteur : accéléromètre LIS3DH
Choisi pour sa fonction d'interruption matérielle "motion detect", qui permet de réveiller l'ESP32 uniquement lors d'un mouvement plutôt que par un réveil minuté systématique. Vérifier que la broche d'interruption (INT1) est bien exposée sur le breakout choisi.

### Communication ESP32 → Raspberry Pi : ESP-NOW
Retenu à la place du WiFi classique pour réduire drastiquement le temps d'éveil actif de l'ESP32 (pas de handshake d'association réseau), ce qui est déterminant pour l'autonomie sur piles.

### Alimentation des boîtiers : piles
**Choix retenu : alimentation par piles (2× AA).**

Une alimentation secteur par boîtier a été envisagée puis écartée : tirer 8 câbles d'alimentation dans une buanderie de taille réduite pose des problèmes pratiques (câblage au sol/au mur, sécurité électrique en milieu humide, esthétique, dépendance à la disponibilité de prises libres).

Le choix des piles implique une stratégie basse consommation optimisée (ESP-NOW + réveil événementiel via interruption du LIS3DH) afin de respecter la contrainte d'autonomie ci-dessous.

**Contrainte : fréquence max de changement de piles : 1 mois.**

*\* Piste à explorer plus tard : alimenter le Raspberry Pi central en Power over Ethernet (PoE) plutôt qu'en secteur classique, si un switch ou injecteur PoE est disponible sur le réseau de la résidence. Permettrait de n'utiliser qu'un seul câble (alimentation + réseau) pour le hub. Nécessite un HAT PoE compatible (ex. officiel Raspberry Pi, ~20-25€) et une source PoE (switch ou injecteur, ~15-30€ si absent). Non retenu pour le moment, alimentation secteur classique du Pi conservée.*

### Boîtier physique
Impression 3D (gratuite), fixation par adhésif double-face.

## Liste de matériel

### Par boîtier (× 8 à terme)

| Composant | Référence suggérée | Rôle | Prix indicatif |
|---|---|---|---|
| Microcontrôleur | ESP32 (dev board type ESP32-WROOM-32, ou variante DevKitC) | Cerveau du boîtier, gère le sommeil, la lecture capteur, l'envoi ESP-NOW | ~5-8€ |
| Accéléromètre | LIS3DH (breakout I2C, avec broche INT1 exposée) | Détection de vibration + interruption matérielle pour réveil événementiel | ~3-5€ |
| Alimentation | 2× piles AA + support de piles | Alimentation autonome du boîtier | ~2-3€ (support) + piles |
| Boîtier physique | Impression 3D | Protection mécanique, tenue en milieu humide (buanderie) | Gratuit |
| Fixation | Adhésif double-face fort (déjà disponible) | Fixer le boîtier sur la machine | Gratuit |
| Câblage/connectique | Fils Dupont ou soudure directe (déjà disponible) | Relier ESP32 ↔ LIS3DH en I2C | Gratuit |

**Total estimé par boîtier : ~8-13€** (matériel électronique uniquement, boîtier/fixation/connectique déjà disponibles).

### Hub central (× 1)

| Composant | Référence suggérée | Rôle | Prix indicatif |
|---|---|---|---|
| Raspberry Pi | Déjà disponible | Réception ESP-NOW/WiFi, traitement, hébergement du site web | — |
| Alimentation Pi | Bloc secteur 5V officiel | Alimentation fixe du hub | ~8-10€ |
| Stockage | Carte microSD (16-32 Go, classe 10) | OS + logs + code | ~5-8€ |

### Outillage de développement (une seule fois)

**Déjà disponible via La Fabrique — gratuit.**

| Composant | Rôle |
|---|---|
| Multimètre | Mesure des consommations réelles, validation des calculs d'autonomie |
| Fer à souder + étain | Montage définitif, plus fiable qu'un breadboard sur le long terme |
| Câble USB-C/micro-USB | Flasher l'ESP32 |

## Montant total de la demande de financement

| Poste | Fourchette basse | Fourchette haute |
|---|---|---|
| 8 boîtiers (8 × 8-13€) | 64€ | 104€ |
| Hub central | 13€ | 18€ |
| **Total** | **77€** | **122€** |

*Fourchette indicative selon les références exactes retenues (ex. piles AA rechargeables ou non). Raspberry Pi, adhésif de fixation, connectique et outillage de développement déjà disponibles (via La Fabrique pour l'outillage), non comptés. Montant hors piste PoE (non retenue pour le moment, cf. astérisque ci-dessus).*

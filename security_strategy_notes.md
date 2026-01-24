# Stratégie de Sécurité et Exposition Internet - InfoMap

Ce document synthétise les options discutées pour rendre InfoMap accessible sur internet de manière sécurisée et souveraine.

## 1. Options de Tunneling (Sans ouverture de ports)

### Cloudflare Tunnel (Américain)
- **Avantages** : 100% Gratuit, illimité, cache l'IP réelle, protection DDoS robuste.
- **Inconvénients** : Entreprise américaine, les données transitent par leur réseau.

### Traefik Hub (Européen - Français 🇫🇷)
- **Avantages** : Souveraineté européenne, intégration Docker native, simple à configurer.
- **Inconvénients** : Version gratuite limitée (environ 1 Go de bande passante/mois), peut devenir payant pour un usage intensif.

## 2. Option "Forteresse Locale" (Exposition Directe)

Cette option consiste à ouvrir les ports 80 (HTTP) et 443 (HTTPS) sur la box internet.

### Composants de la Barricade
1. **Nginx Proxy Manager** : Gère le trafic entrant et les certificats SSL Let's Encrypt (Gratuit).
2. **CrowdSec (Français 🇫🇷)** : Système de détection d'intrusion communautaire. Analyse les logs et bannit automatiquement les adresses IP malveillantes.
3. **Geofencing** : Possibilité de restreindre l'accès à certains pays uniquement (ex: France/Europe).

### Risques et Préventions
- **Visibilité de l'IP** : L'adresse IP de la box est visible via le domaine.
- **Sécurité de la Box** : Faible risque pour la box, le risque est sur le PC.
- **Isolation** : Utilisation de réseaux Docker isolés pour empêcher toute intrusion de se propager au réseau domestique.

## 3. Choix du Domaine

- **Nom choisi** : `infomap.ovh`
- **Registrar** : OVHcloud (Français 🇫🇷)
- **Avantage** : Extension peu coûteuse (3-4€/an), stable et reconnue dans l'écosystème tech européen.

## 4. Mesures de Sécurité Applicatives (Déjà implémentées)

- **Rate Limiting** : Limitation à 10 requêtes par minute par IP pour l'API de news.
- **User Authorization** : Système de "Whitelist" où l'administrateur doit activer manuellement chaque nouvel utilisateur.
- **En-têtes Nginx** : Configuration prévue pour masquer la version du serveur et empêcher le détournement de clics (X-Frame-Options, etc.).

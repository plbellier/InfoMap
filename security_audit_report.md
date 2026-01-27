# Rapport d'Audit de Sécurité - InfoMap
*Date : Mardi 27 Janvier 2026*

Ce document résume l'audit de sécurité effectué sur l'application InfoMap et son environnement d'exécution.

## 🛡️ Points Forts (Bonnes Pratiques Identifiées)

*   **Gestion des Secrets** : Le fichier `.gitignore` est correctement configuré pour exclure les fichiers `.env`, les bases de données SQLite et les fichiers de cache.
*   **Conteneurisation Sécurisée** : Les `Dockerfile` (backend et frontend) utilisent des utilisateurs non-privilégiés (`appuser`), limitant l'impact en cas de compromission d'un conteneur.
*   **Sécurité Nginx** :
    *   Désactivation de `server_tokens` (masque la version de Nginx).
    *   En-têtes de sécurité configurés (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
*   **Protection Applicative** :
    *   **Rate Limiting** : Utilisation de `slowapi` pour limiter les requêtes sur les endpoints sensibles.
    *   **Authentification & Autorisation** : Système basé sur OAuth (Google) avec une "Whitelist" (seuls les utilisateurs approuvés sont `is_active`).
    *   **Prévention SQLi** : Utilisation de `SQLModel` (SQLAlchemy) qui utilise des requêtes paramétrées par défaut.
*   **Exposition Réseau** : Utilisation prévue de **Cloudflare Tunnel**, ce qui évite d'ouvrir des ports sur la box internet et cache l'IP réelle.

## ⚠️ Points de Vigilance et Risques (À corriger)

### 1. Configuration des Secrets
*   **Risque** : Dans `main.py`, la variable `SESSION_SECRET_KEY` possède une valeur par défaut : `"temporary-secret-key-change-it"`.
*   **Recommandation** : S'assurer que cette clé est toujours surchargée par une valeur aléatoire complexe dans le `.env` en production.

### 2. Exposition des Ports Docker
*   **Risque** : Le `docker-compose.yml` expose le port `8000` du backend sur toutes les interfaces du système hôte (`0.0.0.0:8000`).
*   **Recommandation** : Restreindre à `127.0.0.1:8000:8000` ou supprimer l'exposition si Nginx suffit.

### 3. Dépendances Non Figées
*   **Risque** : Le fichier `backend/requirements.txt` ne spécifie pas de versions exactes.
*   **Recommandation** : Verrouiller les versions (ex: `fastapi==0.109.0`) pour garantir la stabilité et la sécurité.

### 4. Mode Développement en Production
*   **Risque** : Le conteneur frontend utilise `npm run dev` (Vite), non optimisé pour la production.
*   **Recommandation** : Créer un build statique et le servir via Nginx.

### 5. Gestion des Administrateurs
*   **Risque** : L'email administrateur est écrit en dur dans `database.py`.
*   **Recommandation** : Passer par une variable d'environnement ou une table de configuration.

## 🚀 Recommandations prioritaires

1.  **Générer une clé de session forte** : `openssl rand -hex 32` et l'ajouter au `.env`.
2.  **Restreindre les ports** : Modifier `docker-compose.yml` pour limiter l'exposition directe.
3.  **Audit de dépendances** : Exécuter `npm audit` et `safety` régulièrement.
4.  **Optimiser HTTPX** : Utiliser un seul `AsyncClient` global dans FastAPI.

# 🌍 InfoMap

> **Intelligence Matrix** — Un tableau de bord géopolitique interactif propulsé par l'IA, offrant des analyses d'actualités en temps réel par pays.

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## ✨ Fonctionnalités

- 🗺️ **Carte interactive du monde** — Sélectionnez un pays d'un simple clic
- 🤖 **Résumés d'actualités par IA** — Propulsés par l'API Perplexity (Sonar Pro)
- 🎯 **Filtres thématiques** — Général, Politique, Économie, Tech, Militaire/Géo
- ⏱️ **Filtres temporels** — Dernières 24h ou 7 jours
- 👮 **Panel d'administration** — Gestion des utilisateurs et des quotas d'API
- 🔐 **Authentification Google OAuth 2.0** — Accès sécurisé

## 🏗️ Architecture

```
InfoMap/
├── backend/          # API FastAPI (Python 3.11+)
│   ├── main.py       # Routes API, auth, middleware
│   ├── database.py   # Service de base de données SQLite
│   ├── models.py     # Modèles SQLModel (User, DailyQuota)
│   └── Dockerfile
├── frontend/         # Application React + Vite + TypeScript
│   ├── src/
│   │   ├── components/   # Composants UI (Globe, AdminPanel, HUD...)
│   │   └── App.tsx
│   ├── nginx.conf    # Configuration de production
│   └── Dockerfile
├── nginx/            # Reverse proxy configuration
├── conductor/        # Documentation technique (privée)
└── docker-compose.yml
```

## 🚀 Déploiement

### Prérequis
- Docker & Docker Compose
- Clés API : Google OAuth, Perplexity AI
- (Optionnel) Cloudflare Tunnel pour le HTTPS

### Installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/votre-user/InfoMap.git
   cd InfoMap
   ```

2. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   # Éditez .env avec vos clés API
   ```

3. **Lancer l'application**
   ```bash
   docker-compose up --build -d
   ```

4. **Accéder à l'application**
   - Local : `http://localhost` (via le conteneur Nginx)
   - Production : L'URL de votre tunnel Cloudflare

## ⚙️ Configuration

| Variable | Description | Requis |
|----------|-------------|--------|
| `PERPLEXITY_API_KEY` | Clé API Perplexity | ✅ |
| `GOOGLE_CLIENT_ID` | ID client OAuth Google | ✅ |
| `GOOGLE_CLIENT_SECRET` | Secret client OAuth | ✅ |
| `SESSION_SECRET_KEY` | Clé secrète pour les sessions | ✅ (production) |
| `ADMIN_EMAIL` | Email de l'administrateur par défaut | ❌ |
| `FRONTEND_URL` | URL du frontend pour les redirections | ❌ |

## 🔒 Sécurité

Ce projet suit les meilleures pratiques de sécurité :
- **Rate Limiting** : 10 requêtes/minute par utilisateur
- **Authentification** : OAuth 2.0 via Google
- **Sessions** : Sécurisées avec `SessionMiddleware` (clé secrète requise en production)
- **CORS** : Configuration stricte
- **En-têtes HTTP** : X-Frame-Options, X-XSS-Protection, X-Content-Type-Options
- **Secrets** : Toutes les clés sensibles sont externalisées dans des variables d'environnement

Pour plus de détails, consultez [SECURITY.md](SECURITY.md).

## 📜 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<p align="center">
  <em>Built with ❤️ by Pierre-Louis Bellier</em>
</p>

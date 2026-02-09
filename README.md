# 🌍 InfoMap

> **Intelligence Matrix** — An interactive geopolitical dashboard powered by AI, providing real-time news analysis by country.

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## ✨ Features

- 🗺️ **Interactive World Map** — Select a country with a single click
- 🤖 **AI-powered News Summaries** — Powered by Perplexity API (Sonar Pro)
- 🎯 **Topic Filters** — General, Politics, Economy, Tech, Military/Geo
- ⏱️ **Time Filters** — Last 24 hours or 7 days
- 👮 **Admin Panel** — User management and API quota control
- 🔐 **Google OAuth 2.0 Authentication** — Secure access

## 🏗️ Architecture

```
InfoMap/
├── backend/          # FastAPI API (Python 3.11+)
│   ├── main.py       # API routes, auth, middleware
│   ├── database.py   # SQLite database service
│   ├── models.py     # SQLModel models (User, DailyQuota)
│   └── Dockerfile
├── frontend/         # React + Vite + TypeScript app
│   ├── src/
│   │   ├── components/   # UI components (Globe, AdminPanel, HUD...)
│   │   └── App.tsx
│   ├── nginx.conf    # Production configuration
│   └── Dockerfile
├── nginx/            # Reverse proxy configuration
├── conductor/        # Technical documentation (private)
└── docker-compose.yml
```

## 🚀 Deployment

### Prerequisites
- Docker & Docker Compose
- API Keys: Google OAuth, Perplexity AI
- (Optional) Cloudflare Tunnel for HTTPS

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/plbellier/InfoMap.git
   cd InfoMap
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start the application**
   ```bash
   docker-compose up --build -d
   ```

4. **Access the application**
   - Local: `http://localhost` (via Nginx container)
   - Production: Your Cloudflare tunnel URL

## ⚙️ Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `PERPLEXITY_API_KEY` | Perplexity API key | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | ✅ |
| `SESSION_SECRET_KEY` | Session secret key | ✅ (production) |
| `ADMIN_EMAIL` | Default administrator email | ❌ |
| `FRONTEND_URL` | Frontend URL for redirects | ❌ |

## 🔒 Security

This project follows security best practices:
- **Rate Limiting**: 10 requests/minute per user
- **Authentication**: OAuth 2.0 via Google
- **Sessions**: Secured with `SessionMiddleware` (secret key required in production)
- **CORS**: Strict configuration
- **HTTP Headers**: X-Frame-Options, X-XSS-Protection, X-Content-Type-Options
- **Secrets**: All sensitive keys externalized in environment variables

For more details, see [SECURITY.md](SECURITY.md).

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <em>Built with ❤️ by Pierre-Louis Bellier</em>
</p>

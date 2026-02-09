# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | ✅ Yes              |

## Reporting a Vulnerability

If you discover a security vulnerability within InfoMap, please follow these steps:

1. **Do not open a public issue** — This prevents the vulnerability from being exploited before it is patched.

2. **Send a private report** — Contact the maintainers via email at [pl.bellier@gmail.com](mailto:pl.bellier@gmail.com) with:
   - A clear description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - (Optional) A suggested fix

3. **Expect a response within 48-72 hours** — We take security seriously and will prioritize the issue.

4. **Coordinated disclosure** — Once the vulnerability is patched, we'll work with you to coordinate a responsible disclosure if appropriate.

## Security Measures in Place

InfoMap implements the following security controls:

### Authentication & Authorization
- Google OAuth 2.0 for user authentication
- Role-based access control (Admin/User)
- Session-based authentication with secure cookies

### API Security
- Rate limiting: 10 requests/minute per IP address
- Daily quota system per user to prevent API abuse
- Input validation on all endpoints

### Infrastructure
- Backend port restricted to `127.0.0.1` (not exposed to the public)
- All traffic routed through Nginx reverse proxy with security headers
- Environment variables for all secrets (never hardcoded)
- Cloudflare Tunnel for HTTPS termination

### HTTP Security Headers
```
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer-when-downgrade
server_tokens: off
```

### Data Protection
- No user passwords stored (OAuth only)
- Minimal data collection (email, name, profile picture)
- SQLite database stored locally, not exposed

## Development Security

When contributing, please ensure:
- Never commit `.env` files or any secrets
- Use the provided `.env.example` as a template
- Run dependency checks before submitting PRs
- Follow secure coding practices

---

Thank you for helping keep InfoMap safe! 🛡️

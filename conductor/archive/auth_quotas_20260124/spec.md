# Specification - Google Authentication & Multi-user Quotas

## Overview
Implement a secure authentication layer using Google OAuth2 to restrict access to the InfoMap application. The system will differentiate between the administrator and regular users to apply specific API usage quotas, manageable via an admin interface.

## User Stories
- As an owner, I want to be the only one with full access to the application's search capabilities.
- As a visitor, I want to be able to use the application within a limited quota after signing in with my Google account.
- As the administrator, I want to ensure that only authorized sessions can reach the backend services.
- As the administrator, I want a secure way to see who is using the app and adjust their quotas.

## Functional Requirements
### Authentication & Authorization
- **Gatekeeper Page:** Implement a dedicated login page that appears before any other application content.
- **Google OAuth2 Flow:** Backend-driven authentication flow (FastAPI) with secure callback handling.
- **Session Management:** Use secure, HTTP-only cookies to store session information.
- **Admin Identification:** Specifically identify `pl.bellier@gmail.com` as the administrator.

### Quota Management
- **Persistence Layer:** Transition from file-based quota (`quota.json`) to a SQLite database.
- **User-Specific Tracking:** Record API calls per user (indexed by Google email) per day.
- **Dynamic Limits:** 
    - Default limit for regular users: 5 successful news queries per 24-hour period.
    - Limits are configurable per user in the database.

### Admin Interface
- **Access Control:** Restricted strictly to `pl.bellier@gmail.com`.
- **User Management:** List all authenticated users, their current usage, and their daily limit.
- **Quota Control:** Simple interface to update the `max_daily_quota` for any user.

## UI/UX Requirements
- **Login Aesthetic:** "High-tech/Terminal" style.
- **Visuals:** Blurred or stylized world map background with a central login terminal prompt: `SYSTEM ACCESS REQUIRED`.
- **Feedback:** Clear "Access Denied" or "Quota Exceeded" messages in the terminal style.
- **Admin Panel:** A discreet settings/admin icon for the owner opening a management overlay.

## Technical Constraints
- Use `authlib` for FastAPI OAuth2 integration.
- Use SQLite for quota persistence.
- Session-based security via cookies.

## Acceptance Criteria
- [ ] No user can see the 3D map without a valid Google login.
- [ ] `pl.bellier@gmail.com` can perform more than 5 queries per day (by default or via admin adjustment).
- [ ] Any other user is blocked with a 429 error after their 5th query (or their specific limit).
- [ ] Sessions persist correctly across page refreshes.
- [ ] The admin panel is invisible and inaccessible to non-admin users.

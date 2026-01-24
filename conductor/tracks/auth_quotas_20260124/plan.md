# Implementation Plan - Google Authentication, SQLite & Admin Management

## Phase 1: Persistence Layer Migration (SQLite) [checkpoint: 9ec36a8]
- [x] Task: Define the Database Schema and Models. 9ec36a8
    - [x] Write Tests: Create `backend/test_models.py` to verify User and Quota models (including `max_daily_quota`).
    - [x] Implement: Create `backend/models.py` with SQLAlchemy/SQLModel.
- [x] Task: Implement Database Repository and Service. 9ec36a8
    - [x] Write Tests: Test CRUD operations and per-user quota logic in `backend/test_database.py`.
    - [x] Implement: Create `backend/database.py` (replacing file-based storage).
- [x] Task: Conductor - User Manual Verification 'Phase 1: Persistence Layer Migration (SQLite)' (Protocol in workflow.md)

## Phase 2: Backend Authentication (FastAPI & Google OAuth2) [checkpoint: 1100568]
- [x] Task: Configure OAuth2 Client and Sessions. 1100568
    - [x] Write Tests: Test session middleware and environment variable loading.
    - [x] Implement: Install `authlib`, configure `SessionMiddleware`.
- [x] Task: Implement OAuth2 Routes (Login, Callback, Logout). 1100568
    - [x] Write Tests: Mock Google API responses for login flows.
    - [x] Implement: Add `/login`, `/auth`, and `/logout` endpoints.
- [x] Task: Implement Authentication Middleware/Dependency. 1100568
    - [x] Write Tests: Test protection of endpoints.
    - [x] Implement: Create `get_current_user` dependency.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Backend Authentication (FastAPI & Google OAuth2)' (Protocol in workflow.md)

## Phase 3: Quota Logic & Admin Privileges [checkpoint: 1100568]
- [x] Task: Update News Endpoint with Dynamic Quotas. 1100568
    - [x] Write Tests: Verify limits are correctly applied based on user profile in DB.
    - [x] Implement: Refactor `get_country_news` to fetch limits from the database.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Quota Logic & Admin Privileges' (Protocol in workflow.md)

## Phase 4: Frontend Integration & Login UI [checkpoint: 1100568]
- [x] Task: Create the Matrix Login Page. 1100568
    - [x] Write Tests: Component tests for the Login screen (Terminal style).
    - [x] Implement: Create `frontend/src/components/Login.tsx`.
- [x] Task: Implement Authentication Guard in React. 1100568
    - [x] Write Tests: Test redirection logic.
    - [x] Implement: Update `App.tsx` for session management and login display.
- [x] Task: Conductor - User Manual Verification 'Phase 4: Frontend Integration & Login UI' (Protocol in workflow.md)

## Phase 5: Admin Management Interface [checkpoint: 3613269]
- [x] Task: Implement Admin API Endpoints. 3613269
    - [x] Write Tests: Verify that only `pl.bellier@gmail.com` can access `/admin/users`.
    - [x] Implement: Add endpoints to list users and update their `max_daily_quota`.
- [x] Task: Create Admin Dashboard Component. 3613269
    - [x] Write Tests: Test UI display for user management.
    - [x] Implement: `frontend/src/components/AdminPanel.tsx` with user list and editable quotas.
- [x] Task: Conductor - User Manual Verification 'Phase 5: Admin Management Interface' (Protocol in workflow.md)

# Implementation Plan - Google Authentication, SQLite & Admin Management

## Phase 1: Persistence Layer Migration (SQLite) [checkpoint: 9ec36a8]
- [x] Task: Define the Database Schema and Models. 9ec36a8
    - [x] Write Tests: Create `backend/test_models.py` to verify User and Quota models (including `max_daily_quota`).
    - [x] Implement: Create `backend/models.py` with SQLAlchemy/SQLModel.
- [x] Task: Implement Database Repository and Service. 9ec36a8
    - [x] Write Tests: Test CRUD operations and per-user quota logic in `backend/test_database.py`.
    - [x] Implement: Create `backend/database.py` (replacing file-based storage).
- [x] Task: Conductor - User Manual Verification 'Phase 1: Persistence Layer Migration (SQLite)' (Protocol in workflow.md)

## Phase 2: Backend Authentication (FastAPI & Google OAuth2)
- [ ] Task: Configure OAuth2 Client and Sessions.
    - [ ] Write Tests: Test session middleware and environment variable loading.
    - [ ] Implement: Install `authlib`, configure `SessionMiddleware`.
- [ ] Task: Implement OAuth2 Routes (Login, Callback, Logout).
    - [ ] Write Tests: Mock Google API responses for login flows.
    - [ ] Implement: Add `/login`, `/auth`, and `/logout` endpoints.
- [ ] Task: Implement Authentication Middleware/Dependency.
    - [ ] Write Tests: Test protection of endpoints.
    - [ ] Implement: Create `get_current_user` dependency.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Backend Authentication (FastAPI & Google OAuth2)' (Protocol in workflow.md)

## Phase 3: Quota Logic & Admin Privileges
- [ ] Task: Update News Endpoint with Dynamic Quotas.
    - [ ] Write Tests: Verify limits are correctly applied based on user profile in DB.
    - [ ] Implement: Refactor `get_country_news` to fetch limits from the database.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Quota Logic & Admin Privileges' (Protocol in workflow.md)

## Phase 4: Frontend Integration & Login UI
- [ ] Task: Create the Matrix Login Page.
    - [ ] Write Tests: Component tests for the Login screen (Terminal style).
    - [ ] Implement: Create `frontend/src/components/Login.tsx`.
- [ ] Task: Implement Authentication Guard in React.
    - [ ] Write Tests: Test redirection logic.
    - [ ] Implement: Update `App.tsx` for session management and login display.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Frontend Integration & Login UI' (Protocol in workflow.md)

## Phase 5: Admin Management Interface
- [ ] Task: Implement Admin API Endpoints.
    - [ ] Write Tests: Verify that only `pl.bellier@gmail.com` can access `/admin/users`.
    - [ ] Implement: Add endpoints to list users and update their `max_daily_quota`.
- [ ] Task: Create Admin Dashboard Component.
    - [ ] Write Tests: Test UI display for user management.
    - [ ] Implement: `frontend/src/components/AdminPanel.tsx` with user list and editable quotas.
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Admin Management Interface' (Protocol in workflow.md)

# Implementation Plan - MVP Core: Interactive World Map with AI News Summaries

## Phase 1: Project Scaffolding & Environment
- [x] Task: Set up the project structure with Docker and Docker Compose. 906b4d1
    - [x] Create `Dockerfile` for Frontend (React).
    - [x] Create `Dockerfile` for Backend (FastAPI).
    - [x] Create `docker-compose.yml` to orchestrate services.
- [x] Task: Initialize the FastAPI backend. 6a8277d
    - [x] Write basic health check endpoint.
    - [x] Configure environment variable management for API keys.
- [x] Task: Initialize the React frontend.
    - [x] Set up Tailwind CSS.
    - [x] Verify frontend can communicate with backend.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Project Scaffolding & Environment' (Protocol in workflow.md)

## Phase 2: Interactive Map Implementation
- [x] Task: Integrate react-globe.gl into the React application.
    - [x] Implement Feature: Render a 3D globe.
- [x] Task: Load and style GeoJSON data.
    - [x] Implement Feature: Overlay country boundaries and implement hover highlights.
- [x] Task: Implement country click selection.
    - [x] Implement Feature: Store selected country in application state and zoom to it.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Interactive Map Implementation' (Protocol in workflow.md)

## Phase 3: Backend & Perplexity API Integration
- [x] Task: Implement news fetching service on the backend.
    - [x] Implement Feature: Integration with Perplexity API for summarization.
- [x] Task: Implement server-side caching.
    - [x] Implement Feature: Add caching layer for API responses.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Backend & Perplexity API Integration' (Protocol in workflow.md)

## Phase 4: UI Integration & News Display
- [x] Task: Create the News Sidebar component.
    - [x] Implement Feature: UI for country name and news content.
- [x] Task: Connect Frontend to Backend News API.
    - [x] Implement Feature: Fetch news on country click and display in sidebar.
- [x] Task: Implement Loading and Error States.
    - [x] Implement Feature: Add spinners and error messages.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: UI Integration & News Display' (Protocol in workflow.md)

# Implementation Plan - MVP Core: Interactive World Map with AI News Summaries

## Phase 1: Project Scaffolding & Environment
- [x] Task: Set up the project structure with Docker and Docker Compose. 906b4d1
    - [x] Create `Dockerfile` for Frontend (React).
    - [x] Create `Dockerfile` for Backend (FastAPI).
    - [x] Create `docker-compose.yml` to orchestrate services.
- [ ] Task: Initialize the FastAPI backend.
    - [ ] Write basic health check endpoint.
    - [ ] Configure environment variable management for API keys.
- [ ] Task: Initialize the React frontend.
    - [ ] Set up Tailwind CSS.
    - [ ] Verify frontend can communicate with backend.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Project Scaffolding & Environment' (Protocol in workflow.md)

## Phase 2: Interactive Map Implementation
- [ ] Task: Integrate Leaflet.js into the React application.
    - [ ] Write Tests: Verify map component rendering.
    - [ ] Implement Feature: Render a basic world map.
- [ ] Task: Load and style GeoJSON data.
    - [ ] Write Tests: Verify GeoJSON data loading.
    - [ ] Implement Feature: Overlay country boundaries and implement hover highlights.
- [ ] Task: Implement country click selection.
    - [ ] Write Tests: Verify click event captures country ID/name.
    - [ ] Implement Feature: Store selected country in application state.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Interactive Map Implementation' (Protocol in workflow.md)

## Phase 3: Backend & Perplexity API Integration
- [ ] Task: Implement news fetching service on the backend.
    - [ ] Write Tests: Mock Perplexity API response and verify service logic.
    - [ ] Implement Feature: Integration with Perplexity API for summarization.
- [ ] Task: Implement server-side caching.
    - [ ] Write Tests: Verify cache hit/miss behavior.
    - [ ] Implement Feature: Add caching layer for API responses.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Backend & Perplexity API Integration' (Protocol in workflow.md)

## Phase 4: UI Integration & News Display
- [ ] Task: Create the News Modal component.
    - [ ] Write Tests: Verify modal rendering with mock data.
    - [ ] Implement Feature: UI for country flag, name, and news content.
- [ ] Task: Connect Frontend to Backend News API.
    - [ ] Write Tests: Verify data fetching and state updates.
    - [ ] Implement Feature: Fetch news on country click and display in modal.
- [ ] Task: Implement Loading and Error States.
    - [ ] Write Tests: Verify UI behavior during loading and on API failure.
    - [ ] Implement Feature: Add spinners and error messages to the modal.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: UI Integration & News Display' (Protocol in workflow.md)

# Specification - MVP Core: Interactive World Map with AI News Summaries

## Overview
This track implements the core functionality of InfoMap: a web application featuring an interactive world map where users can click on countries to receive AI-generated news summaries powered by the Perplexity API.

## Functional Requirements
- **Interactive Map:**
    - Render a world map using Leaflet.js.
    - Load country boundaries from GeoJSON data.
    - Implement hover effects (color change/highlight) for countries.
    - Implement click interaction to select a country.
- **Backend API:**
    - Develop a FastAPI server to handle requests from the frontend.
    - Integrate with Perplexity API to fetch and summarize news for a specific country.
    - Implement server-side caching for API responses to optimize performance and cost.
- **News Modal:**
    - Display a modal or sidebar upon country selection.
    - Show country flag, name, AI summary, and a list of top headlines with links.
    - Implement loading and error states for the news fetching process.

## Non-Functional Requirements
- **Performance:** Map initialization and country interaction should be fast and fluid.
- **Security:** Securely manage Perplexity API keys on the backend (e.g., using environment variables).
- **Architecture:** Use Docker and Docker Compose for local development and deployment.

## Tech Stack
- **Frontend:** React, Leaflet.js, Tailwind CSS.
- **Backend:** Python (FastAPI), Uvicorn.
- **Infrastructure:** Docker, Docker Compose.

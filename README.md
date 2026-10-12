# AirAware India

AirAware India is an air-quality monitoring and route-planning platform that helps people understand local pollution levels and make more informed travel decisions. It brings AQI information, pollutant details, route comparisons, and configurable pollution alerts into one interface.

**Live demo:** https://air-prediction.vercel.app/  
**Repository:** https://github.com/Takurreddy/Air-prediction-

## Overview

AirAware India is designed to make air-quality information easier to explore and use. Users can check AQI conditions, review key pollutants, compare routes with air quality in mind, and configure alerts when pollution crosses a chosen threshold.

The project also explores time-series forecasting for air-quality trends using an LSTM-based model.

## Features

- **AQI dashboard:** View air-quality readings and pollutant details, including PM2.5, PM10, CO, NO₂, SO₂, and O₃.
- **Location-aware results:** Use the current location to find nearby air-quality information.
- **Air-quality-aware route planning:** Compare a conventional route with a lower-pollution alternative where supported by available data.
- **Route exposure estimates:** Explore estimated pollution exposure at points along a journey.
- **Pollution alerts:** Configure AQI thresholds and receive notifications through the supported notification setup.
- **User accounts:** Authentication and saved user preferences.
- **AQI forecasting:** An LSTM-based time-series forecasting component for exploring future air-quality trends.

## How it works

1. **Collect data** from configured air-quality and environmental data sources.
2. **Process readings** into a consistent format for analysis and display.
3. **Forecast trends** with the LSTM-based prediction component where historical sequences are available.
4. **Serve results** through the FastAPI backend.
5. **Present insights** in the React interface, including dashboard readings and route comparisons.
6. **Send alerts** when configured thresholds are exceeded and the notification service is enabled.

## Technology stack

- **Frontend:** React, React Router, React-Leaflet, CSS
- **Backend and APIs:** Python, FastAPI
- **Machine learning:** LSTM time-series forecasting
- **Database:** PostgreSQL on Supabase; InfluxDB for time-series data
- **Caching and background tasks:** Redis and background workers
- **Maps and routing:** Leaflet, CartoDB, OSRM
- **Authentication and notifications:** Supabase and Twilio
- **Deployment:** Docker, Docker Compose, Vercel

## Architecture

```text
Air-quality and environmental data
              |
              v
     Data processing pipeline
              |
       +------+------+
       |             |
       v             v
 Historical data   AQI forecasting
       |          (LSTM model)
       +------+------+
              |
              v
       FastAPI backend
              |
       +------+----------------+
       |                       |
       v                       v
 React dashboard         Route planning
       |
       v
 Configurable AQI alerts
```

## Project structure

The repository contains frontend and backend components. The names below reflect the structure documented for the project; exact paths may vary as the codebase evolves.

```text
AirAware India/
├── AQI-Project/                  # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── config/
│       ├── context/
│       └── services/
└── route-air-quality-backend/    # FastAPI backend
    ├── app/
    │   ├── api/
    │   ├── routers/
    │   ├── services/
    │   └── workers/
    ├── docker-compose.yml
    └── requirements.txt
```

## Getting started

### Prerequisites

- Git
- Node.js and npm
- Python and pip
- Docker Desktop with Docker Compose
- Credentials for the external services enabled in your environment

### 1. Clone the repository

```bash
git clone https://github.com/Takurreddy/Air-prediction-.git
cd Air-prediction-
```

### 2. Configure the backend

Move into the backend directory and create a local environment file from the provided example, if available:

```bash
cd route-air-quality-backend
```

If the repository includes `.env.example`, copy it to `.env` and configure the required database, authentication, notification, and data-provider credentials. Keep secrets out of source control.

### 3. Start backend services

If the backend's Docker Compose configuration is available and configured:

```bash
docker compose up --build
```

Check the backend configuration for its API address and port. If database migrations are used, run the documented migration command before using database-backed features.

### 4. Start the frontend

Open a separate terminal, navigate to the frontend directory, install dependencies, and start the development server:

```bash
cd AQI-Project
npm install
npm start
```

If the frontend is in a nested directory in your checkout, use the actual directory containing its `package.json`. Configure the frontend API base URL to point to your running backend.

## Configuration and data

The application can depend on external data providers, database services, mapping/routing services, and notification credentials. Configure only the services required by the features you want to run. Availability and coverage of live readings depend on the configured data sources.

Never commit API keys, passwords, database connection strings, or private environment files. Use environment variables and keep `.env` files out of version control.

## Future improvements

- Expand historical AQI coverage and forecasting evaluation.
- Improve route scoring with more granular pollution and travel data.
- Add model evaluation metrics and reproducible experiments.
- Improve monitoring, error handling, and test coverage.

## Contributing

Contributions and suggestions are welcome. Open an issue to discuss a bug or feature, or submit a pull request with a clear description of the change.

---

*Stay informed. Make cleaner travel choices.*

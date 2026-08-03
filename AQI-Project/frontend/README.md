# Frontend setup

## Environment

Copy `.env.example` to `.env` and fill values:

- `REACT_APP_API_BASE_URL`: backend base URL (FastAPI)
- `REACT_APP_DEFAULT_CITY`: city used for initial AQI and station lookups
- `REACT_APP_CLERK_PUBLISHABLE_KEY`: required for Clerk sign-in/sign-up
- `REACT_APP_CLERK_JWT_TEMPLATE`: optional Clerk JWT template used for backend bearer token forwarding
- `REACT_APP_UI_TEMPLATE`: `default`, `forest`, or `dark`
- `REACT_APP_GOOGLE_MAPS_API_KEY`: Google Maps key for route planner autocomplete/map

## Features wired to backend

- JWT signup/login/profile via `/auth/*`
- Optional Clerk auth UI with JWT token forwarding to backend
- AQI dashboard via `/air-quality`
- Route evaluation via `/routes`
- Prediction via `/predict`
- Alerts CRUD via `/air-quality/alerts`

## Scripts

In this folder, run:

- `npm start`
- `npm test`
- `npm run build`

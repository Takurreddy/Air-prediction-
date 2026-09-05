<div align="center">
  <h1>🌬️ AirAware India</h1>
  <p><strong>India's Premier Air Quality Monitoring & Route Planning Platform</strong></p>

  [![React](https://img.shields.io/badge/Frontend-React-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
  [![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
  [![Twilio](https://img.shields.io/badge/Auth-Twilio-F22F46?style=for-the-badge&logo=twilio)](https://www.twilio.com/)
</div>

<br />

## 🌟 Overview

**AirAware India** is a comprehensive, interactive platform designed to help users track air quality, plan healthy routes, and receive critical pollution alerts across India. With a seamless user interface, multilingual support, and a powerful scalable backend, AirAware helps users mitigate their exposure to harmful pollutants (PM2.5, PM10, CO, NO₂, SO₂, O₃).

---

## ✨ Key Features

### 🗺️ Interactive AQI Dashboard
- **Live Air Quality Index:** View real-time AQI readings across India.
- **Smart Location:** One-click "📍 Locate Me" to instantly fetch data for the city nearest to you.
- **CartoDB Voyager Maps:** Clean, English-localized map tiles for a premium and consistent viewing experience.
- **Pollutant Breakdown:** Detailed metrics for major pollutants, along with temperature, humidity, and wind conditions.

### 🚗 Smart Route Planner
- **Health-Optimized Navigation:** Compares the "Fastest" route against the "🌿 Low-Pollution" route.
- **Auto-Calculation:** Routes automatically generate and adapt as soon as you select your origin and destination.
- **Waypoint Exposure Simulation:** Estimates your AQI exposure at various points throughout your journey.

### 🔔 Mobile Notifications & Alerts
- **Customizable Thresholds:** Set personalized AQI limits (down to 30 AQI) to trigger warnings.
- **Twilio SMS Alerts:** Direct SMS alerts sent to your mobile phone when a threshold is breached.
- **Health Profiles:** Tailor alerts based on specific sensitivities (e.g., Asthma, Elderly, Young Children).

### 🔐 Secure Authentication
- **Mobile OTP Login:** Fast and secure phone-based login powered by Twilio SMS.
- **Standard Email:** Traditional email and password support for standard access.
- **Supabase Cloud Database:** Secure, scalable, and reliable user data storage.

---

## 🌐 Tech Stack

**Frontend Architecture:**
- **Framework:** React.js, React Router
- **Maps:** React-Leaflet, CartoDB, OSRM (Routing)
- **Styling:** Vanilla CSS (Glassmorphism, Dark/Light Mode)

**Backend Architecture:**
- **Framework:** Python, FastAPI
- **Primary Database:** PostgreSQL (Hosted on Supabase)
- **Time-Series DB:** InfluxDB (for historical AQI data)
- **Caching & Queues:** Redis
- **Auth & SMS:** Twilio REST API
- **Deployment:** Docker & Docker Compose

---

## 📂 Project Structure

```bash
📦 Air_Quality_prjt
 ┣ 📂 AQI-Project (Frontend)
 ┃ ┣ 📂 public
 ┃ ┗ 📂 src
 ┃   ┣ 📂 components  # UI components (Dashboard, RoutePlanner, Auth, etc.)
 ┃   ┣ 📂 config      # Constants and city data
 ┃   ┣ 📂 context     # Auth and state management
 ┃   ┗ 📂 services    # API clients
 ┃
 ┗ 📂 route-air-quality-backend (Backend)
   ┣ 📂 app
   ┃ ┣ 📂 api         # FastAPI public REST endpoints
   ┃ ┣ 📂 routers     # Auth and Notification routers
   ┃ ┣ 📂 services    # ML Interface, Alert Dispatcher
   ┃ ┗ 📂 workers     # AQI Scheduler and background tasks
   ┣ 📜 docker-compose.yml # Container orchestration
   ┣ 📜 .env          # Environment variables (Twilio, Supabase, etc.)
   ┗ 📜 requirements.txt
```

---

## 🚀 Getting Started

The project uses Docker Compose to easily spin up the backend environment, including the FastAPI server, InfluxDB, Redis, and background workers.

### 1. Environment Configuration
Navigate to the backend directory and copy the example environment file:
```bash
cd route-air-quality-backend
cp .env.example .env
```
Open `.env` and fill in your API keys (Twilio, Supabase Pooler Credentials, etc.).

### 2. Backend Setup (Docker)
Start the entire backend stack using Docker Compose:
```bash
docker compose up -d
```
The FastAPI backend will now be running at `http://localhost:8000`.

*Note: The backend connects to a cloud-hosted Supabase PostgreSQL database. Make sure you have run Alembic migrations (`alembic upgrade head`) to generate the tables.*

### 3. Frontend Setup (React)
Open a new terminal, navigate to the frontend directory, install dependencies, and start the app:
```bash
cd AQI-Project/frontend
npm install
npm start
```
The application will be available at `http://localhost:3000`.

---

<br/>
<div align="center">
  <i>Stay Safe, Breathe Better.</i>
</div>

<div align="center">
  <h1>🌬️ AirAware India</h1>
  <p><strong>India's Premier Air Quality Monitoring & Route Planning Platform</strong></p>

  [![React](https://img.shields.io/badge/Frontend-React-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Leaflet](https://img.shields.io/badge/Maps-Leaflet-199900?style=for-the-badge&logo=leaflet)](https://leafletjs.com/)
</div>

<br />

## 🌟 Overview

**AirAware India** is a comprehensive, interactive platform designed to help users track air quality, plan healthy routes, and receive critical pollution alerts across India. With a seamless user interface, multilingual support, and a powerful backend, AirAware helps users mitigate their exposure to harmful pollutants (PM2.5, PM10, CO, NO₂, SO₂, O₃).

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
- **SMS & Push Alerts:** Choose between browser push notifications, email, or direct SMS alerts.
- **Health Profiles:** Tailor alerts based on specific sensitivities (e.g., Asthma, Elderly, Young Children).

### 🔐 Secure Authentication
- **Phone & OTP Login:** Seamless phone-based login with country code support (default `+91`).
- **Standard Email:** Traditional email and password support for standard access.

---

## 📂 Project Structure

This repository is split into two primary segments:

```bash
📦 Air_Quality_prjt
 ┣ 📂 AQI-Project (Frontend)
 ┃ ┣ 📂 public
 ┃ ┗ 📂 src
 ┃   ┣ 📂 components  # Reusable UI components (Dashboard, RoutePlanner, Alerts, etc.)
 ┃   ┣ 📂 config      # Constants and city data
 ┃   ┣ 📂 context     # Auth and state management
 ┃   ┣ 📂 hooks       # Custom React hooks (Translations, etc.)
 ┃   ┗ 📂 services    # API clients (airQualityService.js)
 ┃
 ┗ 📂 route-air-quality-backend (Backend)
   ┣ 📂 app
   ┃ ┣ 📂 api         # FastAPI route handlers (analytics, map, etc.)
   ┃ ┗ 📂 core        # Backend configuration
   ┣ 📜 Dockerfile    # Containerization setup
   ┗ 📜 requirements.txt
```

---

## 🚀 Getting Started

### 1. Backend Setup (FastAPI)
Navigate to the backend directory and run the development server:
```bash
cd route-air-quality-backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 2. Frontend Setup (React)
Navigate to the frontend directory, install dependencies, and start the app:
```bash
cd AQI-Project/frontend
npm install
npm start
```
The application will be available at `http://localhost:3000`.

---

## 🌐 Tech Stack
- **Frontend:** React.js, React-Leaflet, React Router
- **Styling:** Vanilla CSS, CSS Variables for Light/Dark Mode
- **Backend:** Python, FastAPI, Uvicorn
- **Maps:** Leaflet, OpenStreetMap, CartoDB

<br/>
<div align="center">
  <i>Stay Safe, Breathe Better.</i>
</div>

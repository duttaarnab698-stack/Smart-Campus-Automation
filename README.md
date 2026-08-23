<<<<<<< HEAD
# Smart Campus Automation

## Overview

Campus 25 monitoring prototype for occupancy, appliance automation and energy efficiency.

## Problem Statement

Manual monitoring wastes energy when rooms remain active after occupants leave.

## Solution and Features

The Flask API maintains live room state, applies occupancy-based automation, calculates power, tracks energy, exposes alerts and feeds the existing polling dashboard.

## System Architecture

Browser frontend → Flask API → in-memory room store → automation and energy services. `sensor_simulator.py` represents development-only IoT input.

## Technology Stack

Frontend: HTML, CSS, JavaScript  
Backend: Python, Flask, Flask-CORS, Gunicorn  
IoT prototype: ESP32, occupancy and environment sensors, relay module

## API Endpoints

`GET /api/health`, `/api/rooms`, `/api/rooms/<room_id>`, `/api/dashboard/summary`, `/api/analytics/energy`, `/api/alerts`  
`PATCH /api/rooms/<room_id>`, `PATCH /api/rooms/<room_id>/device`  
`POST /api/sensor/occupancy`, `POST /api/sensor/environment`

## Automation and Energy Monitoring

Occupied rooms enable lighting/fan and temperature-dependent AC. Empty rooms remain active for 30 seconds, then appliances are disabled and energy-waste alerts resolved. Power is calculated from device state (0.08 kW light, 0.07 kW fan, 1.20 kW AC).

## Local Setup

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Run the development sensor gateway separately with `python sensor_simulator.py`.

## Production Deployment

Render uses `render.yaml` and starts the backend with `gunicorn app:app`. Set `FRONTEND_URL` to the deployed static frontend origin. Update the single API URL in `js/config.js` after the Render URL is known.

## Future Scope

ESP32/MQTT hardware, persistent storage, real-time transport and predictive analytics can replace the in-memory prototype later.
=======
# Smart-Campus-Automation
>>>>>>> 0dd441b8b0819bf6ac5b2951cacf877b2635e5da

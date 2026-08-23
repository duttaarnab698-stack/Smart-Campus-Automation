# Smart Campus Python Backend

Prototype Flask backend with in-memory room state and simulated occupancy automation.

```powershell
cd A:\project\Smart-Campus-Automation\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

In another terminal run `python sensor_simulator.py`. The frontend continues using the `/api/...` endpoints on port 5000.

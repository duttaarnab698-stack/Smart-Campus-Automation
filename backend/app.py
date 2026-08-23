import os
import time
from flask import Flask, jsonify, request
from flask_cors import CORS

from data.rooms import ROOMS
from power import calculate_power
from automation import on_occupancy


app = Flask(__name__)
allowed_origin = os.environ.get("FRONTEND_URL")
CORS(app, origins=[allowed_origin] if allowed_origin else ["http://localhost:5500", "http://127.0.0.1:5500", "null"])

ALERTS = []
RATE = 8


# ---------------------------------------------------------
# INITIAL POWER CALCULATION
# ---------------------------------------------------------

for room in ROOMS.values():
    calculate_power(room)


# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------

def error(message, status):
    return jsonify(
        success=False,
        message=message
    ), status


def update_energy():
    now = time.time()

    for room in ROOMS.values():

        elapsed = now - room.get("_energyTick", now)

        room["energyToday"] = round(
            room.get("energyToday", 0)
            + room["power"] * elapsed / 3600,
            4
        )

        room["_energyTick"] = now


def public(room):
    return {
        key: value
        for key, value in room.items()
        if not key.startswith("_")
    }


# ---------------------------------------------------------
# SMART OCCUPANCY AUTOMATION
# ---------------------------------------------------------

def apply_occupancy_automation(room):
    """
    Smart Campus automation:

    EMPTY:
        Light OFF
        Fan OFF
        AC OFF

    OCCUPIED:
        Light ON
        Fan ON
        AC ON only when temperature > 27°C
    """

    if room["occupied"]:

        # Occupied room
        room["light"] = True
        room["fan"] = True

        # Temperature based AC control
        if room["temperature"] > 27:
            room["ac"] = True
        else:
            room["ac"] = False

        room["emptySince"] = None

    else:

        # Empty room
        room["light"] = False
        room["fan"] = False
        room["ac"] = False

        room["emptySince"] = time.time()

    # Recalculate power
    calculate_power(room)


# ---------------------------------------------------------
# GET ALL ROOMS
# ---------------------------------------------------------

@app.get("/api/rooms")
def all_rooms():

    update_energy()

    return jsonify({
        room_id: public(room)
        for room_id, room in ROOMS.items()
    })


# ---------------------------------------------------------
# GET SINGLE ROOM
# ---------------------------------------------------------

@app.get("/api/rooms/<room_id>")
def one_room(room_id):

    room = ROOMS.get(room_id)

    if not room:
        return error("Room not found", 404)

    update_energy()
    calculate_power(room)

    return jsonify(public(room))


# ---------------------------------------------------------
# MANUAL ROOM UPDATE
# ---------------------------------------------------------

@app.patch("/api/rooms/<room_id>")
def patch_room(room_id):

    room = ROOMS.get(room_id)

    if not room:
        return error("Room not found", 404)

    allowed = {
        "occupied",
        "temperature",
        "humidity",
        "light",
        "fan",
        "ac"
    }

    data = request.get_json(silent=True) or {}

    unknown = set(data) - allowed

    if unknown:
        return error(
            f"Invalid field: {next(iter(unknown))}",
            400
        )

    # Validate values
    for key, value in data.items():

        if key in {"occupied", "light", "fan", "ac"}:

            if not isinstance(value, bool):
                return error(
                    f"{key} must be boolean",
                    400
                )

        if key == "temperature":

            if (
                not isinstance(value, (int, float))
                or not 0 <= value <= 60
            ):
                return error(
                    "Temperature must be 0-60",
                    400
                )

        if key == "humidity":

            if (
                not isinstance(value, (int, float))
                or not 0 <= value <= 100
            ):
                return error(
                    "Humidity must be 0-100",
                    400
                )

    # Update values
    for key, value in data.items():
        room[key] = value

    room["lastUpdated"] = time.time()

    # If occupancy changed, apply automation
    if "occupied" in data:

        apply_occupancy_automation(room)

        # Keep existing alert/automation system
        on_occupancy(room, ALERTS)

    else:

        calculate_power(room)

    return jsonify(
        success=True,
        roomId=room_id,
        room=public(room)
    )


# ---------------------------------------------------------
# MANUAL DEVICE CONTROL
# ---------------------------------------------------------

@app.patch("/api/rooms/<room_id>/device")
def device(room_id):

    room = ROOMS.get(room_id)

    if not room:
        return error("Room not found", 404)

    data = request.get_json(silent=True) or {}

    device_name = data.get("device")
    state = data.get("state")

    if device_name not in {"light", "fan", "ac"}:
        return error("Invalid device", 400)

    if not isinstance(state, bool):
        return error("State must be boolean", 400)

    # Manual device change
    room[device_name] = state
    room["lastUpdated"] = time.time()

    calculate_power(room)

    # If someone manually turns something ON in an empty room,
    # existing automation will handle it.
    if not room["occupied"] and state:
        on_occupancy(room, ALERTS)

    return jsonify(
        success=True,
        roomId=room_id,
        device=device_name,
        state=room[device_name],
        power=room["power"],
        room=public(room)
    )


# ---------------------------------------------------------
# OCCUPANCY SENSOR
# ---------------------------------------------------------

@app.post("/api/sensor/occupancy")
def occupancy():

    data = request.get_json(silent=True) or {}

    room_id = data.get("roomId")
    occupied = data.get("occupied")

    room = ROOMS.get(room_id)

    if not room:
        return error("Room not found", 404)

    if not isinstance(occupied, bool):
        return error(
            "occupied must be boolean",
            400
        )

    # Update occupancy
    room["occupied"] = occupied
    room["lastUpdated"] = time.time()

    # -----------------------------------------------------
    # SMART AUTOMATION
    # -----------------------------------------------------

    apply_occupancy_automation(room)

    # Existing automation / alert system
    on_occupancy(room, ALERTS)

    return jsonify(
        success=True,
        source="occupancy-sensor",
        roomId=room["roomId"],
        occupied=room["occupied"],
        temperature=room["temperature"],
        light=room["light"],
        fan=room["fan"],
        ac=room["ac"],
        power=room["power"]
    )


# ---------------------------------------------------------
# ENVIRONMENT SENSOR
# ---------------------------------------------------------

@app.post("/api/sensor/environment")
def environment():

    data = request.get_json(silent=True) or {}

    room_id = data.get("roomId")

    room = ROOMS.get(room_id)

    if not room:
        return error("Room not found", 404)

    temperature = data.get("temperature")
    humidity = data.get("humidity")

    if (
        not isinstance(temperature, (int, float))
        or not 0 <= temperature <= 60
        or not isinstance(humidity, (int, float))
        or not 0 <= humidity <= 100
    ):
        return error(
            "Invalid environment values",
            400
        )

    room.update(
        temperature=temperature,
        humidity=humidity,
        lastUpdated=time.time()
    )

    # If room is occupied, re-check AC based on temperature
    if room["occupied"]:

        if room["temperature"] > 27:
            room["ac"] = True
        else:
            room["ac"] = False

        calculate_power(room)

    return jsonify(
        success=True,
        room=public(room)
    )


# ---------------------------------------------------------
# ENERGY ANALYTICS
# ---------------------------------------------------------

@app.get("/api/analytics/energy")
def energy():

    update_energy()

    total_power = sum(
        room["power"]
        for room in ROOMS.values()
    )

    total_energy = sum(
        room["energyToday"]
        for room in ROOMS.values()
    )

    energy_saved = sum(
        room.get("energySavedToday", 0)
        for room in ROOMS.values()
    )

    return jsonify(
        totalPower=round(total_power, 2),
        totalEnergyToday=round(total_energy, 2),
        estimatedCostToday=round(
            total_energy * RATE,
            2
        ),
        roomsUsingEnergy=sum(
            room["power"] > 0
            for room in ROOMS.values()
        ),
        roomsEmpty=sum(
            not room["occupied"]
            for room in ROOMS.values()
        ),
        energySavedToday=round(
            energy_saved,
            2
        )
    )


# ---------------------------------------------------------
# DASHBOARD SUMMARY
# ---------------------------------------------------------

@app.get("/api/dashboard/summary")
def summary():

    update_energy()

    return jsonify(
        totalRooms=len(ROOMS),

        occupiedRooms=sum(
            room["occupied"]
            for room in ROOMS.values()
        ),

        emptyRooms=sum(
            not room["occupied"]
            for room in ROOMS.values()
        ),

        totalPower=round(
            sum(
                room["power"]
                for room in ROOMS.values()
            ),
            2
        ),

        energyToday=round(
            sum(
                room["energyToday"]
                for room in ROOMS.values()
            ),
            2
        ),

        energySavedToday=round(
            sum(
                room.get("energySavedToday", 0)
                for room in ROOMS.values()
            ),
            2
        ),

        activeAlerts=sum(
            not alert["resolved"]
            for alert in ALERTS
        )
    )


# ---------------------------------------------------------
# ALERTS
# ---------------------------------------------------------

@app.get("/api/alerts")
def alerts():

    return jsonify([
        alert
        for alert in ALERTS
        if not alert["resolved"]
    ])


# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------

@app.get("/api/health")
def health():

    return jsonify(
        status="online",
        service="Smart Campus Python Backend",
        timestamp=time.strftime(
            "%Y-%m-%dT%H:%M:%SZ",
            time.gmtime()
        )
    )


# ---------------------------------------------------------
# 404
# ---------------------------------------------------------

@app.errorhandler(404)
def not_found(_):

    return error(
        "Route not found",
        404
    )


# ---------------------------------------------------------
# 500
# ---------------------------------------------------------

@app.errorhandler(500)
def server_error(_):

    return error(
        "Internal server error",
        500
    )


# ---------------------------------------------------------
# START SERVER
# ---------------------------------------------------------

if __name__ == "__main__":

    print(
        "Smart Campus Python Backend running on "
        "http://localhost:5000"
    )

    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

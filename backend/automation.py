import threading
import time

from power import calculate_power

EMPTY_DELAY = 30

_timers = {}
_lock = threading.Lock()


def _clear(room_id):
    with _lock:
        timer = _timers.pop(room_id, None)

    if timer:
        timer.cancel()


def _switch_off(room, alerts):
    # Room became occupied before timer finished
    if room["occupied"]:
        return

    avoided = room["power"]

    print(
        f"AUTOMATION -> {room['roomId']} is empty for "
        f"{EMPTY_DELAY} seconds. Turning OFF appliances."
    )

    room.update(
        light=False,
        fan=False,
        ac=False,
        energySavedToday=room.get("energySavedToday", 0) + avoided
    )

    calculate_power(room)

    room["lastUpdated"] = time.time()

    print(
        f"AUTOMATION -> {room['roomId']}: "
        f"Light OFF | Fan OFF | AC OFF | Power {room['power']} kW"
    )

    # Resolve existing energy-waste alert
    for alert in alerts:
        if (
            alert["roomId"] == room["roomId"]
            and alert["type"] == "ENERGY_WASTE"
            and not alert["resolved"]
        ):
            alert["resolved"] = True


def _turn_on_for_occupied(room, alerts):
    """
    Turn appliances ON when a room becomes occupied.

    Logic:
    - Light ON
    - Fan ON
    - AC ON when temperature >= 27°C
    - AC OFF when temperature < 27°C
    """

    room["light"] = True
    room["fan"] = True

    # Temperature based AC automation
    if room.get("temperature", 0) >= 27:
        room["ac"] = True
    else:
        room["ac"] = False

    calculate_power(room)

    room["lastUpdated"] = time.time()
    room["emptySince"] = None

    print(
        f"AUTOMATION -> {room['roomId']} is occupied. "
        f"Turning ON required appliances."
    )

    print(
        f"AUTOMATION -> {room['roomId']}: "
        f"Light {'ON' if room['light'] else 'OFF'} | "
        f"Fan {'ON' if room['fan'] else 'OFF'} | "
        f"AC {'ON' if room['ac'] else 'OFF'} | "
        f"Power {room['power']} kW"
    )

    # Resolve any old energy waste alert
    for alert in alerts:
        if (
            alert["roomId"] == room["roomId"]
            and alert["type"] == "ENERGY_WASTE"
            and not alert["resolved"]
        ):
            alert["resolved"] = True


def on_occupancy(room, alerts):

    room_id = room["roomId"]

    state = "OCCUPIED" if room["occupied"] else "EMPTY"

    print(f"SENSOR -> {room_id} -> {state}")

    # ------------------------------------------------
    # OCCUPIED
    # ------------------------------------------------
    if room["occupied"]:

        # Cancel empty-room shutdown timer
        _clear(room_id)

        # Turn appliances ON automatically
        _turn_on_for_occupied(room, alerts)

        return

    # ------------------------------------------------
    # EMPTY
    # ------------------------------------------------

    room["emptySince"] = time.time()

    # If appliances are already OFF, nothing to do
    if not (room["light"] or room["fan"] or room["ac"]):
        calculate_power(room)
        room["lastUpdated"] = time.time()

        print(
            f"AUTOMATION -> {room_id}: "
            f"Room empty and appliances already OFF."
        )

        return

    # Create energy waste alert
    if not any(
        a["roomId"] == room_id
        and a["type"] == "ENERGY_WASTE"
        and not a["resolved"]
        for a in alerts
    ):
        alerts.append(
            {
                "id": time.time_ns(),
                "roomId": room_id,
                "type": "ENERGY_WASTE",
                "severity": "warning",
                "message": "Room is empty but appliances are running.",
                "timestamp": time.strftime(
                    "%Y-%m-%dT%H:%M:%SZ",
                    time.gmtime()
                ),
                "resolved": False,
            }
        )

    # Cancel previous timer
    _clear(room_id)

    # Start 30-second automatic shutdown timer
    timer = threading.Timer(
        EMPTY_DELAY,
        _switch_off,
        args=(room, alerts)
    )

    timer.daemon = True

    with _lock:
        _timers[room_id] = timer

    timer.start()

    print(
        f"AUTOMATION -> {room_id} is empty. "
        f"Appliances will turn OFF after {EMPTY_DELAY} seconds."
    )
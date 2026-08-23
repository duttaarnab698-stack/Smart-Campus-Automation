import time

def _room(room_id, occupied, temperature, humidity, light, fan, ac):
    return {'roomId': room_id, 'block': 'A Block', 'floor': 'First Floor', 'occupied': occupied,
            'temperature': temperature, 'humidity': humidity, 'light': light, 'fan': fan, 'ac': ac,
            'power': 0, 'energyToday': 0, 'energySavedToday': 0, 'lastUpdated': time.time(), 'emptySince': None}

ROOMS = {
    'A101': _room('A101', True, 27.8, 61, True, True, False),
    'A102': _room('A102', False, 25.7, 58, False, False, False),
    'A103': _room('A103', True, 26.3, 59, True, True, True),
    'A104': _room('A104', False, 28.5, 63, False, False, False),
    'A105': _room('A105', True, 26.4, 60, True, True, False),
    'A106': _room('A106', False, 26.3, 57, False, False, False),
}

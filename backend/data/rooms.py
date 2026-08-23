import time


def _room(room_id, occupied, temperature, humidity, light, fan, ac):
    return {'roomId': room_id, 'block': 'A Block', 'floor': 'First Floor', 'occupied': occupied,
            'temperature': temperature, 'humidity': humidity, 'light': light, 'fan': fan, 'ac': ac,
            'power': 0, 'energyToday': 0, 'energySavedToday': 0, 'lastUpdated': time.time(), 'emptySince': None}


def _room_ids():
    ground = [
        'A006', 'A007', 'A008', 'A009', 'A011', 'A013', 'A015',
        'B001', 'B002', 'B004', 'B005', 'B006', 'B007', 'B008', 'B009',
        'B011', 'B012', 'B013', 'B014', 'B015', 'B016', 'B017', 'B018',
        'B019', 'B020', 'B021', 'B022', 'C01', 'C02'
    ]
    second = [
        'A211', 'A213', 'B201', 'B202',
        *[f'B{number}' for number in range(204, 222)],
        'C201', 'C203', 'C211', 'C212', 'C213'
    ]
    first = [
        *[f'A{number}' for number in range(101, 119)],
        *[f'B{number}' for number in range(101, 123)],
        'C101', 'C104', 'C105', 'C106'
    ]
    third = [
        *[f'A{number}' for number in range(301, 319)],
        *[f'B{number}' for number in range(301, 323)],
        'C301', 'C303'
    ]
    return (
        [(room_id, 'Ground Floor') for room_id in ground]
        + [(room_id, 'Second Floor') for room_id in second]
        + [(room_id, 'First Floor') for room_id in first]
        + [(room_id, 'Third Floor') for room_id in third]
    )


def _create_rooms():
    existing = {
        'A101': (True, 27.8, 61, True, True, False),
        'A102': (False, 25.7, 58, False, False, False),
        'A103': (True, 26.3, 59, True, True, True),
        'A104': (False, 28.5, 63, False, False, False),
        'A105': (True, 26.4, 60, True, True, False),
        'A106': (False, 26.3, 57, False, False, False),
    }
    rooms = {}

    for room_id, floor in _room_ids():
        occupied, temperature, humidity, light, fan, ac = existing.get(
            room_id,
            (False, 26.0, 55, False, False, False)
        )
        room = _room(
            room_id, occupied, temperature, humidity, light, fan, ac
        )
        room['floor'] = floor
        room['block'] = f'{room_id[0]} Block'
        rooms[room_id] = room

    return rooms


ROOMS = _create_rooms()

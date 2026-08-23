LIGHT_POWER = 0.08
FAN_POWER = 0.07
AC_POWER = 1.20

def calculate_power(room):
    room['power'] = round((LIGHT_POWER if room['light'] else 0) + (FAN_POWER if room['fan'] else 0) + (AC_POWER if room['ac'] else 0), 2)
    return room['power']

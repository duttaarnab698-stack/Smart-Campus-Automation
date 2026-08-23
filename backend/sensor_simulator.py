import time, requests
URL='http://localhost:5000/api/sensor/occupancy'
cycles=[{'A101':True,'A102':False,'A103':True,'A104':False,'A105':True,'A106':False},{'A101':False,'A102':True,'A103':True,'A104':True,'A105':False,'A106':True},{'A101':True,'A102':False,'A103':False,'A104':False,'A105':True,'A106':False}]
if __name__=='__main__':
    i=0
    try:
        while True:
            for room,occupied in cycles[i].items():
                try: requests.post(URL,json={'roomId':room,'occupied':occupied},timeout=3); print(f"SENSOR -> {room} -> {'OCCUPIED' if occupied else 'EMPTY'}")
                except requests.RequestException as exc: print(f'Sensor gateway error: {exc}')
            i=(i+1)%len(cycles); time.sleep(15)
    except KeyboardInterrupt: print('Sensor simulator stopped.')

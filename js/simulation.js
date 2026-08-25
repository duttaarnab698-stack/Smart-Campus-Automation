// Single source of truth for the self-contained Smart Campus demo.
(() => {
  const STORAGE_KEY = 'smartCampusState_v2';
  const DEVICES = { light: 0.08, fan: 0.12, ac: 1.15 };
  const AUTO_OFF_MS = 15000;
  const ENERGY_RATE = 8;

  const state = campusState;

  const normalize = room => {
    room.appliances = room.appliances || { light: !!room.light, fan: !!room.fan, ac: !!room.ac };
    Object.keys(DEVICES).forEach(device => {
      room[device] = room.appliances[device] = !!(room.appliances[device] ?? room[device]);
    });
    room.autoOff = room.autoOff || { light: null, fan: null, ac: null };
    room.energyToday = Number(room.energyToday || 0);
    room.energySavedToday = Number(room.energySavedToday || 0);
  };

  const recalculate = () => {
    let total = 0;
    campusState.rooms.forEach(room => {
      normalize(room);
      room.powerModel = { light: room.light ? DEVICES.light : 0, fan: room.fan ? DEVICES.fan : 0, ac: room.ac ? DEVICES.ac : 0 };
      room.power = Number((room.powerModel.light + room.powerModel.fan + room.powerModel.ac).toFixed(2));
      room.powerModel.total = room.power;
      total += room.power;
    });
    campusState.totalPower = Number(total.toFixed(2));
    campusState.energyToday = Number(campusState.rooms.reduce((sum, room) => sum + room.energyToday, 0).toFixed(4));
    campusState.energySavedToday = Number(campusState.rooms.reduce((sum, room) => sum + room.energySavedToday, 0).toFixed(4));
    campusState.estimatedCostSaved = Number((campusState.energySavedToday * ENERGY_RATE).toFixed(2));
  };

  const updateAlerts = () => {
    campusState.alertObjects = campusState.alertObjects || [];
    campusState.rooms.forEach(room => {
      const wasting = !room.occupied && room.power > 0;
      room.warning = wasting;
      const existing = campusState.alertObjects.find(alert => alert.roomId === room.id && alert.type === 'energy' && !alert.resolved);
      if (wasting && !existing) campusState.alertObjects.unshift({ id: `${room.id}-energy`, roomId: room.id, type: 'energy', severity: 'warning', message: `${room.id} is empty while appliances are consuming power.`, timestamp: Date.now(), resolved: false });
      if (!wasting && existing) existing.resolved = true;
    });
    campusState.alerts = campusState.alertObjects.map(alert => [alert.severity, alert.roomId, alert.message, alert.timestamp]);
  };

  const persist = () => {
    campusState.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rooms: campusState.rooms, automationEnabled: campusState.automationEnabled, totalPower: campusState.totalPower, energyToday: campusState.energyToday, energySavedToday: campusState.energySavedToday, estimatedCostSaved: campusState.estimatedCostSaved, alertObjects: campusState.alertObjects, alerts: campusState.alerts, lastUpdated: campusState.lastUpdated }));
    refreshSimulationViews?.();
    refreshDashboardLive?.();
    window.refreshRoomsLive?.();
    window.refreshEnergyLive?.();
    window.dispatchEvent(new CustomEvent('campus-state-change'));
  };

  const refresh = () => { recalculate(); updateAlerts(); persist(); };

  SimulationEngine.toggleAppliance = (id, device) => {
    const room = campusState.rooms.find(item => item.id === id);
    if (!room || !(device in DEVICES)) return null;
    normalize(room);
    room[device] = room.appliances[device] = !room[device];
    room.autoOff[device] = room[device] && !room.occupied ? Date.now() + AUTO_OFF_MS : null;
    refresh();
    return room;
  };

  SimulationEngine.setOccupancy = (id, occupied) => {
    const room = campusState.rooms.find(item => item.id === id);
    if (!room) return null;
    normalize(room);
    room.occupied = !!occupied;
    Object.keys(DEVICES).forEach(device => {
      room.autoOff[device] = room.occupied ? null : (room[device] ? Date.now() + AUTO_OFF_MS : null);
    });
    refresh();
    return room;
  };

  SimulationEngine.start = () => { campusState.automationEnabled = true; refresh(); };
  SimulationEngine.pause = () => { campusState.automationEnabled = false; refresh(); };
  SimulationEngine.reset = () => { localStorage.removeItem(STORAGE_KEY); location.reload(); };
  SimulationEngine.demo = () => {
    const room = campusState.rooms.find(item => item.id === 'A104');
    if (!room) return;
    room.occupied = false; room.light = room.appliances.light = true; room.fan = room.appliances.fan = true;
    room.autoOff.light = room.autoOff.fan = Date.now() + AUTO_OFF_MS;
    refresh();
  };

  const tick = () => {
    const now = Date.now();
    let changed = false;
    campusState.rooms.forEach(room => {
      normalize(room);
      if (campusState.automationEnabled && !room.occupied) {
        Object.keys(DEVICES).forEach(device => {
          if (room[device] && room.autoOff[device] && now >= room.autoOff[device]) {
            room[device] = room.appliances[device] = false;
            room.autoOff[device] = null;
            room.energySavedToday = Number((room.energySavedToday + DEVICES[device]).toFixed(4));
            changed = true;
          }
        });
      }
      if (room.power > 0) room.energyToday = Number((room.energyToday + room.power / 3600).toFixed(5));
    });
    recalculate();
    updateAlerts();
    // Persist the measured energy and any automatic state transition, without random changes.
    persist();
  };

  const automationToggle = document.querySelector('#automationToggle');
  if (automationToggle) {
    automationToggle.onclick = () => {
      campusState.automationEnabled = !campusState.automationEnabled;
      automationToggle.classList.toggle('on', campusState.automationEnabled);
      refresh();
    };
  }

  window.SimulationEngine = SimulationEngine;
  refresh();
  if (!window.smartCampusAutomationTimer) window.smartCampusAutomationTimer = setInterval(tick, 1000);
})();

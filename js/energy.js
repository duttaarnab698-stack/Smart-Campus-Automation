const ENERGY_TARIFF = 8;
const CO2_FACTOR = 0.417;

let energyCharts = {};
let latestEnergy = null;

function energyNumber(value) {
    return Number(value || 0);
}

function formatEnergy(value) {
    return `${energyNumber(value).toFixed(2)} kWh`;
}

function formatPower(value) {
    return `${energyNumber(value).toFixed(2)} kW`;
}

function chartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                display: true,
                labels: { color: '#F1F5F9', usePointStyle: true }
            },
            tooltip: {
                backgroundColor: '#0B1324',
                titleColor: '#F1F5F9',
                bodyColor: '#CBD5E1',
                borderColor: '#263B5C',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                ticks: { color: '#CBD5E1', maxRotation: 45, minRotation: 0 },
                grid: { color: '#1E3150' }
            },
            y: {
                beginAtZero: true,
                ticks: { color: '#CBD5E1' },
                grid: { color: '#1E3150' }
            }
        }
    };
}

function drawEnergyChart(id, type, labels, values, label, color) {
    const canvas = document.querySelector(`#${id}`);
    if (!canvas) return;
    energyCharts[id]?.destroy();
    energyCharts[id] = new Chart(canvas, {
        type,
        data: {
            labels,
            datasets: [{
                label,
                data: values,
                backgroundColor: `${color}55`,
                borderColor: color,
                borderWidth: 2,
                borderRadius: type === 'bar' ? 5 : 0,
                tension: 0.3,
                fill: type === 'line',
                pointRadius: type === 'line' ? 3 : 0
            }]
        },
        options: chartOptions()
    });
}

function groupRooms(rooms, field) {
    return rooms.reduce((groups, room) => {
        const key = room[field] || 'Unknown';
        const value = field === 'block' ? room.power : room.energySavedToday;
        groups[key] = (groups[key] || 0) + energyNumber(value);
        return groups;
    }, {});
}

function renderEnergyLive() {
    if (page !== 'energy' || !latestEnergy) return;

    const rooms = Campus.rooms;
    const analytics = latestEnergy.analytics;
    const summary = latestEnergy.summary;
    const alerts = latestEnergy.alerts;
    const activeWaste = alerts.filter(alert => alert.type === 'ENERGY_WASTE' && !alert.resolved);
    const byPower = [...rooms].sort((a, b) => energyNumber(b.power) - energyNumber(a.power));
    const topRooms = byPower.slice(0, 10);
    const blockPower = rooms.reduce((groups, room) => {
        const key = room.block || 'Unknown';
        groups[key] = (groups[key] || 0) + energyNumber(room.power);
        return groups;
    }, {});
    const savedByBlock = groupRooms(rooms, 'block');
    const energySaved = energyNumber(analytics.energySavedToday);
    const liveLoad = energyNumber(analytics.totalPower ?? summary.totalPower);
    const consumedToday = energyNumber(analytics.totalEnergyToday ?? summary.energyToday);
    const estimatedCost = energyNumber(analytics.estimatedCostToday ?? consumedToday * ENERGY_TARIFF);
    const lowestRoom = [...rooms].sort((a, b) => energyNumber(a.power) - energyNumber(b.power))[0];

    document.querySelector('#energyStatus').textContent = '● ONLINE';
    document.querySelector('#energyStatus').style.color = '#10B981';
    document.querySelector('#kpiConsumption').textContent = formatEnergy(consumedToday);
    document.querySelector('#kpiCurrent').textContent = formatPower(liveLoad);
    document.querySelector('#kpiSaved').textContent = formatEnergy(energySaved);
    document.querySelector('#kpiCost').textContent = `₹${estimatedCost.toFixed(2)}`;
    document.querySelector('#kpiCo2').textContent = `${(energySaved * CO2_FACTOR).toFixed(2)} kg`;
    document.querySelector('#energyInsights').innerHTML = [
        `<div><span>Highest Power Room</span><strong>${topRooms[0]?.id || 'None'} · ${formatPower(topRooms[0]?.power)}</strong></div>`,
        `<div><span>Lowest Power Room</span><strong>${lowestRoom?.id || 'None'} · ${formatPower(lowestRoom?.power)}</strong></div>`,
        `<div><span>Occupied Rooms</span><strong>${summary.occupiedRooms ?? rooms.filter(room => room.occupied).length} / ${summary.totalRooms ?? rooms.length}</strong></div>`,
        `<div><span>Appliances Running</span><strong>${analytics.roomsUsingEnergy ?? rooms.filter(room => energyNumber(room.power) > 0).length}</strong></div>`,
        `<div><span>Energy Waste Alerts</span><strong>${activeWaste.length}</strong></div>`,
        `<div><span>Energy Saved</span><strong>${formatEnergy(energySaved)}</strong></div>`
    ].join('');
    document.querySelector('#energyWaste').innerHTML = activeWaste.length
        ? activeWaste.map(alert => `<div class="alert"><strong>${alert.roomId} · ${alert.severity || 'warning'}</strong><p>${alert.message}</p><small>${alert.timestamp || 'Timestamp unavailable'}</small></div>`).join('')
        : '<p class="muted">No active energy-waste alerts.</p>';

    drawEnergyChart('daily', 'bar', topRooms.map(room => room.id), topRooms.map(room => energyNumber(room.power)), 'Current power (kW)', '#22D3EE');
    drawEnergyChart('hourly', 'bar', Object.keys(blockPower), Object.values(blockPower), 'Block power (kW)', '#3B82F6');
    drawEnergyChart('saved', 'bar', Object.keys(savedByBlock), Object.values(savedByBlock), 'Energy saved (kWh)', '#10B981');
    drawEnergyChart('roomsChart', 'bar', topRooms.map(room => room.id), topRooms.map(room => energyNumber(room.energyToday)), 'Room energy today (kWh)', '#F59E0B');
}

function loadEnergyLive() {
    if (page !== 'energy' || !Campus.energyAnalytics) return;
    latestEnergy = Campus.energyAnalytics;
    renderEnergyLive();
}

if (page === 'energy') {
    shell('Energy Analytics', 'Campus 25 live energy performance.', `<div class="page-heading"><div><h2>Energy Overview</h2><p class="muted">Live simulated campus data, updated in your browser.</p></div><span id="energyStatus" class="sub">● CONNECTING</span></div><div class="kpis energy-kpis">${[["Today's Consumption", 'kpiConsumption', 'Simulated energy today'], ['Current Live Load', 'kpiCurrent', 'Current room power'], ['Energy Saved', 'kpiSaved', 'Simulation automation savings'], ['Estimated Cost', 'kpiCost', 'Estimated at ₹8/kWh'], ['CO2 Reduction', 'kpiCo2', `Estimate at ${CO2_FACTOR} kg/kWh`]].map((item, index) => `<div class="card energy-kpi kpi-${index + 1}"><div class="kpi-head"><span>${item[0]}</span><span class="energy-dot"></span></div><div id="${item[1]}" class="value">Loading...</div><div class="sub">${item[2]}</div></div>`).join('')}</div><div class="charts energy-charts">${[['Current Room Power Consumption', 'daily', 'kW'], ['Power Consumption by Block', 'hourly', 'kW'], ['Energy Saved by Block', 'saved', 'kWh'], ['Top Room Energy Today', 'roomsChart', 'kWh']].map(item => `<div class="card chart-small"><div class="chart-heading"><h2>${item[0]}</h2><span>${item[2]}</span></div><div class="canvas-wrap"><canvas id="${item[1]}"></canvas></div></div>`).join('')}</div><div class="layout energy-detail"><div class="card"><div class="section-title"><h2>Live Insights</h2><span class="sub">Simulation-derived</span></div><div id="energyInsights" class="metric-list"><p class="muted">Waiting for simulated data...</p></div></div><div class="card"><div class="section-title"><h2>Energy Waste</h2><span class="sub">Active simulated alerts</span></div><div id="energyWaste"><p class="muted">Waiting for simulated data...</p></div></div></div>`);
    Chart.defaults.color = '#CBD5E1';
    Chart.defaults.borderColor = '#1E3150';
    window.refreshEnergyLive = loadEnergyLive;
    if (Campus.energyAnalytics) loadEnergyLive();
}

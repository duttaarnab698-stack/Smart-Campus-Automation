// ======================================================
// SMART CAMPUS - MAIN.JS
// STATIC FRONTEND VERSION
// ======================================================


// ======================================================
// STATIC CONFIGURATION
// ======================================================


// ======================================================
// ROOM FACTORY
// ======================================================

const room = (
    id,
    floor,
    block,
    occupied = false,
    warning = false
) => ({
    id,
    room: id,
    campus: "Campus 25",
    floor,
    block,
    building: block,
    occupied,
    temperature: 26,
    humidity: 58,
    light: occupied || warning,
    fan: occupied,
    ac: false,
    power: 0,
    energyToday: 1.2,
    warning
});


// ======================================================
// INITIAL FRONTEND ROOM DATA
// ======================================================

const Campus = {

    rooms: [

        {
            ...room(
                "A101",
                "First Floor",
                "A Block",
                true
            ),
            temperature: 27.4,
            humidity: 61,
            energyToday: 6.42
        },

        {
            ...room(
                "A102",
                "First Floor",
                "A Block",
                false
            ),
            temperature: 26.1,
            humidity: 58,
            energyToday: 1.21
        },

        {
            ...room(
                "A103",
                "First Floor",
                "A Block",
                true
            ),
            temperature: 25.8,
            humidity: 59,
            ac: true,
            energyToday: 9.15
        },

        {
            ...room(
                "A104",
                "First Floor",
                "A Block",
                false,
                true
            ),
            temperature: 28.2,
            humidity: 63,
            energyToday: 2.15
        },

        ...Array.from(
            {
                length: 14
            },
            (_, i) =>
                room(
                    `A${105 + i}`,
                    "First Floor",
                    "A Block",
                    i % 3 === 0
                )
        ),

        ...Array.from(
            {
                length: 22
            },
            (_, i) =>
                room(
                    `B${101 + i}`,
                    "First Floor",
                    "B Block",
                    i % 2 === 0
                )
        ),

        ...[
            "C101",
            "C104",
            "C105",
            "C106"
        ].map(
            (id, i) =>
                room(
                    id,
                    "First Floor",
                    "C Block",
                    i === 0
                )
        ),

        ...Array.from(
            {
                length: 18
            },
            (_, i) =>
                room(
                    `A${301 + i}`,
                    "Third Floor",
                    "A Block",
                    i % 3 === 1
                )
        ),

        ...Array.from(
            {
                length: 22
            },
            (_, i) =>
                room(
                    `B${301 + i}`,
                    "Third Floor",
                    "B Block",
                    i % 2 === 1
                )
        ),

        ...[
            "C301",
            "C303"
        ].map(
            (id, i) =>
                room(
                    id,
                    "Third Floor",
                    "C Block",
                    !!i
                )
        )

    ],

    alerts: [
        [
            "warning",
            "A104",
            "Room is empty but appliances are still running.",
            "just now"
        ]
    ]

};


// ======================================================
// PAGE
// ======================================================

const page = document.body.dataset.page;


// ======================================================
// DATE / TIME
// ======================================================

const DateTime = {

    compact(date = new Date()) {

        return new Intl.DateTimeFormat(
            undefined,
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        ).format(date);

    },

    time(date = new Date()) {

        return new Intl.DateTimeFormat(
            undefined,
            {
                hour: "numeric",
                minute: "2-digit"
            }
        ).format(date);

    },

    relative(value) {

        const seconds = Math.max(
            0,
            Math.floor(
                (Date.now() - new Date(value).getTime()) / 1000
            )
        );


        if (seconds < 45) {

            return "Just now";

        }


        if (seconds < 3600) {

            return `${Math.floor(seconds / 60)} min ago`;

        }


        if (seconds < 86400) {

            return `${Math.floor(seconds / 3600)} hr ago`;

        }


        return new Intl.DateTimeFormat(
            undefined,
            {
                month: "short",
                day: "numeric"
            }
        ).format(new Date(value));

    }

};


window.DateTime = DateTime;


// ======================================================
// CONSTANTS
// ======================================================

const CAMPUS_STORE_KEY = "campus25-simulation-v2";

const SIMULATION_INTERVAL = 1000;

const AUTO_OFF_DELAY = 15000;

const ENERGY_RATE = 8;


// ======================================================
// CAMPUS STATE
// ======================================================

const campusState = (() => {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    CAMPUS_STORE_KEY
                )
            );


        if (saved) {

            Object.assign(
                Campus,
                saved
            );

        }

    } catch (error) {

        console.error(
            "Local campus state error:",
            error
        );

    }


    Campus.campus = "Campus 25";

    Campus.energySavedToday =
        Campus.energySavedToday || 0;

    Campus.estimatedCostSaved =
        Campus.estimatedCostSaved || 0;

    Campus.totalPower =
        Campus.totalPower || 0;

    Campus.energyToday =
        Campus.energyToday ||
        Campus.rooms.reduce(
            (total, r) =>
                total + Number(r.energyToday || 0),
            0
        );

    Campus.alertObjects =
        Campus.alertObjects || [];

    Campus.simulationRunning = false;

    Campus.automationEnabled = true;


    Campus.rooms.forEach(r => {

        r.appliances =
            r.appliances || {

                light: !!r.light,

                fan: !!r.fan,

                ac: !!r.ac

            };


        r.powerModel =
            r.powerModel || {

                light: 0,

                fan: 0,

                ac: 0,

                total: 0

            };


        if (r.emptySince === undefined) {

            r.emptySince =
                r.occupied
                    ? null
                    : Date.now();

        }


        if (r.autoOffTriggered === undefined) {

            r.autoOffTriggered = false;

        }

        r.manualDevices = r.manualDevices || {
            light: false,
            fan: false,
            ac: false
        };

        r.autoOff = r.autoOff || {
            light: null,
            fan: null,
            ac: null
        };

    });


    return Campus;

})();


// ======================================================
// SECOND FLOOR DATA
// ======================================================

const secondFloorIds = [

    "A211",
    "A213",

    "B201",
    "B202",
    "B204",
    "B205",
    "B206",
    "B207",
    "B208",
    "B209",
    "B210",
    "B211",
    "B212",
    "B213",
    "B214",
    "B215",
    "B216",
    "B217",
    "B218",
    "B219",
    "B220",
    "B221",

    "C201",
    "C203",
    "C211",
    "C212",
    "C213"

];


secondFloorIds.forEach(
    (id, i) => {

        if (
            !campusState.rooms.some(
                r => r.id === id
            )
        ) {

            const block =
                id.startsWith("A")
                    ? "A Block"
                    : id.startsWith("B")
                        ? "B Block"
                        : "C Block";


            const r =
                room(
                    id,
                    "Second Floor",
                    block,
                    i % 3 === 0
                );


            r.appliances = {

                light: r.light,

                fan: r.fan,

                ac: r.ac

            };


            r.powerModel = {

                light: 0,

                fan: 0,

                ac: 0,

                total: 0

            };


            r.emptySince =
                r.occupied
                    ? null
                    : Date.now();


            r.autoOffTriggered = false;


            campusState.rooms.push(r);

        }

    }
);


// ======================================================
// GROUND FLOOR DATA
// ======================================================

const groundFloorIds = [

    "A006",
    "A007",
    "A008",
    "A009",
    "A011",
    "A013",
    "A015",

    "A101",
    "A102",
    "A103",
    "A104",
    "A105",

    "B001",
    "B002",
    "B004",
    "B005",
    "B006",
    "B007",
    "B008",
    "B009",
    "B011",
    "B012",
    "B013",
    "B014",
    "B015",
    "B016",
    "B017",
    "B018",
    "B019",
    "B020",
    "B021",
    "B022",

    "C01",
    "C02"

];


groundFloorIds.forEach(
    (id, i) => {

        if (
            !campusState.rooms.some(
                r =>
                    r.id === id &&
                    r.floor === "Ground Floor"
            )
        ) {

            const block =
                id.startsWith("A")
                    ? "A Block"
                    : id.startsWith("B")
                        ? "B Block"
                        : "C Block";


            const r =
                room(
                    id,
                    "Ground Floor",
                    block,
                    i % 3 === 1
                );


            r.appliances = {

                light: r.light,

                fan: r.fan,

                ac: r.ac

            };


            r.powerModel = {

                light: 0,

                fan: 0,

                ac: 0,

                total: 0

            };


            r.emptySince =
                r.occupied
                    ? null
                    : Date.now();


            r.autoOffTriggered = false;


            campusState.rooms.push(r);

        }

    }
);


// Keep persisted data aligned with the 147-room campus model.
const requiredRoomIds = [
    ...['A', 'B', 'C'].flatMap(block =>
        Array.from({ length: 49 }, (_, i) => `${block}${101 + i}`)
    )
];
const fallbackRoomsById = new Map(campusState.rooms.map(r => [r.id, r]));
campusState.rooms = requiredRoomIds.map((id, i) => {
    const existing = fallbackRoomsById.get(id);
    if (existing) return existing;
    const block = `${id[0]} Block`;
    return room(id, 'First Floor', block, i % 3 === 0);
});
campusState.rooms.forEach(r => {
    r.appliances = r.appliances && typeof r.appliances === 'object'
        ? r.appliances
        : { light: !!r.light, fan: !!r.fan, ac: !!r.ac };
    r.autoOff = r.autoOff || { light: null, fan: null, ac: null };
    r.manualDevices = r.manualDevices || { light: false, fan: false, ac: false };
});


// ======================================================
// HELPER
// ======================================================

function syncRoomAppliances(room) {

    room.light =
        !!room.appliances?.light;

    room.fan =
        !!room.appliances?.fan;

    room.ac =
        !!room.appliances?.ac;

}


// ======================================================
// LOCAL ROOM STATE
// ======================================================
// FRONTEND SIMULATION REFRESH
// ======================================================

function refreshSimulationViews() {
    Campus.totalPower = Number((campusState.totalPower || 0).toFixed(2));
    Campus.energyAnalytics = {
        summary: { totalPower: Campus.totalPower, energyToday: Campus.energyToday, energySavedToday: Campus.energySavedToday, occupiedRooms: Campus.rooms.filter(room => room.occupied).length, totalRooms: Campus.rooms.length },
        analytics: { totalPower: Campus.totalPower, totalEnergyToday: Campus.energyToday, energySavedToday: Campus.energySavedToday, estimatedCostToday: Campus.energyToday * ENERGY_RATE, roomsUsingEnergy: Campus.rooms.filter(room => room.power > 0).length },
        alerts: Campus.alertObjects
    };
    Campus.alerts = Campus.alertObjects.map(alert => [alert.severity === 'critical' ? 'warning' : alert.severity, alert.roomId, alert.message, alert.timestamp]);
    campusState.lastUpdated = Date.now();
    refreshDashboardLive();
    window.refreshRoomsLive?.();
    window.refreshEnergyLive?.();
    saveLocalState();
}
// SAVE LOCAL UI STATE
// ======================================================

function saveLocalState() {

    campusState.lastUpdated =
        Date.now();


    localStorage.setItem(
        CAMPUS_STORE_KEY,
        JSON.stringify(campusState)
    );


    window.dispatchEvent(
        new CustomEvent(
            "campus-state-change"
        )
    );

}


// ======================================================
// SIMULATION ENGINE
// ======================================================

const SimulationEngine = {

    timer: null,


    sync(room) {

        syncRoomAppliances(room);


        room.powerModel = {

            light:
                room.light
                    ? 0.08
                    : 0,

            fan:
                room.fan
                    ? 0.12
                    : 0,

            ac:
                room.ac
                    ? 1.2
                    : 0,

            total: 0

        };


        room.powerModel.total =
            Number(
                (
                    room.powerModel.light +
                    room.powerModel.fan +
                    room.powerModel.ac +
                    (room.spikePower || 0)
                ).toFixed(2)
            );


        room.power =
            room.powerModel.total;

    },


    recalc() {

        campusState.totalPower = 0;


        campusState.rooms.forEach(
            room => {

                this.sync(room);

                campusState.totalPower +=
                    Number(
                        room.power || 0
                    );

            }
        );


        campusState.totalPower =
            Number(
                campusState.totalPower.toFixed(2)
            );

    },


    save() {

        saveLocalState();

    },


    alert(
        roomId,
        type,
        severity,
        message
    ) {

        if (
            campusState.alertObjects.some(
                a =>
                    a.roomId === roomId &&
                    a.type === type &&
                    !a.resolved
            )
        ) {

            return;

        }


        campusState.alertObjects.unshift({

            id: Date.now(),

            roomId,

            type,

            severity,

            message,

            timestamp: Date.now(),

            resolved: false

        });


        campusState.alerts.unshift([

            severity === "critical"
                ? "warning"
                : severity,

            roomId,

            message,

            "just now"

        ]);

    },


    resolve(
        roomId,
        type
    ) {

        campusState.alertObjects

            .filter(
                a =>
                    a.roomId === roomId &&
                    a.type === type
            )

            .forEach(
                a =>
                    a.resolved = true
            );

    },


    toggleAppliance(id, device) {
        const r = campusState.rooms.find(x => x.id === id);
        if (!r || !Object.hasOwn(r.appliances, device)) return null;
        r.appliances[device] = !r.appliances[device];
        r.manualDevices = r.manualDevices || { light: false, fan: false, ac: false };
        r.manualDevices[device] = true;
        r.autoOff[device] = r.appliances[device] && !r.occupied
            ? Date.now() + AUTO_OFF_DELAY
            : null;
        this.recalc();
        this.updateAlerts();
        refreshSimulationViews();
        return r;
    },

    setOccupancy(id, occupied) {
        const r = campusState.rooms.find(x => x.id === id);
        if (!r) return null;
        r.occupied = !!occupied;
        r.emptySince = r.occupied ? null : Date.now();
        r.autoOffTriggered = false;
        if (r.occupied) {
            r.autoOff = { light: null, fan: null, ac: null };
        } else {
            ['light', 'fan', 'ac'].forEach(device => {
                r.autoOff[device] = r.appliances[device]
                    ? Date.now() + AUTO_OFF_DELAY
                    : null;
            });
        }
        if (r.occupied && campusState.automationEnabled) {
            if (!r.manualDevices?.light) r.appliances.light = true;
            if (!r.manualDevices?.fan) r.appliances.fan = true;
        }
        this.recalc();
        this.updateAlerts();
        refreshSimulationViews();
        return r;
    },

    updateAlerts() {
        campusState.rooms.forEach(room => {
            const wasting = !room.occupied && room.power > 0;
            room.warning = wasting;
            if (wasting) this.alert(room.id, 'energy', room.spikePower ? 'critical' : 'warning', `${room.id} is empty while appliances are consuming power.`);
            else this.resolve(room.id, 'energy');
        });
    },
    async spike() {

        const r =
            campusState.rooms.find(
                x => x.id === "A104"
            );


        if (!r) {

            return;

        }


        r.spikePower = 1.75;

        r.warning = true;


        this.alert(
            r.id,
            "energy",
            "critical",
            `${r.id} is consuming unusually high energy (rule-based anomaly).`
        );


        this.recalc();

        this.save();


        toast(
            `Energy spike simulated in ${r.id}`
        );


        setTimeout(
            () => {

                r.spikePower = 0;

                r.warning = false;

                this.resolve(
                    r.id,
                    "energy"
                );


                this.recalc();

                this.save();

            },
            30000
        );

    },


    start() {
        if (this.timer) return;
        campusState.simulationRunning = true;
        this.recalc();
        this.updateAlerts();
        refreshSimulationViews();
        this.timer = setInterval(() => {
            if (!campusState.simulationRunning) return;
            const now = Date.now();
            campusState.rooms.forEach(room => {
                room.temperature = Number(Math.max(20, Math.min(32, room.temperature + (Math.random() - 0.5) * 0.4)).toFixed(1));
                room.humidity = Math.round(Math.max(35, Math.min(80, room.humidity + (Math.random() - 0.5) * 2)));
                if (campusState.automationEnabled && !room.occupied) {
                    ['light', 'fan', 'ac'].forEach(device => {
                        if (room.appliances[device] && room.autoOff[device] && now >= room.autoOff[device]) {
                            room.appliances[device] = false;
                            room.autoOff[device] = null;
                            Campus.energySavedToday = Number((Campus.energySavedToday + ({ light: 0.08, fan: 0.12, ac: 1.15 }[device]) * AUTO_OFF_DELAY / 3600000).toFixed(3));
                            Campus.estimatedCostSaved = Number((Campus.energySavedToday * ENERGY_RATE).toFixed(2));
                        }
                    });
                }
            });
            this.recalc();
            this.updateAlerts();
            Campus.rooms.forEach(room => room.energyToday = Number((room.energyToday + room.power * SIMULATION_INTERVAL / 3600000).toFixed(3)));
            Campus.energyToday = Number(Campus.rooms.reduce((total, room) => total + room.energyToday, 0).toFixed(3));
            refreshSimulationViews();
        }, SIMULATION_INTERVAL);
    },

    pause() {

        campusState.simulationRunning =
            false;


        clearInterval(
            this.timer
        );


        this.timer = null;

    },


    reset() {

        localStorage.removeItem(
            CAMPUS_STORE_KEY
        );


        location.reload();

    },


    demo() {
        const r = campusState.rooms.find(x => x.id === 'A104');
        if (!r) return;
        r.occupied = false;
        r.emptySince = Date.now();
        r.appliances = { light: true, fan: true, ac: false };
        this.recalc();
        this.updateAlerts();
        refreshSimulationViews();
        toast('Demo started: A104 empty-room automation sequence running.');
    }

};


// ======================================================
// GLOBAL ACCESS
// ======================================================

window.campusState =
    campusState;

window.SimulationEngine =
    SimulationEngine;

SimulationEngine.start();


// ======================================================
// NAVIGATION
// ======================================================

const nav = [

    [
        "dashboard.html",
        "Dashboard",
        "dashboard"
    ],

    [
        "campus-map.html",
        "Campus Map",
        "map"
    ],

    [
        "rooms.html",
        "Rooms",
        "rooms"
    ],

    [
        "energy.html",
        "Energy Analytics",
        "energy"
    ],

    [
        "alerts.html",
        "Alerts",
        "alerts"
    ],

    [
        "ai-insights.html",
        "AI Insights",
        "ai"
    ]

];


// ======================================================
// COMMON SHELL
// ======================================================

function shell(
    title,
    subtitle,
    content
) {

    app.innerHTML = `

        <div class="shell">

            <aside
                class="sidebar"
                id="sidebar"
            >

                <div class="logo">
                    <span>⚡</span>
                    Smart Campus
                </div>


                <nav class="nav">

                    ${nav.map(
                        n => `

                        <a
                            class="${page === n[2] ? "active" : ""}"
                            href="${n[0]}"
                        >
                            ${n[1]}
                        </a>

                    `
                    ).join("")}

                </nav>


                <nav class="nav nav-bottom">

                    <a href="settings.html">
                        ⚙ Settings
                    </a>

                    <a
                        href="index.html"
                        id="logout"
                    >
                        ↪ Logout
                    </a>

                </nav>

            </aside>


            <main class="main">

                <header class="header">

                    <div>

                        <button
                            class="menu"
                            id="menu"
                        >
                            ☰
                        </button>

                        <h1>
                            ${title}
                        </h1>

                        <p>
                            ${subtitle}
                        </p>

                    </div>


                    <div class="profile">

                        <span id="localClock"></span>

                        🔔

                        <div class="avatar">
                            A
                        </div>

                        <span>
                            Admin
                        </span>

                    </div>

                </header>


                <section class="content">

                    ${content}

                </section>

            </main>

        </div>

    `;


    const updateClock = () => {

        const clock =
            document.querySelector(
                "#localClock"
            );


        if (clock) {

            clock.textContent =
                DateTime.time();

        }

    };


    updateClock();


    setInterval(
        updateClock,
        1000
    );


    const menu =
        document.querySelector(
            "#menu"
        );


    const sidebar =
        document.querySelector(
            "#sidebar"
        );


    const logout =
        document.querySelector(
            "#logout"
        );


    menu?.addEventListener(
        "click",
        () =>
            sidebar.classList.toggle(
                "open"
            )
    );


    logout?.addEventListener(
        "click",
        () =>
            sessionStorage.removeItem(
                "smartCampusLogin"
            )
    );

}


// ======================================================
// BADGE
// ======================================================

function badge(
    value,
    type
) {

    return `

        <span
            class="badge ${type || String(value).toLowerCase()}"
        >
            ${value}
        </span>

    `;

}


// ======================================================
// ROOM POWER
// ======================================================

function roomPower(r) {

    return r.power || 0;

}


// ======================================================
// TOAST
// ======================================================

function toast(msg) {

    const e =
        document.createElement(
            "div"
        );


    e.className = "toast";

    e.textContent = msg;


    document.body.append(e);


    setTimeout(
        () => e.remove(),
        2800
    );

}


// ======================================================
// DASHBOARD HTML
// ======================================================

function dashboardHTML() {

    const occupied =
        Campus.rooms.filter(
            r => r.occupied
        ).length;


    const alerts =
        (
            Campus.alertObjects || []
        ).filter(
            a => !a.resolved
        ).length;


    return `
        <div id="simulationStatus" style="font-size:12px;color:#22c55e;margin-bottom:10px">● ONLINE</div>

        <div class="kpis">

            ${[

                [
                    "▦",
                    "Rooms Occupied",
                    `${occupied} / ${Campus.rooms.length}`,
                    "Live occupancy"
                ],

                [
                    "◉",
                    "Live Load",
                    `${Campus.totalPower.toFixed(2)} kW`,
                    "Current campus load"
                ],

                [
                    "⚡",
                    "Energy Today",
                    `${Campus.energyToday.toFixed(2)} kWh`,
                    "₹" +
                    (
                        Campus.energyToday *
                        ENERGY_RATE
                    ).toFixed(0)
                ],

                [
                    "↘",
                    "Energy Saved",
                    `${Campus.energySavedToday.toFixed(3)} kWh`,
                    "₹" +
                    Campus.estimatedCostSaved +
                    " saved"
                ],

                [
                    "!",
                    "Active Alerts",
                    alerts,
                    "Unresolved alerts"
                ]

            ].map(
                k => `

                    <div class="card">

                        <div class="kpi-head">

                            <span>
                                ${k[1]}
                            </span>

                            <span class="kpi-icon">
                                ${k[0]}
                            </span>

                        </div>


                        <div class="value">
                            ${k[2]}
                        </div>


                        <div class="sub">
                            ${k[3]}
                        </div>

                    </div>

                `
            ).join("")}

        </div>


        <div class="layout">

            <div class="card">

                <div class="section-title">

                    <h2>
                        Live Room Status
                    </h2>

                    <a href="rooms.html">
                        View all rooms →
                    </a>

                </div>


                <div class="table-wrap">

                    <table class="table">

                        <thead>

                            <tr>

                                <th>ROOM</th>

                                <th>LOCATION</th>

                                <th>OCCUPANCY</th>

                                <th>TEMP.</th>

                                <th>LIGHT</th>

                                <th>FAN</th>

                                <th>AC</th>

                                <th>POWER</th>

                            </tr>

                        </thead>


                        <tbody>

                            ${Campus.rooms
                                .slice(0, 6)
                                .map(
                                    r => `

                                    <tr
                                        class="clickable"
                                        data-room="${r.id}"
                                    >

                                        <td>
                                            <strong>
                                                ${r.id}
                                            </strong>
                                        </td>


                                        <td>
                                            ${r.block}
                                        </td>


                                        <td>
                                            ${badge(
                                                r.occupied
                                                    ? "Occupied"
                                                    : "Empty",
                                                r.occupied
                                                    ? "occupied"
                                                    : "empty"
                                            )}
                                        </td>


                                        <td>
                                            ${r.temperature}°C
                                        </td>


                                        <td>
                                            ${badge(
                                                r.light
                                                    ? "ON"
                                                    : "OFF",
                                                r.light
                                                    ? "on"
                                                    : "off"
                                            )}
                                        </td>


                                        <td>
                                            ${badge(
                                                r.fan
                                                    ? "ON"
                                                    : "OFF",
                                                r.fan
                                                    ? "on"
                                                    : "off"
                                            )}
                                        </td>


                                        <td>
                                            ${badge(
                                                r.ac
                                                    ? "ON"
                                                    : "OFF",
                                                r.ac
                                                    ? "on"
                                                    : "off"
                                            )}
                                        </td>


                                        <td>
                                            ${Number(
                                                r.power || 0
                                            ).toFixed(2)}
                                            kW
                                        </td>

                                    </tr>

                                `
                                )
                                .join("")}

                        </tbody>

                    </table>

                </div>

            </div>


            <div class="card">

                <div class="section-title">

                    <h2>
                        Recent Alerts
                    </h2>

                    <a href="alerts.html">
                        View all
                    </a>

                </div>


                <div class="alerts">

                    ${Campus.alerts
                        .slice(0, 4)
                        .map(
                            a => `

                            <div class="alert">

                                <strong>
                                    ${a[1]} ·
                                    ${a[0].toUpperCase()}
                                </strong>

                                <p>
                                    ${a[2]}
                                </p>

                                <small>
                                    ${a[3]}
                                </small>

                            </div>

                        `
                        )
                        .join("")}

                </div>

            </div>

        </div>

    `;

}


// ======================================================
// LIVE DASHBOARD REFRESH
// ======================================================

function refreshDashboardLive() {

    if (
        page !== "dashboard"
    ) {

        return;

    }


    const rows =
        document.querySelector(
            ".table tbody"
        );


    if (rows) {

        rows.innerHTML =
            Campus.rooms
                .slice(0, 6)
                .map(
                    r => `

                    <tr
                        class="clickable"
                        data-room="${r.id}"
                    >

                        <td>
                            <strong>
                                ${r.id}
                            </strong>
                        </td>


                        <td>
                            ${r.block}
                        </td>


                        <td>

                            ${badge(
                                r.occupied
                                    ? "Occupied"
                                    : "Empty",

                                r.occupied
                                    ? "occupied"
                                    : "empty"
                            )}

                        </td>


                        <td>
                            ${r.temperature}°C
                        </td>


                        <td>

                            ${badge(
                                r.light
                                    ? "ON"
                                    : "OFF",

                                r.light
                                    ? "on"
                                    : "off"
                            )}

                        </td>


                        <td>

                            ${badge(
                                r.fan
                                    ? "ON"
                                    : "OFF",

                                r.fan
                                    ? "on"
                                    : "off"
                            )}

                        </td>


                        <td>

                            ${badge(
                                r.ac
                                    ? "ON"
                                    : "OFF",

                                r.ac
                                    ? "on"
                                    : "off"
                            )}

                        </td>


                        <td>

                            ${Number(
                                r.power || 0
                            ).toFixed(2)}
                            kW

                        </td>

                    </tr>

                `
                )
                .join("");

    }


    const values =
        document.querySelectorAll(
            ".kpis .value"
        );


    const occupied =
        Campus.rooms.filter(
            r => r.occupied
        ).length;


    const alerts =
        (
            campusState.alertObjects || []
        ).filter(
            a => !a.resolved
        ).length;


    if (values[0]) {

        values[0].textContent =
            occupied +
            " / " +
            Campus.rooms.length;

    }


    if (values[1]) {

        values[1].textContent =
            Campus.totalPower.toFixed(2) +
            " kW";

    }


    if (values[2]) {

        values[2].textContent =
            Campus.energyToday.toFixed(2) +
            " kWh";

    }


    if (values[3]) {

        values[3].textContent =
            Campus.energySavedToday.toFixed(3) +
            " kWh";

    }


    if (values[4]) {

        values[4].textContent =
            alerts;

    }


    document
        .querySelectorAll(
            "[data-room]"
        )
        .forEach(
            element => {

                element.onclick =
                    () => {

                        location.href =
                            "rooms.html?room=" +
                            encodeURIComponent(
                                element.dataset.room
                            );

                    };

            }
        );

}


// ======================================================
// SETTINGS
// ======================================================

function settingsPage() {

    shell(
        "Settings",
        "Manage your campus preferences.",

        `

        <div class="settings">

            <div class="card">

                <h2>
                    Campus Information
                </h2>


                <div class="setting-grid">

                    <label>

                        Campus Name

                        <input
                            value="Campus 25"
                        >

                    </label>


                    <label>

                        Admin Email

                        <input
                            value="admin@smartcampus.com"
                        >

                    </label>

                </div>

            </div>


            <div class="card">

                <h2>
                    Automation
                </h2>


                <div class="setting-line">

                    <span>
                        Auto turn-off in empty rooms
                    </span>


                    <button
                        class="switch ${campusState.automationEnabled ? "on" : ""}"
                        id="automationToggle"
                    >
                    </button>

                </div>

            </div>

        </div>

        `
    );


    const automationToggle =
        document.querySelector(
            "#automationToggle"
        );


    automationToggle?.addEventListener(
        "click",
        () => {

            campusState.automationEnabled =
                !campusState.automationEnabled;

            if (campusState.automationEnabled) {
                SimulationEngine.start();
            } else {
                SimulationEngine.pause();
            }
    r.autoOff = { light: Date.now() + AUTO_OFF_DELAY, fan: Date.now() + AUTO_OFF_DELAY, ac: null };


            automationToggle.classList.toggle(
                "on"
            );


            saveLocalState();

        }
    );

}


// ======================================================
// LOGIN
// ======================================================

const loginForm =
    document.querySelector(
        "#loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async e => {

            e.preventDefault();


            const email =
                document.querySelector(
                    "#email"
                );


            const password =
                document.querySelector(
                    "#password"
                );


            const loginError =
                document.querySelector(
                    "#loginError"
                );


            if (
                email.value.trim() ===
                    "admin@smartcampus.com" &&
                password.value ===
                    "admin123"
            ) {

                sessionStorage.smartCampusLogin =
                    "true";


                location.href =
                    "dashboard.html";

            } else {

                if (loginError) {

                    loginError.textContent =
                        "Use the provided demo credentials.";

                }

            }

        }
    );

}


// ======================================================
// DASHBOARD
// ======================================================

if (
    page === "dashboard"
) {

    shell(
        "Campus 25 Dashboard",
        "Here's what's happening across Campus 25 today.",
        dashboardHTML()
    );


    document.querySelector(".content").insertAdjacentHTML(
        "afterbegin",

        `

        <div class="campus-context card">

            <div>

                <span class="eyebrow">
                    ACTIVE CAMPUS
                </span>


                <strong>

                    Campus 25

                    <span class="live-indicator">
                        ● LIVE
                    </span>

                </strong>


                <p class="sub">

                    Last updated:

                    <span id="lastUpdated">
                        ${DateTime.relative(
                            campusState.lastUpdated ||
                            Date.now()
                        )}
                    </span>

                </p>

            </div>


            <a
                class="btn primary"
                href="campus-map.html"
            >
                Open Campus Map
            </a>

        </div>


        <div class="simulation-controls card">

            <strong>
                Simulation Controls
            </strong>

            <span class="sub">
                Browser-side Smart Campus simulation
            </span>


            <div>

                <button
                    class="btn filter"
                    data-sim="start"
                >
                    Start Simulation
                </button>


                <button
                    class="btn filter"
                    data-sim="pause"
                >
                    Pause Sync
                </button>


                <button
                    class="btn filter"
                    data-sim="occupancy"
                >
                    Toggle A104
                </button>


                <button
                    class="btn filter"
                    data-sim="spike"
                >
                    Energy Spike
                </button>


                <button
                    class="btn filter"
                    data-sim="demo"
                >
                    Run Demo Scenario
                </button>


                <button
                    class="btn filter"
                    data-sim="reset"
                >
                    Reset
                </button>

            </div>

        </div>

        `
    );


    refreshDashboardLive();


    document
        .querySelectorAll(
            "[data-sim]"
        )
        .forEach(
            button => {

                button.onclick =
                    async () => {

                        const action =
                            button.dataset.sim;


                        if (
                            action ===
                            "start"
                        ) {

                            SimulationEngine.start();

                        }

                        else if (
                            action ===
                            "pause"
                        ) {

                            SimulationEngine.pause();

                        }

                        else if (
                            action ===
                            "occupancy"
                        ) {

                            const r =
                                Campus.rooms.find(
                                    r =>
                                        r.id ===
                                        "A104"
                                );


                            if (r) {

                                await SimulationEngine.setOccupancy(
                                    r.id,
                                    !r.occupied
                                );

                            }

                        }

                        else if (
                            action ===
                            "spike"
                        ) {

                            await SimulationEngine.spike();

                        }

                        else if (
                            action ===
                            "demo"
                        ) {

                            SimulationEngine.demo();

                        }

                        else if (
                            action ===
                            "reset"
                        ) {

                            SimulationEngine.reset();

                        }


                        if (
                            action !==
                            "reset"
                        ) {

                            toast(
                                "Action applied"
                            );

                        }

                    };

            }
        );


    window.addEventListener(
        "campus-state-change",
        refreshDashboardLive
    );


    setInterval(
        () => {

            const el =
                document.querySelector(
                    "#lastUpdated"
                );


            if (el) {

                el.textContent =
                    DateTime.relative(
                        campusState.lastUpdated ||
                        Date.now()
                    );

            }

        },
        1000
    );

}


// ======================================================
// SETTINGS PAGE
// ======================================================

if (
    page === "settings"
) {

    settingsPage();

}


// ======================================================
// AI INSIGHTS
// ======================================================

if (
    page === "ai"
) {

    shell(

        "AI Insights",

        "Demo insights based on Campus 25 patterns.",

        `

        <div class="page-heading">

            <div>

                <h2>

                    AI Energy Insights

                    <span class="demo-badge">
                        DEMO / SIMULATED
                    </span>

                </h2>


                <p class="muted">
                    Rule-based prototype insights — no real AI model is running.
                </p>

            </div>

        </div>


        <div class="ai-grid">

            ${[

                [
                    "Occupancy Prediction",
                    "A101",
                    "2 PM – 3 PM",
                    "Predicted occupancy: 12%"
                ],

                [
                    "Energy Forecast",
                    "Tomorrow",
                    "Expected campus use",
                    "368 kWh"
                ],

                [
                    "Saving Opportunity",
                    "A104",
                    "Automation status",
                    "Empty-room control can reduce wastage."
                ],

                [
                    "Rule-based Anomaly",
                    "A104",
                    "Consumption pattern",
                    "Use Energy Spike for a demonstration."
                ]

            ].map(
                x => `

                <article class="card">

                    <span class="kpi-icon">
                        ✦
                    </span>

                    <h3>
                        ${x[0]}
                    </h3>

                    <strong>
                        ${x[1]}
                    </strong>

                    <p class="muted">
                        ${x[2]}
                    </p>

                    <p>
                        ${x[3]}
                    </p>

                </article>

            `
            ).join("")}

        </div>

        `

    );

}

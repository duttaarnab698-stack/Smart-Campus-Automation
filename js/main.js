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

const CAMPUS_STORE_KEY = "smartCampusState_v2";

const SIMULATION_INTERVAL = 1000;

const AUTO_OFF_DELAY = 15000;

const ENERGY_RATE = 8;


// ======================================================
// CAMPUS STATE
// ======================================================

const campusState = (() => {
    try {
        const saved = JSON.parse(localStorage.getItem("smartCampusState_v2"));
        if (saved && Array.isArray(saved.rooms) && (saved.rooms.length === 147 || saved.rooms.length === 130)) {
            Object.assign(Campus, saved);
        }
    } catch (error) {
        console.warn("Saved campus state could not be loaded; using demo data.", error);
    }

    // Initial data is replaced by the persistent static-demo state.
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

    Campus.automationEnabled = Campus.automationEnabled !== false;


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


// ======================================================
// ACTUAL CAMPUS ROOM INVENTORY
// ======================================================
// Based on real floor plans - DO NOT use generated IDs
// Total rooms: ~130 actual rooms across 4 floors

const actualRoomsByFloor = {
    'Ground Floor': [
        // A Block - Ground Floor
        'A006', 'A007', 'A008', 'A009', 'A011', 'A013', 'A015',
        'A101', 'A102', 'A103', 'A104', 'A105',
        // B Block - Ground Floor
        'B001', 'B002', 'B004', 'B005', 'B006', 'B007', 'B008', 'B009',
        'B011', 'B012', 'B013', 'B014', 'B015', 'B016', 'B017', 'B018',
        'B019', 'B020', 'B021', 'B022',
        // C Block - Ground Floor
        'C01', 'C02'
    ],
    'First Floor': [
        // A Block - First Floor
        'A101', 'A102', 'A103', 'A104', 'A105', 'A109', 'A110', 'A111',
        // B Block - First Floor
        'B101', 'B102', 'B104', 'B105', 'B106', 'B107', 'B108', 'B109',
        'B110', 'B111', 'B112', 'B113', 'B114', 'B115', 'B116', 'B117',
        'B118', 'B119', 'B120', 'B121',
        // C Block - First Floor
        'C101', 'C11'
    ],
    'Second Floor': [
        // A Block - Second Floor
        'A211', 'A213',
        // B Block - Second Floor
        'B201', 'B202', 'B204', 'B205', 'B206', 'B207', 'B208', 'B209',
        'B210', 'B211', 'B212', 'B213', 'B214', 'B215', 'B216', 'B217',
        'B218', 'B219', 'B220', 'B221',
        // C Block - Second Floor
        'C201', 'C203', 'C211', 'C212', 'C213'
    ],
    'Third Floor': [
        // A Block - Third Floor
        'A301', 'A302', 'A303', 'A304', 'A305', 'A307', 'A308', 'A309',
        'A310', 'A311', 'A313', 'A314', 'A315', 'A316', 'A317', 'A318',
        // B Block - Third Floor
        'B301', 'B302', 'B303', 'B304', 'B305', 'B306', 'B307', 'B308',
        'B309', 'B310', 'B311', 'B312', 'B313', 'B314', 'B315', 'B316',
        'B317', 'B318', 'B319', 'B320', 'B321',
        // C Block - Third Floor
        'C301', 'C303'
    ]
};

// Rebuild Campus.rooms with ACTUAL room data (not generated)
const fallbackRoomsById = new Map(campusState.rooms.map(r => [r.id + '|' + r.floor, r]));
const finalRooms = [];

Object.entries(actualRoomsByFloor).forEach(([floor, roomIds]) => {
    roomIds.forEach((id, i) => {
        const key = id + '|' + floor;
        let roomData = fallbackRoomsById.get(key);
        
        if (!roomData) {
            // Create new room with proper floor assignment
            const block = id.startsWith('A') ? 'A Block' : 
                         id.startsWith('B') ? 'B Block' : 'C Block';
            roomData = room(id, floor, block, i % 3 === 0);
        }
        
        finalRooms.push(roomData);
    });
});

campusState.rooms = finalRooms;

// Ensure all rooms have proper appliance structure
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
        JSON.stringify({
            rooms: campusState.rooms,
            automationEnabled: campusState.automationEnabled,
            totalPower: campusState.totalPower,
            energyToday: campusState.energyToday,
            energySavedToday: campusState.energySavedToday,
            estimatedCostSaved: campusState.estimatedCostSaved,
            alertObjects: campusState.alertObjects,
            alerts: campusState.alerts,
            lastUpdated: campusState.lastUpdated
        })
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

const SimulationEngine = {};

// GLOBAL ACCESS
// ======================================================

window.campusState =
    campusState;

window.SimulationEngine =
    SimulationEngine;

// simulation.js starts the single frontend automation engine.
// Legacy simulation is never started.


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
        <div id="simulationStatus" style="font-size:12px;color:#22c55e;margin-bottom:10px">SMART AUTOMATION · ACTIVE</div>

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


    // simulation.js attaches the local automation-toggle handler.
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
            <strong>Smart Automation</strong>
            <span class="sub">Smart Automation uses this browser demo state.</span>
        </div>
        `
    );


    refreshDashboardLive();


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
